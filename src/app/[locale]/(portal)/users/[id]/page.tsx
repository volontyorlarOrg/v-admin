import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { Panel } from "@/components/portal/panel";
import {
  StatusBadge,
  applicationStatus,
  attendanceStatus,
} from "@/components/portal/status-badge";
import { TemporaryPasswordForm } from "@/components/portal/temporary-password-form";
import { Facts, FigureRow } from "@/components/register/facts";
import { Register, RegisterNote } from "@/components/register/register";
import { LoadFailure } from "@/components/states/load-failure";
import { PageHeader } from "@/components/states/page-header";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  PROFILE_FIELD_KEYS,
  VolunteerProfile,
  type ProfileFieldKey,
  type VolunteerProfileLabels,
} from "@/components/users/volunteer-profile";
import { Link } from "@/i18n/navigation";
import { failureOf, isReady } from "@/lib/api/load";
import { isRegion } from "@/lib/domain/vocabulary";
import { applicationHref, navHref, vacancyHref } from "@/lib/routing/routes";
import { replaceUserPasswordAction } from "@/lib/users/actions";
import { loadUser } from "@/lib/users/data.server";
import { completionShare, participationOf } from "@/lib/users/participation";
import { passwordLoginState } from "@/lib/users/password-state";
import { errorCatalog } from "@/lib/vacancies/labels.server";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/users/[id]">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "users" });
  return { title: t("record") };
}

export default async function UserPage({ params }: PageProps<"/[locale]/users/[id]">) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const [t, applications, attendanceCopy, auth, common, errors, vocabulary, format] =
    await Promise.all([
      getTranslations("users"),
      getTranslations("applications"),
      getTranslations("attendance"),
      getTranslations("auth"),
      getTranslations("common"),
      getTranslations("errors"),
      getTranslations("vocabulary"),
      getFormatter(),
    ]);
  const languages = new Intl.DisplayNames([locale], { type: "language" });
  const back = { href: navHref("users"), label: t("title") };

  const loaded = await loadUser(id);
  const failure = failureOf(loaded);

  if (failure) {
    return (
      <>
        <PageHeader back={back} title={t("record")} />
        <LoadFailure failure={failure} />
      </>
    );
  }

  if (!isReady(loaded)) notFound();

  const user = loaded.data;
  const name = user.displayName ?? common("notSet");
  const password = passwordLoginState(user);
  const participation = participationOf(user.applications);
  const profileLabels: VolunteerProfileLabels = {
    fields: Object.fromEntries(
      PROFILE_FIELD_KEYS.map((key) => [key, applications(`snapshotFields.${key}`)]),
    ) as VolunteerProfileLabels["fields"],
  };
  const fieldName = (key: string) =>
    (PROFILE_FIELD_KEYS as readonly string[]).includes(key)
      ? profileLabels.fields[key as ProfileFieldKey]
      : key;
  const completion = user.profileCompletion;
  const regionName = (region: string) =>
    isRegion(region) ? vocabulary(`regions.${region}`) : region;
  const languageName = (code: string) => {
    try {
      return languages.of(code) ?? code;
    } catch {
      return code;
    }
  };

  return (
    <>
      <PageHeader
        back={back}
        title={name}
        meta={
          <>
            {user.username ? <span>@{user.username}</span> : null}
            <span>{user.email ?? t("noEmail")}</span>
            <span>
              {t("joinedOn", {
                when: format.dateTime(new Date(user.createdAt), "date"),
              })}
            </span>
          </>
        }
      />

      <FigureRow
        items={[
          { label: t("figures.sent"), value: format.number(participation.sent) },
          {
            label: t("figures.accepted"),
            value: format.number(participation.accepted),
          },
          {
            label: t("figures.attended"),
            value: format.number(participation.attended),
            tone: "person",
          },
          {
            label: t("figures.hours"),
            value: format.number(participation.hours),
            tone: "person",
          },
          {
            label: t("figures.awaiting"),
            value: format.number(participation.awaiting),
          },
        ]}
      />

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="flex min-w-0 flex-col gap-6">
          <Panel
            title={t("detail.currentProfile")}
            description={t("detail.currentProfileNote")}
          >
            <VolunteerProfile
              identity={{ name, username: user.username, avatarUrl: user.avatarUrl }}
              profile={user.profile ?? {}}
              labels={profileLabels}
              {...(completion
                ? {
                    completion: {
                      share: completionShare(completion.missing),
                      label: t("detail.completeness"),
                    },
                    status: {
                      label: completion.complete
                        ? t("detail.profileComplete")
                        : t("detail.profileIncomplete"),
                      tone: completion.complete
                        ? ("person" as const)
                        : ("draft" as const),
                      ...(completion.complete
                        ? {}
                        : {
                            note: t("detail.missing", {
                              fields: completion.missing.map(fieldName).join(", "),
                            }),
                          }),
                    },
                  }
                : {})}
              regionName={regionName}
              languageName={languageName}
            />
            {user.profile ? null : (
              <p className="mt-4 text-sm text-ink-muted">{t("detail.noProfile")}</p>
            )}
          </Panel>

          <Register
            title={t("detail.applications")}
            count={user.applications.length}
            countLabel={applications("countLabel")}
          >
            {user.applications.length === 0 ? (
              <RegisterNote title={t("detail.noApplications")} />
            ) : (
              <Table>
                <TableCaption className="sr-only">
                  {t("detail.applications")}
                </TableCaption>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead scope="col">{applications("table.vacancy")}</TableHead>
                    <TableHead scope="col">{applications("table.status")}</TableHead>
                    <TableHead scope="col">{attendanceCopy("table.hours")}</TableHead>
                    <TableHead scope="col">{applications("table.submitted")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {user.applications.map((application) => {
                    const chip = applicationStatus(application.status);
                    const outcome = application.attendance?.outcome;
                    const outcomeChip = outcome ? attendanceStatus(outcome) : null;
                    return (
                      <TableRow key={application.id}>
                        <TableCell className="max-w-[20rem]">
                          <Link
                            href={applicationHref(application.id)}
                            className="font-semibold text-ink hover:text-primary-ink hover:underline"
                          >
                            {application.opportunity?.title ??
                              application.opportunityId}
                          </Link>
                          {application.opportunity ? (
                            <Link
                              href={vacancyHref(application.opportunity.id)}
                              className="mt-0.5 block text-xs text-ink-muted hover:text-primary-ink hover:underline"
                            >
                              {t("detail.openVacancy")}
                            </Link>
                          ) : null}
                        </TableCell>
                        <TableCell>
                          <span className="flex flex-wrap gap-1.5">
                            <StatusBadge
                              label={applications(`status.${application.status}`)}
                              tone={chip.tone}
                              icon={chip.icon}
                            />
                            {outcome && outcomeChip ? (
                              <StatusBadge
                                label={attendanceCopy(`outcome.${outcome}`)}
                                tone={outcomeChip.tone}
                                icon={outcomeChip.icon}
                              />
                            ) : null}
                          </span>
                        </TableCell>
                        <TableCell className="tabular">
                          {application.attendance?.confirmedHours === undefined
                            ? "—"
                            : format.number(application.attendance.confirmedHours)}
                        </TableCell>
                        <TableCell className="tabular whitespace-nowrap text-ink-muted">
                          {application.submittedAt
                            ? format.dateTime(new Date(application.submittedAt), "day")
                            : "—"}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </Register>
        </div>

        <aside className="flex min-w-0 flex-col gap-6">
          <Panel title={t("detail.account")}>
            <Facts
              items={[
                { term: t("table.email"), value: user.email ?? t("noEmail") },
                {
                  term: t("table.passwordLogin"),
                  value:
                    password.kind === "none"
                      ? t("passwordState.none")
                      : password.changeRequired
                        ? t("passwordState.required")
                        : t("passwordState.set"),
                },
                ...(password.kind === "set"
                  ? [
                      {
                        term: t("table.passwordChangedAt"),
                        value: password.changedAt
                          ? format.dateTime(new Date(password.changedAt), "stamp")
                          : t("passwordState.neverChanged"),
                      },
                    ]
                  : []),
              ]}
            />
          </Panel>

          <Panel title={t("password.title")} description={t("password.description")}>
            <TemporaryPasswordForm
              action={replaceUserPasswordAction}
              targetId={user.id}
              labels={{
                label: t("password.label"),
                help: t("password.help"),
                privacy: t("password.privacy"),
                showPassword: auth("showPassword"),
                hidePassword: auth("hidePassword"),
                submit: t("password.confirm"),
                pending: t("password.pending"),
                success: t("password.success"),
                fallbackError: errors("server"),
                errors: await errorCatalog([
                  "server",
                  "network",
                  "timeout",
                  "rateLimited",
                  "unavailable",
                  "forbidden",
                  "notFound",
                  "conflict",
                  "validationFailed",
                  "awaitingContract",
                  "sessionExpired",
                  "required",
                  "passwordShort",
                  "passwordLong",
                  "weakPassword",
                  "userNotFound",
                ]),
              }}
            />
          </Panel>
        </aside>
      </div>
    </>
  );
}
