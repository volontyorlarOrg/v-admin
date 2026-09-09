import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";

import { DefinitionList } from "@/components/portal/definition-list";
import { Panel } from "@/components/portal/panel";
import { StatusBadge, applicationStatusTone } from "@/components/portal/status-badge";
import { TemporaryPasswordForm } from "@/components/portal/temporary-password-form";
import { LoadFailure } from "@/components/states/load-failure";
import { PageHeader } from "@/components/states/page-header";
import { buttonClass } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { failureOf, isReady } from "@/lib/api/load";
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
  const format = await getFormatter();

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
