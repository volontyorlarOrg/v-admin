import { PencilLine, Stamp } from "lucide-react";
import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

import {
  AttendanceRoster,
  type RosterRow,
} from "@/components/attendance/attendance-roster";
import { Avatar } from "@/components/portal/avatar";
import { Panel } from "@/components/portal/panel";
import {
  StatusBadge,
  applicationStatus,
  attendanceStatus,
  vacancyStatus,
} from "@/components/portal/status-badge";
import { Facts, type Fact } from "@/components/register/facts";
import { InlineDecision } from "@/components/register/inline-decision";
import { Register, RegisterNote } from "@/components/register/register";
import { Seal } from "@/components/register/seal";
import { LoadFailure } from "@/components/states/load-failure";
import { PageHeader } from "@/components/states/page-header";
import { StatePanel } from "@/components/states/state-panel";
import { ArchiveVacancy } from "@/components/vacancies/archive-vacancy";
import { ReadinessList } from "@/components/vacancies/readiness-list";
import { VacancyImage } from "@/components/vacancies/vacancy-image";
import { buttonClass } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Link } from "@/i18n/navigation";
import { failureOf, isReady } from "@/lib/api/load";
import { reviewApplicationAction } from "@/lib/applications/actions";
import { loadApplications } from "@/lib/applications/data.server";
import { isAttendanceResolved, volunteerNameOf } from "@/lib/applications/filters";
import { loadCoordinators } from "@/lib/coordinators/data.server";
import { sealDate } from "@/lib/datetime";
import {
  RESOLVABLE_ATTENDANCE_OUTCOMES,
  SENT_APPLICATION_STATUSES,
  canArchive,
} from "@/lib/domain/vocabulary";
import { vacancyDecisions } from "@/lib/queue/approval-decisions.server";
import { applicationDecisions, decisionLabels } from "@/lib/queue/decisions.server";
import { MAX_PAGE_SIZE } from "@/lib/routing/search-params";
import {
  applicationHref,
  coordinatorHref,
  navHref,
  vacancyEditHref,
} from "@/lib/routing/routes";
import {
  APPROVAL_REQUIREMENTS,
  attendanceOpensAt,
  canApproveVacancy,
  canEditVacancy,
  canPublishVacancy,
  isAttendanceOpen,
  missingForApproval,
  vacancyStateOf,
} from "@/lib/vacancies/approval";
import {
  archiveVacancyAction,
  decideVacancyAction,
  publishVacancyAction,
  uploadVacancyImageAction,
  removeVacancyImageAction,
} from "@/lib/vacancies/actions";
import { loadOrganizations, loadVacancy } from "@/lib/vacancies/data.server";
import { errorCatalog } from "@/lib/vacancies/labels.server";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/vacancies/[id]">): Promise<Metadata> {
  const { locale, id } = await params;
  const t = await getTranslations({ locale, namespace: "vacancies" });
  const loaded = await loadVacancy(id);
  return { title: isReady(loaded) ? loaded.data.title : t("record") };
}

export default async function VacancyPage({
  params,
}: PageProps<"/[locale]/vacancies/[id]">) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const [
    t,
    attendanceCopy,
    applicationsCopy,
    vocabulary,
    errors,
    common,
    seal,
    format,
  ] = await Promise.all([
    getTranslations("vacancies"),
    getTranslations("attendance"),
    getTranslations("applications"),
    getTranslations("vocabulary"),
    getTranslations("errors"),
    getTranslations("common"),
    getTranslations("seal"),
    getFormatter(),
  ]);

  const back = { href: navHref("vacancies"), label: t("title") };
  const loaded = await loadVacancy(id);
  const failure = failureOf(loaded);

  if (failure) {
    return (
      <>
        <PageHeader back={back} title={t("record")} />
        <LoadFailure failure={failure} />
      </>
    );
  }

  if (!isReady(loaded)) notFound();

  const vacancy = loaded.data;
  const now = new Date();
  const state = vacancyStateOf(vacancy);
  const status = vacancyStatus(state);

  const [organizations, applications, coordinators] = await Promise.all([
    loadOrganizations(),
    loadApplications({ vacancyId: vacancy.id }),
    loadCoordinators({ page: 1, pageSize: MAX_PAGE_SIZE }),
  ]);

  const organization =
    (isReady(organizations)
      ? organizations.data.find((item) => item.id === vacancy.organizationId)
      : undefined) ?? vacancy.organization;
  const coordinator =
    vacancy.createdById && isReady(coordinators)
      ? coordinators.data.items.find((item) => item.id === vacancy.createdById)
      : undefined;

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
  const ready = missing.length === 0;

  const rows = isReady(applications) ? applications.data : [];
  const applicationsFailure = failureOf(applications);
  const accepted = rows.filter((application) => application.status === "accepted");
  const undecided = rows.filter(
    (application) =>
      application.status === "submitted" || application.status === "under_review",
  );
  const attendanceOpen = isAttendanceOpen(vacancy, now);
  const opensAt = attendanceOpensAt(vacancy);

  const [labels, vacancyOptions, applicationOptions] = await Promise.all([
    decisionLabels(),
    vacancyDecisions(),
    applicationDecisions(),
  ]);

  const readinessLabels = {
    met: t("approval.met"),
    unmet: t("approval.unmet"),
    requirements: Object.fromEntries(
      APPROVAL_REQUIREMENTS.map((requirement) => [
        requirement,
        t(`approval.requirements.${requirement}`),
      ]),
    ),
  };

  const location =
    vacancy.locationName && vacancy.city
      ? vacancy.locationName.localeCompare(vacancy.city, locale, {
          sensitivity: "base",
        }) === 0
        ? vacancy.locationName
        : `${vacancy.locationName} · ${vacancy.city}`
      : (vacancy.locationName ?? vacancy.city);

  const facts: Fact[] = [
    {
      term: t("fields.startsAt"),
      value: vacancy.endsAt
        ? t("detail.span", {
            from: format.dateTime(new Date(vacancy.startsAt), "stamp"),
            to: format.dateTime(new Date(vacancy.endsAt), "stamp"),
          })
        : format.dateTime(new Date(vacancy.startsAt), "stamp"),
    },
    {
      term: t("fields.applicationDeadline"),
      value: format.dateTime(new Date(vacancy.applicationDeadline), "stamp"),
    },
    {
      term: t("fields.region"),
      value: [vocabulary(`regions.${vacancy.region}`), location]
        .filter(Boolean)
        .join(" · "),
    },
    { term: t("fields.format"), value: vocabulary(`formats.${vacancy.format}`) },
    {
      term: t("fields.capacity"),
      value:
        vacancy.capacity === undefined
          ? t("detail.noLimit")
          : t("detail.places", {
              taken: accepted.length,
              capacity: vacancy.capacity,
            }),
    },
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
  ];

  const reviewer =
    vacancy.approvalReviewedBy?.displayName ??
    vacancy.approvalReviewedBy?.id ??
    vacancy.approvalReviewedById;
  const approvalFacts: Fact[] = [
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
    ...(vacancy.approvalNote
      ? [{ term: t("approval.note"), value: vacancy.approvalNote }]
      : []),
  ];

  const byStatus = SENT_APPLICATION_STATUSES.map((value) => ({
    value,
    count: rows.filter((application) => application.status === value).length,
  })).filter((entry) => entry.count > 0);

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
    "duplicateAttendanceApplication",
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
        : attendanceCopy("hoursLine", {
            hours: format.number(attendance.confirmedHours),
          }),
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

  const approved = state === "approved" && vacancy.approvalReviewedAt;
  const readinessId = "vacancy-readiness";

  return (
    <>
      <PageHeader
        back={back}
        title={vacancy.title}
        meta={
          <>
            <StatusBadge
              label={t(`state.${state}`)}
              tone={status.tone}
              icon={status.icon}
            />
            {organization ? <span>{organization.name}</span> : null}
            {coordinator ? (
              <Link
                href={coordinatorHref(coordinator.id)}
                className="text-primary-ink hover:underline"
              >
                {coordinator.displayName ?? coordinator.email}
              </Link>
            ) : null}
          </>
        }
        actions={
          <>
            {approved ? (
              <Seal
                word={seal("approved")}
                date={sealDate(vacancy.approvalReviewedAt as string)}
                issuer={seal("issuer")}
                label={seal("label", {
                  word: seal("approved"),
                  date: sealDate(vacancy.approvalReviewedAt as string),
                })}
                size={76}
              />
            ) : null}
            {canEditVacancy(vacancy) ? (
              <Link
                href={vacancyEditHref(vacancy.id)}
                className={buttonClass({ variant: "outline", size: "sm" })}
              >
                <PencilLine aria-hidden="true" />
                {t("form.editTitle")}
              </Link>
            ) : null}
            {canArchive(vacancy) ? (
              <ArchiveVacancy
                vacancyId={vacancy.id}
                action={archiveVacancyAction}
                undecided={undecided.length}
                labels={{
                  trigger: t("archive.trigger"),
                  title: t("archive.title"),
                  description:
                    undecided.length > 0
                      ? t("archive.closes", { count: undecided.length })
                      : t("archive.description"),
                  submit: t("archive.confirm"),
                  pending: t("archive.pending"),
                  success: t("archive.success"),
                  cancel: common("cancel"),
                  close: common("close"),
                  summary: common("fixFields"),
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
                    "sessionExpired",
                    "opportunityNotFound",
                    "opportunityAlreadyArchived",
                  ]),
                }}
              />
            ) : null}
          </>
        }
      />

      {canApproveVacancy(vacancy) ? (
        <section
          aria-labelledby="decision-title"
          className="rounded-xl border border-border bg-surface-soft px-5 py-4 shadow-(--sheet-shadow)"
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex min-w-0 gap-3" id={readinessId}>
              <span
                aria-hidden="true"
                className="grid size-9 shrink-0 place-items-center rounded-full bg-primary text-knockout"
              >
                <Stamp className="size-4" strokeWidth={2} />
              </span>
              <div className="min-w-0">
                <h2 id="decision-title" className="text-section text-ink">
                  {t("approval.pendingTitle")}
                </h2>
                <p className="mt-1 text-sm text-ink-muted">
                  {ready ? t("approval.readyLine") : t("approval.missingDescription")}
                </p>
                {ready ? null : (
                  <ReadinessList
                    missing={missing}
                    labels={readinessLabels}
                    className="mt-2"
                    onlyMissing
                  />
                )}
              </div>
            </div>
            <div className="grid w-full grid-cols-1 gap-3 lg:w-auto lg:justify-items-end">
              <InlineDecision
                action={decideVacancyAction}
                hidden={{ id: vacancy.id }}
                subject={vacancy.title}
                labels={labels}
                options={vacancyOptions({
                  title: vacancy.title,
                  ready,
                  describedBy: readinessId,
                })}
                className="lg:justify-end"
                expandClassName="w-full lg:w-[32rem]"
              />
            </div>
          </div>
        </section>
      ) : null}

      {canPublishVacancy(vacancy) ? (
        <section
          aria-labelledby="publish-title"
          className="flex flex-col gap-4 sheet px-5 py-4 lg:flex-row lg:items-start lg:justify-between"
        >
          <div className="min-w-0" id={readinessId}>
            <h2 id="publish-title" className="text-section text-ink">
              {state === "changes_requested"
                ? t("approval.changesTitle")
                : t("approval.draftTitle")}
            </h2>
            <p className="mt-1 text-sm text-ink-muted">
              {state === "changes_requested" && vacancy.approvalNote
                ? vacancy.approvalNote
                : ready
                  ? t("approval.readyLine")
                  : t("approval.missingDescription")}
            </p>
            {ready ? null : (
              <ReadinessList
                missing={missing}
                labels={readinessLabels}
                className="mt-2"
                onlyMissing
              />
            )}
          </div>
          <InlineDecision
            action={publishVacancyAction}
            hidden={{ id: vacancy.id }}
            subject={vacancy.title}
            labels={labels}
            options={[
              {
                key: "publish",
                label: t("publish.trigger"),
                variant: "primary",
                fields: {},
                success: t("publish.success"),
                confirm: { prompt: t("publish.prompt"), submit: t("publish.confirm") },
                disabled: !ready,
                describedBy: readinessId,
              },
            ]}
            className="lg:justify-end"
          />
        </section>
      ) : null}

      {canEditVacancy(vacancy) || vacancy.imageUrl ? (
        <VacancyImage
          id={vacancy.id}
          imageUrl={vacancy.imageUrl}
          editable={canEditVacancy(vacancy)}
          uploadAction={uploadVacancyImageAction}
          removeAction={removeVacancyImageAction}
          labels={{
            title: t("image.title"),
            description: t("image.description"),
            choose: t("image.choose"),
            upload: t("image.upload"),
            replace: t("image.replace"),
            remove: t("image.remove"),
            pending: t("image.pending"),
            saved: t("image.saved"),
            removed: t("image.removed"),
            noImage: t("image.noImage"),
            errors: await errorCatalog(),
          }}
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

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="flex min-w-0 flex-col gap-6">
          <Panel title={t("detail.details")}>
            <Facts items={facts} />
          </Panel>

          <Panel title={t("detail.description")}>
            <p className="max-w-prose text-sm leading-relaxed whitespace-pre-line text-ink">
              {vacancy.description}
            </p>
            {vacancy.requirements.length > 0 ? (
              <>
                <h3 className="mt-5 text-sm font-semibold text-ink">
                  {t("detail.requirements")}
                </h3>
                <ul className="mt-2 list-disc pl-5 text-sm leading-relaxed text-ink">
                  {vacancy.requirements.map((requirement) => (
                    <li key={requirement}>{requirement}</li>
                  ))}
                </ul>
              </>
            ) : null}
          </Panel>

          {vacancy.questions.length > 0 ? (
            <Panel
              title={t("detail.questions")}
              description={t("detail.questionsLegacy")}
            >
              <ol className="flex list-decimal flex-col gap-3 pl-5">
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
        </div>

        <aside className="flex min-w-0 flex-col gap-6">
          {approvalFacts.length > 0 ? (
            <Panel title={t("approval.title")}>
              <Facts items={approvalFacts} />
            </Panel>
          ) : null}

          <Panel title={t("detail.applications")}>
            {byStatus.length === 0 ? (
              <p className="text-sm text-ink-muted">{t("detail.noApplications")}</p>
            ) : (
              <ul className="flex flex-col divide-y divide-border">
                {byStatus.map((entry) => {
                  const chip = applicationStatus(entry.value);
                  return (
                    <li
                      key={entry.value}
                      className="flex items-center justify-between gap-3 py-2"
                    >
                      <StatusBadge
                        label={applicationsCopy(`status.${entry.value}`)}
                        tone={chip.tone}
                        icon={chip.icon}
                      />
                      <span className="display-face tabular text-figure-inline text-ink">
                        {format.number(entry.count)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </Panel>
        </aside>
      </div>

      {applicationsFailure || accepted.length > 0 ? (
        <Register
          id="roll-call"
          title={attendanceCopy("roster.title")}
          count={accepted.length}
          countLabel={attendanceCopy("roster.countLabel")}
          description={attendanceCopy("roster.description")}
        >
          {applicationsFailure ? (
            <div className="p-5">
              <LoadFailure failure={applicationsFailure} />
            </div>
          ) : !attendanceOpen ? (
            <RegisterNote
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
            <div className="px-5 py-4">
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
            </div>
          )}
        </Register>
      ) : null}

      <Register
        id="applications"
        title={t("detail.applicationsList")}
        count={rows.length}
        countLabel={applicationsCopy("countLabel")}
      >
        {applicationsFailure ? (
          <div className="p-5">
            <LoadFailure failure={applicationsFailure} />
          </div>
        ) : rows.length === 0 ? (
          <RegisterNote title={t("detail.noApplications")} />
        ) : (
          <Table>
            <TableCaption className="sr-only">
              {t("detail.applicationsList")}
            </TableCaption>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead scope="col">{applicationsCopy("table.volunteer")}</TableHead>
                <TableHead scope="col">{applicationsCopy("table.status")}</TableHead>
                <TableHead scope="col">{applicationsCopy("table.submitted")}</TableHead>
                <TableHead scope="col">
                  <span className="sr-only">{common("actions")}</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((application) => {
                const name = volunteerNameOf(application) || common("notSet");
                const chip = applicationStatus(application.status);
                const attendanceChip = application.attendance
                  ? attendanceStatus(application.attendance.outcome)
                  : null;
                const waiting =
                  application.status === "submitted" ||
                  application.status === "under_review";
                return (
                  <TableRow key={application.id}>
                    <TableCell>
                      <span className="flex items-center gap-3">
                        <Avatar
                          name={name}
                          src={application.volunteer?.avatarUrl}
                          size="sm"
                          person
                        />
                        <Link
                          href={applicationHref(application.id)}
                          className="font-semibold text-ink hover:text-primary-ink hover:underline"
                        >
                          {name}
                        </Link>
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="flex flex-wrap gap-1.5">
                        <StatusBadge
                          label={applicationsCopy(`status.${application.status}`)}
                          tone={chip.tone}
                          icon={chip.icon}
                        />
                        {attendanceChip && application.attendance ? (
                          <StatusBadge
                            label={attendanceCopy(
                              `outcome.${application.attendance.outcome}`,
                            )}
                            tone={attendanceChip.tone}
                            icon={attendanceChip.icon}
                          />
                        ) : null}
                      </span>
                    </TableCell>
                    <TableCell className="tabular whitespace-nowrap text-ink-muted">
                      {application.submittedAt
                        ? format.dateTime(new Date(application.submittedAt), "day")
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      {waiting && state !== "archived" ? (
                        <InlineDecision
                          action={reviewApplicationAction}
                          hidden={{ id: application.id }}
                          subject={name}
                          labels={labels}
                          options={applicationOptions({
                            name,
                            status: application.status,
                          })}
                          className="justify-end"
                          expandClassName="mt-2 text-left"
                        />
                      ) : null}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Register>
    </>
  );
}
