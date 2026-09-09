import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";

import { Panel } from "@/components/portal/panel";
import { LoadFailure } from "@/components/states/load-failure";
import { PageHeader } from "@/components/states/page-header";
import { StatePanel } from "@/components/states/state-panel";
import { VacancyForm } from "@/components/vacancies/vacancy-form";
import { failureOf, isReady } from "@/lib/api/load";
import { REGIONS, VACANCY_FORMATS } from "@/lib/domain/vocabulary";
import { createVacancyAction } from "@/lib/vacancies/actions";
import { loadOrganizations } from "@/lib/vacancies/data.server";
import { vacancyFormLabels } from "@/lib/vacancies/labels.server";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/vacancies/new">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "vacancies" });
  return { title: t("form.createTitle") };
}

export default async function NewVacancyPage({
  params,
}: PageProps<"/[locale]/vacancies/new">) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("vacancies");
  const organizations = await loadOrganizations();
  const failure = failureOf(organizations);
  const available = isReady(organizations) ? organizations.data : [];

  const labels = await vacancyFormLabels(
    t("form.submitCreate"),
    t("form.pending"),
    t("form.created"),
  );

  return (
    <>
      <PageHeader
        eyebrow={t("detail.eyebrow")}
        title={t("form.createTitle")}
        description={t("form.createDescription")}
      />

      {failure ? <LoadFailure failure={failure} /> : null}

      {isReady(organizations) && available.length === 0 ? (
        <StatePanel role="status" title={t("form.noOrganizations")} />
      ) : null}

      {available.length > 0 ? (
        <Panel>
          <VacancyForm
            action={createVacancyAction}
            labels={labels}
            defaults={{}}
            organizations={available.map((organization) => ({
              id: organization.id,
              name: organization.name,
              verified: organization.verified,
            }))}
            regions={REGIONS}
            formats={VACANCY_FORMATS}
          />
        </Panel>
      ) : null}
    </>
  );
}
