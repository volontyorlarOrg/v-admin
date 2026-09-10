import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";

import { BarChart, type BarRow } from "@/components/charts/bar-chart";
import { ColumnChart } from "@/components/charts/column-chart";
import { LineChart } from "@/components/charts/line-chart";
import { Meter } from "@/components/charts/meter";
import { StackedBar, type StackSegment } from "@/components/charts/stacked-bar";
import { Stat } from "@/components/portal/figure";
import { Panel } from "@/components/portal/panel";
import { LoadFailure } from "@/components/states/load-failure";
import { PageHeader } from "@/components/states/page-header";
import { buttonClass } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { failureOf, isReady } from "@/lib/api/load";
import { loadApplications } from "@/lib/applications/data.server";
import { navHref } from "@/lib/routing/routes";
import {
  applicationStatuses,
  joinTrend,
  submissionTrend,
  vacancyFormats,
  vacancyRegions,
  vacancyStages,
  type Slice,
} from "@/lib/statistics/breakdowns";
import {
  attendanceRatio,
  coordinatorSplit,
  pipeline,
  publishedRatio,
  type CoordinatorStateKey,
} from "@/lib/statistics/charts";
import { loadStatistics } from "@/lib/statistics/data.server";
import { loadEveryUser } from "@/lib/users/data.server";
import { loadVacancies } from "@/lib/vacancies/data.server";
import type { VacancyStage } from "@/lib/domain/vocabulary";

export const dynamic = "force-dynamic";

const PERCENT = { style: "percent", maximumFractionDigits: 0 } as const;

type Tone = StackSegment["tone"];

const COORDINATOR_TONE: Record<CoordinatorStateKey, Tone> = {
  active: "strong",
  blocked: "mid",
  removed: "soft",
};

const STAGE_ORDER: readonly VacancyStage[] = ["published", "draft", "archived"];

const STAGE_TONE: Record<VacancyStage, Tone> = {
  published: "strong",
  draft: "mid",
  archived: "soft",
};

function rowsOf<K extends string>(
  slices: Slice<K>[],
  label: (key: K) => string,
  value: (count: number) => string,
): BarRow[] {
  return slices.map((slice) => ({
    key: slice.key,
    label: label(slice.key),
    value: value(slice.value),
    share: slice.share,
  }));
}

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/dashboard">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "dashboard" });
  return { title: t("title") };
}

export default async function DashboardPage({
  params,
}: PageProps<"/[locale]/dashboard">) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [t, applicationsT, vacanciesT, vocabulary, format] = await Promise.all([
    getTranslations("dashboard"),
    getTranslations("applications"),
    getTranslations("vacancies"),
    getTranslations("vocabulary"),
    getFormatter(),
  ]);

  const [statistics, vacancies, applications, users] = await Promise.all([
    loadStatistics(),
    loadVacancies(),
    loadApplications(),
    loadEveryUser(),
  ]);

  const header = (
    <PageHeader
      eyebrow={t("eyebrow")}
      title={t("title")}
      description={t("description")}
    />
  );

  if (!isReady(statistics)) {
    const failure = failureOf(statistics);
    return (
      <>
        {header}
        {failure ? <LoadFailure failure={failure} /> : null}
      </>
    );
  }

  const totals = statistics.data.totals;
  const stages = pipeline(totals);
  const published = publishedRatio(totals);
  const attendance = attendanceRatio(totals);
  const coordinators = coordinatorSplit(totals);
  const count = (value: number) => format.number(value);
  const day = (value: string) => format.dateTime(new Date(value), "day");
  const date = (value: string) => format.dateTime(new Date(value), "date");

  const charted = stages.some((stage) => stage.value > 0);
  const rated = published.total > 0 || attendance.total > 0;
  const empty = <p className="text-sm text-ink-muted">{t("charts.empty")}</p>;

  const applicationRows = isReady(applications) ? applications.data : null;
  const trend = applicationRows ? submissionTrend(applicationRows) : null;
  const statuses = applicationRows ? applicationStatuses(applicationRows) : [];

  const scan = isReady(users) ? users.data : null;
  const joins = scan?.complete ? joinTrend(scan.users) : null;

  const vacancyRows = isReady(vacancies) ? vacancies.data : null;
  const regions = vacancyRows ? vacancyRegions(vacancyRows) : [];
  const formats = vacancyRows ? vacancyFormats(vacancyRows) : [];
  const stageSlices = vacancyRows ? vacancyStages(vacancyRows) : [];
  const stageSegments = STAGE_ORDER.flatMap((stage) => {
    const slice = stageSlices.find((entry) => entry.key === stage);
    if (!slice) return [];
    return [
      {
        key: slice.key,
        label: vacanciesT(`stage.${slice.key}`),
        value: count(slice.value),
        share: slice.share,
        tone: STAGE_TONE[slice.key],
      },
    ];
  });

  const applicationFailure = failureOf(applications);
  const userFailure = failureOf(users);
  const vacancyFailure = failureOf(vacancies);

  return (
    <>
      <PageHeader
        eyebrow={t("eyebrow")}
        title={t("title")}
        description={t("description")}
      />

      <Panel>
        <div className="grid gap-8 sm:grid-cols-[minmax(0,1fr)_minmax(0,auto)] sm:items-end">
          <div className="min-w-0">
            <p className="eyebrow text-ink-muted">{t("figures.confirmedHours")}</p>
            <p className="tabular mt-3 text-hero text-accent-ink">
              {count(totals.confirmedHours)}
            </p>
            <p className="tabular mt-3 text-sm text-ink-muted">
              {t("range", {
                from: date(statistics.data.range.from),
                to: date(statistics.data.range.to),
              })}
            </p>
          </div>

          <dl className="grid grid-cols-2 gap-x-8 gap-y-5 sm:grid-cols-3">
            {totals.volunteers === undefined ? null : (
              <Stat label={t("figures.volunteers")} value={count(totals.volunteers)} />
            )}
            <Stat label={t("figures.vacancies")} value={count(totals.vacancies)} />
            <Stat
              label={t("figures.applications")}
              value={count(totals.applications)}
            />
          </dl>
        </div>
      </Panel>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <Panel
          title={t("charts.pipeline.title")}
          description={t("charts.pipeline.description")}
        >
          {charted ? (
            <BarChart
              className="mt-1"
              rows={rowsOf(
                stages,
                (key) => t(`figures.${key}`),
                (value) => count(value),
              )}
            />
          ) : (
            empty
          )}
        </Panel>

        <Panel className="flex flex-col justify-center">
          {rated ? (
            <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-1">
              {published.total > 0 ? (
                <Meter
                  label={t("charts.published.label")}
                  headline={format.number(published.share, PERCENT)}
                  caption={t("charts.of", {
                    value: count(published.value),
                    total: count(published.total),
                  })}
                  share={published.share}
                />
              ) : null}
              {attendance.total > 0 ? (
                <Meter
                  label={t("charts.attendance.label")}
                  headline={format.number(attendance.share, PERCENT)}
                  caption={t("charts.of", {
                    value: count(attendance.value),
                    total: count(attendance.total),
                  })}
                  share={attendance.share}
                  tone="person"
                />
              ) : null}
            </div>
          ) : (
            empty
          )}
        </Panel>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-2">
        {applicationRows ? (
          <Panel
            title={t("charts.trend.title")}
            description={t("charts.trend.description")}
          >
            {trend ? (
              <div className="grid gap-4">
                <ColumnChart
                  columns={trend.buckets.map((bucket) => ({
                    key: bucket.start,
                    label: day(bucket.start),
                    value: count(bucket.value),
                    share: bucket.share,
                  }))}
                  peak={count(trend.peak)}
                  from={day(trend.from)}
                  to={day(trend.to)}
                />
                <p className="text-sm text-ink-muted">
                  {t("charts.trend.summary", {
                    total: trend.total,
                    from: date(trend.from),
                    to: date(trend.to),
                  })}
                </p>
              </div>
            ) : (
              empty
            )}
          </Panel>
        ) : applicationFailure ? (
          <Panel
            title={t("charts.trend.title")}
            description={t("charts.trend.description")}
          >
            <LoadFailure failure={applicationFailure} />
          </Panel>
        ) : null}

        {scan ? (
          <Panel
            title={t("charts.joins.title")}
            description={t("charts.joins.description")}
          >
            {joins ? (
              <div className="grid gap-4">
                {joins.buckets.length > 1 ? (
                  <LineChart
                    points={joins.buckets.map((bucket) => ({
                      key: bucket.start,
                      label: day(bucket.start),
                      value: count(bucket.value),
                      share: bucket.share,
                    }))}
                    peak={count(joins.peak)}
                    from={day(joins.from)}
                    to={day(joins.to)}
                  />
                ) : (
                  <ColumnChart
                    columns={joins.buckets.map((bucket) => ({
                      key: bucket.start,
                      label: day(bucket.start),
                      value: count(bucket.value),
                      share: bucket.share,
                    }))}
                    peak={count(joins.peak)}
                    from={day(joins.from)}
                    to={day(joins.to)}
                  />
                )}
                <p className="text-sm text-ink-muted">
                  {t("charts.joins.summary", {
                    total: joins.total,
                    from: date(joins.from),
                    to: date(joins.to),
                  })}
                </p>
              </div>
            ) : scan.complete ? (
              empty
            ) : (
              <p className="text-sm text-ink-muted">
                {t("charts.joins.partial", {
                  shown: count(scan.users.length),
                  total: count(scan.total),
                })}
              </p>
            )}
          </Panel>
        ) : userFailure ? (
          <Panel
            title={t("charts.joins.title")}
            description={t("charts.joins.description")}
          >
            <LoadFailure failure={userFailure} />
          </Panel>
        ) : null}
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-2">
        {applicationRows ? (
          <Panel
            title={t("charts.status.title")}
            description={t("charts.status.description")}
          >
            {statuses.length > 0 ? (
              <BarChart
                className="mt-1"
                rows={rowsOf(
                  statuses,
                  (key) => applicationsT(`status.${key}`),
                  (value) => count(value),
                )}
              />
            ) : (
              empty
            )}
          </Panel>
        ) : applicationFailure ? (
          <Panel
            title={t("charts.status.title")}
            description={t("charts.status.description")}
          >
            <LoadFailure failure={applicationFailure} />
          </Panel>
        ) : null}

        {vacancyRows ? (
          <Panel
            title={t("charts.regions.title")}
            description={t("charts.regions.description")}
          >
            {regions.length > 0 ? (
              <BarChart
                className="mt-1"
                rows={rowsOf(
                  regions,
                  (key) => vocabulary(`regions.${key}`),
                  (value) => count(value),
                )}
              />
            ) : (
              empty
            )}
          </Panel>
        ) : vacancyFailure ? (
          <Panel
            title={t("charts.regions.title")}
            description={t("charts.regions.description")}
          >
            <LoadFailure failure={vacancyFailure} />
          </Panel>
        ) : null}
      </div>

      {vacancyRows ? (
        <div className="grid items-start gap-6 lg:grid-cols-2">
          <Panel
            title={t("charts.stages.title")}
            description={t("charts.stages.description")}
          >
            {stageSegments.length > 0 ? <StackedBar segments={stageSegments} /> : empty}
          </Panel>

          <Panel
            title={t("charts.formats.title")}
            description={t("charts.formats.description")}
          >
            {formats.length > 0 ? (
              <BarChart
                className="mt-1"
                rows={rowsOf(
                  formats,
                  (key) => vocabulary(`formats.${key}`),
                  (value) => count(value),
                )}
              />
            ) : (
              empty
            )}
          </Panel>
        </div>
      ) : vacancyFailure ? (
        <div className="grid items-start gap-6 lg:grid-cols-2">
          <Panel
            title={t("charts.stages.title")}
            description={t("charts.stages.description")}
          >
            <LoadFailure failure={vacancyFailure} />
          </Panel>
          <Panel
            title={t("charts.formats.title")}
            description={t("charts.formats.description")}
          >
            <LoadFailure failure={vacancyFailure} />
          </Panel>
        </div>
      ) : null}

      {coordinators ? (
        <Panel
          title={t("coordinators.title")}
          description={t("coordinators.description")}
          actions={
            <Link
              href={navHref("coordinators")}
              className={buttonClass({ variant: "outline", size: "sm" })}
            >
              {t("coordinators.title")}
            </Link>
          }
        >
          <StackedBar
            segments={coordinators.map((segment) => ({
              key: segment.key,
              label: t(`coordinators.${segment.key}`),
              value: count(segment.value),
              share: segment.share,
              tone: COORDINATOR_TONE[segment.key],
            }))}
          />
        </Panel>
      ) : null}

      <Panel title={t("next.title")}>
        <ul className="flex flex-wrap gap-3">
          <li>
            <Link
              href={`${navHref("applications")}?status=submitted`}
              className={buttonClass({ variant: "outline", size: "sm" })}
            >
              {t("next.review", { count: totals.pendingReview })}
            </Link>
          </li>
          <li>
            <Link
              href={navHref("attendance")}
              className={buttonClass({ variant: "outline", size: "sm" })}
            >
              {t("next.attendance", { count: totals.awaitingAttendance })}
            </Link>
          </li>
        </ul>
      </Panel>
    </>
  );
}
