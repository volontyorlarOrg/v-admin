import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";

import { CoordinatorForm } from "@/components/coordinators/coordinator-form";
import { Panel } from "@/components/portal/panel";
import { PageHeader } from "@/components/states/page-header";
import { StatePanel } from "@/components/states/state-panel";
import { errorCatalog } from "@/lib/vacancies/labels.server";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/coordinators/new">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "coordinators" });
  return { title: t("create.title") };
}

export default async function NewCoordinatorPage({
  params,
}: PageProps<"/[locale]/coordinators/new">) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("coordinators");
  const auth = await getTranslations("auth");
  const errors = await getTranslations("errors");

  return (
    <>
      <PageHeader
        eyebrow={t("detail.eyebrow")}
        title={t("create.title")}
        description={t("create.description")}
      />

      <Panel>
        <CoordinatorForm
          labels={{
            name: t("create.name"),
            email: t("create.email"),
            temporaryPassword: t("create.temporaryPassword"),
            temporaryPasswordHelp: t("create.temporaryPasswordHelp"),
            showPassword: auth("showPassword"),
            hidePassword: auth("hidePassword"),
            submit: t("create.submit"),
            pending: t("create.pending"),
            success: t("create.success"),
            fallbackError: errors("server"),
            errors: await errorCatalog([
              "server",
              "network",
              "timeout",
              "rateLimited",
              "unavailable",
              "forbidden",
              "conflict",
              "validationFailed",
              "awaitingContract",
              "sessionExpired",
              "required",
              "email",
              "emailLong",
              "nameLong",
              "passwordShort",
              "passwordLong",
              "weakPassword",
              "emailUnavailable",
            ]),
          }}
        />
      </Panel>

      <StatePanel role="status" title={t("adminNotice")} />
    </>
  );
}
