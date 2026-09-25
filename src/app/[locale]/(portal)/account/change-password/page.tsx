import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";

import { ChangePasswordForm } from "@/components/account/change-password-form";
import { Panel } from "@/components/portal/panel";
import { PageHeader } from "@/components/states/page-header";
import { StatePanel } from "@/components/states/state-panel";
import { getSession } from "@/lib/auth/session.server";
import { HOME_ROUTE, navHref } from "@/lib/routing/routes";
import { errorCatalog } from "@/lib/vacancies/labels.server";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/account/change-password">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "account" });
  return { title: t("title") };
}

export default async function ChangePasswordPage({
  params,
}: PageProps<"/[locale]/account/change-password">) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("account");
  const auth = await getTranslations("auth");
  const errors = await getTranslations("errors");

  const session = await getSession();
  const required = session?.passwordChangeRequired ?? false;

  return (
    <>
      <PageHeader title={t("title")} description={t("description")} />

      {required ? (
        <StatePanel
          role="status"
          tone="notice"
          title={t("required.title")}
          description={t("required.description")}
          className="max-w-2xl"
        />
      ) : null}

      <Panel className="max-w-2xl">
        <ChangePasswordForm
          labels={{
            currentPassword: t("currentPassword"),
            newPassword: t("newPassword"),
            newPasswordHelp: t("newPasswordHelp"),
            confirmPassword: t("confirmPassword"),
            showPassword: auth("showPassword"),
            hidePassword: auth("hidePassword"),
            submit: t("submit"),
            pending: t("pending"),
            success: t("success"),
            continueLabel: t("continue"),
            continueHref: navHref(HOME_ROUTE),
            fallbackError: errors("server"),
            errors: await errorCatalog([
              "server",
              "network",
              "timeout",
              "rateLimited",
              "unavailable",
              "forbidden",
              "validationFailed",
              "awaitingContract",
              "sessionExpired",
              "invalidCredentials",
              "required",
              "passwordShort",
              "passwordLong",
              "passwordMismatch",
              "passwordUnchanged",
              "weakPassword",
            ]),
          }}
        />
      </Panel>
    </>
  );
}
