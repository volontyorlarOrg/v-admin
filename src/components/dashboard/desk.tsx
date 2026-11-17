import { ArrowRight } from "lucide-react";
import { getFormatter, getTranslations } from "next-intl/server";
import type { ReactNode } from "react";

import { ClearedToday } from "@/components/dashboard/cleared-today";
import {
  Journey,
  type JourneyStation,
  type JourneyWaiting,
} from "@/components/dashboard/journey";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { TodayHeader } from "@/components/dashboard/today-header";
import { AgeLead } from "@/components/queue/queue";
import { WorkCard, WorkItem } from "@/components/queue/work-card";
import { InlineDecision } from "@/components/register/inline-decision";
import { Count, Register, RegisterNote } from "@/components/register/register";
import { LoadFailure } from "@/components/states/load-failure";
import { buttonClass } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { dataOr, failureOf, firstFailure, isReady, type Loaded } from "@/lib/api/load";
import type { Statistics } from "@/lib/api/schemas";
import { loadApplications } from "@/lib/applications/data.server";
import { loadAudit } from "@/lib/audit/data.server";
import { loadAuditDirectory } from "@/lib/audit/directory.server";
import { roleOf } from "@/lib/audit/directory";
import { getSession } from "@/lib/auth/session.server";
import { longestWait, waited, type Waited } from "@/lib/datetime";
import { verifyOrganizationAction } from "@/lib/organizations/actions";
import { loadPastEventRequests, loadPastEvents } from "@/lib/past-events/data.server";
import {
  organizationDecisions,
  vacancyDecisions,
} from "@/lib/queue/approval-decisions.server";
import {
  applicationsByVacancy,
  applicationsToDecide,
  blockingOrganizations,
  clearedToday,
  organizerWork,
  rollCallsDue,
  runnerOf,
  vacanciesToApprove,
} from "@/lib/queue/dashboard";
import { decisionLabels } from "@/lib/queue/decisions.server";
import { loadVerificationQueue } from "@/lib/results/data.server";
import { navHref, pastEventHref, vacancyHref } from "@/lib/routing/routes";
import { decideVacancyAction } from "@/lib/vacancies/actions";
import { loadOrganizations, loadVacancies } from "@/lib/vacancies/data.server";

const ORGANIZER_ROWS = 6;
const PAST_EVENT_ROWS = 5;
const ACTIVITY_ROWS = 6;

const linkClass =
  "inline-flex min-h-7 items-center gap-1 text-sm font-medium text-primary-ink hover:underline";

const titleLink = "hover:text-primary-ink hover:underline";

export async function DashboardDesk({
  statistics,
  title,
  actions,
}: {
  statistics: Loaded<Statistics>;
  title: string;
  actions?: ReactNode;
}) {
  const [t, journey, vocabulary, format, session] = await Promise.all([
    getTranslations("desk"),
    getTranslations("journey"),
    getTranslations("vocabulary"),
    getFormatter(),
    getSession(),
  ]);

  const [
    vacancies,
    applications,
    organizations,
    verification,
    pastEvents,
    pastEventRequests,
    directory,
    recent,
  ] = await Promise.all([
    loadVacancies(),
    loadApplications(),
    loadOrganizations(),
    loadVerificationQueue(),
    loadPastEvents({ view: "waiting", q: "", page: 1, pageSize: PAST_EVENT_ROWS }),
    loadPastEventRequests({ status: "pending", page: 1, pageSize: 1 }),
    loadAuditDirectory(),
    loadAudit({ page: 1, pageSize: ACTIVITY_ROWS }),
  ]);

  const now = new Date();
  const failure = firstFailure(vacancies, applications);
  const today = format.dateTime(now, {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const totals = isReady(statistics) ? statistics.data.totals : null;
  const statisticsFailure = failureOf(statistics);
  const figure = (value: number | undefined) =>
    totals && value !== undefined
      ? format.number(value, { maximumFractionDigits: 1 })
      : "—";
  const station = (
    key: "published" | "applications" | "accepted" | "attended" | "hours",
  ): Omit<JourneyStation, "waiting"> => {
    const base = {
      published: {
        value: figure(totals?.publishedVacancies),
        scope: journey("scope.now"),
        href: `${navHref("vacancies")}?state=approved`,
        tone: "institution" as const,
      },
      applications: {
        value: figure(totals?.applications),
        scope: journey("scope.allTime"),
        href: navHref("vacancies"),
        tone: "institution" as const,
      },
      accepted: {
        value: figure(totals?.accepted),
        scope: journey("scope.now"),
        href: navHref("vacancies"),
        tone: "earned" as const,
      },
      attended: {
        value: figure(totals?.attended),
        scope: journey("scope.allTime"),
        href: navHref("attendance"),
        tone: "earned" as const,
      },
      hours: {
        value: totals
          ? journey("hours", { value: figure(totals.confirmedHours) })
          : "—",
        scope: journey("scope.allTime"),
        href: `${navHref("dashboard")}#impact`,
        tone: "earned" as const,
      },
    }[key];
    return { key, label: journey(`stations.${key}`), ...base };
  };
  const journeyCopy = {
    id: "journey",
    title: journey("title"),
    ...(totals?.volunteers !== undefined
      ? { summary: journey("volunteers", { count: totals.volunteers }) }
      : {}),
    owners: { you: journey("owner.you"), organizers: journey("owner.organizers") },
    clear: journey("clear"),
  };

  if (failure || !isReady(vacancies) || !isReady(applications)) {
    return (
      <>
        <TodayHeader date={today} headline={title} actions={actions} />
        {statisticsFailure ? <LoadFailure failure={statisticsFailure} /> : null}
        <Journey
          {...journeyCopy}
          waitingKnown={false}
          stations={(
            ["published", "applications", "accepted", "attended", "hours"] as const
          ).map((key) => ({ ...station(key), waiting: [] }))}
        />
        {failure ? <LoadFailure failure={failure} /> : null}
      </>
    );
  }

  const organizationRows = dataOr(organizations, []);
  const organizationNames = new Map(
    organizationRows.map((item) => [item.id, item.name]),
  );
  const runner = (createdById: string | undefined) =>
    runnerOf(createdById, (id) => roleOf(id, directory));

  const approve = vacanciesToApprove(vacancies.data, organizationRows, now);
  const blocked = blockingOrganizations(vacancies.data, organizationRows);
  const toVerify = dataOr(verification, null)?.items ?? [];
  const waitingEvents = dataOr(pastEvents, null);
  const pendingRequests = dataOr(pastEventRequests, null)?.total ?? 0;
  const pastEventCount = (waitingEvents?.total ?? 0) + pendingRequests;

  const decideGroups = applicationsByVacancy(
    applicationsToDecide(applications.data, vacancies.data),
  );
  const rollCalls = rollCallsDue(applications.data, vacancies.data, now);
  const creators = new Map(vacancies.data.map((item) => [item.id, item.createdById]));
  const mine = (vacancyId: string) =>
    runner(creators.get(vacancyId)) === "administrators";

  const decide = decideGroups.filter((group) => mine(group.vacancyId));
  const myRollCalls = rollCalls.filter((call) => mine(call.vacancyId));
  const theirDecide = decideGroups.filter((group) => !mine(group.vacancyId));
  const theirRollCalls = rollCalls.filter((call) => !mine(call.vacancyId));
  const organizers = organizerWork(theirDecide, theirRollCalls, vacancies.data);

  const waiting =
    approve.length +
    blocked.length +
    toVerify.length +
    pastEventCount +
    decide.reduce((total, group) => total + group.waiting, 0) +
    myRollCalls.length;

  const cleared = session
    ? clearedToday({
        vacancies: vacancies.data,
        applications: applications.data,
        me: session.userId,
        now,
      })
    : [];

  const [labels, vacancyOptions, organizationOptions] = await Promise.all([
    decisionLabels(),
    vacancyDecisions(),
    organizationDecisions(),
  ]);

  const when = (value: string | Date | undefined | null) =>
    value ? format.relativeTime(new Date(value), now) : "";
  const ageText = (age: Waited) =>
    format.number(age.value, { style: "unit", unit: age.unit, unitDisplay: "narrow" });
  const ageLong = (age: Waited) =>
    format.number(age.value, { style: "unit", unit: age.unit, unitDisplay: "long" });

  const oldest = longestWait(
    [
      ...approve.map((entry) => entry.receivedAt),
      ...toVerify.map((item) => item.submittedAt),
      ...(waitingEvents?.items ?? []).map((event) => event.createdAt),
      ...decide.map((group) => group.oldestAt),
      ...myRollCalls.map((call) => call.endedAt),
    ],
    now,
  );
  const scale = Math.max(1, oldest?.days ?? 1);

  const lead = (since: string | Date | null | undefined, ceiling = scale) => {
    const age = waited(since, now);
    if (!age) {
      return (
        <span className="text-sm text-ink-faint">
          <span aria-hidden="true">—</span>
          <span className="sr-only">{t("ageUnknown")}</span>
        </span>
      );
    }
    const text = ageText(age);
    return (
      <AgeLead
        value={text}
        label={t("age", { age: text })}
        share={age.days / ceiling}
      />
    );
  };

  const runnerName = (createdById: string | undefined, organizationId?: string) => {
    const person = createdById ? directory.people.get(createdById) : undefined;
    const name =
      person?.name ??
      (organizationId ? organizationNames.get(organizationId) : undefined);
    return name ? t("organizers.runner", { name }) : t("organizers.unknownRunner");
  };

  const sum = (groups: readonly { waiting: number }[]) =>
    groups.reduce((total, group) => total + group.waiting, 0);
  const dashboard = navHref("dashboard");

  const waitingAt = (items: (JourneyWaiting & { count: number })[]): JourneyWaiting[] =>
    items
      .filter((item) => item.count > 0)
      .map((item) => ({
        key: item.key,
        label: item.label,
        href: item.href,
        owner: item.owner,
      }));

  const stations = [
    {
      ...station("published"),
      waiting: waitingAt([
        {
          key: "approve",
          count: approve.length,
          label: journey("waiting.approve", { count: approve.length }),
          href: `${dashboard}#approve`,
          owner: "you",
        },
        {
          key: "organizations",
          count: blocked.length,
          label: journey("waiting.organizations", { count: blocked.length }),
          href: `${navHref("organizations")}?verified=no`,
          owner: "you",
        },
        {
          key: "returned",
          count: totals?.changesRequested ?? 0,
          label: journey("waiting.returned", { count: totals?.changesRequested ?? 0 }),
          href: `${navHref("vacancies")}?state=changes_requested`,
          owner: "organizers",
        },
      ]),
    },
    {
      ...station("applications"),
      waiting: waitingAt([
        {
          key: "decide-mine",
          count: sum(decide),
          label: journey("waiting.decide", { count: sum(decide) }),
          href: `${dashboard}#decide`,
          owner: "you",
        },
        {
          key: "decide-theirs",
          count: sum(theirDecide),
          label: journey("waiting.decide", { count: sum(theirDecide) }),
          href: navHref("vacancies"),
          owner: "organizers",
        },
      ]),
    },
    {
      ...station("accepted"),
      waiting: [],
    },
    {
      ...station("attended"),
      waiting: waitingAt([
        {
          key: "verify",
          count: toVerify.length,
          label: journey("waiting.results", { count: toVerify.length }),
          href: `${dashboard}#verify`,
          owner: "you",
        },
        {
          key: "roll-mine",
          count: myRollCalls.length,
          label: journey("waiting.rollCalls", { count: myRollCalls.length }),
          href: `${dashboard}#roll-calls`,
          owner: "you",
        },
        {
          key: "roll-theirs",
          count: theirRollCalls.length,
          label: journey("waiting.rollCalls", { count: theirRollCalls.length }),
          href: navHref("attendance"),
          owner: "organizers",
        },
      ]),
    },
    {
      ...station("hours"),
      waiting: waitingAt([
        {
          key: "past-events",
          count: pastEventCount,
          label: journey("waiting.pastEvents", { count: pastEventCount }),
          href: `${dashboard}#past-events`,
          owner: "you",
        },
      ]),
    },
  ] satisfies Parameters<typeof Journey>[0]["stations"];

  const organizerScale = Math.max(
    1,
    ...organizers.map((item) =>
      Number.isFinite(item.since) ? (now.getTime() - item.since) / 86_400_000 : 0,
    ),
  );

  const allLink = (href: string, label: string) => (
    <Link href={href} className={linkClass}>
      {label}
      <ArrowRight aria-hidden="true" className="size-4" />
    </Link>
  );
  const oldestIn = (dates: readonly (string | Date | null | undefined)[]) => {
    const longest = longestWait(dates, now);
    return longest ? t("oldestNote", { age: ageText(longest) }) : undefined;
  };

  return (
    <>
      <TodayHeader
        date={today}
        headline={t("headline", { count: waiting })}
        detail={
          waiting === 0
            ? t("headlineClear")
            : oldest
              ? t("headlineOldest", { age: ageLong(oldest) })
              : undefined
        }
        actions={actions}
      />
      {statisticsFailure ? <LoadFailure failure={statisticsFailure} /> : null}
      <Journey {...journeyCopy} stations={stations} />

      <section
        id="operations"
        aria-labelledby="operations-title"
        className="grid gap-4"
      >
        <header className="flex flex-wrap items-center gap-2">
          <h2 id="operations-title" className="text-section text-ink">
            {t("listTitle")}
          </h2>
          <Count value={waiting} label={t("waitingLabel")} tone="waiting" />
        </header>

        {waiting === 0 ? (
          <div className="sheet">
            <RegisterNote
              title={t("clear.title")}
              description={t("clear.description")}
            />
          </div>
        ) : (
          <div className="-mb-4 gap-4 lg:columns-2 [&>*]:mb-4 [&>*]:break-inside-avoid">
            {approve.length > 0 ? (
              <WorkCard
                id="approve"
                title={t("approve.title")}
                count={approve.length}
                countLabel={t("approve.countLabel")}
                note={oldestIn(approve.map((entry) => entry.receivedAt))}
                footer={allLink(
                  `${navHref("vacancies")}?state=pending_review`,
                  t("approve.all"),
                )}
              >
                {approve.map((entry) => {
                  const ready = entry.missing.length === 0;
                  const sideId = `approve-${entry.vacancy.id}-state`;
                  const person = entry.vacancy.createdById
                    ? directory.people.get(entry.vacancy.createdById)
                    : undefined;
                  return (
                    <WorkItem
                      key={entry.vacancy.id}
                      lead={lead(entry.receivedAt)}
                      title={
                        <Link
                          href={vacancyHref(entry.vacancy.id)}
                          className={titleLink}
                        >
                          {entry.vacancy.title}
                        </Link>
                      }
                      meta={[
                        entry.organization?.name,
                        person && person.role !== "organization"
                          ? person.name
                          : undefined,
                        vocabulary(`regions.${entry.vacancy.region}`),
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                      facts={
                        <>
                          <span>
                            {t("approve.sent", { when: when(entry.receivedAt) })}
                          </span>
                          {ready ? (
                            <span id={sideId} className="font-medium text-success-ink">
                              {t("approve.ready")}
                            </span>
                          ) : (
                            <span id={sideId} className="font-medium text-warning-ink">
                              {t("approve.needs", {
                                items: entry.missing
                                  .map((item) => t(`requirements.${item}`))
                                  .join(", "),
                              })}
                            </span>
                          )}
                        </>
                      }
                      actions={
                        <InlineDecision
                          action={decideVacancyAction}
                          hidden={{ id: entry.vacancy.id }}
                          subject={entry.vacancy.title}
                          labels={labels}
                          options={vacancyOptions({
                            title: entry.vacancy.title,
                            ready,
                            describedBy: sideId,
                          })}
                        />
                      }
                    />
                  );
                })}
              </WorkCard>
            ) : null}

            {toVerify.length > 0 ? (
              <WorkCard
                id="verify"
                title={t("verify.title")}
                count={toVerify.length}
                countLabel={t("verify.countLabel")}
                note={oldestIn(toVerify.map((item) => item.submittedAt))}
              >
                {toVerify.map((item) => (
                  <WorkItem
                    key={item.opportunityId}
                    lead={lead(item.submittedAt)}
                    title={
                      <Link
                        href={`${vacancyHref(item.opportunityId)}?tab=attendance`}
                        className={titleLink}
                      >
                        {item.title}
                      </Link>
                    }
                    meta={item.organization?.name}
                    facts={
                      <>
                        <span>
                          {t("verify.submitted", { when: when(item.submittedAt) })}
                        </span>
                        <span className="font-medium text-ink">
                          {item.correction
                            ? t("verify.correction")
                            : t("verify.volunteers", { count: item.volunteers })}
                        </span>
                      </>
                    }
                    actions={
                      <div className="flex">
                        <Link
                          href={`${vacancyHref(item.opportunityId)}?tab=attendance`}
                          className={buttonClass({ size: "row" })}
                        >
                          {t("verify.open")}
                          <span className="sr-only"> — {item.title}</span>
                        </Link>
                      </div>
                    }
                  />
                ))}
              </WorkCard>
            ) : null}

            {pastEventCount > 0 ? (
              <WorkCard
                id="past-events"
                title={t("pastEvents.title")}
                count={pastEventCount}
                countLabel={t("pastEvents.countLabel")}
                note={oldestIn(
                  (waitingEvents?.items ?? []).map((event) => event.createdAt),
                )}
                footer={allLink(navHref("pastEvents"), t("pastEvents.requestsOpen"))}
              >
                {(waitingEvents?.items ?? []).map((event) => (
                  <WorkItem
                    key={event.id}
                    lead={lead(event.createdAt)}
                    title={
                      <Link href={pastEventHref(event.id)} className={titleLink}>
                        {event.title}
                      </Link>
                    }
                    meta={t("pastEvents.meta", {
                      organization: event.organization.name,
                      date: format.dateTime(
                        new Date(`${event.eventDate.slice(0, 10)}T12:00:00+05:00`),
                        "date",
                      ),
                    })}
                    facts={
                      <>
                        <span className="font-medium text-ink">
                          {t("pastEvents.waiting", {
                            waiting: event.pending,
                            total: event.participants,
                          })}
                        </span>
                        <span>
                          {t("verify.submitted", { when: when(event.createdAt) })}
                        </span>
                      </>
                    }
                    actions={
                      <div className="flex">
                        <Link
                          href={pastEventHref(event.id)}
                          className={buttonClass({ size: "row" })}
                        >
                          {t("pastEvents.open")}
                          <span className="sr-only"> — {event.title}</span>
                        </Link>
                      </div>
                    }
                  />
                ))}
                {pendingRequests > 0 ? (
                  <li className="px-5 py-3 text-[0.8125rem] text-ink-muted">
                    {t("pastEvents.requests", { count: pendingRequests })}
                  </li>
                ) : null}
              </WorkCard>
            ) : null}

            {blocked.length > 0 ? (
              <WorkCard
                id="blocked"
                title={t("blocked.title")}
                count={blocked.length}
                countLabel={t("blocked.countLabel")}
                footer={allLink(
                  `${navHref("organizations")}?verified=no`,
                  t("blocked.all"),
                )}
              >
                {blocked.map((entry) => (
                  <WorkItem
                    key={entry.organization.id}
                    title={entry.organization.name}
                    meta={t("blocked.meta", {
                      count: entry.vacancies.length,
                      titles: entry.vacancies.map((item) => item.title).join(", "),
                    })}
                    facts={
                      <span className="font-medium text-warning-ink">
                        {t("blocked.state")}
                      </span>
                    }
                    actions={
                      <InlineDecision
                        action={verifyOrganizationAction}
                        hidden={{ id: entry.organization.id }}
                        subject={entry.organization.name}
                        labels={labels}
                        options={organizationOptions({ name: entry.organization.name })}
                      />
                    }
                  />
                ))}
              </WorkCard>
            ) : null}

            {decide.length > 0 ? (
              <WorkCard
                id="decide"
                title={t("decide.title")}
                count={sum(decide)}
                countLabel={t("decide.countLabel")}
                note={oldestIn(decide.map((group) => group.oldestAt))}
                footer={allLink(navHref("vacancies"), t("decide.all"))}
              >
                {decide.map((group) => (
                  <WorkItem
                    key={group.vacancyId}
                    lead={lead(group.oldestAt)}
                    title={
                      <Link href={vacancyHref(group.vacancyId)} className={titleLink}>
                        {group.title}
                      </Link>
                    }
                    meta={
                      group.vacancy
                        ? [
                            organizationNames.get(group.vacancy.organizationId),
                            vocabulary(`regions.${group.vacancy.region}`),
                          ]
                            .filter(Boolean)
                            .join(" · ")
                        : undefined
                    }
                    facts={
                      <>
                        <span className="font-medium text-ink">
                          {t("decide.waiting", { count: group.waiting })}
                        </span>
                        <span>
                          {t("decide.oldest", { when: when(group.oldestAt) })}
                        </span>
                        {group.staged > 0 ? (
                          <span className="text-primary-ink">
                            {t("decide.staged", { count: group.staged })}
                          </span>
                        ) : null}
                      </>
                    }
                    actions={
                      <div className="flex">
                        <Link
                          href={`${vacancyHref(group.vacancyId)}?tab=applications`}
                          className={buttonClass({ size: "row", variant: "outline" })}
                        >
                          {t("decide.review")}
                          <span className="sr-only"> — {group.title}</span>
                        </Link>
                      </div>
                    }
                  />
                ))}
              </WorkCard>
            ) : null}

            {myRollCalls.length > 0 ? (
              <WorkCard
                id="roll-calls"
                title={t("rollCalls.title")}
                count={myRollCalls.length}
                countLabel={t("rollCalls.countLabel")}
                note={oldestIn(myRollCalls.map((call) => call.endedAt))}
                footer={allLink(navHref("attendance"), t("rollCalls.all"))}
              >
                {myRollCalls.map((call) => (
                  <WorkItem
                    key={call.vacancyId}
                    lead={lead(call.endedAt)}
                    title={
                      <Link href={vacancyHref(call.vacancyId)} className={titleLink}>
                        {call.title}
                      </Link>
                    }
                    meta={
                      call.endedAt
                        ? t("rollCalls.ended", { when: when(call.endedAt) })
                        : undefined
                    }
                    facts={
                      <>
                        <span className="font-medium text-ink">
                          {t("rollCalls.waiting", { count: call.awaiting })}
                        </span>
                        {call.resolved > 0 ? (
                          <span>
                            {t("rollCalls.resolved", { count: call.resolved })}
                          </span>
                        ) : null}
                      </>
                    }
                    actions={
                      <div className="flex">
                        <Link
                          href={`${vacancyHref(call.vacancyId)}?tab=attendance`}
                          className={buttonClass({ size: "row" })}
                        >
                          {t("rollCalls.open")}
                          <span className="sr-only"> — {call.title}</span>
                        </Link>
                      </div>
                    }
                  />
                ))}
              </WorkCard>
            ) : null}
          </div>
        )}
      </section>

      <div className="grid items-start gap-4 lg:grid-cols-2">
        <Register
          id="organizers"
          title={t("organizers.title")}
          count={organizers.length}
          countLabel={t("organizers.countLabel")}
          description={t("organizers.description")}
        >
          {organizers.length === 0 ? (
            <RegisterNote title={t("organizers.empty")} />
          ) : (
            <ol className="divide-y divide-border">
              {organizers.slice(0, ORGANIZER_ROWS).map((item) => (
                <li
                  key={item.vacancyId}
                  className="grid grid-cols-[2.75rem_minmax(0,1fr)] items-start gap-x-4 px-5 py-3.5"
                >
                  {lead(
                    Number.isFinite(item.since) ? new Date(item.since) : undefined,
                    organizerScale,
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-semibold break-words text-ink">
                      <Link
                        href={`${vacancyHref(item.vacancyId)}?tab=${item.applications ? "applications" : "attendance"}`}
                        className={titleLink}
                      >
                        {item.title}
                      </Link>
                    </p>
                    <p className="mt-0.5 text-[0.8125rem] text-ink-muted">
                      {runnerName(item.createdById, item.organizationId)}
                    </p>
                    <p className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[0.8125rem] text-ink">
                      {item.applications ? (
                        <span>
                          {t("decide.waiting", { count: item.applications.waiting })}
                        </span>
                      ) : null}
                      {item.rollCall ? (
                        <span>
                          {t("organizers.rollCall", {
                            count: item.rollCall.awaiting,
                          })}
                        </span>
                      ) : null}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          )}
          {organizers.length > ORGANIZER_ROWS ? (
            <p className="border-t border-border px-5 py-2.5 text-[0.8125rem] text-ink-muted">
              {t("organizers.more", { count: organizers.length - ORGANIZER_ROWS })}
            </p>
          ) : null}
        </Register>

        <ClearedToday cleared={cleared} />
      </div>

      <RecentActivity
        recent={recent}
        directory={directory}
        now={now}
        href={navHref("audit")}
      />
    </>
  );
}
