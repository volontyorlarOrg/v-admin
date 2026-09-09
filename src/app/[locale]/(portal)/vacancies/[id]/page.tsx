import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { ConfirmAction } from "@/components/forms/confirm-action";
import { DefinitionList } from "@/components/portal/definition-list";
import { Panel } from "@/components/portal/panel";
import {
  StatusBadge,
  applicationStatusTone,
  vacancyStageTone,
} from "@/components/portal/status-badge";
import { LoadFailure } from "@/components/states/load-failure";
import { PageHeader } from "@/components/states/page-header";
import { StatePanel } from "@/components/states/state-panel";
import { VacancyForm } from "@/components/vacancies/vacancy-form";
import { buttonClass } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { failureOf, isReady } from "@/lib/api/load";
import { loadApplications } from "@/lib/applications/data.server";
import { volunteerNameOf } from "@/lib/applications/filters";
import {
  REGIONS,
  VACANCY_FORMATS,
  canArchive,
  canEdit,
  canPublish,
  stageOf,
} from "@/lib/domain/vocabulary";
import { applicationHref } from "@/lib/routing/routes";
import {
  archiveVacancyAction,
  publishVacancyAction,
  updateVacancyAction,
} from "@/lib/vacancies/actions";
import { loadOrganizations, loadVacancy } from "@/lib/vacancies/data.server";
import { errorCatalog, vacancyFormLabels } from "@/lib/vacancies/labels.server";
import { toDateTimeLocal } from "@/lib/vacancies/form";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/vacancies/[id]">): Promise<Metadata> {
  const { locale, id } = await params;
  const t = await getTranslations({ locale, namespace: "vacancies" });
  const loaded = await loadVacancy(id);
  return { title: isReady(loaded) ? loaded.data.title : t("detail.eyebrow") };
}

export default async function VacancyPage({
  params,
}: PageProps<"/[locale]/vacancies/[id]">) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("vacancies");
  const applicationsCopy = await getTranslations("applications");
  const vocabulary = await getTranslations("vocabulary");
  const common = await getTranslations("common");
  const errors = await getTranslations("errors");
  const format = await getFormatter();

  const loaded = await loadVacancy(id);
  const failure = failureOf(loaded);

  if (failure) {
    return (
      <>
        <PageHeader eyebrow={t("detail.eyebrow")} title={t("title")} />
        <LoadFailure failure={failure} />
      </>
    );
  }

  if (!isReady(loaded)) notFound();

  const vacancy = loaded.data;

  const stage = stageOf(vacancy);
  const [organizations, applications] = await Promise.all([
    loadOrganizations(),
    loadApplications({ vacancyId: vacancy.id }),
  ]);

  const confirmErrors = await errorCatalog();
  const labels = await vacancyFormLabels(
    t("form.submitUpdate"),
    t("form.pending"),
    t("form.updated"),
  );

  const rows = isReady(applications) ? applications.data : [];

  return (
    <>
      <PageHeader
        eyebrow={t("detail.eyebrow")}
        title={vacancy.title}
        description={vacancy.summary}
        actions={
          <>
            {canPublish(vacancy) ? (
              <ConfirmAction
                action={publishVacancyAction}
                fields={{ id: vacancy.id }}
                labels={{
                  trigger: t("publish.trigger"),
                  title: t("publish.title"),
                  description: t("publish.description"),
                  confirm: t("publish.confirm"),
                  cancel: common("cancel"),
                  pending: t("publish.pending"),
                  fallbackError: errors("server"),
                  errors: confirmErrors,
                }}
              />
            ) : null}
            {canArchive(vacancy) ? (
              <ConfirmAction
                action={archiveVacancyAction}
                tone="danger"
                fields={{ id: vacancy.id }}
                labels={{
                  trigger: t("archive.trigger"),
                  title: t("archive.title"),
                  description: t("archive.description"),
                  confirm: t("archive.confirm"),
                  cancel: common("cancel"),
                  pending: t("archive.pending"),
                  fallbackError: errors("server"),
                  errors: confirmErrors,
                }}
              />
            ) : null}
          </>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge label={t(`stage.${stage}`)} tone={vacancyStageTone(stage)} />
        {vacancy.organization ? (
          <span className="text-sm text-ink-muted">{vacancy.organization.name}</span>
        ) : null}
      </div>

      {stage === "archived" ? (
        <StatePanel role="status" title={t("archivedNotice")} />
      ) : null}

      <Panel title={t("detail.details")}>
        <DefinitionList
          items={[
            { term: t("fields.slug"), value: vacancy.slug },
            {
              term: t("fields.region"),
              value: vocabulary(`regions.${vacancy.region}`),
            },
            {
              term: t("fields.format"),
              value: vocabulary(`formats.${vacancy.format}`),
            },
            { term: t("fields.city"), value: vacancy.city ?? common("notSet") },
            {
              term: t("fields.locationName"),
              value: vacancy.locationName ?? common("notSet"),
            },
            {
              term: t("fields.startsAt"),
              value: format.dateTime(new Date(vacancy.startsAt), "stamp"),
            },
            {
              term: t("fields.endsAt"),
              value: vacancy.endsAt
                ? format.dateTime(new Date(vacancy.endsAt), "stamp")
                : common("notSet"),
            },
            {
              term: t("fields.applicationDeadline"),
              value: format.dateTime(new Date(vacancy.applicationDeadline), "stamp"),
            },
            {
              term: t("fields.capacity"),
              value:
                vacancy.capacity === undefined
                  ? common("none")
                  : format.number(vacancy.capacity),
            },
          ]}
        />
      </Panel>

      <Panel title={t("detail.description")}>
        <p className="text-sm leading-relaxed whitespace-pre-line text-ink">
          {vacancy.description}
        </p>
        {vacancy.requirements.length > 0 ? (
          <>
            <h3 className="eyebrow mt-5 text-ink-muted">{t("detail.requirements")}</h3>
            <ul className="mt-2 list-disc pl-5 text-sm text-ink">
              {vacancy.requirements.map((requirement) => (
                <li key={requirement}>{requirement}</li>
              ))}
            </ul>
          </>
        ) : null}
      </Panel>

      <Panel title={t("detail.questions")}>
        {vacancy.questions.length === 0 ? (
          <p className="text-sm text-ink-muted">{t("detail.noQuestions")}</p>
        ) : (
          <ol className="flex flex-col gap-3">
            {[...vacancy.questions]
              .sort((a, b) => a.position - b.position)
              .map((question) => (
                <li key={question.id} className="text-sm text-ink">
                  {question.prompt}
                  {question.helpText ? (
                    <span className="mt-0.5 block text-xs text-ink-muted">
                      {question.helpText}
                    </span>
                  ) : null}
                </li>
              ))}
          </ol>
        )}
      </Panel>

      <Panel title={t("detail.applications")}>
        {rows.length === 0 ? (
          <p className="text-sm text-ink-muted">{t("detail.noApplications")}</p>
        ) : (
          <ul className="flex flex-col divide-y divide-border">
            {rows.map((application) => (
              <li
                key={application.id}
                className="flex items-center justify-between gap-4 py-3"
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-ink">
                    {volunteerNameOf(application) || application.volunteerId}
                  </span>
                  <StatusBadge
                    label={applicationsCopy(`status.${application.status}`)}
                    tone={applicationStatusTone(application.status)}
                  />
                </span>
                <Link
                  href={applicationHref(application.id)}
                  className={buttonClass({ variant: "ghost", size: "sm" })}
                >
                  {applicationsCopy("table.open")}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      {canEdit(vacancy) && isReady(organizations) ? (
        <Panel title={t("form.editTitle")}>
          <VacancyForm
            action={updateVacancyAction}
            id={vacancy.id}
            labels={labels}
            defaults={{
              title: vacancy.title,
              slug: vacancy.slug,
              summary: vacancy.summary,
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
              requirements: vacancy.requirements.join("\n"),
            }}
            organizations={organizations.data.map((organization) => ({
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
