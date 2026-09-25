import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { LoadFailure } from "@/components/states/load-failure";
import { PageHeader } from "@/components/states/page-header";
import { StatePanel } from "@/components/states/state-panel";
import { VacancyForm } from "@/components/vacancies/vacancy-form";
import { failureOf, isReady } from "@/lib/api/load";
import { REGIONS, VACANCY_FORMATS } from "@/lib/domain/vocabulary";
import { vacancyHref } from "@/lib/routing/routes";
import { canEditVacancy } from "@/lib/vacancies/approval";
import { updateVacancyAction } from "@/lib/vacancies/actions";
import { loadOrganizations, loadVacancy } from "@/lib/vacancies/data.server";
import { toDateTimeLocal } from "@/lib/vacancies/form";
import { vacancyFormLabels } from "@/lib/vacancies/labels.server";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/vacancies/[id]/edit">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "vacancies" });
  return { title: t("form.editTitle") };
}

export default async function EditVacancyPage({
  params,
}: PageProps<"/[locale]/vacancies/[id]/edit">) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("vacancies");
  const [loaded, organizations] = await Promise.all([
    loadVacancy(id),
    loadOrganizations(),
  ]);
  const failure = failureOf(loaded) ?? failureOf(organizations);
  const back = { href: vacancyHref(id), label: t("form.backToVacancy") };

  if (failure) {
    return (
      <>
        <PageHeader back={back} title={t("form.editTitle")} />
        <LoadFailure failure={failure} />
      </>
    );
  }

  if (!isReady(loaded) || !isReady(organizations)) notFound();

  const vacancy = loaded.data;
  const labels = await vacancyFormLabels(
    t("form.submitUpdate"),
    t("form.pending"),
    t("form.updated"),
  );

  return (
    <>
      <PageHeader back={back} title={t("form.editTitle")} description={vacancy.title} />

      {canEditVacancy(vacancy) ? (
        <VacancyForm
          action={updateVacancyAction}
          id={vacancy.id}
          locale={locale}
          cancelHref={vacancyHref(vacancy.id)}
          labels={labels}
          defaults={{
            title: vacancy.title,
            description: vacancy.description,
            organizationId: vacancy.organizationId,
            region: vacancy.region,
            format: vacancy.format,
            city: vacancy.city ?? "",
            locationName: vacancy.locationName ?? "",
            startsAt: toDateTimeLocal(vacancy.startsAt),
            endsAt: toDateTimeLocal(vacancy.endsAt),
            applicationDeadline: toDateTimeLocal(vacancy.applicationDeadline),
            capacity: vacancy.capacity === undefined ? "" : String(vacancy.capacity),
            estimatedTotalHours:
              vacancy.estimatedTotalHours === undefined
                ? ""
                : String(vacancy.estimatedTotalHours),
            acceptanceMode: vacancy.acceptanceMode,
            essayRequired: vacancy.essayRequired ? "on" : "",
            requirements: vacancy.requirements.join("\n"),
          }}
          organizations={organizations.data.map((item) => ({
            id: item.id,
            name: item.name,
            verified: item.verified,
          }))}
          regions={REGIONS}
          formats={VACANCY_FORMATS}
        />
      ) : (
        <StatePanel role="status" title={t("form.locked")} />
      )}
    </>
  );
}
