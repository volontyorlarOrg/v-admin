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
      <ol aria-hidden="true" className="flex h-1">
        {stations.map((station) => (
          <li key={station.key} className={cn("flex-1", SEGMENT[station.tone])} />
        ))}
      </ol>
      <header className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 px-5 pt-3.5">
        <h2 id={`${id}-title`} className="text-sm font-semibold text-ink-muted">
          {title}
        </h2>
        {summary ? <p className="text-sm text-ink-muted">{summary}</p> : null}
      </header>

      <ol className="mt-3 grid grid-cols-2 gap-px border-t border-border bg-border lg:mt-0 lg:grid-cols-5 lg:border-t-0">
        {stations.map((station) => (
          <li
            key={station.key}
            className="min-w-0 bg-surface px-4 pt-3 pb-4 last:col-span-2 sm:px-5 lg:pt-4 lg:last:col-span-1"
          >
            <Link href={station.href} className="group/station block rounded-sm">
              <span className="flex items-center gap-2 text-[0.8125rem] leading-tight font-medium text-ink-muted transition-colors duration-150 group-hover/station:text-primary-ink">
                <span
                  aria-hidden="true"
                  className={cn("size-2 shrink-0 rounded-full", SEGMENT[station.tone])}
                />
                {station.label}
              </span>
              <span className="mt-1.5 flex flex-wrap items-baseline gap-x-1.5">
                <span className="text-station figure text-ink">{station.value}</span>
                <span className="text-xs text-ink-muted">{station.scope}</span>
              </span>
            </Link>

            {waitingKnown ? (
              <ul className="mt-2.5 flex flex-col gap-1">
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
                            "size-1.5 shrink-0 rounded-full",
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
        ))}
      </ol>
    </section>
  );
}
