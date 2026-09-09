import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";

import { LoginForm } from "@/components/auth/login-form";
import { FormMessage } from "@/components/forms/form-message";
import { fixtureModeEnabled, isAuthConfigured } from "@/lib/auth/config";
import { fixtureEmail } from "@/lib/auth/fixture-session";
import { FIXTURE_PASSWORD } from "@/lib/fixtures/data";
import { isSessionStatus, safeReturnPath } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/login">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "auth" });
  return { title: t("metaTitle"), robots: { index: false, follow: false } };
}

export default async function LoginPage({
  params,
  searchParams,
}: PageProps<"/[locale]/login">) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "auth" });
  const errors = await getTranslations({ locale, namespace: "errors" });

  const { session, next } = await searchParams;
  const status = isSessionStatus(session) ? session : null;
  const returnTo = safeReturnPath(typeof next === "string" ? next : null);
  const configured = isAuthConfigured();

  return (
    <>
      <div className="mb-6">
        <h1 className="text-page-title text-ink">{t("title")}</h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-muted">{t("subtitle")}</p>
      </div>

      {status ? (
        <FormMessage tone="error" className="mb-5">
          {t(`status.${status}`)}
        </FormMessage>
      ) : null}

      {configured ? null : (
        <FormMessage tone="error" className="mb-5">
          {errors("portalUnavailable")}
        </FormMessage>
      )}

      {fixtureModeEnabled() ? (
        <FormMessage tone="success" className="mb-5">
          {t("fixtureHint", { email: fixtureEmail, password: FIXTURE_PASSWORD })}
        </FormMessage>
      ) : null}

      <div className="rounded-xl border border-border bg-card p-6">
        <LoginForm
          locale={locale}
          next={returnTo}
          labels={{
            email: t("email"),
            password: t("password"),
            showPassword: t("showPassword"),
            hidePassword: t("hidePassword"),
            submit: t("submit"),
            pending: t("submitting"),
            fallbackError: errors("server"),
            errors: {
              invalidCredentials: errors("invalidCredentials"),
              wrongRole: errors("wrongRole"),
              portalUnavailable: errors("portalUnavailable"),
              passwordAuthUnavailable: errors("portalUnavailable"),
              authUnavailable: errors("portalUnavailable"),
              rateLimited: errors("rateLimited"),
              network: errors("network"),
              timeout: errors("timeout"),
              server: errors("server"),
              notConfigured: errors("portalUnavailable"),
              unavailable: errors("portalUnavailable"),
              accountDisabled: errors("accountDisabled"),
              required: errors("required"),
              email: errors("email"),
              emailLong: errors("emailLong"),
              passwordLong: errors("passwordLong"),
            },
          }}
        />
      </div>

      <p className="mt-6 text-center text-sm leading-relaxed text-ink-muted">
        {t("accessNotice")}
      </p>
    </>
  );
}
