import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Stamp } from "lucide-react";

import { Panel } from "@/components/portal/panel";
import {
  StatusBadge,
  applicationStatus,
  attendanceStatus,
} from "@/components/portal/status-badge";
import { Facts, type Fact } from "@/components/register/facts";
import { InlineDecision } from "@/components/register/inline-decision";
import { Seal } from "@/components/register/seal";
import { LoadFailure } from "@/components/states/load-failure";
import { PageHeader } from "@/components/states/page-header";
import { StatePanel } from "@/components/states/state-panel";
import { buttonClass } from "@/components/ui/button";
import {
  PROFILE_FIELD_KEYS,
  VolunteerProfile,
  type VolunteerProfileLabels,
} from "@/components/users/volunteer-profile";
import { Link } from "@/i18n/navigation";
import { failureOf, isReady } from "@/lib/api/load";
import { reviewApplicationAction } from "@/lib/applications/actions";
import { loadApplication } from "@/lib/applications/data.server";
import { volunteerNameOf } from "@/lib/applications/filters";
import { sealDate } from "@/lib/datetime";
import { isRegion, isReviewable } from "@/lib/domain/vocabulary";
import { applicationDecisions, decisionLabels } from "@/lib/queue/decisions.server";
import { navHref, userHref, vacancyHref } from "@/lib/routing/routes";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/applications/[id]">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "applications" });
  return { title: t("record") };
}

export default async function ApplicationPage({
  params,
}: PageProps<"/[locale]/applications/[id]">) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const [t, attendanceCopy, common, vocabulary, seal, format] = await Promise.all([
    getTranslations("applications"),
    getTranslations("attendance"),
    getTranslations("common"),
    getTranslations("vocabulary"),
    getTranslations("seal"),
    getFormatter(),
  ]);
  const languages = new Intl.DisplayNames([locale], { type: "language" });
  const back = { href: navHref("applications"), label: t("title") };

  const loaded = await loadApplication(id);
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

  const application = loaded.data;
  const name = volunteerNameOf(application) || common("notSet");
  const snapshot = application.profileSnapshot;
  const chip = applicationStatus(application.status);
  const regionName = (region: string) =>
    isRegion(region) ? vocabulary(`regions.${region}`) : region;
  const languageName = (code: string) => {
    try {
      return languages.of(code) ?? code;
    } catch {
      return code;
    }
  };

  const profileLabels: VolunteerProfileLabels = {
    fields: Object.fromEntries(
      PROFILE_FIELD_KEYS.map((key) => [key, t(`snapshotFields.${key}`)]),
    ) as VolunteerProfileLabels["fields"],
  };

  const acceptedAutomatically =
    application.status === "accepted" &&
    application.reviewedById === undefined &&
    application.opportunity?.acceptanceMode === "automatic";

  const timeline: Array<[string, string | undefined]> = [
    ["createdAt", application.createdAt],
    ["submittedAt", application.submittedAt],
    [
      acceptedAutomatically ? "acceptedAutomatically" : "reviewedAt",
      application.reviewedAt,
    ],
    ["withdrawnAt", application.withdrawnAt],
    ["updatedAt", application.updatedAt],
  ];
  const history: Fact[] = timeline.flatMap(([key, value]) =>
    value
      ? [
          {
            term: t(`history.${key}`),
            value: format.dateTime(new Date(value), "stamp"),
          },
        ]
      : [],
  );

  const attendance = application.attendance;
  const attendanceChip = attendance ? attendanceStatus(attendance.outcome) : null;
  const attendanceFacts: Fact[] = attendance
    ? [
        {
          term: attendanceCopy("table.outcome"),
          value: attendanceChip ? (
            <StatusBadge
              label={attendanceCopy(`outcome.${attendance.outcome}`)}
              tone={attendanceChip.tone}
              icon={attendanceChip.icon}
            />
          ) : null,
        },
        ...(attendance.confirmedHours === undefined
          ? []
          : [
              {
                term: attendanceCopy("table.hours"),
                value: format.number(attendance.confirmedHours),
              },
            ]),
        ...(attendance.resolvedAt
          ? [
              {
                term: attendanceCopy("table.resolved"),
                value: format.dateTime(new Date(attendance.resolvedAt), "stamp"),
              },
            ]
          : []),
      ]
    : [];

  const attendanceResolved =
    attendance !== undefined && attendance.outcome !== "awaiting_confirmation";
  const reviewable =
    isReviewable(application.status) &&
    !(application.status === "accepted" && attendanceResolved);

  const [labels, options] = await Promise.all([
    decisionLabels(),
    applicationDecisions(),
  ]);
  const choices = options({ name, status: application.status, withNote: true }).filter(
    (option) => (application.status === "accepted" ? option.key === "reject" : true),
  );

  const accepted = application.status === "accepted" && application.reviewedAt;

  return (
    <>
      <PageHeader
        back={back}
        title={name}
        meta={
          <>
            <StatusBadge
              label={t(`status.${application.status}`)}
              tone={chip.tone}
              icon={chip.icon}
            />
            {application.opportunity ? (
              <Link
                href={vacancyHref(application.opportunity.id)}
                className="text-primary-ink hover:underline"
              >
                {application.opportunity.title}
              </Link>
            ) : null}
            {application.submittedAt ? (
              <span>
                {t("sentOn", {
                  when: format.dateTime(new Date(application.submittedAt), "date"),
                })}
              </span>
            ) : null}
          </>
        }
        actions={
          <>
            {accepted ? (
              <Seal
                word={seal("accepted")}
                date={sealDate(application.reviewedAt as string)}
                issuer={seal("issuer")}
                tone="person"
                size={76}
                label={seal("label", {
                  word: seal("accepted"),
                  date: sealDate(application.reviewedAt as string),
                })}
              />
            ) : null}
            <Link
              href={userHref(application.volunteerId)}
              className={buttonClass({ variant: "outline", size: "sm" })}
            >
              {t("detail.volunteer")}
            </Link>
          </>
        }
      />

      {reviewable ? (
        <section
          aria-labelledby="review-title"
          className="flex flex-col gap-3 rounded-xl border border-border bg-surface-soft px-5 py-4 shadow-(--sheet-shadow) lg:flex-row lg:items-start lg:justify-between"
        >
          <div className="flex min-w-0 gap-3">
            <span
              aria-hidden="true"
              className="grid size-9 shrink-0 place-items-center rounded-full bg-primary text-knockout"
            >
              <Stamp className="size-4" strokeWidth={2} />
            </span>
            <div className="min-w-0">
              <h2 id="review-title" className="text-section text-ink">
                {application.status === "accepted"
                  ? t("review.acceptedTitle")
                  : t("review.title")}
              </h2>
              <p className="mt-1 text-sm text-ink-muted">
                {application.status === "accepted"
                  ? t("review.acceptedDescription")
                  : t("review.description")}
              </p>
            </div>
          </div>
          <div className="flex w-full flex-col gap-3 lg:w-auto lg:items-end">
            <InlineDecision
              action={reviewApplicationAction}
              hidden={{ id: application.id }}
              subject={name}
              labels={labels}
              options={choices}
              className="lg:justify-end"
              expandClassName="w-full lg:w-[30rem]"
            />
          </div>
        </section>
      ) : application.status === "accepted" && attendanceResolved ? (
        <StatePanel
          role="status"
          title={t("review.recordedTitle")}
          description={t("review.recordedDescription")}
        />
      ) : (
        <StatePanel
          role="status"
          title={t(`review.final.${application.status}.title`)}
          description={t(`review.final.${application.status}.description`)}
        />
      )}

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="flex min-w-0 flex-col gap-6">
          {application.essay ? (
            <Panel title={t("detail.essay")}>
              <p className="max-w-prose text-base leading-relaxed whitespace-pre-line text-ink">
                {application.essay}
              </p>
            </Panel>
          ) : null}

          {application.answers.length > 0 ? (
            <Panel title={t("detail.answers")}>
              <dl className="flex flex-col divide-y divide-border">
                {application.answers.map((answer, index) => (
                  <div key={answer.id ?? index} className="py-3 first:pt-0 last:pb-0">
                    <dt className="text-sm font-semibold text-ink">
                      {answer.questionPrompt}
                    </dt>
                    <dd className="mt-1 text-sm leading-relaxed whitespace-pre-line text-ink-muted">
                      {Array.isArray(answer.value)
                        ? answer.value.join(", ")
                        : answer.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </Panel>
          ) : null}

          {snapshot ? (
            <Panel title={t("detail.snapshot")} description={t("detail.snapshotNote")}>
              <VolunteerProfile
                identity={{
                  name,
                  username: snapshot.username ?? application.volunteer?.username,
                  avatarUrl: application.volunteer?.avatarUrl,
                }}
                profile={snapshot}
                labels={profileLabels}
                regionName={regionName}
                languageName={languageName}
              />
            </Panel>
          ) : null}
        </div>

        <aside className="flex min-w-0 flex-col gap-6">
          <Panel title={t("detail.history")}>
            <Facts items={history} />
            {application.reviewerNote ? (
              <div className="mt-4 border-t border-border pt-4">
                <h3 className="text-sm font-semibold text-ink">
                  {t("detail.reviewerNote")}
                </h3>
                <p className="mt-1 text-sm leading-relaxed text-ink">
                  {application.reviewerNote}
                </p>
              </div>
            ) : null}
          </Panel>

          {attendanceFacts.length > 0 ? (
            <Panel title={attendanceCopy("record")}>
              <Facts items={attendanceFacts} />
            </Panel>
          ) : null}
        </aside>
      </div>
    </>
  );
}
