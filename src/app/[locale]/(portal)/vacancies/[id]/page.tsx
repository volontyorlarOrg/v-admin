import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

import {
  AttendanceRoster,
  type RosterRow,
} from "@/components/attendance/attendance-roster";
import { DefinitionList, type Definition } from "@/components/portal/definition-list";
import { Panel } from "@/components/portal/panel";
import {
  StatusBadge,
  applicationStatusTone,
  vacancyStateTone,
} from "@/components/portal/status-badge";
import { LoadFailure } from "@/components/states/load-failure";
import { PageHeader } from "@/components/states/page-header";
import { StatePanel } from "@/components/states/state-panel";
import { ReadinessList } from "@/components/vacancies/readiness-list";
import { VacancyDialog } from "@/components/vacancies/vacancy-dialog";
import { VacancyWorkflow } from "@/components/vacancies/vacancy-workflow";
import { Button, buttonClass } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { failureOf, isReady } from "@/lib/api/load";
import { loadApplications } from "@/lib/applications/data.server";
import { isAttendanceResolved, volunteerNameOf } from "@/lib/applications/filters";
import {
  REGIONS,
  RESOLVABLE_ATTENDANCE_OUTCOMES,
  VACANCY_FORMATS,
  canArchive,
} from "@/lib/domain/vocabulary";
import { applicationHref } from "@/lib/routing/routes";
import {
  attendanceOpensAt,
  canApproveVacancy,
  canEditVacancy,
  canPublishVacancy,
  canRejectVacancy,
  canRequestVacancyChanges,
  isAttendanceOpen,
  missingForApproval,
  vacancyStateOf,
} from "@/lib/vacancies/approval";
import {
  archiveVacancyAction,
  decideVacancyAction,
  publishVacancyAction,
  updateVacancyAction,
} from "@/lib/vacancies/actions";
import { loadOrganizations, loadVacancy } from "@/lib/vacancies/data.server";
import {
  errorCatalog,
  vacancyDecisionLabels,
  vacancyDialogLabels,
  vacancyWorkflowLabels,
} from "@/lib/vacancies/labels.server";
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
  const attendanceCopy = await getTranslations("attendance");
  const applicationsCopy = await getTranslations("applications");
  const vocabulary = await getTranslations("vocabulary");
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
  const now = new Date();
  const state = vacancyStateOf(vacancy);

  const [organizations, applications] = await Promise.all([
    loadOrganizations(),
    loadApplications({ vacancyId: vacancy.id }),
  ]);

  const organization =
    vacancy.organization ??
    (isReady(organizations)
      ? organizations.data.find((item) => item.id === vacancy.organizationId)
      : undefined);

  const missing = missingForApproval(
    {
      title: vacancy.title,
      description: vacancy.description,
      format: vacancy.format,
      region: vacancy.region,
      startsAt: vacancy.startsAt,
      applicationDeadline: vacancy.applicationDeadline,
      ...(organization ? { organization: { verified: organization.verified } } : {}),
    },
    now,
  );

  const abilities = {
    submit: false,
    publish: canPublishVacancy(vacancy),
    approve: canApproveVacancy(vacancy),
    requestChanges: canRequestVacancyChanges(vacancy),
    reject: canRejectVacancy(vacancy),
    archive: canArchive(vacancy),
  };

  const readinessMatters = abilities.publish || abilities.approve;
  const reviewer =
    vacancy.approvalReviewedBy?.displayName ??
    vacancy.approvalReviewedBy?.id ??
    vacancy.approvalReviewedById;
  const approvalFacts: Definition[] = [
    ...(vacancy.approvalSubmittedAt
      ? [
          {
            term: t("approval.submitted"),
            value: format.dateTime(new Date(vacancy.approvalSubmittedAt), "stamp"),
          },
        ]
      : []),
    ...(vacancy.approvalReviewedAt
      ? [
          {
            term: t("approval.decided"),
            value: format.dateTime(new Date(vacancy.approvalReviewedAt), "stamp"),
          },
        ]
      : []),
    ...(reviewer ? [{ term: t("approval.reviewer"), value: reviewer }] : []),
  ];

  const workflowLabels = await vacancyWorkflowLabels();
  const decisionLabels = await vacancyDecisionLabels();
  const editLabels = await vacancyDialogLabels("edit");
  const editable = canEditVacancy(vacancy) && isReady(organizations);

  const rows = isReady(applications) ? applications.data : [];
  const applicationsFailure = failureOf(applications);
  const accepted = rows.filter((application) => application.status === "accepted");
  const attendanceOpen = isAttendanceOpen(vacancy, now);
  const opensAt = attendanceOpensAt(vacancy);
  const location =
    vacancy.locationName && vacancy.city
      ? vacancy.locationName.localeCompare(vacancy.city, locale, {
          sensitivity: "base",
        }) === 0
        ? vacancy.locationName
        : `${vacancy.locationName} · ${vacancy.city}`
      : (vacancy.locationName ?? vacancy.city);

  const outcomeLabels = Object.fromEntries(
    RESOLVABLE_ATTENDANCE_OUTCOMES.map((outcome) => [
      outcome,
      attendanceCopy(`outcome.${outcome}`),
    ]),
  );

  const attendanceErrors = await errorCatalog([
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
    "hours",
    "confirmedHoursRequired",
    "attendanceNotFound",
    "attendanceNotOpen",
    "attendanceOutcomeNotResolved",
    "attendanceBatchFailed",
    "noVolunteersSelected",
    "tooManyVolunteers",
    "applicationNotAccepted",
    "adminWorkflowsDisabled",
  ]);

  const rosterRows: RosterRow[] = accepted.map((application) => {
    const attendance = application.attendance;
    const detail = [
      attendance?.resolvedAt
        ? attendanceCopy("resolved", {
            when: format.dateTime(new Date(attendance.resolvedAt), "date"),
          })
        : null,
      attendance?.confirmedHours === undefined
        ? null
        : `${attendanceCopy("table.hours")}: ${format.number(attendance.confirmedHours)}`,
    ]
      .filter(Boolean)
      .join(" · ");

    return {
      applicationId: application.id,
      name: volunteerNameOf(application) || application.volunteerId,
      outcome: attendance?.outcome ?? "awaiting_confirmation",
      outcomeLabel: attendance
        ? attendanceCopy(`outcome.${attendance.outcome}`)
        : attendanceCopy("outcome.unknown"),
      resolved: isAttendanceResolved(application),
      detail,
      hours:
        attendance?.confirmedHours === undefined
          ? ""
          : String(attendance.confirmedHours),
    };
  });

  const stateNotice = {
    pending_review: {
      tone: "notice" as const,
      title: t("approval.pendingTitle"),
      description: t("approval.pendingDescription"),
    },
    changes_requested: {
      tone: "notice" as const,
      title: t("approval.changesTitle"),
      description: vacancy.approvalNote ?? t("approval.changesDescription"),
    },
    rejected: {
      tone: "danger" as const,
      title: t("approval.rejectedTitle"),
      description: vacancy.approvalNote ?? t("approval.rejectedDescription"),
    },
    archived: {
      tone: "neutral" as const,
      title: t("archivedNotice"),
    },
  }[state as string];

  return (
    <>
      <PageHeader
        eyebrow={t("detail.eyebrow")}
        title={vacancy.title}
        actions={
          <>
            {editable ? (
              <VacancyDialog
                action={updateVacancyAction}
                id={vacancy.id}
                labels={editLabels}
                defaults={{
                  title: vacancy.title,
                  description: vacancy.description,
                  organizationId: vacancy.organizationId,
                  region: vacancy.region,
                  format: vacancy.format,
                  locationName: vacancy.locationName ?? "",
                  startsAt: toDateTimeLocal(vacancy.startsAt),
                  endsAt: toDateTimeLocal(vacancy.endsAt),
                  applicationDeadline: toDateTimeLocal(vacancy.applicationDeadline),
                  capacity:
                    vacancy.capacity === undefined ? "" : String(vacancy.capacity),
                  estimatedTotalHours:
                    vacancy.estimatedTotalHours === undefined
                      ? ""
                      : String(vacancy.estimatedTotalHours),
                  acceptanceMode: vacancy.acceptanceMode,
                  essayRequired: vacancy.essayRequired ? "on" : "",
                  requirements: vacancy.requirements.join("\n"),
                }}
                organizations={
                  isReady(organizations)
                    ? organizations.data.map((item) => ({
                        id: item.id,
                        name: item.name,
                        verified: item.verified,
                      }))
                    : []
                }
                regions={REGIONS}
                formats={VACANCY_FORMATS}
                trigger={
                  <Button type="button" size="sm" variant="outline">
                    {t("form.editTitle")}
                  </Button>
                }
              />
            ) : null}

            <VacancyWorkflow
              vacancyId={vacancy.id}
              abilities={abilities}
              missing={missing}
              labels={workflowLabels}
              decisionLabels={decisionLabels}
              publishAction={publishVacancyAction}
              decideAction={decideVacancyAction}
              archiveAction={archiveVacancyAction}
            />
          </>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge label={t(`state.${state}`)} tone={vacancyStateTone(state)} />
        {organization ? (
          <span className="text-sm text-ink-muted">{organization.name}</span>
        ) : null}
      </div>

      {stateNotice ? (
        <StatePanel
          role="status"
          tone={stateNotice.tone}
          title={stateNotice.title}
          {...(stateNotice.description ? { description: stateNotice.description } : {})}
        />
      ) : null}

      {readinessMatters || approvalFacts.length > 0 ? (
        <Panel title={t("approval.title")} description={t("approval.description")}>
          {readinessMatters ? (
            <div
              className={
                approvalFacts.length > 0
                  ? "mb-5 rounded-lg border border-border bg-surface-sunk/50 px-4 py-3"
                  : "rounded-lg border border-border bg-surface-sunk/50 px-4 py-3"
              }
            >
              <p className="text-sm font-semibold text-ink">
                {missing.length === 0
                  ? t("approval.readyTitle")
                  : t("approval.missingTitle")}
              </p>
              {missing.length === 0 ? (
                <p className="mt-1 text-sm text-ink-muted">{t("approval.readyLine")}</p>
              ) : (
                <ReadinessList
                  missing={missing}
                  labels={workflowLabels.readiness}
                  className="mt-2"
                />
              )}
            </div>
          ) : null}

          {approvalFacts.length > 0 ? <DefinitionList items={approvalFacts} /> : null}
        </Panel>
      ) : null}

      <Panel title={t("detail.details")}>
        <DefinitionList
          items={[
            {
              term: t("fields.region"),
              value: vocabulary(`regions.${vacancy.region}`),
            },
            {
              term: t("fields.format"),
              value: vocabulary(`formats.${vacancy.format}`),
            },
            ...(location ? [{ term: t("fields.locationName"), value: location }] : []),
            {
              term: t("fields.startsAt"),
              value: format.dateTime(new Date(vacancy.startsAt), "stamp"),
            },
            ...(vacancy.endsAt
              ? [
                  {
                    term: t("fields.endsAt"),
                    value: format.dateTime(new Date(vacancy.endsAt), "stamp"),
                  },
                ]
              : []),
            {
              term: t("fields.applicationDeadline"),
              value: format.dateTime(new Date(vacancy.applicationDeadline), "stamp"),
            },
            ...(vacancy.capacity === undefined
              ? []
              : [
                  {
                    term: t("fields.capacity"),
                    value: format.number(vacancy.capacity),
                  },
                ]),
            ...(vacancy.estimatedTotalHours === undefined
              ? []
              : [
                  {
                    term: t("fields.estimatedTotalHours"),
                    value: format.number(vacancy.estimatedTotalHours),
                  },
                ]),
            {
              term: t("fields.acceptanceMode"),
              value: vocabulary(`acceptanceModes.${vacancy.acceptanceMode}`),
            },
            {
              term: t("fields.essayRequired"),
              value: vacancy.essayRequired
                ? t("fields.essayRequiredYes")
                : t("fields.essayRequiredNo"),
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

      {vacancy.questions.length > 0 ? (
        <Panel title={t("detail.questions")} description={t("detail.questionsLegacy")}>
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
        </Panel>
      ) : null}

      {applicationsFailure || accepted.length > 0 ? (
        <Panel
          title={attendanceCopy("roster.title")}
          description={attendanceCopy("roster.description")}
        >
          {applicationsFailure ? (
            <LoadFailure failure={applicationsFailure} />
          ) : !attendanceOpen ? (
            <StatePanel
              role="status"
              title={attendanceCopy("roster.closedTitle")}
              description={
                opensAt
                  ? attendanceCopy("roster.closedDescription", {
                      when: format.dateTime(opensAt, "stamp"),
                    })
                  : attendanceCopy("roster.closedUnknown")
              }
            />
          ) : (
            <AttendanceRoster
              vacancyId={vacancy.id}
              rows={rosterRows}
              outcomes={RESOLVABLE_ATTENDANCE_OUTCOMES}
              {...(vacancy.estimatedTotalHours === undefined
                ? {}
                : { defaultHours: String(vacancy.estimatedTotalHours) })}
              labels={{
                caption: attendanceCopy("roster.caption"),
                volunteer: attendanceCopy("table.volunteer"),
                state: attendanceCopy("table.outcome"),
                select: attendanceCopy("roster.select"),
                selectAll: attendanceCopy("roster.selectAll"),
                selected: Array.from(
                  { length: rosterRows.length + 1 },
                  (_item, count) => attendanceCopy("roster.selected", { count }),
                ),
                correct: attendanceCopy("roster.correct"),
                batchTitle: attendanceCopy("roster.batchTitle"),
                batchHelp: attendanceCopy("roster.batchHelp"),
                outcome: attendanceCopy("roster.outcome"),
                outcomes: outcomeLabels,
                hours: attendanceCopy("roster.hours"),
                hoursHelp:
                  vacancy.estimatedTotalHours === undefined
                    ? attendanceCopy("resolve.hoursHelp")
                    : attendanceCopy("roster.hoursHelp"),
                submit: attendanceCopy("roster.submit"),
                pending: attendanceCopy("roster.pending"),
                success: attendanceCopy("roster.success"),
                fallbackError: errors("server"),
                errors: attendanceErrors,
                row: {
                  outcome: attendanceCopy("resolve.outcome"),
                  outcomes: outcomeLabels,
                  hours: attendanceCopy("resolve.hours"),
                  hoursHelp: attendanceCopy("resolve.hoursHelp"),
                  submit: attendanceCopy("resolve.confirm"),
                  pending: attendanceCopy("resolve.pending"),
                  success: attendanceCopy("resolve.success"),
                  fallbackError: errors("server"),
                  errors: attendanceErrors,
                },
              }}
            />
          )}
        </Panel>
      ) : null}

      <Panel title={t("detail.applications")}>
        {applicationsFailure ? (
          <LoadFailure failure={applicationsFailure} />
        ) : rows.length === 0 ? (
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
    </>
  );
}
