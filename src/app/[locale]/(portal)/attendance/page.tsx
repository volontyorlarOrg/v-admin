import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";

import {
  QUEUE_ACTIONS,
  QueueMain,
  QueueRow,
  QueueSide,
} from "@/components/queue/queue";
import { Register, RegisterNote } from "@/components/register/register";
import { LoadFailure } from "@/components/states/load-failure";
import { PageHeader } from "@/components/states/page-header";
import { buttonClass } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { failureOf, isReady } from "@/lib/api/load";
import { loadApplications } from "@/lib/applications/data.server";
import {
  groupAttendance,
  groupStage,
  type AttendanceGroup,
} from "@/lib/attendance/queue";
import { loadVerificationQueue } from "@/lib/results/data.server";
import { vacancyHref } from "@/lib/routing/routes";
import { loadVacancies } from "@/lib/vacancies/data.server";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/attendance">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "attendance" });
  return { title: t("title") };
}

export default async function AttendancePage({
  params,
}: PageProps<"/[locale]/attendance">) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [t, format] = await Promise.all([
    getTranslations("attendance"),
    getFormatter(),
  ]);

  const now = new Date();
  const [applications, vacancies, queue] = await Promise.all([
    loadApplications({ status: "accepted" }),
    loadVacancies(),
    loadVerificationQueue(),
  ]);
  const toVerify = isReady(queue) ? queue.data.items : [];
  const failure = failureOf(applications) ?? failureOf(vacancies);
  const groups =
    isReady(applications) && isReady(vacancies)
      ? groupAttendance(applications.data, now, vacancies.data)
      : [];
  const stageOf = new Map(groups.map((group) => [group.vacancyId, groupStage(group)]));
  const due = groups.filter((group) =>
    ["due", "returned"].includes(stageOf.get(group.vacancyId) ?? ""),
  );
  const upcoming = groups.filter(
    (group) => stageOf.get(group.vacancyId) === "upcoming",
  );
  const recorded = groups.filter(
    (group) => stageOf.get(group.vacancyId) === "verified",
  );

  const rows = (list: AttendanceGroup[], kind: "due" | "upcoming" | "recorded") => (
    <ol className="divide-y divide-border">
      {list.map((group, index) => (
        <QueueRow
          key={group.vacancyId}
          number={index + 1}
          numberLabel={t("queue.number")}
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
              kind === "upcoming"
                ? group.opensAt
                  ? t("queue.opensAt", {
                      when: format.dateTime(group.opensAt, "stamp"),
                    })
                  : t("queue.opensUnknown")
                : group.opensAt
                  ? t("queue.ended", { when: format.relativeTime(group.opensAt, now) })
                  : undefined
            }
          />
          <QueueSide>
            {kind === "upcoming" ? (
              <span>{t("queue.accepted", { count: group.unresolved.length })}</span>
            ) : (
              <>
                {group.unresolved.length > 0 ? (
                  <span className="font-medium text-ink">
                    {t("queue.waiting", { count: group.unresolved.length })}
                  </span>
                ) : null}
                {group.resolved.length > 0 ? (
                  <span>
                    {t("queue.resolvedCount", { count: group.resolved.length })}
                  </span>
                ) : null}
              </>
            )}
          </QueueSide>
          <div className={`flex ${QUEUE_ACTIONS}`}>
            <Link
              href={`${vacancyHref(group.vacancyId)}?tab=attendance`}
              className={buttonClass({
                size: "row",
                variant: kind === "due" ? "primary" : "outline",
              })}
            >
              {kind === "due" ? t("queue.take") : t("queue.view")}
              <span className="sr-only"> — {group.title}</span>
            </Link>
          </div>
        </QueueRow>
      ))}
    </ol>
  );

  return (
    <>
      <PageHeader title={t("title")} description={t("description")} />

      {failure ? <LoadFailure failure={failure} /> : null}

      {isReady(applications) && isReady(vacancies) ? (
        <>
          {toVerify.length > 0 ? (
            <Register
              id="verify"
              title={t("sections.verify")}
              count={toVerify.length}
              countLabel={t("sections.verifyLabel")}
              countTone="waiting"
              description={t("sections.verifyDescription")}
            >
              <ol className="divide-y divide-border">
                {toVerify.map((item, index) => (
                  <QueueRow
                    key={item.opportunityId}
                    number={index + 1}
                    numberLabel={t("queue.number")}
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
                      meta={t("queue.submittedBy", {
                        when: item.submittedAt
                          ? format.relativeTime(new Date(item.submittedAt), now)
                          : "",
                        organization: item.organization?.name ?? "",
                      })}
                    />
                    <QueueSide>
                      <span>{t("queue.accepted", { count: item.volunteers })}</span>
                      {item.correction ? (
                        <span className="font-semibold text-accent-ink">
                          {t("queue.correction")}
                        </span>
                      ) : null}
                    </QueueSide>
                    <div className={`flex ${QUEUE_ACTIONS}`}>
                      <Link
                        href={`${vacancyHref(item.opportunityId)}?tab=attendance`}
                        className={buttonClass({ size: "row" })}
                      >
                        {t("queue.verify")}
                        <span className="sr-only"> — {item.title}</span>
                      </Link>
                    </div>
                  </QueueRow>
                ))}
              </ol>
            </Register>
          ) : null}

          <Register
            id="due"
            title={t("sections.due")}
            count={due.length}
            countLabel={t("sections.dueLabel")}
            countTone="waiting"
            description={t("sections.dueDescription")}
          >
            {due.length === 0 ? (
              <RegisterNote
                title={t("empty.title")}
                description={t("empty.description")}
              />
            ) : (
              rows(due, "due")
            )}
          </Register>

          {upcoming.length > 0 ? (
            <Register
              id="upcoming"
              title={t("sections.upcoming")}
              count={upcoming.length}
              countLabel={t("sections.upcomingLabel")}
              description={t("sections.upcomingDescription")}
            >
              {rows(upcoming, "upcoming")}
            </Register>
          ) : null}

          {recorded.length > 0 ? (
            <Register
              id="recorded"
              title={t("sections.recorded")}
              count={recorded.length}
              countLabel={t("sections.recordedLabel")}
            >
              {rows(recorded, "recorded")}
            </Register>
          ) : null}
        </>
      ) : null}
    </>
  );
}
