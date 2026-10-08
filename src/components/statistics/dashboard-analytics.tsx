import { getFormatter, getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import { BarChart } from "@/components/charts/bar-chart";
import { RegisterTabs } from "@/components/register/register";
import { LoadFailure } from "@/components/states/load-failure";
import { TrendChart } from "@/components/statistics/trend-chart";
import { failureOf, isReady, type Loaded } from "@/lib/api/load";
import type { Statistics } from "@/lib/api/schemas";
import { navHref } from "@/lib/routing/routes";
import {
  ANALYTICS_RANGES,
  attendanceRate,
  impactOutcomes,
  metricSeries,
  type Analytics,
  type DailyMetric,
} from "@/lib/statistics/analytics";
import { pipeline } from "@/lib/statistics/charts";

function ChartPanel({
  id,
  title,
  description,
  children,
}: {
  id: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section aria-labelledby={`${id}-title`} className="min-w-0 sheet">
      <header className="border-b border-border px-5 py-3.5">
        <h3 id={`${id}-title`} className="text-section text-ink">
          {title}
        </h3>
        <p className="mt-0.5 text-sm text-ink-muted">{description}</p>
      </header>
      <div className="px-5 py-4">{children}</div>
    </section>
  );
}

function Metrics({
  items,
}: {
  items: { label: string; value: string; caption: string }[];
}) {
  return (
    <dl className="grid grid-cols-2 gap-x-6 gap-y-5 border-y border-border py-4 lg:grid-cols-4">
      {items.map((item) => (
        <div key={item.label} className="min-w-0">
          <dt className="text-sm text-ink-muted">{item.label}</dt>
          <dd className="display-face tabular mt-1.5 text-2xl text-ink">
            {item.value}
          </dd>
          <dd className="mt-1 text-xs leading-relaxed text-ink-muted">
            {item.caption}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export async function DashboardAnalytics({
  analytics,
  statistics,
  days,
}: {
  analytics: Loaded<Analytics>;
  statistics: Loaded<Statistics>;
  days: 30 | 90;
}) {
  const [t, figures, format] = await Promise.all([
    getTranslations("dashboardHome"),
    getTranslations("dashboard"),
    getFormatter(),
  ]);
  const count = (value: number) => format.number(value, { maximumFractionDigits: 1 });
  const percent = (value: number | null) =>
    value === null
      ? "—"
      : format.number(value, { style: "percent", maximumFractionDigits: 1 });
  const data = isReady(analytics) ? analytics.data : null;
  const totals = isReady(statistics) ? statistics.data.totals : null;
  const failure = failureOf(analytics);
  const header = (
    <header
      id="analytics"
      className="flex scroll-mt-6 flex-wrap items-end justify-between gap-4"
    >
      <div>
        <h2 className="text-section text-ink">{t("analytics")}</h2>
        <p className="mt-1 text-sm text-ink-muted">
          {data
            ? t("range", {
                from: format.dateTime(new Date(data.range.from), "date"),
                to: format.dateTime(new Date(data.range.to), "date"),
              })
            : t("timeZone")}
        </p>
      </div>
      <RegisterTabs
        label={t("period")}
        items={ANALYTICS_RANGES.map((option) => ({
          key: option,
          label: t("days", { days: Number(option) }),
          href: `${navHref("dashboard")}?days=${option}#analytics`,
          active: Number(option) === days,
        }))}
      />
    </header>
  );
  if (!data)
    return (
      <div className="grid gap-4">
        {header}
        {failure ? <LoadFailure failure={failure} /> : null}
      </div>
    );

  const summary = data.summary;
  const inPeriod = t("inPeriod");
  const allTime = t("allTime");
  const chart = (
    metric: DailyMetric,
    kind: "line" | "columns" = "columns",
    tone: "neutral" | "person" = "neutral",
  ) => {
    const series = metricSeries(data.daily, metric);
    return (
      <TrendChart
        title={t(`charts.${metric === "signups" ? "joins" : metric}.title`)}
        points={series.map((point) => ({
          ...point,
          label: format.dateTime(new Date(point.date), "day"),
          formatted: count(point.value),
        }))}
        peakLabel={count(Math.max(0, ...series.map((point) => point.value)))}
        hint={
          series.every((point) => point.value === 0)
            ? t("charts.empty")
            : t("chartHint")
        }
        dataLabel={t("viewData")}
        dateLabel={t("date")}
        kind={kind}
        tone={tone}
      />
    );
  };
  const signupChange =
    summary.signupChange === null
      ? "—"
      : format.number(summary.signupChange, {
          style: "percent",
          maximumFractionDigits: 1,
          signDisplay: "exceptZero",
        });
  const periodCaption = t("comparison", {
    days,
    previous: count(data.previous.signups),
  });
  const stageRows = totals ? pipeline(totals) : [];
  const statsFailure = failureOf(statistics);
  return (
    <div className="grid gap-8">
      <div className="grid gap-2">
        {header}
        <p className="text-xs text-ink-muted">{t("partialDay")}</p>
      </div>

      <section
        id="growth"
        aria-labelledby="growth-title"
        className="grid scroll-mt-6 gap-4"
      >
        <h2 id="growth-title" className="text-section text-ink">
          {t("categories.growth")}
        </h2>
        <Metrics
          items={[
            {
              label: t("growth.joins"),
              value: count(summary.signups),
              caption: inPeriod,
            },
            {
              label: t("growth.average"),
              value: count(summary.signupAverage),
              caption: t("growth.averageCaption"),
            },
            {
              label: t("growth.change"),
              value: signupChange,
              caption:
                summary.signupChange === null ? t("growth.noBaseline") : periodCaption,
            },
            {
              label: t("growth.activation"),
              value: percent(
                summary.signups > 0 ? summary.activatedSignups / summary.signups : null,
              ),
              caption: t("growth.activationCaption", {
                activated: count(summary.activatedSignups),
                signups: count(summary.signups),
              }),
            },
          ]}
        />
        <div className="grid gap-5 xl:grid-cols-2">
          <ChartPanel
            id="signup-chart"
            title={t("charts.joins.title")}
            description={t("charts.joins.description")}
          >
            {chart("signups")}
          </ChartPanel>
          <ChartPanel
            id="volunteer-chart"
            title={t("charts.volunteers.title")}
            description={t("charts.volunteers.description")}
          >
            {chart("volunteers", "line")}
          </ChartPanel>
        </div>
      </section>

      <section
        id="application-analytics"
        aria-labelledby="application-analytics-title"
        className="grid scroll-mt-6 gap-4"
      >
        <h2 id="application-analytics-title" className="text-section text-ink">
          {t("categories.applications")}
        </h2>
        <Metrics
          items={[
            {
              label: t("applications.submitted"),
              value: count(summary.applications),
              caption: inPeriod,
            },
            {
              label: t("applications.average"),
              value: count(summary.applications / days),
              caption: t("growth.averageCaption"),
            },
            {
              label: t("applications.accepted"),
              value: percent(
                totals && totals.applications > 0
                  ? totals.accepted / totals.applications
                  : null,
              ),
              caption: allTime,
            },
            {
              label: t("applications.waiting"),
              value: totals ? count(totals.pendingReview) : "—",
              caption: t("currentState"),
            },
          ]}
        />
        <div className="grid gap-5 xl:grid-cols-2">
          <ChartPanel
            id="application-chart"
            title={t("charts.applications.title")}
            description={t("charts.applications.description")}
          >
            {chart("applications")}
          </ChartPanel>
          <ChartPanel
            id="pipeline-chart"
            title={figures("charts.pipeline.title")}
            description={t("applications.pipelineCaption")}
          >
            {totals ? (
              <BarChart
                rows={stageRows.map((stage) => ({
                  key: stage.key,
                  label: figures(`figures.${stage.key}`),
                  value: count(stage.value),
                  share: stage.share,
                }))}
              />
            ) : statsFailure ? (
              <LoadFailure failure={statsFailure} />
            ) : null}
          </ChartPanel>
        </div>
      </section>

      <section
        id="impact"
        aria-labelledby="impact-title"
        className="grid scroll-mt-6 gap-4"
      >
        <h2 id="impact-title" className="text-section text-ink">
          {t("categories.impact")}
        </h2>
        <Metrics
          items={[
            {
              label: t("impact.attended"),
              value: count(summary.attended),
              caption: inPeriod,
            },
            {
              label: t("impact.hours"),
              value: count(summary.confirmedHours),
              caption: inPeriod,
            },
            {
              label: t("impact.rate"),
              value: percent(attendanceRate(summary)),
              caption: t("impact.rateCaption"),
            },
            {
              label: t("impact.awaiting"),
              value: count(summary.awaiting),
              caption: t("impact.awaitingCaption"),
            },
          ]}
        />
        <div className="grid gap-5 xl:grid-cols-2">
          <ChartPanel
            id="hours-chart"
            title={t("charts.confirmedHours.title")}
            description={t("charts.confirmedHours.description")}
          >
            {chart("confirmedHours", "line", "person")}
          </ChartPanel>
          <ChartPanel
            id="attendance-chart"
            title={t("impact.outcomes")}
            description={t("impact.outcomesCaption")}
          >
            <BarChart
              rows={impactOutcomes(summary).map((row) => ({
                key: row.key,
                label: t(`outcomes.${row.key}`),
                value: count(row.value),
                share: row.share,
              }))}
            />
          </ChartPanel>
        </div>
      </section>
    </div>
  );
}
