import { ArrowRight } from "lucide-react";
import { getFormatter, getTranslations } from "next-intl/server";

import { ClearedToday } from "@/components/dashboard/cleared-today";
import {
  Journey,
  type JourneyStation,
  type JourneyWaiting,
} from "@/components/dashboard/journey";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import {
  AgeLead,
  QUEUE_ACTIONS,
  QUEUE_EXPAND,
  QueueMain,
  QueueRow,
  QueueSection,
  QueueSide,
} from "@/components/queue/queue";
import { InlineDecision } from "@/components/register/inline-decision";
import { Register, RegisterNote } from "@/components/register/register";
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
import { waited, type Waited } from "@/lib/datetime";
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
}: {
  statistics: Loaded<Statistics>;
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
        href: `${navHref("applications")}?view=all`,
        tone: "institution" as const,
      },
      accepted: {
        value: figure(totals?.accepted),
        scope: journey("scope.now"),
        href: `${navHref("applications")}?view=accepted`,
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

  const myAges = [
    ...approve.map((entry) => waited(entry.receivedAt, now)),
    ...toVerify.map((item) => waited(item.submittedAt, now)),
    ...(waitingEvents?.items ?? []).map((event) => waited(event.createdAt, now)),
    ...decide.map((group) => waited(group.oldestAt, now)),
    ...myRollCalls.map((call) => waited(call.endedAt, now)),
  ].filter((age): age is Waited => age !== null);
  const oldest = myAges.reduce<Waited | null>(
    (longest, age) => (longest === null || age.days > longest.days ? age : longest),
    null,
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
          href: `${navHref("applications")}?view=waiting`,
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

  return (
    <>
      {statisticsFailure ? <LoadFailure failure={statisticsFailure} /> : null}
      <Journey {...journeyCopy} stations={stations} />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_23rem] xl:items-start">
        <div className="grid min-w-0 gap-6">
          <Register
            id="operations"
            title={t("listTitle")}
            description={
              oldest
                ? t("datelineOldest", {
                    date: format.dateTime(now, {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                    }),
                    age: ageText(oldest),
                  })
                : format.dateTime(now, {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                  })
            }
            count={waiting}
            countLabel={t("waitingLabel")}
            countTone="waiting"
          >
            {waiting === 0 ? (
              <RegisterNote
                title={t("clear.title")}
                description={t("clear.description")}
              />
            ) : null}

            {approve.length > 0 ? (
              <QueueSection
                id="approve"
                title={t("approve.title")}
                count={approve.length}
                countLabel={t("approve.countLabel")}
              >
                {approve.map((entry) => {
                  const ready = entry.missing.length === 0;
                  const sideId = `approve-${entry.vacancy.id}-state`;
                  const person = entry.vacancy.createdById
                    ? directory.people.get(entry.vacancy.createdById)
                    : undefined;
                  return (
                    <QueueRow key={entry.vacancy.id} lead={lead(entry.receivedAt)}>
                      <QueueMain
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
                      />
                      <QueueSide id={sideId}>
                        <span>
                          {t("approve.sent", { when: when(entry.receivedAt) })}
                        </span>
                        {ready ? (
                          <span className="font-medium text-success-ink">
                            {t("approve.ready")}
                          </span>
                        ) : (
                          <span className="font-medium text-warning-ink">
                            {t("approve.needs", {
                              items: entry.missing
                                .map((item) => t(`requirements.${item}`))
                                .join(", "),
                            })}
                          </span>
                        )}
                      </QueueSide>
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
                        className={QUEUE_ACTIONS}
                        expandClassName={QUEUE_EXPAND}
                      />
                    </QueueRow>
                  );
                })}
              </QueueSection>
            ) : null}

            {blocked.length > 0 ? (
              <QueueSection
                id="blocked"
                title={t("blocked.title")}
                count={blocked.length}
                countLabel={t("blocked.countLabel")}
              >
                {blocked.map((entry) => (
                  <QueueRow key={entry.organization.id} lead={lead(undefined)}>
                    <QueueMain
                      title={entry.organization.name}
                      meta={t("blocked.meta", {
                        count: entry.vacancies.length,
                        titles: entry.vacancies.map((item) => item.title).join(", "),
                      })}
                    />
                    <QueueSide>
                      <span className="font-medium text-warning-ink">
                        {t("blocked.state")}
                      </span>
                    </QueueSide>
                    <InlineDecision
                      action={verifyOrganizationAction}
                      hidden={{ id: entry.organization.id }}
                      subject={entry.organization.name}
                      labels={labels}
                      options={organizationOptions({ name: entry.organization.name })}
                      className={QUEUE_ACTIONS}
                      expandClassName={QUEUE_EXPAND}
                    />
                  </QueueRow>
                ))}
              </QueueSection>
            ) : null}

            {toVerify.length > 0 ? (
              <QueueSection
                id="verify"
                title={t("verify.title")}
                count={toVerify.length}
                countLabel={t("verify.countLabel")}
              >
                {toVerify.map((item) => (
                  <QueueRow key={item.opportunityId} lead={lead(item.submittedAt)}>
                    <QueueMain
                      title={
                        <Link
                          href={`${vacancyHref(item.opportunityId)}?tab=attendance`}
                          className={titleLink}
                        >
                          {item.title}
                        </Link>
                      }
                      meta={item.organization?.name}
                    />
                    <QueueSide>
                      <span>
                        {t("verify.submitted", { when: when(item.submittedAt) })}
                      </span>
                      <span className="font-medium text-ink">
                        {item.correction
                          ? t("verify.correction")
                          : t("verify.volunteers", { count: item.volunteers })}
                      </span>
                    </QueueSide>
                    <div className={`flex ${QUEUE_ACTIONS}`}>
                      <Link
                        href={`${vacancyHref(item.opportunityId)}?tab=attendance`}
                        className={buttonClass({ size: "row" })}
                      >
                        {t("verify.open")}
                        <span className="sr-only"> — {item.title}</span>
                      </Link>
                    </div>
                  </QueueRow>
                ))}
              </QueueSection>
            ) : null}

            {pastEventCount > 0 ? (
              <QueueSection
                id="past-events"
                title={t("pastEvents.title")}
                count={pastEventCount}
                countLabel={t("pastEvents.countLabel")}
                action={
                  <Link href={navHref("pastEvents")} className={linkClass}>
                    {t("pastEvents.requestsOpen")}
                    <ArrowRight aria-hidden="true" className="size-4" />
                  </Link>
                }
              >
                {(waitingEvents?.items ?? []).map((event) => (
                  <QueueRow key={event.id} lead={lead(event.createdAt)}>
                    <QueueMain
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
                    />
                    <QueueSide>
                      <span className="font-medium text-ink">
                        {t("pastEvents.waiting", {
                          waiting: event.pending,
                          total: event.participants,
                        })}
                      </span>
                      <span>
                        {t("verify.submitted", { when: when(event.createdAt) })}
                      </span>
                    </QueueSide>
                    <div className={`flex ${QUEUE_ACTIONS}`}>
                      <Link
                        href={pastEventHref(event.id)}
                        className={buttonClass({ size: "row" })}
                      >
                        {t("pastEvents.open")}
                        <span className="sr-only"> — {event.title}</span>
                      </Link>
                    </div>
                  </QueueRow>
                ))}
                {pendingRequests > 0 ? (
                  <li className="px-4 py-2.5 text-[0.8125rem] text-ink-muted">
                    {t("pastEvents.requests", { count: pendingRequests })}
                  </li>
                ) : null}
              </QueueSection>
            ) : null}

            {decide.length > 0 ? (
              <QueueSection
                id="decide"
                title={t("decide.title")}
                count={sum(decide)}
                countLabel={t("decide.countLabel")}
                action={
                  <Link
                    href={`${navHref("applications")}?view=waiting`}
                    className={linkClass}
                  >
                    {t("decide.all")}
                    <ArrowRight aria-hidden="true" className="size-4" />
                  </Link>
                }
              >
                {decide.map((group) => (
                  <QueueRow key={group.vacancyId} lead={lead(group.oldestAt)}>
                    <QueueMain
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
                    />
                    <QueueSide>
                      <span className="font-medium text-ink">
                        {t("decide.waiting", { count: group.waiting })}
                      </span>
                      <span>{t("decide.oldest", { when: when(group.oldestAt) })}</span>
                      {group.staged > 0 ? (
                        <span className="text-primary-ink">
                          {t("decide.staged", { count: group.staged })}
                        </span>
                      ) : null}
                    </QueueSide>
                    <div className={`flex ${QUEUE_ACTIONS}`}>
                      <Link
                        href={`${vacancyHref(group.vacancyId)}?tab=applications`}
                        className={buttonClass({ size: "row", variant: "outline" })}
                      >
                        {t("decide.review")}
                        <span className="sr-only"> — {group.title}</span>
                      </Link>
                    </div>
                  </QueueRow>
                ))}
              </QueueSection>
            ) : null}

            {myRollCalls.length > 0 ? (
              <QueueSection
                id="roll-calls"
                title={t("rollCalls.title")}
                count={myRollCalls.length}
                countLabel={t("rollCalls.countLabel")}
              >
                {myRollCalls.map((call) => (
                  <QueueRow key={call.vacancyId} lead={lead(call.endedAt)}>
                    <QueueMain
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
                    />
                    <QueueSide>
                      <span className="font-medium text-ink">
                        {t("rollCalls.waiting", { count: call.awaiting })}
                      </span>
                      {call.resolved > 0 ? (
                        <span>{t("rollCalls.resolved", { count: call.resolved })}</span>
                      ) : null}
                    </QueueSide>
                    <div className={`flex ${QUEUE_ACTIONS}`}>
                      <Link
                        href={`${vacancyHref(call.vacancyId)}?tab=attendance`}
                        className={buttonClass({ size: "row" })}
                      >
                        {t("rollCalls.open")}
                        <span className="sr-only"> — {call.title}</span>
                      </Link>
                    </div>
                  </QueueRow>
                ))}
              </QueueSection>
            ) : null}
          </Register>

          <RecentActivity
            recent={recent}
            directory={directory}
            now={now}
            href={navHref("audit")}
          />
        </div>

        <div className="grid min-w-0 gap-6">
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
                    className="grid grid-cols-[3.25rem_minmax(0,1fr)] items-start gap-x-3 px-4 py-3"
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
              <p className="border-t border-border px-4 py-2.5 text-[0.8125rem] text-ink-muted">
                {t("organizers.more", { count: organizers.length - ORGANIZER_ROWS })}
              </p>
            ) : null}
          </Register>

          <ClearedToday cleared={cleared} />
        </div>
      </div>
    </>
  );
}
