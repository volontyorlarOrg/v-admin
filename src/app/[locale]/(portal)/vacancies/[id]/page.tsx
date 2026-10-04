import { CalendarDays, MapPin, PencilLine, Stamp, Tag } from "lucide-react";
import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { Panel } from "@/components/portal/panel";
import {
  StatusBadge,
  applicationStatus,
  vacancyStatus,
} from "@/components/portal/status-badge";
import { Facts, type Fact } from "@/components/register/facts";
import { InlineDecision } from "@/components/register/inline-decision";
import { Count } from "@/components/register/register";
import { ApplicationsDesk } from "@/components/results/applications-desk";
import { InstructionsPanel } from "@/components/results/instructions-panel";
import { ResultsCopy } from "@/components/results/results-copy";
import { RewardsPanel } from "@/components/results/rewards-panel";
import { AdminAttendance } from "@/components/results/verification-desk";
import {
  VacancyTabs,
  isVacancyTab,
  type VacancyTab,
} from "@/components/results/vacancy-tabs";
import { Seal } from "@/components/register/seal";
import { LoadFailure } from "@/components/states/load-failure";
import { PageHeader } from "@/components/states/page-header";
import { StatePanel } from "@/components/states/state-panel";
import { ArchiveVacancy } from "@/components/vacancies/archive-vacancy";
import { ReadinessList } from "@/components/vacancies/readiness-list";
import { VacancyImage } from "@/components/vacancies/vacancy-image";
import { buttonClass } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { failureOf, isReady } from "@/lib/api/load";
import { loadApplications } from "@/lib/applications/data.server";
import { loadCoordinators } from "@/lib/coordinators/data.server";
import { sealDate } from "@/lib/datetime";
import { SENT_APPLICATION_STATUSES, canArchive } from "@/lib/domain/vocabulary";
import { vacancyDecisions } from "@/lib/queue/approval-decisions.server";
import { decisionLabels } from "@/lib/queue/decisions.server";
import {
  deskApplicants,
  loadAttendanceSheet,
  loadInstructions,
} from "@/lib/results/data.server";
import { MAX_PAGE_SIZE, readParam } from "@/lib/routing/search-params";
import {
  coordinatorHref,
  navHref,
  vacancyEditHref,
  vacancyHref,
} from "@/lib/routing/routes";
import {
  APPROVAL_REQUIREMENTS,
  canApproveVacancy,
  canEditVacancy,
  canPublishVacancy,
  missingForApproval,
  vacancyStateOf,
} from "@/lib/vacancies/approval";
import {
  archiveVacancyAction,
  decideVacancyAction,
  publishVacancyAction,
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
  searchParams,
}: PageProps<"/[locale]/vacancies/[id]">) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const requestedTab = readParam(await searchParams, "tab");

  const [t, results, applicationsCopy, vocabulary, errors, common, seal, format] =
    await Promise.all([
      getTranslations("vacancies"),
      getTranslations("results"),
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
  const published = state === "approved" || state === "archived";
  const started = new Date(vacancy.startsAt) <= now;
  const tab: VacancyTab = isVacancyTab(requestedTab)
    ? requestedTab
    : vacancy.attendanceSheet?.status === "submitted"
      ? "attendance"
      : !published
        ? "details"
        : started && accepted.length > 0
          ? "attendance"
          : "applications";
  const tabHref = (value: VacancyTab) => `${vacancyHref(vacancy.id)}?tab=${value}`;

  const [labels, vacancyOptions, instructions, sheet] = await Promise.all([
    decisionLabels(),
    vacancyDecisions(),
    tab === "applications" && accepted.length > 0 ? loadInstructions(vacancy.id) : null,
    tab === "attendance" ? loadAttendanceSheet(vacancy.id) : null,
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

  // An organization sets daily times; the admin sees what volunteers will see.
  const schedule = vacancy.schedule ?? [];
  const firstDay = schedule[0];
  const sameTimes = schedule.every(
    (day) => day.startTime === firstDay?.startTime && day.endTime === firstDay?.endTime,
  );
  const scheduleFacts: Fact[] = firstDay
    ? [
        {
          term: t("detail.dailyTime"),
          value: sameTimes
            ? schedule.length > 1
              ? t("detail.eachDay", {
                  time: `${firstDay.startTime}–${firstDay.endTime}`,
                })
              : `${firstDay.startTime}–${firstDay.endTime}`
            : schedule
                .map(
                  (day) =>
                    `${format.dateTime(new Date(`${day.date}T12:00:00+05:00`), "day")}: ${day.startTime}–${day.endTime}`,
                )
                .join(" · "),
        },
        ...(schedule.length > 1
          ? [
              {
                term: t("detail.attendance"),
                value: vacancy.allDaysRequired
                  ? t("detail.allDays", { count: schedule.length })
                  : t("detail.someDays"),
              },
            ]
          : []),
      ]
    : [];

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
    ...scheduleFacts,
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
    { term: t("fields.kind"), value: t(`kinds.${vacancy.kind}`) },
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
    ...(vacancy.essayRequired && vacancy.essayPrompt
      ? [{ term: t("detail.question"), value: vacancy.essayPrompt }]
      : []),
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
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays aria-hidden="true" className="size-4" />
              {vacancy.endsAt
                ? format.dateTimeRange(
                    new Date(vacancy.startsAt),
                    new Date(vacancy.endsAt),
                    "date",
                  )
                : format.dateTime(new Date(vacancy.startsAt), "date")}
            </span>
            {location ? (
              <span className="inline-flex items-center gap-1.5">
                <MapPin aria-hidden="true" className="size-4" />
                {location}
              </span>
            ) : null}
            <span className="inline-flex items-center gap-1.5">
              <Tag aria-hidden="true" className="size-4" />
              {t(`kinds.${vacancy.kind}`)}
            </span>
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

      {vacancy.imageUrl ? (
        <VacancyImage imageUrl={vacancy.imageUrl} title={t("image.title")} />
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

      <VacancyTabs
        label={t("detail.sections")}
        active={tab}
        items={[
          { tab: "details", label: t("detail.details"), href: tabHref("details") },
          {
            tab: "applications",
            label: t("detail.applicationsList"),
            href: tabHref("applications"),
            badge:
              undecided.length > 0 ? (
                <Count
                  value={undecided.length}
                  label={results("tabs.pending")}
                  tone="waiting"
                />
              ) : undefined,
          },
          {
            tab: "attendance",
            label: t("detail.results"),
            href: tabHref("attendance"),
            badge: vacancy.attendanceSheet ? (
              <span
                className={
                  vacancy.attendanceSheet.status === "submitted"
                    ? "text-xs font-semibold text-accent-ink"
                    : "text-xs font-medium text-ink-muted"
                }
              >
                {results(
                  `tabs.sheet.${vacancy.attendanceSheet.correction && vacancy.attendanceSheet.status === "draft" ? "correction" : vacancy.attendanceSheet.status}`,
                )}
              </span>
            ) : undefined,
          },
        ]}
      />

      {tab === "details" ? (
        <ResultsCopy>
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
              <RewardsPanel
                vacancyId={vacancy.id}
                kind={vacancy.kind}
                rules={{
                  xpPerHour: vacancy.xpPerHour,
                  xpWinner: vacancy.xpWinner,
                  xpContributor: vacancy.xpContributor,
                  xpAttendee: vacancy.xpAttendee,
                  xpNoShowPenalty: vacancy.xpNoShowPenalty,
                }}
                editable={!vacancy.publishedAt && canEditVacancy(vacancy)}
              />

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
        </ResultsCopy>
      ) : null}

      {tab === "applications" ? (
        applicationsFailure ? (
          <LoadFailure failure={applicationsFailure} />
        ) : (
          <ResultsCopy>
            <div
              className={
                accepted.length > 0 && instructions && isReady(instructions)
                  ? "grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_23rem]"
                  : "flex flex-col"
              }
            >
              <ApplicationsDesk
                key={rows.map((row) => `${row.id}:${row.status}`).join()}
                vacancyId={vacancy.id}
                capacity={vacancy.capacity ?? null}
                archived={state === "archived"}
                applicants={await deskApplicants(rows)}
              />
              {accepted.length > 0 && instructions && isReady(instructions) ? (
                <div className="xl:sticky xl:top-6">
                  <InstructionsPanel
                    vacancyId={vacancy.id}
                    vacancyTitle={vacancy.title}
                    initial={instructions.data}
                    sentLabel={
                      instructions.data.sentAt
                        ? format.dateTime(new Date(instructions.data.sentAt), "stamp")
                        : null
                    }
                  />
                </div>
              ) : null}
            </div>
          </ResultsCopy>
        )
      ) : null}

      {tab === "attendance" ? (
        sheet && isReady(sheet) ? (
          <ResultsCopy>
            <AdminAttendance
              key={`${sheet.data.status}:${sheet.data.revision}:${sheet.data.correction}:${sheet.data.verifiedAt ?? ""}`}
              vacancyId={vacancy.id}
              initial={sheet.data}
              dates={{
                opens: format.dateTime(new Date(sheet.data.opensAt), "stamp"),
                submittable: format.dateTime(
                  new Date(sheet.data.submittableAt),
                  "stamp",
                ),
                submitted: sheet.data.submittedAt
                  ? format.dateTime(new Date(sheet.data.submittedAt), "stamp")
                  : null,
                reviewed: sheet.data.reviewedAt
                  ? format.dateTime(new Date(sheet.data.reviewedAt), "stamp")
                  : null,
                verified: sheet.data.verifiedAt
                  ? format.dateTime(new Date(sheet.data.verifiedAt), "stamp")
                  : null,
                events: Object.fromEntries(
                  sheet.data.history.map((event) => [
                    event.id,
                    format.dateTime(new Date(event.createdAt), "stamp"),
                  ]),
                ),
              }}
            />
          </ResultsCopy>
        ) : sheet ? (
          <LoadFailure failure={failureOf(sheet)!} />
        ) : null
      ) : null}
    </>
  );
}
