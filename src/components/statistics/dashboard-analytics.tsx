import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { getFormatter, getTranslations } from "next-intl/server";
import type { ReactNode } from "react";

import { SegmentedBar } from "@/components/charts/segmented-bar";
import { LoadFailure } from "@/components/states/load-failure";
import { TrendChart } from "@/components/statistics/trend-chart";
import { Link } from "@/i18n/navigation";
import { failureOf, isReady, type Loaded } from "@/lib/api/load";
import { navHref } from "@/lib/routing/routes";
import {
  ANALYTICS_RANGES,
  attendanceRate,
  metricSeries,
  type Analytics,
  type DailyMetric,
} from "@/lib/statistics/analytics";
import { change } from "@/lib/statistics/scale";
import { cn } from "@/lib/utils";

type Tile = {
  label: string;
  value: string;
  note?: ReactNode;
};

const OUTCOME_FILLS = {
  attended: "bg-chart-person",
  excused: "bg-chart-excused",
  cancelled: "bg-chart-cancelled",
  awaiting: "bg-warning",
  noShow: "bg-danger",
} as const;

const OUTCOME_ORDER = [
  "attended",
  "excused",
  "cancelled",
  "awaiting",
  "noShow",
] as const;

function Tiles({ items }: { items: Tile[] }) {
  const three = items.length === 3;
  return (
    <dl
      className={cn(
        "grid border-b border-border",
        three ? "grid-cols-1 sm:grid-cols-3" : "grid-cols-2 lg:grid-cols-4",
      )}
    >
      {items.map((item, index) => (
        <div
          key={item.label}
          className={cn(
            "min-w-0 px-4 py-3.5",
            three
              ? index > 0 && "border-t border-border sm:border-t-0 sm:border-l"
              : [
                  index % 2 === 1 && "border-l border-border",
                  index >= 2 && "border-t border-border lg:border-t-0",
                  index % 4 !== 0 && "lg:border-l",
                ],
          )}
        >
          <dt className="text-[0.8125rem] text-ink-muted">{item.label}</dt>
          <dd className="mt-1 text-figure-inline figure text-ink">{item.value}</dd>
          {item.note ? (
            <dd className="mt-1 text-xs leading-snug text-ink-muted">{item.note}</dd>
          ) : null}
        </div>
      ))}
    </dl>
  );
}

function Delta({
  value,
  label,
  noBaseline,
}: {
  value: number | null;
  label: string;
  noBaseline: string;
}) {
  if (value === null) return <span>{noBaseline}</span>;
  const Icon = value > 0 ? ArrowUpRight : value < 0 ? ArrowDownRight : Minus;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 font-semibold",
        value > 0
          ? "text-success-ink"
          : value < 0
            ? "text-danger-ink"
            : "text-ink-muted",
      )}
    >
      <Icon aria-hidden="true" className="size-3.5 shrink-0" strokeWidth={2.5} />
      {label}
    </span>
  );
}

function ChartBlock({
  id,
  title,
  description,
  children,
  className,
}: {
  id: string;
  title: string;
  description: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-title`}
      className={cn("min-w-0 px-4 py-4", className)}
    >
      <h4 id={`${id}-title`} className="text-sm font-semibold text-ink">
        {title}
      </h4>
      <p className="mt-0.5 max-w-prose text-xs leading-snug text-ink-muted">
        {description}
      </p>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function Group({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-title`}
      className="scroll-mt-6 overflow-hidden sheet"
    >
      <header className="border-b border-border px-4 py-3">
        <h3 id={`${id}-title`} className="text-section text-ink">
          {title}
        </h3>
      </header>
      {children}
    </section>
  );
}

export async function DashboardAnalytics({
  analytics,
  days,
}: {
  analytics: Loaded<Analytics>;
  days: 30 | 90;
}) {
  const [t, format] = await Promise.all([
    getTranslations("dashboardHome"),
    getFormatter(),
  ]);
  const count = (value: number) => format.number(value, { maximumFractionDigits: 1 });
  const percent = (value: number | null) =>
    value === null
      ? "—"
      : format.number(value, { style: "percent", maximumFractionDigits: 1 });
  const signed = (value: number) =>
    format.number(value, {
      style: "percent",
      maximumFractionDigits: 1,
      signDisplay: "exceptZero",
    });
  const data = isReady(analytics) ? analytics.data : null;
  const failure = failureOf(analytics);

  const header = (
    <header
      id="trends"
      className="flex scroll-mt-6 flex-wrap items-end justify-between gap-x-6 gap-y-3 pt-2"
    >
      <div className="min-w-0">
        <h2 className="text-lg font-semibold text-ink">{t("analytics")}</h2>
        <p className="mt-0.5 text-sm text-ink-muted">
          {data
            ? t("range", {
                from: format.dateTime(new Date(data.range.from), "date"),
                to: format.dateTime(new Date(data.range.to), "date"),
              })
            : t("timeZone")}
        </p>
      </div>
      <nav aria-label={t("period")}>
        <ul className="inline-flex rounded-md border border-border-strong bg-surface p-0.5">
          {ANALYTICS_RANGES.map((option) => {
            const active = Number(option) === days;
            return (
              <li key={option}>
                <Link
                  href={`${navHref("dashboard")}?days=${option}#trends`}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "inline-flex min-h-8 items-center rounded-[0.3125rem] px-3 text-sm whitespace-nowrap transition-colors duration-150",
                    active
                      ? "bg-surface-sunk font-semibold text-ink shadow-[inset_0_0_0_1px_var(--color-border-strong)]"
                      : "font-medium text-ink-muted hover:text-ink",
                  )}
                >
                  {t("days", { days: Number(option) })}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </header>
  );

  if (!data) {
    return (
      <div className="grid gap-4">
        {header}
        {failure ? <LoadFailure failure={failure} /> : null}
      </div>
    );
  }

  const summary = data.summary;
  const chart = (
    metric: DailyMetric,
    title: string,
    options: {
      kind?: "line" | "columns";
      tone?: "neutral" | "person";
      baseline?: "zero" | "auto";
      integer?: boolean;
      cumulative?: boolean;
    } = {},
  ) => {
    const series = metricSeries(data.daily, metric);
    const points = series.map((point) => ({
      ...point,
      label: format.dateTime(new Date(point.date), "day"),
      formatted: count(point.value),
    }));
    const total = series.reduce((sum, point) => sum + point.value, 0);
    const lastPoint = points.at(-1);
    return (
      <TrendChart
        title={title}
        points={points}
        summary={
          options.cumulative && lastPoint
            ? t("readout.latest", { value: lastPoint.formatted, date: lastPoint.label })
            : t("readout.total", { total: count(total) })
        }
        emptyLabel={t("charts.empty")}
        dataLabel={t("viewData")}
        dateLabel={t("date")}
        kind={options.kind ?? "columns"}
        tone={options.tone ?? "neutral"}
        baseline={options.baseline ?? "zero"}
        integer={options.integer ?? true}
      />
    );
  };

  const signupChange = change(summary.signups, data.previous.signups);
  const applicationChange = change(summary.applications, data.previous.applications);
  const versus = (value: number | null, noBaseline: string) => (
    <Delta
      value={value}
      label={value === null ? "" : t("versus", { change: signed(value), days })}
      noBaseline={noBaseline}
    />
  );
  const outcomeTotal = OUTCOME_ORDER.reduce((sum, key) => sum + summary[key], 0);

  return (
    <div className="grid gap-4">
      <div className="grid gap-1">
        {header}
        <p className="text-xs text-ink-muted">{t("partialDay")}</p>
      </div>

      <Group id="growth" title={t("categories.growth")}>
        <Tiles
          items={[
            {
              label: t("growth.joins"),
              value: count(summary.signups),
              note: versus(signupChange, t("growth.noBaseline")),
            },
            {
              label: t("growth.average"),
              value: count(summary.signupAverage),
              note: t("growth.averageCaption"),
            },
            {
              label: t("growth.activation"),
              value: percent(
                summary.signups > 0 ? summary.activatedSignups / summary.signups : null,
              ),
              note: t("growth.activationCaption", {
                activated: count(summary.activatedSignups),
                signups: count(summary.signups),
              }),
            },
            {
              label: t("growth.previous"),
              value: count(data.previous.signups),
              note: t("previousCaption", { days }),
            },
          ]}
        />
        <div className="grid divide-y divide-border xl:grid-cols-2 xl:divide-x xl:divide-y-0">
          <ChartBlock
            id="signup-chart"
            title={t("charts.joins.title")}
            description={t("charts.joins.description")}
          >
            {chart("signups", t("charts.joins.title"))}
          </ChartBlock>
          <ChartBlock
            id="volunteer-chart"
            title={t("charts.volunteers.title")}
            description={t("charts.volunteers.description")}
          >
            {chart("volunteers", t("charts.volunteers.title"), {
              kind: "line",
              baseline: "auto",
              cumulative: true,
            })}
          </ChartBlock>
        </div>
      </Group>

      <Group id="application-analytics" title={t("categories.applications")}>
        <Tiles
          items={[
            {
              label: t("applications.submitted"),
              value: count(summary.applications),
              note: versus(applicationChange, t("applications.noBaseline")),
            },
            {
              label: t("applications.average"),
              value: count(summary.applications / days),
              note: t("growth.averageCaption"),
            },
            {
              label: t("applications.previous"),
              value: count(data.previous.applications),
              note: t("previousCaption", { days }),
            },
          ]}
        />
        <ChartBlock
          id="application-chart"
          title={t("charts.applications.title")}
          description={t("charts.applications.description")}
        >
          {chart("applications", t("charts.applications.title"))}
        </ChartBlock>
      </Group>

      <Group id="impact" title={t("categories.impact")}>
        <Tiles
          items={[
            { label: t("impact.attended"), value: count(summary.attended) },
            {
              label: t("impact.hours"),
              value: t("hoursValue", { value: count(summary.confirmedHours) }),
            },
            {
              label: t("impact.rate"),
              value: percent(attendanceRate(summary)),
              note: t("impact.rateCaption"),
            },
            {
              label: t("impact.awaiting"),
              value: count(summary.awaiting),
              note: t("impact.awaitingCaption"),
            },
          ]}
        />
        <div className="grid divide-y divide-border xl:grid-cols-2 xl:divide-x xl:divide-y-0">
          <ChartBlock
            id="hours-chart"
            title={t("charts.confirmedHours.title")}
            description={t("charts.confirmedHours.description")}
          >
            {chart("confirmedHours", t("charts.confirmedHours.title"), {
              tone: "person",
              integer: false,
            })}
          </ChartBlock>
          <ChartBlock
            id="attendance-chart"
            title={t("impact.outcomes")}
            description={t("impact.outcomesCaption")}
          >
            <SegmentedBar
              label={t("impact.outcomes")}
              emptyLabel={t("charts.empty")}
              segments={OUTCOME_ORDER.map((key) => ({
                key,
                label: t(`outcomes.${key}`),
                value: count(summary[key]),
                share: outcomeTotal > 0 ? summary[key] / outcomeTotal : 0,
                shareLabel:
                  outcomeTotal > 0
                    ? format.number(summary[key] / outcomeTotal, {
                        style: "percent",
                        maximumFractionDigits: 0,
                      })
                    : "—",
                fill: OUTCOME_FILLS[key],
              }))}
            />
          </ChartBlock>
        </div>
      </Group>
    </div>
  );
}
