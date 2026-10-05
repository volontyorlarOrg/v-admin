import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import { randomUUID } from "node:crypto";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { Panel } from "@/components/portal/panel";
import {
  StatusBadge,
  applicationStatus,
  attendanceStatus,
} from "@/components/portal/status-badge";
import { TemporaryPasswordForm } from "@/components/portal/temporary-password-form";
import { ProgressAdjustmentForm } from "@/components/users/progress-adjustment-form";
import {
  PastEventDialog,
  RemovePastEventDialog,
  type PastEventLabels,
} from "@/components/users/past-event-dialog";
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
import { loadOrganizations } from "@/lib/organizations/data.server";
import {
  createPastEventAction,
  updatePastEventAction,
  removePastEventAction,
} from "@/lib/users/past-events-actions";
import { completionShare, participationOf } from "@/lib/users/participation";
import { passwordLoginState } from "@/lib/users/password-state";
import { signedChange } from "@/lib/users/progress";
import { adjustUserProgressAction } from "@/lib/users/progress-actions";
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

  const [loaded, loadedOrganizations] = await Promise.all([
    loadUser(id),
    loadOrganizations(),
  ]);
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
  const progress = user.progress;
  const organizations = isReady(loadedOrganizations) ? loadedOrganizations.data : [];
  const pastEventLabels: PastEventLabels = {
    add: t("pastEvents.add"),
    edit: t("pastEvents.edit"),
    remove: t("pastEvents.remove"),
    noOrganizations: isReady(loadedOrganizations)
      ? t("pastEvents.noOrganizations")
      : t("pastEvents.organizationsUnavailable"),
    counted: t("pastEvents.counted"),
    notCounted: t("pastEvents.notCounted"),
    countHelp: t("pastEvents.countHelp"),
    removePrompt: t("pastEvents.removePrompt"),
    title: t("pastEvents.fields.title"),
    organization: t("pastEvents.fields.organization"),
    date: t("pastEvents.fields.date"),
    hours: t("pastEvents.fields.hours"),
    xp: t("pastEvents.fields.xp"),
    close: common("close"),
    cancel: common("cancel"),
    pending: common("saving"),
    addSuccess: t("pastEvents.addSuccess"),
    editSuccess: t("pastEvents.editSuccess"),
    removeSuccess: t("pastEvents.removeSuccess"),
    fallbackError: errors("server"),
    errors: {
      required: errors("required"),
      tooLong: errors("tooLong"),
      hoursAmount: t("pastEvents.errors.hoursAmount"),
      xpAmount: t("pastEvents.errors.xpAmount"),
      pastEventDateInvalid: t("pastEvents.errors.dateInvalid"),
      pastEventUncreditedXp: t("pastEvents.errors.uncreditedXp"),
      pastEventNotFound: t("pastEvents.errors.notFound"),
      pastEventSubmissionConflict: t("pastEvents.errors.submissionConflict"),
      organizationNotFound: t("pastEvents.errors.organizationNotFound"),
      userNotFound: errors("userNotFound"),
      forbidden: errors("forbidden"),
      network: errors("network"),
      timeout: errors("timeout"),
      server: errors("server"),
    },
  };
  const adjustments = progress?.adjustments ?? [];
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
        className="xl:grid-cols-6"
        items={[
          { label: t("figures.sent"), value: format.number(participation.sent) },
          {
            label: t("figures.accepted"),
            value: format.number(participation.accepted),
          },
          {
            label: t("figures.attended"),
            value: format.number(
              participation.attended + (progress?.manualAttended ?? 0),
            ),
            tone: "person",
          },
          {
            label: t("figures.hours"),
            value: format.number(progress?.hours ?? participation.hours),
            tone: "person",
          },
          ...(progress
            ? [
                {
                  label: t("figures.xp"),
                  value: format.number(progress.xp),
                  tone: "person" as const,
                },
              ]
            : []),
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

          <Register
            title={t("pastEvents.heading")}
            count={user.pastEvents.length}
            countLabel={t("pastEvents.countLabel")}
            description={t("pastEvents.description")}
            actions={
              <PastEventDialog
                userId={user.id}
                organizations={organizations}
                submissionId={randomUUID()}
                action={createPastEventAction}
                labels={pastEventLabels}
              />
            }
          >
            {user.pastEvents.length === 0 ? (
              <RegisterNote title={t("pastEvents.empty")} />
            ) : (
              <div className="divide-y divide-border">
                {user.pastEvents.map((event) => (
                  <div
                    key={event.id}
                    className="flex flex-wrap items-center gap-x-5 gap-y-3 px-5 py-3.5"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-ink">{event.title}</p>
                      <p className="text-sm text-ink-muted">
                        {event.organization} ·{" "}
                        {format.dateTime(
                          new Date(`${event.eventDate}T00:00:00Z`),
                          "day",
                        )}
                      </p>
                    </div>
                    <p className="tabular text-sm text-ink">
                      {format.number(event.hours)} {t("pastEvents.hoursUnit")}
                      {event.countsTowardProgress
                        ? ` · ${format.number(event.xpAwarded)} XP`
                        : ""}
                    </p>
                    <span className="text-xs font-semibold text-ink-muted">
                      {event.countsTowardProgress
                        ? pastEventLabels.counted
                        : pastEventLabels.notCounted}
                    </span>
                    <div className="flex gap-2">
                      <PastEventDialog
                        userId={user.id}
                        event={event}
                        organizations={organizations}
                        action={updatePastEventAction}
                        labels={pastEventLabels}
                      />
                      <RemovePastEventDialog
                        userId={user.id}
                        eventId={event.id}
                        action={removePastEventAction}
                        labels={pastEventLabels}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Register>

          {adjustments.length > 0 ? (
            <Register
              title={t("progress.history")}
              count={adjustments.length}
              countLabel={t("progress.countLabel")}
            >
              <Table>
                <TableCaption className="sr-only">
                  {t("progress.table.caption")}
                </TableCaption>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead scope="col">{t("progress.table.change")}</TableHead>
                    <TableHead scope="col">{t("progress.table.reason")}</TableHead>
                    <TableHead scope="col">{t("progress.table.by")}</TableHead>
                    <TableHead scope="col">{t("progress.table.when")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {adjustments.map((adjustment) => (
                    <TableRow key={adjustment.id}>
                      <TableCell className="tabular align-top font-semibold whitespace-nowrap">
                        {adjustment.xpDelta !== 0 ? (
                          <span className="block">
                            {t("progress.xpChange", {
                              value: signedChange(adjustment.xpDelta, (value) =>
                                format.number(value),
                              ),
                            })}
                          </span>
                        ) : null}
                        {adjustment.hoursDelta !== 0 ? (
                          <span className="block">
                            {t("progress.hoursChange", {
                              value: signedChange(adjustment.hoursDelta, (value) =>
                                format.number(value),
                              ),
                            })}
                          </span>
                        ) : null}
                      </TableCell>
                      <TableCell className="min-w-[12rem] align-top break-words whitespace-normal">
                        {adjustment.reason}
                        {adjustment.bulkAwardId ? (
                          <Link
                            href={`${navHref("bulkAwards")}/${adjustment.bulkAwardId}`}
                            className="mt-1 block w-fit text-xs font-semibold text-primary-ink hover:underline"
                          >
                            {t("progress.fromBulkAward")}
                          </Link>
                        ) : null}
                      </TableCell>
                      <TableCell className="align-top text-ink-muted">
                        {adjustment.createdBy?.displayName ??
                          t("progress.unknownAuthor")}
                      </TableCell>
                      <TableCell className="tabular align-top whitespace-nowrap text-ink-muted">
                        <time
                          dateTime={adjustment.createdAt}
                          title={format.dateTime(
                            new Date(adjustment.createdAt),
                            "stamp",
                          )}
                        >
                          {format.dateTime(new Date(adjustment.createdAt), "day")}
                        </time>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Register>
          ) : null}
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

          {progress ? (
            <Panel title={t("progress.title")} description={t("progress.description")}>
              <ProgressAdjustmentForm
                action={adjustUserProgressAction}
                targetId={user.id}
                labels={{
                  direction: t("progress.direction"),
                  add: t("progress.add"),
                  remove: t("progress.remove"),
                  xp: t("progress.xp"),
                  hours: t("progress.hours"),
                  amountHelp: t("progress.amountHelp"),
                  reason: t("progress.reason"),
                  reasonHelp: t("progress.reasonHelp"),
                  submit: t("progress.submit"),
                  pending: t("progress.pending"),
                  success: t("progress.success"),
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
                    "tooLong",
                    "xpAmount",
                    "hoursAmount",
                    "adjustmentEmpty",
                    "progressBelowZero",
                    "ownProgressNotAdjustable",
                    "userNotFound",
                  ]),
                }}
              />
            </Panel>
          ) : null}

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
