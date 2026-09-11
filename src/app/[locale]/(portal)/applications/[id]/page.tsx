import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { ReviewForm } from "@/components/applications/review-form";
import { DefinitionList, type Definition } from "@/components/portal/definition-list";
import { Panel } from "@/components/portal/panel";
import { StatusBadge, applicationStatusTone } from "@/components/portal/status-badge";
import { LoadFailure } from "@/components/states/load-failure";
import { PageHeader } from "@/components/states/page-header";
import { StatePanel } from "@/components/states/state-panel";
import { buttonClass } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { failureOf, isReady } from "@/lib/api/load";
import { loadApplication } from "@/lib/applications/data.server";
import { volunteerNameOf } from "@/lib/applications/filters";
import { REVIEW_DECISIONS, isReviewable } from "@/lib/domain/vocabulary";
import { errorCatalog } from "@/lib/vacancies/labels.server";
import { userHref, vacancyHref } from "@/lib/routing/routes";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/applications/[id]">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "applications" });
  return { title: t("detail.eyebrow") };
}

export default async function ApplicationPage({
  params,
}: PageProps<"/[locale]/applications/[id]">) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("applications");
  const common = await getTranslations("common");
  const errors = await getTranslations("errors");
  const format = await getFormatter();

  const loaded = await loadApplication(id);
  const failure = failureOf(loaded);

  if (failure) {
    return (
      <>
        <PageHeader eyebrow={t("detail.eyebrow")} title={t("title")} />
        <LoadFailure failure={failure} />
      </>
    );
  }

  if (!isReady(loaded)) notFound();

  const application = loaded.data;

  const name = volunteerNameOf(application);
  const snapshot = application.profileSnapshot;

  const timeline: Array<[string, string | undefined]> = [
    ["createdAt", application.createdAt],
    ["submittedAt", application.submittedAt],
    ["reviewedAt", application.reviewedAt],
    ["withdrawnAt", application.withdrawnAt],
    ["updatedAt", application.updatedAt],
  ];

  const history: Definition[] = timeline.flatMap(([key, value]) =>
    value
      ? [
          {
            term: t(`history.${key}`),
            value: format.dateTime(new Date(value), "stamp"),
          },
        ]
      : [],
  );

  return (
    <>
      <PageHeader
        eyebrow={t("detail.eyebrow")}
        title={name || common("notSet")}
        description={application.opportunity?.title}
        actions={
          <>
            {application.opportunity ? (
              <Link
                href={vacancyHref(application.opportunity.id)}
                className={buttonClass({ variant: "outline", size: "sm" })}
              >
                {t("table.vacancy")}
              </Link>
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

      <div>
        <StatusBadge
          label={t(`status.${application.status}`)}
          tone={applicationStatusTone(application.status)}
        />
      </div>

      <Panel title={t("detail.snapshot")} description={t("detail.snapshotNote")}>
        {snapshot ? (
          <DefinitionList
            items={[
              {
                term: t("snapshotFields.fullName"),
                value: snapshot.fullName ?? common("notSet"),
              },
              {
                term: t("snapshotFields.bio"),
                value: snapshot.bio ?? common("notSet"),
              },
              {
                term: t("snapshotFields.region"),
                value: snapshot.region ?? common("notSet"),
              },
              {
                term: t("snapshotFields.school"),
                value: snapshot.school ?? common("notSet"),
              },
              {
                term: t("snapshotFields.languages"),
                value: snapshot.languages?.join(", ") || common("notSet"),
              },
              {
                term: t("snapshotFields.phone"),
                value: snapshot.phone ?? common("notSet"),
              },
              {
                term: t("snapshotFields.telegram"),
                value: snapshot.telegram ?? common("notSet"),
              },
            ]}
          />
        ) : (
          <p className="text-sm text-ink-muted">{t("detail.noSnapshot")}</p>
        )}
      </Panel>

      <Panel title={t("detail.answers")}>
        {application.answers.length === 0 ? (
          <p className="text-sm text-ink-muted">{t("detail.noAnswers")}</p>
        ) : (
          <dl className="flex flex-col gap-4">
            {application.answers.map((answer, index) => (
              <div key={answer.id ?? index}>
                <dt className="text-sm font-semibold text-ink">
                  {answer.questionPrompt}
                </dt>
                <dd className="mt-1 text-sm leading-relaxed whitespace-pre-line text-ink-muted">
                  {Array.isArray(answer.value) ? answer.value.join(", ") : answer.value}
                </dd>
              </div>
            ))}
          </dl>
        )}
      </Panel>

      <Panel title={t("detail.history")}>
        <DefinitionList items={history} />
        {application.reviewerNote ? (
          <div className="mt-5">
            <h3 className="eyebrow text-ink-muted">{t("detail.reviewerNote")}</h3>
            <p className="mt-1 text-sm leading-relaxed text-ink">
              {application.reviewerNote}
            </p>
          </div>
        ) : null}
      </Panel>

      {isReviewable(application.status) ? (
        <Panel title={t("review.title")}>
          <ReviewForm
            applicationId={application.id}
            currentStatus={application.status}
            currentNote={application.reviewerNote ?? ""}
            decisions={REVIEW_DECISIONS}
            labels={{
              decision: t("review.decision"),
              decisions: Object.fromEntries(
                REVIEW_DECISIONS.map((decision) => [decision, t(`status.${decision}`)]),
              ),
              note: t("review.note"),
              noteHelp: t("review.noteHelp"),
              submit: t("review.submit"),
              pending: t("review.pending"),
              success: t("review.success"),
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
                "validationFailed",
                "awaitingContract",
                "sessionExpired",
                "required",
                "tooLong",
                "applicationNotFound",
                "applicationCannotBeReviewed",
              ]),
            }}
          />
        </Panel>
      ) : (
        <StatePanel role="status" title={t("review.closed")} />
      )}
    </>
  );
}
