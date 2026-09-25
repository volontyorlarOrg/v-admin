import { ArrowRight } from "lucide-react";
import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import type { ReactNode } from "react";

import { Avatar } from "@/components/portal/avatar";
import {
  QUEUE_ACTIONS,
  QUEUE_EXPAND,
  QueueMain,
  QueueRow,
  QueueSection,
  QueueSide,
} from "@/components/queue/queue";
import { Totals } from "@/components/register/facts";
import { InlineDecision } from "@/components/register/inline-decision";
import { Register, RegisterNote } from "@/components/register/register";
import { Seal, type SealTone } from "@/components/register/seal";
import { LoadFailure } from "@/components/states/load-failure";
import { PageHeader } from "@/components/states/page-header";
import { buttonClass } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { failureOf, isReady } from "@/lib/api/load";
import { loadApplications } from "@/lib/applications/data.server";
import { reviewApplicationAction } from "@/lib/applications/actions";
import { volunteerNameOf } from "@/lib/applications/filters";
import { getSession } from "@/lib/auth/session.server";
import { loadCoordinators } from "@/lib/coordinators/data.server";
import { sealDate } from "@/lib/datetime";
import { verifyOrganizationAction } from "@/lib/organizations/actions";
import {
  organizationDecisions,
  vacancyDecisions,
} from "@/lib/queue/approval-decisions.server";
import { applicationDecisions, decisionLabels } from "@/lib/queue/decisions.server";
import {
  applicationsToDecide,
  blockingOrganizations,
  clearedToday,
  isFresh,
  rollCallsDue,
  vacanciesToApprove,
  type Cleared,
} from "@/lib/queue/today";
import { MAX_PAGE_SIZE } from "@/lib/routing/search-params";
import { applicationHref, navHref, vacancyHref } from "@/lib/routing/routes";
import { loadStatistics } from "@/lib/statistics/data.server";
import { decideVacancyAction } from "@/lib/vacancies/actions";
import { loadOrganizations, loadVacancies } from "@/lib/vacancies/data.server";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/dashboard">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "today" });
  return { title: t("title") };
}

export default async function TodayPage({ params }: PageProps<"/[locale]/dashboard">) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [t, seal, vocabulary, format, session] = await Promise.all([
    getTranslations("today"),
    getTranslations("seal"),
    getTranslations("vocabulary"),
    getFormatter(),
    getSession(),
  ]);

  const [vacancies, applications, organizations, coordinators, statistics] =
    await Promise.all([
      loadVacancies(),
      loadApplications(),
      loadOrganizations(),
      loadCoordinators({ page: 1, pageSize: MAX_PAGE_SIZE }),
      loadStatistics(),
    ]);

  const now = new Date();
  const failure = failureOf(vacancies) ?? failureOf(applications);

  if (failure || !isReady(vacancies) || !isReady(applications)) {
    return (
      <>
        <PageHeader title={t("title")} />
        {failure ? <LoadFailure failure={failure} /> : null}
      </>
    );
  }

  const organizationRows = isReady(organizations) ? organizations.data : [];
  const coordinatorNames = new Map(
    isReady(coordinators)
      ? coordinators.data.items.map((item) => [
          item.id,
          item.displayName ?? item.email ?? item.id,
        ])
      : [],
  );

  const approve = vacanciesToApprove(vacancies.data, organizationRows, now);
  const blocked = blockingOrganizations(vacancies.data, organizationRows);
  const decide = applicationsToDecide(applications.data, vacancies.data);
  const rollCalls = rollCallsDue(applications.data, vacancies.data, now);
  const waiting = approve.length + blocked.length + decide.length + rollCalls.length;
  const cleared = session
    ? clearedToday({
        vacancies: vacancies.data,
        applications: applications.data,
        me: session.userId,
        now,
      })
    : [];

  const [labels, vacancyOptions, applicationOptions, organizationOptions] =
    await Promise.all([
      decisionLabels(),
      vacancyDecisions(),
      applicationDecisions(),
      organizationDecisions(),
    ]);

  const when = (value: string | undefined) =>
    value ? format.relativeTime(new Date(value), now) : "";
  const totals = isReady(statistics) ? statistics.data.totals : null;
  const issuer = seal("issuer");
  const figure = (chunks: ReactNode) => (
    <span className="display-face tabular text-lg text-ink">{chunks}</span>
  );
  const earned = (chunks: ReactNode) => (
    <span className="display-face tabular text-lg text-accent-ink">{chunks}</span>
  );

  const clearedSeal = (item: Cleared): { word: string; tone: SealTone } => {
    if (item.kind === "rollCall") return { word: seal("recorded"), tone: "person" };
    if (item.kind === "vacancy") {
      return item.decision === "approved"
        ? { word: seal("approved"), tone: "institution" }
        : item.decision === "rejected"
          ? { word: seal("rejected"), tone: "neutral" }
          : { word: seal("returned"), tone: "neutral" };
    }
    return item.decision === "accepted"
      ? { word: seal("accepted"), tone: "person" }
      : item.decision === "closed"
        ? { word: seal("closed"), tone: "neutral" }
        : { word: seal("rejected"), tone: "neutral" };
  };

  return (
    <>
      <PageHeader
        title={t("title")}
        description={t("dateline", {
          date: format.dateTime(now, {
            weekday: "long",
            day: "numeric",
            month: "long",
          }),
          count: waiting,
        })}
      />

      <Register
        id="waiting"
        title={t("listTitle")}
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
                issuer={issuer}
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
              const coordinator = entry.vacancy.createdById
                ? coordinatorNames.get(entry.vacancy.createdById)
                : undefined;
              const sideId = `approve-${entry.vacancy.id}-state`;
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
                      coordinator,
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

        {decide.length > 0 ? (
          <QueueSection
            id="decide"
            title={t("decide.title")}
            count={decide.length}
            countLabel={t("decide.countLabel")}
            action={
              <Link
                href={`${navHref("applications")}?view=waiting`}
                className="inline-flex min-h-8 items-center gap-1 text-sm font-semibold text-primary-ink hover:underline"
              >
                {t("decide.all")}
                <ArrowRight aria-hidden="true" className="size-4" />
              </Link>
            }
          >
            {decide.slice(0, 12).map((entry, index) => {
              const name = volunteerNameOf(entry.application) || t("decide.unnamed");
              const incomplete =
                entry.application.volunteer?.profileCompletion?.complete === false;
              return (
                <QueueRow
                  key={entry.application.id}
                  number={index + 1}
                  numberLabel={t("number")}
                >
                  <QueueMain
                    lead={
                      <Avatar
                        name={name}
                        src={entry.application.volunteer?.avatarUrl}
                        person
                      />
                    }
                    title={
                      <Link
                        href={applicationHref(entry.application.id)}
                        className="hover:text-primary-ink hover:underline"
                      >
                        {name}
                      </Link>
                    }
                    meta={entry.vacancy?.title ?? entry.application.opportunity?.title}
                  />
                  <QueueSide>
                    <span>
                      {t("decide.sent", {
                        when: when(
                          entry.application.submittedAt ?? entry.application.createdAt,
                        ),
                      })}
                    </span>
                    <span className="flex flex-wrap gap-x-3">
                      {entry.application.essay ? (
                        <span className="text-ink">{t("decide.essay")}</span>
                      ) : null}
                      {entry.application.status === "under_review" ? (
                        <span className="text-primary-ink">{t("decide.looking")}</span>
                      ) : null}
                      {incomplete ? (
                        <span className="text-ink-muted">{t("decide.incomplete")}</span>
                      ) : null}
                    </span>
                  </QueueSide>
                  <InlineDecision
                    action={reviewApplicationAction}
                    hidden={{ id: entry.application.id }}
                    subject={name}
                    labels={labels}
                    options={applicationOptions({
                      name,
                      status: entry.application.status,
                    })}
                    className={QUEUE_ACTIONS}
                    expandClassName={QUEUE_EXPAND}
                  />
                </QueueRow>
              );
            })}
          </QueueSection>
        ) : null}

        {rollCalls.length > 0 ? (
          <QueueSection
            id="roll-calls"
            title={t("rollCalls.title")}
            count={rollCalls.length}
            countLabel={t("rollCalls.countLabel")}
          >
            {rollCalls.map((call, index) => (
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
                      ? t("rollCalls.ended", {
                          when: format.relativeTime(call.endedAt, now),
                        })
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
                    href={`${vacancyHref(call.vacancyId)}#roll-call`}
                    className={buttonClass({ size: "row" })}
                  >
                    {t("rollCalls.open")}
                  </Link>
                </div>
              </QueueRow>
            ))}
          </QueueSection>
        ) : null}
      </Register>

      {cleared.length > 0 ? (
        <Register
          id="cleared"
          title={t("cleared.title")}
          count={cleared.length}
          countLabel={t("cleared.countLabel")}
        >
          <ol className="divide-y divide-border">
            {cleared.map((item) => {
              const mark = clearedSeal(item);
              const date = sealDate(item.at);
              const fresh = isFresh(item.at, now);
              const key =
                item.kind === "vacancy"
                  ? `vacancy-${item.vacancy.id}`
                  : item.kind === "application"
                    ? `application-${item.application.id}`
                    : `roll-${item.vacancyId}`;
              return (
                <li key={key} className="flex items-center gap-4 px-5 py-3">
                  <Seal
                    word={mark.word}
                    date={date}
                    issuer={issuer}
                    tone={mark.tone}
                    fresh={fresh}
                    size={44}
                    label={seal("label", { word: mark.word, date })}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold break-words text-ink">
                      {item.kind === "vacancy" ? (
                        <Link
                          href={vacancyHref(item.vacancy.id)}
                          className="hover:text-primary-ink hover:underline"
                        >
                          {item.vacancy.title}
                        </Link>
                      ) : item.kind === "application" ? (
                        <Link
                          href={applicationHref(item.application.id)}
                          className="hover:text-primary-ink hover:underline"
                        >
                          {volunteerNameOf(item.application) || t("decide.unnamed")}
                        </Link>
                      ) : (
                        <Link
                          href={vacancyHref(item.vacancyId)}
                          className="hover:text-primary-ink hover:underline"
                        >
                          {item.title}
                        </Link>
                      )}
                    </p>
                    <p className="mt-0.5 text-sm text-ink-muted">
                      {item.kind === "vacancy"
                        ? t(`cleared.vacancy.${item.decision}`)
                        : item.kind === "application"
                          ? t("cleared.application", {
                              decision: t(`cleared.decision.${item.decision}`),
                              vacancy: item.application.opportunity?.title ?? "",
                            })
                          : t("cleared.rollCall", {
                              attended: item.attended,
                              other: item.other,
                            })}
                    </p>
                  </div>
                  <span className="tabular shrink-0 text-sm text-ink-muted">
                    {format.dateTime(new Date(item.at), "time")}
                  </span>
                </li>
              );
            })}
          </ol>
        </Register>
      ) : null}

      {totals ? (
        <Totals
          id="operation"
          title={t("operation.title")}
          items={[
            ...(totals.volunteers === undefined
              ? []
              : [
                  {
                    key: "volunteers",
                    value: t.rich("operation.line.volunteers", {
                      count: totals.volunteers,
                      n: figure,
                    }),
                  },
                ]),
            {
              key: "live",
              value: t.rich("operation.line.live", {
                count: totals.publishedVacancies,
                n: figure,
              }),
            },
            {
              key: "applications",
              value: t.rich("operation.line.applications", {
                count: totals.applications,
                n: figure,
              }),
            },
            {
              key: "attended",
              value: t.rich("operation.line.attended", {
                count: totals.attended,
                n: figure,
              }),
            },
            {
              key: "hours",
              value: t.rich("operation.line.hours", {
                count: totals.confirmedHours,
                n: earned,
              }),
            },
          ]}
          action={
            <Link
              href={navHref("insights")}
              className="inline-flex min-h-8 items-center gap-1 text-sm font-semibold text-primary-ink hover:underline"
            >
              {t("operation.insights")}
              <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
          }
        />
      ) : null}
    </>
  );
}
