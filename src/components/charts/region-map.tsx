import type { Region } from "@/lib/domain/vocabulary";
import { REGION_TILES, TILE_COLUMNS, TILE_ROWS } from "@/lib/map/tiles";
import type { CoverageStep, RegionCoverage } from "@/lib/statistics/breakdowns";
import { cn } from "@/lib/utils";

const STEP: Record<CoverageStep, string> = {
  0: "bg-map-0 text-ink-muted",
  1: "bg-map-1 text-map-ink",
  2: "bg-map-2 text-map-ink",
  3: "bg-map-3 text-map-ink",
  4: "bg-map-4 text-map-ink-strong",
  5: "bg-map-5 text-map-ink-strong",
};

const LEGEND: CoverageStep[] = [1, 2, 3, 4, 5];

export function RegionMap({
  coverage,
  label,
  regionName,
  tileLabel,
  copy,
}: {
  coverage: RegionCoverage;
  label: string;
  regionName: (region: Region) => string;
  tileLabel: (region: Region, count: number) => string;
  copy: {
    covered: string;
    coveredValue: string;
    none: string;
    ranked: string;
    fewer: string;
    more: string;
    zero: string;
  };
}) {
  const ranked = coverage.cells
    .filter((cell) => cell.value > 0)
    .sort((a, b) => b.value - a.value);
  const empty = coverage.cells.filter((cell) => cell.value === 0);

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_15rem]">
      <div className="hidden min-w-0 sm:block">
        <ul
          aria-label={label}
          className="grid gap-1"
          style={{
            gridTemplateColumns: `repeat(${TILE_COLUMNS}, minmax(0, 1fr))`,
            gridTemplateRows: `repeat(${TILE_ROWS}, minmax(0, auto))`,
          }}
        >
          {coverage.cells.map((cell) => {
            const tile = REGION_TILES[cell.key];
            return (
              <li
                key={cell.key}
                aria-label={tileLabel(cell.key, cell.value)}
                title={tileLabel(cell.key, cell.value)}
                className={cn(
                  "flex min-h-16 flex-col justify-between gap-1 rounded-md p-2",
                  STEP[cell.step],
                )}
                style={{ gridColumn: tile.column + 1, gridRow: tile.row + 1 }}
              >
                <span
                  aria-hidden="true"
                  className="line-clamp-2 text-[0.6875rem] leading-tight font-medium [overflow-wrap:anywhere]"
                >
                  {regionName(cell.key)}
                </span>
                <span aria-hidden="true" className="text-lg leading-none figure">
                  {cell.value}
                </span>
              </li>
            );
          })}
        </ul>
        <div
          aria-hidden="true"
          className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-ink-muted"
        >
          <span className="inline-flex items-center gap-1.5">
            <span className="size-3 rounded-sm bg-map-0 ring-1 ring-border ring-inset" />
            {copy.zero}
          </span>
          <span className="inline-flex items-center gap-1.5">
            {copy.fewer}
            <span className="flex gap-0.5">
              {LEGEND.map((step) => (
                <span key={step} className={cn("h-3 w-5 rounded-sm", STEP[step])} />
              ))}
            </span>
            {copy.more}
          </span>
        </div>
      </div>

      <div className="grid content-start gap-4">
        <div>
          <p className="text-[0.8125rem] text-ink-muted">{copy.covered}</p>
          <p className="mt-1 text-figure-inline figure text-ink">{copy.coveredValue}</p>
        </div>
        {ranked.length > 0 ? (
          <div>
            <p className="column-label">{copy.ranked}</p>
            <ol className="mt-1.5 divide-y divide-border">
              {ranked.map((cell) => (
                <li
                  key={cell.key}
                  className="flex items-baseline justify-between gap-3 py-1.5 text-[0.8125rem]"
                >
                  <span className="min-w-0 truncate text-ink">
                    {regionName(cell.key)}
                  </span>
                  <span className="tabular font-semibold text-ink">{cell.value}</span>
                </li>
              ))}
            </ol>
          </div>
        ) : null}
        {empty.length > 0 ? (
          <div>
            <p className="column-label">{copy.none}</p>
            <p className="mt-1.5 text-[0.8125rem] leading-relaxed text-ink-muted">
              {empty.map((cell) => regionName(cell.key)).join(", ")}
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
