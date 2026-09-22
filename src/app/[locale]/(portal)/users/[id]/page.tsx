import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";

import { DefinitionList } from "@/components/portal/definition-list";
import { Panel } from "@/components/portal/panel";
import { StatusBadge, applicationStatusTone } from "@/components/portal/status-badge";
import { TemporaryPasswordForm } from "@/components/portal/temporary-password-form";
import { LoadFailure } from "@/components/states/load-failure";
import { PageHeader } from "@/components/states/page-header";
import { buttonClass } from "@/components/ui/button";
import {
  PROFILE_FIELD_KEYS,
  VolunteerProfile,
  type ProfileFieldKey,
  type VolunteerProfileLabels,
} from "@/components/users/volunteer-profile";
import { Link } from "@/i18n/navigation";
import { failureOf, isReady } from "@/lib/api/load";
import { isRegion } from "@/lib/domain/vocabulary";
import { applicationHref } from "@/lib/routing/routes";
import { replaceUserPasswordAction } from "@/lib/users/actions";
import { loadUser } from "@/lib/users/data.server";
import { passwordLoginState } from "@/lib/users/password-state";
import { errorCatalog } from "@/lib/vacancies/labels.server";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/users/[id]">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "users" });
  return { title: t("detail.eyebrow") };
}

export default async function UserPage({ params }: PageProps<"/[locale]/users/[id]">) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("users");
  const applications = await getTranslations("applications");
  const auth = await getTranslations("auth");
  const common = await getTranslations("common");
  const errors = await getTranslations("errors");
  const vocabulary = await getTranslations("vocabulary");
  const format = await getFormatter();
  const languages = new Intl.DisplayNames([locale], { type: "language" });

  const loaded = await loadUser(id);
  const failure = failureOf(loaded);

  if (failure) {
    return (
      <>
        <PageHeader eyebrow={t("detail.eyebrow")} title={t("title")} />
        <LoadFailure failure={failure} />
      </>
    );
  }

  if (!isReady(loaded)) return null;

  const user = loaded.data;
  const password = passwordLoginState(user);
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
        eyebrow={t("detail.eyebrow")}
        title={user.displayName ?? common("notSet")}
        description={user.email ?? undefined}
      />

      <Panel title={t("detail.account")}>
        <DefinitionList
          items={[
            { term: t("table.email"), value: user.email ?? common("notSet") },
            {
              term: t("table.joined"),
              value: format.dateTime(new Date(user.createdAt), "date"),
            },
            {
              term: t("table.passwordLogin"),
              value:
                password.kind === "none"
                  ? t("passwordState.none")
                  : t("passwordState.set"),
            },
            {
              term: t("table.passwordChangedAt"),
              value:
                password.kind === "set" && password.changedAt
                  ? format.dateTime(new Date(password.changedAt), "stamp")
                  : t("passwordState.neverChanged"),
            },
            {
              term: t("table.passwordChangeRequired"),
              value:
                password.kind === "set" && password.changeRequired
                  ? common("yes")
                  : common("no"),
            },
          ]}
        />
      </Panel>

      <Panel
        title={t("detail.currentProfile")}
        description={t("detail.currentProfileNote")}
      >
        <VolunteerProfile
          identity={{
            name: user.displayName ?? common("notSet"),
            username: user.username,
            avatarUrl: user.avatarUrl,
          }}
          profile={user.profile ?? {}}
          labels={profileLabels}
          status={
            completion
              ? {
                  label: completion.complete
                    ? t("detail.profileComplete")
                    : t("detail.profileIncomplete"),
                  tone: completion.complete ? "person" : "neutral",
                  note: completion.complete
                    ? undefined
                    : t("detail.missing", {
                        fields: completion.missing.map(fieldName).join(", "),
                      }),
                }
              : undefined
          }
          regionName={regionName}
          languageName={languageName}
        />
        {user.profile ? null : (
          <p className="mt-4 text-sm text-ink-muted">{t("detail.noProfile")}</p>
        )}
      </Panel>

      <Panel title={t("detail.applications")}>
        {user.applications.length === 0 ? (
          <p className="text-sm text-ink-muted">{t("detail.noApplications")}</p>
        ) : (
          <ul className="flex flex-col divide-y divide-border">
            {user.applications.map((application) => (
              <li
                key={application.id}
                className="flex items-center justify-between gap-4 py-3"
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-ink">
                    {application.opportunity?.title ?? application.opportunityId}
                  </span>
                  <StatusBadge
                    label={applications(`status.${application.status}`)}
                    tone={applicationStatusTone(application.status)}
                  />
                </span>
                <Link
                  href={applicationHref(application.id)}
                  className={buttonClass({ variant: "ghost", size: "sm" })}
                >
                  {applications("table.open")}
                </Link>
              </li>
            ))}
          </ul>
        )}
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
    </>
  );
}
