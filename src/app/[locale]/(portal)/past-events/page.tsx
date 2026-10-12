import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";

import {
  ApproveRequestDialog,
  RejectRequestDialog,
  type ReviewDialogLabels,
} from "@/components/past-events/review-dialogs";
import { StatusBadge, type StatusTone } from "@/components/portal/status-badge";
import { Register, RegisterNote, RegisterTabs } from "@/components/register/register";
import { LoadFailure } from "@/components/states/load-failure";
import { PageHeader } from "@/components/states/page-header";
import { Pagination } from "@/components/states/pagination";
import { Link } from "@/i18n/navigation";
import { failureOf, isReady } from "@/lib/api/load";
import {
  approvePastEventRequestAction,
  rejectPastEventRequestAction,
} from "@/lib/past-events/actions";
import { loadPastEventRequests } from "@/lib/past-events/data.server";
import { requestChanges, requestSubject } from "@/lib/past-events/review";
import {
  PAST_EVENT_REQUEST_STATUSES,
  type PastEventRequest,
  type PastEventRequestStatus,
} from "@/lib/past-events/schemas";
import { navHref, userHref } from "@/lib/routing/routes";
import {
  DEFAULT_PAGE_SIZE,
  hrefWith,
  readOption,
  readPage,
} from "@/lib/routing/search-params";
import { errorCatalog } from "@/lib/vacancies/labels.server";

export const dynamic = "force-dynamic";

const TONES: Record<PastEventRequestStatus, StatusTone> = {
  pending: "waiting",
  approved: "person",
  rejected: "danger",
  cancelled: "neutral",
};

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/past-events">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "pastEventRequests" });
  return { title: t("title") };
}

export default async function PastEventRequestsPage({
  params,
  searchParams,
}: PageProps<"/[locale]/past-events">) {
  const { locale } = await params;
  setRequestLocale(locale);

  const query = await searchParams;
  const status = readOption(query, "status", PAST_EVENT_REQUEST_STATUSES) ?? "pending";
  const page = readPage(query);

  const [t, common, errors, format, loaded] = await Promise.all([
    getTranslations("pastEventRequests"),
    getTranslations("common"),
    getTranslations("errors"),
    getFormatter(),
    loadPastEventRequests({ status, page, pageSize: DEFAULT_PAGE_SIZE }),
  ]);

  const failure = failureOf(loaded);
  const listPath = navHref("pastEvents");
  const day = (date: string) =>
    format.dateTime(new Date(`${date.slice(0, 10)}T00:00:00Z`), "date");
  const hours = (value: number) => t("facts.hours", { value: format.number(value) });
  const xp = (value: number) => t("facts.xp", { value: format.number(value) });

  const dialogLabels: ReviewDialogLabels = {
    approve: t("review.approve"),
    approveDescription: t("review.approveDescription"),
    approveRemovalDescription: t("review.approveRemovalDescription"),
    approveSuccess: t("review.approveSuccess"),
    reject: t("review.reject"),
    rejectDescription: t("review.rejectDescription"),
    rejectSuccess: t("review.rejectSuccess"),
    hours: t("review.hours"),
    xp: t("review.xp"),
    amountsHelp: t("review.amountsHelp"),
    reason: t("review.reason"),
    reasonHelp: t("review.reasonHelp"),
    close: common("close"),
    cancel: common("cancel"),
    pending: common("saving"),
    fallbackError: errors("server"),
    errors: {
      ...(await errorCatalog([
        "server",
        "network",
        "timeout",
        "rateLimited",
        "unavailable",
        "forbidden",
        "validationFailed",
        "sessionExpired",
        "required",
        "tooLong",
        "userNotFound",
      ])),
      hoursAmount: t("errors.hoursAmount"),
      xpAmount: t("errors.xpAmount"),
      pastEventRequestNotFound: t("errors.requestNotFound"),
      pastEventRequestNotPending: t("errors.notPending"),
      pastEventRequestIncomplete: t("errors.incomplete"),
      volunteerNotParticipant: t("errors.notParticipant"),
      pastEventGone: t("errors.eventGone"),
      pastEventUncreditedXp: t("errors.uncreditedXp"),
    },
  };

  const tabs = PAST_EVENT_REQUEST_STATUSES.map((option) => ({
    key: option,
    label: t(`status.${option}`),
    href: hrefWith(listPath, option === "pending" ? {} : { status: option }),
    active: option === status,
    ...(option === "pending" && isReady(loaded) ? { count: loaded.data.pending } : {}),
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

  return (
    <>
      <PageHeader title={t("title")} description={t("description")} />

      {failure ? <LoadFailure failure={failure} /> : null}

      {isReady(loaded) ? (
        <Register
          id="past-event-requests"
          title={t(`listTitle.${status}`)}
          count={loaded.data.total}
          countLabel={t("countLabel")}
          countTone={
            status === "pending" && loaded.data.total > 0 ? "waiting" : "neutral"
          }
          toolbar={<RegisterTabs label={t("filter")} items={tabs} />}
        >
          {loaded.data.items.length === 0 ? (
            <RegisterNote
              title={t(`empty.${status}`)}
              {...(status === "pending"
                ? { description: t("empty.pendingDescription") }
                : {})}
            />
          ) : (
            <>
              <ol className="divide-y divide-border">
                {loaded.data.items.map((request) => {
                  const subject = requestSubject(request);
                  const evidence = request.participation;
                  return (
                    <li
                      key={request.id}
                      className="flex flex-wrap items-start gap-x-6 gap-y-4 px-5 py-4"
                    >
                      <div className="min-w-0 flex-1 basis-72">
                        <p className="text-xs font-semibold tracking-[0.04em] text-ink-muted uppercase">
                          {t(`kind.${request.kind}`)}
                        </p>
                        <p className="mt-1 font-semibold [overflow-wrap:anywhere] text-ink">
                          {subject}
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
                        {request.reviewNote ? (
                          <p className="mt-2 text-sm leading-relaxed [overflow-wrap:anywhere] text-ink">
                            {t("reviewNote", { note: request.reviewNote })}
                          </p>
                        ) : null}
                        {request.adjusted ? (
                          <p className="mt-2 text-sm leading-relaxed text-ink">
                            {t("adjusted")}
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
                        {request.status === "pending" ? (
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
                        ) : (
                          <StatusBadge
                            label={t(`status.${request.status}`)}
                            tone={TONES[request.status]}
                          />
                        )}
                      </div>
                    </li>
                  );
                })}
              </ol>
              <Pagination
                framed
                state={loaded.data}
                hrefFor={(next) =>
                  hrefWith(listPath, {
                    ...(status === "pending" ? {} : { status }),
                    page: next,
                  })
                }
              />
            </>
          )}
        </Register>
      ) : null}
    </>
  );
}
