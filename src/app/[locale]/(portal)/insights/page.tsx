import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";

import { BarChart, type BarRow } from "@/components/charts/bar-chart";
import { ColumnChart } from "@/components/charts/column-chart";
import { LineChart } from "@/components/charts/line-chart";
import { Meter } from "@/components/charts/meter";
import { RegionMap } from "@/components/charts/region-map";
import { SegmentedBar } from "@/components/charts/segmented-bar";
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
  regionCoverage,
  submissionTrend,
  vacancyFormats,
  vacancyStates,
  type Slice,
} from "@/lib/statistics/breakdowns";
import {
  attendanceRatio,
  coordinatorSplit,
  pipeline,
  publishedRatio,
  type CoordinatorStateKey,
  type PipelineStageKey,
} from "@/lib/statistics/charts";
import { loadStatistics } from "@/lib/statistics/data.server";
import { loadEveryUser } from "@/lib/users/data.server";
import { loadVacancies } from "@/lib/vacancies/data.server";

export const dynamic = "force-dynamic";

const PERCENT = { style: "percent", maximumFractionDigits: 0 } as const;

const COORDINATOR_FILL: Record<CoordinatorStateKey, string> = {
  active: "bg-success",
  blocked: "bg-danger",
  removed: "bg-chart-cancelled",
};

const PIPELINE_SCOPE: Record<PipelineStageKey, "allTime" | "now"> = {
  applications: "allTime",
  pendingReview: "now",
  accepted: "now",
  awaitingAttendance: "now",
  attended: "allTime",
};

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/insights">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "dashboard" });
  return { title: t("title") };
}

export default async function InsightsPage({
  params,
}: PageProps<"/[locale]/insights">) {
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

  const header = <PageHeader title={t("title")} description={t("description")} />;

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
  const share = (value: number) => format.number(value, PERCENT);
  const day = (value: string) => format.dateTime(new Date(value), "day");
  const date = (value: string) => format.dateTime(new Date(value), "date");
  const scope = { allTime: t("scope.allTime"), now: t("scope.now") };

  const ofTotal = <K extends string>(
    slices: Slice<K>[],
    label: (key: K) => string,
  ): BarRow[] => {
    const total = slices.reduce((sum, slice) => sum + slice.value, 0);
    return slices.map((slice) => ({
      key: slice.key,
      label: label(slice.key),
      value: count(slice.value),
      share: total > 0 ? slice.value / total : 0,
      detail: total > 0 ? share(slice.value / total) : undefined,
    }));
  };

  const charted = stages.some((stage) => stage.value > 0);
  const rated = published.total > 0 || attendance.total > 0;
  const empty = <p className="text-[0.8125rem] text-ink-muted">{t("charts.empty")}</p>;

  const applicationRows = isReady(applications) ? applications.data : null;
  const trend = applicationRows ? submissionTrend(applicationRows) : null;
  const statuses = applicationRows ? applicationStatuses(applicationRows) : [];

  const scan = isReady(users) ? users.data : null;
  const joins = scan?.complete ? joinTrend(scan.users) : null;

  const vacancyRows = isReady(vacancies) ? vacancies.data : null;
  const coverage = vacancyRows ? regionCoverage(vacancyRows) : null;
  const formats = vacancyRows ? vacancyFormats(vacancyRows) : [];
  const states = vacancyRows ? vacancyStates(vacancyRows) : [];

  const applicationFailure = failureOf(applications);
  const userFailure = failureOf(users);
  const vacancyFailure = failureOf(vacancies);

  return (
    <>
      {header}

      <Panel
        id="regions"
        title={t("charts.regions.title")}
        description={t("charts.regions.description")}
        scope={scope.allTime}
      >
        {coverage ? (
          <RegionMap
            coverage={coverage}
            label={t("charts.regions.title")}
            regionName={(region) => vocabulary(`regions.${region}`)}
            tileLabel={(region, value) =>
              t("regions.tile", {
                region: vocabulary(`regions.${region}`),
                count: value,
              })
            }
            copy={{
              covered: t("regions.covered"),
              coveredValue: t("regions.coveredValue", {
                covered: coverage.covered,
                total: coverage.total,
              }),
              none: t("regions.none"),
              ranked: t("regions.ranked"),
              fewer: t("regions.fewer"),
              more: t("regions.more"),
              zero: t("regions.zero"),
            }}
          />
        ) : vacancyFailure ? (
          <LoadFailure failure={vacancyFailure} />
        ) : null}
      </Panel>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <Panel
          title={t("charts.pipeline.title")}
          description={t("charts.pipeline.description")}
        >
          {charted ? (
            <BarChart
              rows={stages.map((stage) => ({
                key: stage.key,
                label: t(`figures.${stage.key}`),
                note: scope[PIPELINE_SCOPE[stage.key]],
                value: count(stage.value),
                share: stage.share,
                detail:
                  stage.key === "applications" || totals.applications === 0
                    ? undefined
                    : share(stage.value / totals.applications),
              }))}
            />
          ) : (
            empty
          )}
        </Panel>

        <Panel
          title={t("charts.shares.title")}
          description={t("charts.shares.description")}
          scope={scope.now}
        >
          {rated ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-1">
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
            scope={scope.allTime}
          >
            {trend ? (
              <div className="grid gap-3">
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
                <p className="text-[0.8125rem] text-ink-muted">
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
            scope={scope.allTime}
          >
            {joins ? (
              <div className="grid gap-3">
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
                <p className="text-[0.8125rem] text-ink-muted">
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
              <p className="text-[0.8125rem] text-ink-muted">
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
            scope={scope.now}
          >
            {statuses.length > 0 ? (
              <BarChart
                rows={ofTotal(statuses, (key) => applicationsT(`status.${key}`))}
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
            title={t("charts.stages.title")}
            description={t("charts.stages.description")}
            scope={scope.now}
          >
            {states.length > 0 ? (
              <BarChart rows={ofTotal(states, (key) => vacanciesT(`state.${key}`))} />
            ) : (
              empty
            )}
          </Panel>
        ) : vacancyFailure ? (
          <Panel
            title={t("charts.stages.title")}
            description={t("charts.stages.description")}
          >
            <LoadFailure failure={vacancyFailure} />
          </Panel>
        ) : null}
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-2">
        {vacancyRows ? (
          <Panel
            title={t("charts.formats.title")}
            description={t("charts.formats.description")}
            scope={scope.allTime}
          >
            {formats.length > 0 ? (
              <BarChart
                rows={ofTotal(formats, (key) => vocabulary(`formats.${key}`))}
              />
            ) : (
              empty
            )}
          </Panel>
        ) : vacancyFailure ? (
          <Panel
            title={t("charts.formats.title")}
            description={t("charts.formats.description")}
          >
            <LoadFailure failure={vacancyFailure} />
          </Panel>
        ) : null}

        {coordinators ? (
          <Panel
            title={t("coordinators.title")}
            description={t("coordinators.description")}
            scope={scope.now}
            actions={
              <Link
                href={navHref("coordinators")}
                className={buttonClass({ variant: "outline", size: "sm" })}
              >
                {t("coordinators.open")}
              </Link>
            }
          >
            <SegmentedBar
              label={t("coordinators.title")}
              emptyLabel={t("charts.empty")}
              segments={coordinators.map((segment) => ({
                key: segment.key,
                label: t(`coordinators.${segment.key}`),
                value: count(segment.value),
                share: segment.share,
                shareLabel: share(segment.share),
                fill: COORDINATOR_FILL[segment.key],
              }))}
            />
          </Panel>
        ) : null}
      </div>
    </>
  );
}
