import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

import {
  AttendanceRoster,
  type RosterRow,
} from "@/components/attendance/attendance-roster";
import { ConfirmAction } from "@/components/forms/confirm-action";
import { VacancyDecisionForm } from "@/components/vacancies/decision-form";
import { DefinitionList } from "@/components/portal/definition-list";
import { Panel } from "@/components/portal/panel";
import {
  StatusBadge,
  applicationStatusTone,
  vacancyStateTone,
} from "@/components/portal/status-badge";
import { LoadFailure } from "@/components/states/load-failure";
import { PageHeader } from "@/components/states/page-header";
import { StatePanel } from "@/components/states/state-panel";
import { VacancyForm } from "@/components/vacancies/vacancy-form";
import { buttonClass } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { failureOf, isReady } from "@/lib/api/load";
import { loadApplications } from "@/lib/applications/data.server";
import { isAttendanceResolved, volunteerNameOf } from "@/lib/applications/filters";
import {
  REGIONS,
  VACANCY_DECISIONS,
  RESOLVABLE_ATTENDANCE_OUTCOMES,
  VACANCY_FORMATS,
  canArchive,
} from "@/lib/domain/vocabulary";
import { applicationHref } from "@/lib/routing/routes";
import {
  attendanceOpensAt,
  canApproveVacancy,
  canEditVacancy,
  canRejectVacancy,
  canRequestVacancyChanges,
  isAttendanceOpen,
  missingForApproval,
  vacancyStateOf,
} from "@/lib/vacancies/approval";
import { archiveVacancyAction, updateVacancyAction } from "@/lib/vacancies/actions";
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
  const attendanceCopy = await getTranslations("attendance");
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
      summary: vacancy.summary,
      description: vacancy.description,
      format: vacancy.format,
      region: vacancy.region,
      city: vacancy.city,
      locationName: vacancy.locationName,
      startsAt: vacancy.startsAt,
      endsAt: vacancy.endsAt,
      applicationDeadline: vacancy.applicationDeadline,
      capacity: vacancy.capacity,
      estimatedTotalHours: vacancy.estimatedTotalHours,
      ...(organization ? { organization: { verified: organization.verified } } : {}),
    },
    now,
  );

  const decidable = ["draft", "pending_review", "changes_requested"];
  const decisions = VACANCY_DECISIONS.filter((decision) => {
    if (decision === "approve") {
      return canApproveVacancy(vacancy) && missing.length === 0;
    }
    if (decision === "request_changes") return canRequestVacancyChanges(vacancy);
    return canRejectVacancy(vacancy);
  });
  const confirmErrors = await errorCatalog();
  const labels = await vacancyFormLabels(
    t("form.submitUpdate"),
    t("form.pending"),
    t("form.updated"),
  );

  const rows = isReady(applications) ? applications.data : [];
  const accepted = rows.filter((application) => application.status === "accepted");
  const attendanceOpen = isAttendanceOpen(vacancy, now);
  const opensAt = attendanceOpensAt(vacancy);

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

  return (
    <>
      <PageHeader
        eyebrow={t("detail.eyebrow")}
        title={vacancy.title}
        description={vacancy.summary}
        actions={
          <>
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
        <StatusBadge label={t(`state.${state}`)} tone={vacancyStateTone(state)} />
        {organization ? (
          <span className="text-sm text-ink-muted">{organization.name}</span>
        ) : null}
      </div>

      {state === "pending_review" ? (
        <StatePanel
          role="status"
          tone="notice"
          title={t("approval.pendingTitle")}
          description={t("approval.pendingDescription")}
        />
      ) : null}

      {state === "changes_requested" ? (
        <StatePanel
          role="status"
          tone="notice"
          title={t("approval.changesTitle")}
          description={vacancy.approvalNote ?? t("approval.changesDescription")}
        />
      ) : null}

      {state === "rejected" ? (
        <StatePanel
          role="status"
          tone="danger"
          title={t("approval.rejectedTitle")}
          description={vacancy.approvalNote ?? t("approval.rejectedDescription")}
        />
      ) : null}

      {state === "archived" ? (
        <StatePanel role="status" title={t("archivedNotice")} />
      ) : null}

      {missing.length > 0 && decidable.includes(state) ? (
        <StatePanel
          role="status"
          tone="notice"
          title={t("approval.missingTitle")}
          description={`${t("approval.missingDescription")} ${missing
            .map((requirement) => t(`approval.requirements.${requirement}`))
            .join(", ")}`}
        />
      ) : null}

      <Panel title={t("decide.title")} description={t("decide.description")}>
        <VacancyDecisionForm
          vacancyId={vacancy.id}
          decisions={decisions}
          labels={{
            closedTitle: t("decide.closedTitle"),
            closedDescription: t("decide.closedDescription"),
            decision: t("decide.decision"),
            decisions: Object.fromEntries(
              VACANCY_DECISIONS.map((decision) => [decision, t(`decide.${decision}`)]),
            ),
            note: t("decide.note"),
            noteHelp: t("decide.noteHelp"),
            submit: t("decide.submit"),
            pending: t("decide.pending"),
            success: t("decide.success"),
            fallbackError: errors("server"),
            errors: confirmErrors,
          }}
        />
      </Panel>

      <Panel title={t("approval.title")} description={t("approval.description")}>
        <DefinitionList
          items={[
            { term: t("approval.status"), value: t(`state.${state}`) },
            {
              term: t("approval.submitted"),
              value: vacancy.approvalSubmittedAt
                ? format.dateTime(new Date(vacancy.approvalSubmittedAt), "stamp")
                : t("approval.notSubmitted"),
            },
            {
              term: t("approval.decided"),
              value: vacancy.approvalReviewedAt
                ? format.dateTime(new Date(vacancy.approvalReviewedAt), "stamp")
                : common("notSet"),
            },
            {
              term: t("approval.reviewer"),
              value:
                vacancy.approvalReviewedBy?.displayName ??
                vacancy.approvalReviewedBy?.id ??
                vacancy.approvalReviewedById ??
                common("notSet"),
            },
            {
              term: t("approval.note"),
              value: vacancy.approvalNote ?? t("approval.noNote"),
            },
          ]}
        />
      </Panel>

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
            {
              term: t("fields.estimatedTotalHours"),
              value:
                vacancy.estimatedTotalHours === undefined
                  ? common("notSet")
                  : format.number(vacancy.estimatedTotalHours),
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

      <Panel
        title={attendanceCopy("roster.title")}
        description={attendanceCopy("roster.description")}
      >
        {accepted.length === 0 ? (
          <p className="text-sm text-ink-muted">
            {attendanceCopy("roster.noAccepted")}
          </p>
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
            labels={{
              caption: attendanceCopy("roster.caption"),
              volunteer: attendanceCopy("table.volunteer"),
              state: attendanceCopy("table.outcome"),
              select: attendanceCopy("roster.select"),
              selectAll: attendanceCopy("roster.selectAll"),
              selected: Array.from({ length: rosterRows.length + 1 }, (_item, count) =>
                attendanceCopy("roster.selected", { count }),
              ),
              correct: attendanceCopy("roster.correct"),
              batchTitle: attendanceCopy("roster.batchTitle"),
              batchHelp: attendanceCopy("roster.batchHelp"),
              outcome: attendanceCopy("roster.outcome"),
              outcomes: outcomeLabels,
              hours: attendanceCopy("roster.hours"),
              hoursHelp: attendanceCopy("resolve.hoursHelp"),
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

      {canEditVacancy(vacancy) && isReady(organizations) ? (
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
              estimatedTotalHours:
                vacancy.estimatedTotalHours === undefined
                  ? ""
                  : String(vacancy.estimatedTotalHours),
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
