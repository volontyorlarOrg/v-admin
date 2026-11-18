import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

export type JourneyOwner = "you" | "organizers";

export type JourneyWaiting = {
  key: string;
  label: string;
  href: string;
  owner: JourneyOwner;
};

export type JourneyStation = {
  key: string;
  label: string;
  value: string;
  scope: string;
  href: string;
  tone: "institution" | "earned";
  waiting: JourneyWaiting[];
};

const SEGMENT = {
  institution: "bg-primary",
  earned: "bg-accent",
} as const;

const MARKER = {
  institution: "border-primary group-hover/station:bg-primary",
  earned: "border-accent group-hover/station:bg-accent",
} as const;

const OWNER = {
  you: "bg-warning",
  organizers: "bg-primary",
} as const;

export function Journey({
  id,
  title,
  summary,
  stations,
  owners,
  clear,
  waitingKnown = true,
}: {
  id: string;
  title: string;
  summary?: string;
  stations: JourneyStation[];
  owners: Record<JourneyOwner, string>;
  clear: string;
  waitingKnown?: boolean;
}) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="overflow-hidden sheet">
      <header className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b border-border px-4 py-3">
        <h2 id={`${id}-title`} className="text-section text-ink">
          {title}
        </h2>
        {summary ? <p className="text-sm text-ink-muted">{summary}</p> : null}
      </header>

      <ol className="grid px-4 pt-5 pb-5 lg:grid-cols-5 lg:px-1">
        {stations.map((station, index) => {
          const next = stations[index + 1];
          return (
            <li
              key={station.key}
              className="relative pb-6 pl-10 last:pb-0 lg:pt-8 lg:pr-3 lg:pb-0 lg:pl-3"
            >
              {next ? (
                <span
                  aria-hidden="true"
                  className={cn(
                    "absolute top-[0.6875rem] bottom-[-0.6875rem] left-3 w-1 lg:top-[0.4375rem] lg:bottom-auto lg:left-[1.3125rem] lg:h-1 lg:w-full",
                    SEGMENT[station.tone],
                  )}
                />
              ) : null}

              <Link href={station.href} className="group/station block rounded-sm">
                <span
                  aria-hidden="true"
                  className={cn(
                    "absolute top-0.5 left-[0.3125rem] z-10 size-[1.125rem] rounded-full border-4 bg-surface transition-colors duration-150 lg:top-0 lg:left-3",
                    MARKER[station.tone],
                  )}
                />
                <span className="block text-[0.8125rem] leading-tight font-semibold text-ink transition-colors duration-150 group-hover/station:text-primary-ink">
                  {station.label}
                </span>
                <span className="mt-1 flex flex-wrap items-baseline gap-x-1.5">
                  <span className="text-station figure text-ink">{station.value}</span>
                  <span className="text-xs text-ink-muted">{station.scope}</span>
                </span>
              </Link>

              {waitingKnown ? (
                <ul className="mt-2 flex flex-col gap-1">
                  {station.waiting.length === 0 ? (
                    <li className="text-xs text-ink-faint">{clear}</li>
                  ) : (
                    station.waiting.map((item) => (
                      <li key={item.key}>
                        <Link
                          href={item.href}
                          className="inline-flex flex-wrap items-center gap-x-1.5 rounded-sm text-[0.8125rem] leading-snug font-medium text-ink hover:text-primary-ink hover:underline"
                        >
                          <span
                            aria-hidden="true"
                            className={cn(
                              "size-2 shrink-0 rounded-full",
                              OWNER[item.owner],
                            )}
                          />
                          {item.label}
                          <span className="text-xs font-normal whitespace-nowrap text-ink-muted">
                            {" · "}
                            {owners[item.owner]}
                          </span>
                        </Link>
                      </li>
                    ))
                  )}
                </ul>
              ) : null}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
