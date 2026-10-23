import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

import {
  ApproveRequestDialog,
  RejectRequestDialog,
} from "@/components/past-events/review-dialogs";
import { StatusBadge, type StatusTone } from "@/components/portal/status-badge";
import { InlineDecision } from "@/components/register/inline-decision";
import { Register } from "@/components/register/register";
import { LoadFailure } from "@/components/states/load-failure";
import { PageHeader } from "@/components/states/page-header";
import { Link } from "@/i18n/navigation";
import { failureOf, isReady } from "@/lib/api/load";
import {
  approvePastEventRequestAction,
  decidePastEventAction,
  rejectPastEventRequestAction,
} from "@/lib/past-events/actions";
import { loadPastEvent } from "@/lib/past-events/data.server";
import {
  eventDecisionLabels,
  reviewDialogLabels,
} from "@/lib/past-events/labels.server";
import {
  pastEventState,
  waitingFirst,
  waitingTotals,
  type PastEventState,
} from "@/lib/past-events/review";
import type { PastEventRequestStatus } from "@/lib/past-events/schemas";
import { navHref, userHref } from "@/lib/routing/routes";

export const dynamic = "force-dynamic";

const EVENT_TONES: Record<PastEventState, StatusTone> = {
  waiting: "waiting",
  approved: "person",
  partlyApproved: "person",
  rejected: "final",
  withdrawn: "neutral",
};

const PERSON_TONES: Record<PastEventRequestStatus, StatusTone> = {
  pending: "waiting",
  approved: "person",
  rejected: "final",
  cancelled: "neutral",
};

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/past-events/[id]">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "pastEventRequests" });
  return { title: t("event.record") };
}

export default async function PastEventPage({
  params,
}: PageProps<"/[locale]/past-events/[id]">) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const [t, common, format, loaded, dialogLabels, decisionLabels] = await Promise.all([
    getTranslations("pastEventRequests"),
    getTranslations("common"),
    getFormatter(),
    loadPastEvent(id),
    reviewDialogLabels(),
    eventDecisionLabels(),
  ]);
  if (loaded.state === "missing") notFound();

  const back = { href: navHref("pastEvents"), label: t("title") };
  const failure = failureOf(loaded);
  if (failure)
    return (
      <>
        <PageHeader back={back} title={t("event.record")} />
        <LoadFailure failure={failure} />
      </>
    );
  if (!isReady(loaded)) notFound();

  const event = loaded.data;
  const state = pastEventState(event);
  const waiting = waitingTotals(event.requests);
  const hours = (value: number) => t("facts.hours", { value: format.number(value) });
  const xp = (value: number) => t("facts.xp", { value: format.number(value) });
  const everyone = waiting.people === event.participants;
  const approveLabel = t(everyone ? "event.approveAll" : "event.approveRemaining", {
    count: waiting.people,
  });
  const rejectLabel = t(everyone ? "event.rejectAll" : "event.rejectRemaining", {
    count: waiting.people,
  });
  const decideAll =
    waiting.people > 0 ? (
      <InlineDecision
        action={decidePastEventAction}
        hidden={{ eventId: event.id }}
        subject={event.title}
        labels={decisionLabels}
        expandClassName="basis-full"
        options={[
          {
            key: "approve",
            label: approveLabel,
            variant: "primary",
            fields: { decision: "approve" },
            success: t("event.approveAllSuccess", { count: waiting.people }),
            confirm: {
              prompt: t("event.approveAllPrompt", {
                count: waiting.people,
                hours: format.number(waiting.hours),
                xp: format.number(waiting.xp),
              }),
              submit: approveLabel,
            },
          },
          {
            key: "reject",
            label: rejectLabel,
            variant: "danger-outline",
            fields: { decision: "reject" },
            success: t("event.rejectAllSuccess"),
            note: {
              name: "note",
              label: t("review.reason"),
              help: t("event.rejectAllHelp"),
              required: true,
              submit: rejectLabel,
              danger: true,
            },
          },
        ]}
      />
    ) : null;

  return (
    <>
      <PageHeader
        back={back}
        title={event.title}
        description={t("event.published")}
        meta={
          <>
            <span className="tabular">
              {event.organization.name} ·{" "}
              {format.dateTime(new Date(`${event.eventDate}T00:00:00Z`), "date")} ·{" "}
              {t("events.people", { count: event.participants })}
            </span>
            <StatusBadge
              label={t(`events.state.${state}`, { count: event.pending })}
              tone={EVENT_TONES[state]}
            />
          </>
        }
      />

      {event.note ? (
        <Register id="past-event-note" title={t("event.note")}>
          <p className="px-5 py-4 [overflow-wrap:anywhere] whitespace-pre-wrap text-ink">
            {event.note}
          </p>
        </Register>
      ) : null}

      <Register
        id="past-event-participants"
        title={t("event.participants")}
        count={event.participants}
        countLabel={t("event.countLabel")}
        {...(decideAll
          ? { description: t("event.decideHelp"), toolbar: decideAll }
          : {})}
      >
        <ul className="divide-y divide-border">
          {waitingFirst(event.requests).map((request) => {
            const name = request.volunteer.displayName ?? common("notSet");
            return (
              <li
                key={request.id}
                className="flex flex-wrap items-start gap-x-6 gap-y-3 px-5 py-4"
              >
                <div className="min-w-0 flex-1 basis-64">
                  <p className="[overflow-wrap:anywhere]">
                    <Link
                      href={userHref(request.volunteer.id)}
                      className="font-semibold text-primary-ink underline-offset-4 hover:underline"
                    >
                      {name}
                    </Link>
                    {request.volunteer.username ? (
                      <span className="text-sm text-ink-muted">
                        {" "}
                        @{request.volunteer.username}
                      </span>
                    ) : null}
                  </p>
                  <p className="tabular mt-1 text-sm text-ink">
                    {hours(request.hours ?? 0)} · {xp(request.xpAwarded ?? 0)}
                  </p>
                  {request.adjusted ? (
                    <p className="mt-1 text-sm leading-relaxed text-ink-muted">
                      {t("adjusted")}
                    </p>
                  ) : null}
                  {request.reviewNote ? (
                    <p className="mt-1 text-sm leading-relaxed [overflow-wrap:anywhere] text-ink-muted">
                      {t("reviewNote", { note: request.reviewNote })}
                    </p>
                  ) : null}
                </div>
                {request.status === "pending" ? (
                  <div className="flex flex-wrap gap-2">
                    <ApproveRequestDialog
                      requestId={request.id}
                      subject={name}
                      amounts={{
                        hours: request.hours ?? 0,
                        xpAwarded: request.xpAwarded ?? 0,
                        xpLocked: false,
                      }}
                      action={approvePastEventRequestAction}
                      labels={dialogLabels}
                    />
                    <RejectRequestDialog
                      requestId={request.id}
                      subject={name}
                      action={rejectPastEventRequestAction}
                      labels={dialogLabels}
                    />
                  </div>
                ) : (
                  <StatusBadge
                    label={t(`status.${request.status}`)}
                    tone={PERSON_TONES[request.status]}
                  />
                )}
              </li>
            );
          })}
        </ul>
      </Register>
    </>
  );
}
