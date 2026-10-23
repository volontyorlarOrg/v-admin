import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";

import {
  ApproveRequestDialog,
  RejectRequestDialog,
} from "@/components/past-events/review-dialogs";
import { StatusBadge, type StatusTone } from "@/components/portal/status-badge";
import {
  Register,
  RegisterNote,
  RegisterSearch,
  RegisterTabs,
} from "@/components/register/register";
import { LoadFailure } from "@/components/states/load-failure";
import { PageHeader } from "@/components/states/page-header";
import { Pagination } from "@/components/states/pagination";
import { Link } from "@/i18n/navigation";
import { failureOf, isReady } from "@/lib/api/load";
import {
  approvePastEventRequestAction,
  rejectPastEventRequestAction,
} from "@/lib/past-events/actions";
import { loadPastEventRequests, loadPastEvents } from "@/lib/past-events/data.server";
import { reviewDialogLabels } from "@/lib/past-events/labels.server";
import {
  pastEventState,
  requestChanges,
  requestSubject,
  type PastEventState,
} from "@/lib/past-events/review";
import { PAST_EVENT_VIEWS, type PastEventRequest } from "@/lib/past-events/schemas";
import { navHref, pastEventHref, userHref } from "@/lib/routing/routes";
import {
  DEFAULT_PAGE_SIZE,
  hrefWith,
  readOption,
  readPage,
  readParam,
} from "@/lib/routing/search-params";

export const dynamic = "force-dynamic";

const CHANGES_PAGE_SIZE = 100;

const TONES: Record<PastEventState, StatusTone> = {
  waiting: "waiting",
  approved: "person",
  partlyApproved: "person",
  rejected: "final",
  withdrawn: "neutral",
};

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/past-events">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "pastEventRequests" });
  return { title: t("title") };
}

export default async function PastEventsPage({
  params,
  searchParams,
}: PageProps<"/[locale]/past-events">) {
  const { locale } = await params;
  setRequestLocale(locale);

  const query = await searchParams;
  const view = readOption(query, "view", PAST_EVENT_VIEWS) ?? "waiting";
  const q = readParam(query, "q");
  const page = readPage(query);

  const [t, common, format, loaded, changes, dialogLabels] = await Promise.all([
    getTranslations("pastEventRequests"),
    getTranslations("common"),
    getFormatter(),
    loadPastEvents({ view, q, page, pageSize: DEFAULT_PAGE_SIZE }),
    view === "waiting"
      ? loadPastEventRequests({
          status: "pending",
          page: 1,
          pageSize: CHANGES_PAGE_SIZE,
        })
      : null,
    reviewDialogLabels(),
  ]);

  const failure = failureOf(loaded);
  const listPath = navHref("pastEvents");
  const keep = view === "waiting" ? {} : { view };
  const day = (date: string) =>
    format.dateTime(new Date(`${date.slice(0, 10)}T00:00:00Z`), "date");
  const hours = (value: number) => t("facts.hours", { value: format.number(value) });
  const xp = (value: number) => t("facts.xp", { value: format.number(value) });

  const tabs = PAST_EVENT_VIEWS.map((option) => ({
    key: option,
    label: t(`views.${option}`),
    href: hrefWith(listPath, option === "waiting" ? {} : { view: option }),
    active: option === view,
    ...(option === "waiting" && isReady(loaded) ? { count: loaded.data.waiting } : {}),
  }));

  const proposal = (request: PastEventRequest) => {
    if (request.kind === "update") {
      return requestChanges(request).map((change) => {
        const show = (value: string | number) =>
          change.field === "eventDate"
            ? day(String(value))
            : change.field === "hours"
              ? hours(Number(value))
              : change.field === "xpAwarded"
                ? xp(Number(value))
                : String(value);
        return t("change", {
          field: t(`fields.${change.field}`),
          from: show(change.from),
          to: show(change.to),
        });
      });
    }
    const source = request.kind === "remove" ? request.event : request;
    if (!source) return [];
    return [
      [
        source.eventDate ? day(source.eventDate) : null,
        source.hours === null ? null : hours(source.hours),
        source.xpAwarded === null ? null : xp(source.xpAwarded),
      ]
        .filter((fact): fact is string => fact !== null)
        .join(" · "),
    ].filter(Boolean);
  };

  const changesFailure = changes ? failureOf(changes) : null;
  const waitingChanges = changes && isReady(changes) ? changes.data.items : [];

  return (
    <>
      <PageHeader title={t("title")} description={t("description")} />

      {failure ? <LoadFailure failure={failure} /> : null}

      {isReady(loaded) ? (
        <Register
          id="past-events"
          title={t(`events.title.${view}`)}
          count={loaded.data.total}
          countLabel={t("events.countLabel")}
          countTone={
            view === "waiting" && loaded.data.total > 0 ? "waiting" : "neutral"
          }
          toolbar={
            <div className="flex w-full flex-col gap-3">
              <RegisterTabs label={t("views.label")} items={tabs} />
              <RegisterSearch
                action={`/${locale}${listPath}`}
                label={t("events.search")}
                submitLabel={common("search")}
                value={q}
                keep={keep}
              />
            </div>
          }
        >
          {loaded.data.items.length === 0 ? (
            <RegisterNote
              title={q ? t("events.empty.noMatches") : t(`events.empty.${view}`)}
              {...(view === "waiting" && !q
                ? { description: t("events.empty.waitingDescription") }
                : {})}
            />
          ) : (
            <>
              <ul className="divide-y divide-border">
                {loaded.data.items.map((event) => {
                  const state = pastEventState(event);
                  return (
                    <li
                      key={event.id}
                      className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"
                    >
                      <div className="min-w-0 flex-1 basis-64">
                        <Link
                          href={pastEventHref(event.id)}
                          className="font-semibold [overflow-wrap:anywhere] text-primary-ink underline-offset-4 hover:underline"
                        >
                          {event.title}
                        </Link>
                        <p className="tabular mt-1 text-sm text-ink-muted">
                          {event.organization.name} · {day(event.eventDate)} ·{" "}
                          {t("events.people", { count: event.participants })}
                        </p>
                      </div>
                      <StatusBadge
                        label={t(`events.state.${state}`, { count: event.pending })}
                        tone={TONES[state]}
                      />
                    </li>
                  );
                })}
              </ul>
              <Pagination
                framed
                state={loaded.data}
                hrefFor={(next) => hrefWith(listPath, { ...keep, q, page: next })}
              />
            </>
          )}
        </Register>
      ) : null}

      {changesFailure ? <LoadFailure failure={changesFailure} /> : null}

      {waitingChanges.length > 0 ? (
        <Register
          id="past-event-changes"
          title={t("changes.title")}
          count={waitingChanges.length}
          countLabel={t("changes.countLabel")}
          countTone="waiting"
          description={t("changes.description")}
        >
          <ol className="divide-y divide-border">
            {waitingChanges.map((request) => {
              const subject = requestSubject(request);
              const evidence = request.participation;
              return (
                <li
                  key={request.id}
                  className="flex flex-wrap items-start gap-x-6 gap-y-4 px-5 py-4"
                >
                  <div className="min-w-0 flex-1 basis-72">
                    <p className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
                      <span className="font-semibold [overflow-wrap:anywhere] text-ink">
                        {subject}
                      </span>
                      <StatusBadge label={t(`kind.${request.kind}`)} tone="neutral" />
                    </p>
                    <p className="mt-0.5 text-sm text-ink-muted">
                      <Link
                        href={userHref(request.volunteer.id)}
                        className="font-semibold text-primary-ink underline-offset-4 hover:underline"
                      >
                        {request.volunteer.displayName ?? common("notSet")}
                      </Link>
                      {request.volunteer.username
                        ? ` @${request.volunteer.username}`
                        : ""}{" "}
                      · {request.organization.name}
                    </p>
                    <ul className="tabular mt-2 flex flex-col gap-0.5 text-sm text-ink">
                      {proposal(request).map((line) => (
                        <li key={line}>{line}</li>
                      ))}
                    </ul>
                    {request.kind === "create" ? (
                      <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                        {t("evidence", {
                          attended: evidence.attendedEvents,
                          hours: format.number(evidence.attendedHours),
                          pastEvents: evidence.pastEvents,
                        })}
                      </p>
                    ) : null}
                    {request.note ? (
                      <p className="mt-2 text-sm leading-relaxed [overflow-wrap:anywhere] text-ink-muted">
                        {t("note", { note: request.note })}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex flex-col items-start gap-2 sm:items-end">
                    <time
                      dateTime={request.createdAt}
                      className="tabular text-xs text-ink-muted"
                    >
                      {t("sent", {
                        when: format.dateTime(new Date(request.createdAt), "stamp"),
                      })}
                    </time>
                    <div className="flex flex-wrap gap-2">
                      <ApproveRequestDialog
                        requestId={request.id}
                        subject={subject}
                        amounts={
                          request.kind === "remove"
                            ? null
                            : {
                                hours: request.hours ?? 0,
                                xpAwarded: request.xpAwarded ?? 0,
                                xpLocked:
                                  request.kind === "update" &&
                                  request.event?.countsTowardProgress === false,
                              }
                        }
                        action={approvePastEventRequestAction}
                        labels={dialogLabels}
                      />
                      <RejectRequestDialog
                        requestId={request.id}
                        subject={subject}
                        action={rejectPastEventRequestAction}
                        labels={dialogLabels}
                      />
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        </Register>
      ) : null}
    </>
  );
}
