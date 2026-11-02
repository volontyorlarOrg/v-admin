import { ArrowRight } from "lucide-react";
import { getFormatter, getTranslations } from "next-intl/server";

import { ClearedToday } from "@/components/dashboard/cleared-today";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import {
  QUEUE_ACTIONS,
  QUEUE_EXPAND,
  QueueMain,
  QueueRow,
  QueueSection,
  QueueSide,
} from "@/components/queue/queue";
import { InlineDecision } from "@/components/register/inline-decision";
import { Register, RegisterNote } from "@/components/register/register";
import { Seal } from "@/components/register/seal";
import { LoadFailure } from "@/components/states/load-failure";
import { buttonClass } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { dataOr, firstFailure, isReady } from "@/lib/api/load";
import { loadApplications } from "@/lib/applications/data.server";
import { loadAudit } from "@/lib/audit/data.server";
import { loadAuditDirectory } from "@/lib/audit/directory.server";
import { roleOf } from "@/lib/audit/directory";
import { getSession } from "@/lib/auth/session.server";
import { sealDate } from "@/lib/datetime";
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

const ORGANIZER_ROWS = 8;
const PAST_EVENT_ROWS = 5;
const ACTIVITY_ROWS = 8;

const linkClass =
  "inline-flex min-h-8 items-center gap-1 text-sm font-semibold text-primary-ink hover:underline";

export async function DashboardDesk() {
  const [t, seal, vocabulary, nav, format, session] = await Promise.all([
    getTranslations("desk"),
    getTranslations("seal"),
    getTranslations("vocabulary"),
    getTranslations("nav"),
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

  if (failure || !isReady(vacancies) || !isReady(applications)) {
    return failure ? <LoadFailure failure={failure} /> : null;
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
  const organizers = organizerWork(
    decideGroups.filter((group) => !mine(group.vacancyId)),
    rollCalls.filter((call) => !mine(call.vacancyId)),
    vacancies.data,
  );

  const waiting =
    approve.length +
    blocked.length +
    toVerify.length +
    pastEventCount +
    decide.length +
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
  const runnerName = (createdById: string | undefined, organizationId?: string) => {
    const person = createdById ? directory.people.get(createdById) : undefined;
    const name =
      person?.name ??
      (organizationId ? organizationNames.get(organizationId) : undefined);
    return name ? t("organizers.runner", { name }) : t("organizers.unknownRunner");
  };

  return (
    <>
      <Register
        id="operations"
        title={t("listTitle")}
        description={t("dateline", {
          date: format.dateTime(now, {
            weekday: "long",
            day: "numeric",
            month: "long",
          }),
          count: waiting,
        })}
        actions={
          <Link
            href={navHref("attendance")}
            className={buttonClass({ size: "sm", variant: "outline" })}
          >
            {nav("attendance")}
          </Link>
        }
        count={waiting}
        countLabel={t("waitingLabel")}
        countTone="waiting"
      >
        {waiting === 0 ? (
          <RegisterNote
            title={t("clear.title")}
            description={t("clear.description")}
            action={
              <Seal
                word={seal("clear")}
                date={sealDate(now)}
                issuer={seal("issuer")}
                label={seal("label", { word: seal("clear"), date: sealDate(now) })}
                tone="neutral"
                size={72}
              />
            }
          />
        ) : null}

        {approve.length > 0 ? (
          <QueueSection
            id="approve"
            title={t("approve.title")}
            count={approve.length}
            countLabel={t("approve.countLabel")}
          >
            {approve.map((entry, index) => {
              const ready = entry.missing.length === 0;
              const sideId = `approve-${entry.vacancy.id}-state`;
              const person = entry.vacancy.createdById
                ? directory.people.get(entry.vacancy.createdById)
                : undefined;
              return (
                <QueueRow
                  key={entry.vacancy.id}
                  number={index + 1}
                  numberLabel={t("number")}
                >
                  <QueueMain
                    title={
                      <Link
                        href={vacancyHref(entry.vacancy.id)}
                        className="hover:text-primary-ink hover:underline"
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
                    <span>{t("approve.sent", { when: when(entry.receivedAt) })}</span>
                    {ready ? (
                      <span className="font-medium text-primary-ink">
                        {t("approve.ready")}
                      </span>
                    ) : (
                      <span className="font-medium text-danger-ink">
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
            {blocked.map((entry, index) => (
              <QueueRow
                key={entry.organization.id}
                number={index + 1}
                numberLabel={t("number")}
              >
                <QueueMain
                  title={entry.organization.name}
                  meta={t("blocked.meta", {
                    count: entry.vacancies.length,
                    titles: entry.vacancies.map((item) => item.title).join(", "),
                  })}
                />
                <QueueSide>
                  <span className="font-medium text-danger-ink">
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
            {toVerify.map((item, index) => (
              <QueueRow
                key={item.opportunityId}
                number={index + 1}
                numberLabel={t("number")}
              >
                <QueueMain
                  title={
                    <Link
                      href={`${vacancyHref(item.opportunityId)}?tab=attendance`}
                      className="hover:text-primary-ink hover:underline"
                    >
                      {item.title}
                    </Link>
                  }
                  meta={item.organization?.name}
                />
                <QueueSide>
                  <span>{t("verify.submitted", { when: when(item.submittedAt) })}</span>
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
            {(waitingEvents?.items ?? []).map((event, index) => (
              <QueueRow key={event.id} number={index + 1} numberLabel={t("number")}>
                <QueueMain
                  title={
                    <Link
                      href={pastEventHref(event.id)}
                      className="hover:text-primary-ink hover:underline"
                    >
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
                  <span>{t("verify.submitted", { when: when(event.createdAt) })}</span>
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
              <li className="px-5 py-3 text-sm text-ink-muted">
                {t("pastEvents.requests", { count: pendingRequests })}
              </li>
            ) : null}
          </QueueSection>
        ) : null}

        {decide.length > 0 ? (
          <QueueSection
            id="decide"
            title={t("decide.title")}
            count={decide.reduce((sum, group) => sum + group.waiting, 0)}
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
            {decide.map((group, index) => (
              <QueueRow
                key={group.vacancyId}
                number={index + 1}
                numberLabel={t("number")}
              >
                <QueueMain
                  title={
                    <Link
                      href={vacancyHref(group.vacancyId)}
                      className="hover:text-primary-ink hover:underline"
                    >
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
                    <span className="text-accent-ink">
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
            {myRollCalls.map((call, index) => (
              <QueueRow
                key={call.vacancyId}
                number={index + 1}
                numberLabel={t("number")}
              >
                <QueueMain
                  title={
                    <Link
                      href={vacancyHref(call.vacancyId)}
                      className="hover:text-primary-ink hover:underline"
                    >
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

      {organizers.length > 0 ? (
        <Register
          id="organizers"
          title={t("organizers.title")}
          count={organizers.length}
          countLabel={t("organizers.countLabel")}
          description={t("organizers.description")}
        >
          <ol className="divide-y divide-border">
            {organizers.slice(0, ORGANIZER_ROWS).map((item, index) => (
              <QueueRow
                key={item.vacancyId}
                number={index + 1}
                numberLabel={t("number")}
              >
                <QueueMain
                  title={
                    <Link
                      href={vacancyHref(item.vacancyId)}
                      className="hover:text-primary-ink hover:underline"
                    >
                      {item.title}
                    </Link>
                  }
                  meta={runnerName(item.createdById, item.organizationId)}
                />
                <QueueSide>
                  {item.applications ? (
                    <span>
                      {t("organizers.applications", {
                        count: item.applications.waiting,
                        when: when(item.applications.oldestAt),
                      })}
                    </span>
                  ) : null}
                  {item.rollCall ? (
                    <span>
                      {t("organizers.rollCall", { count: item.rollCall.awaiting })}
                    </span>
                  ) : null}
                </QueueSide>
                <div className={`flex ${QUEUE_ACTIONS}`}>
                  <Link
                    href={`${vacancyHref(item.vacancyId)}?tab=${item.applications ? "applications" : "attendance"}`}
                    className={buttonClass({ size: "row", variant: "outline" })}
                  >
                    {t("organizers.open")}
                    <span className="sr-only"> — {item.title}</span>
                  </Link>
                </div>
              </QueueRow>
            ))}
          </ol>
          {organizers.length > ORGANIZER_ROWS ? (
            <p className="border-t border-border px-5 py-3 text-sm text-ink-muted">
              {t("organizers.more", { count: organizers.length - ORGANIZER_ROWS })}
            </p>
          ) : null}
        </Register>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-2 xl:items-start">
        <RecentActivity
          recent={recent}
          directory={directory}
          now={now}
          href={navHref("audit")}
        />
        <ClearedToday cleared={cleared} now={now} />
      </div>
    </>
  );
}
