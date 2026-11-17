import { Check, X } from "lucide-react";

import type { TrackStatus, TrackTone } from "@/lib/vacancies/track";
import { cn } from "@/lib/utils";

export type TrackItem = {
  key: string;
  name: string;
  note: string;
  status: TrackStatus;
  statusLabel: string;
  tone: TrackTone;
};

const FILL = { institution: "bg-primary", earned: "bg-accent" } as const;
const RING = { institution: "border-primary", earned: "border-accent" } as const;

function Marker({ item }: { item: TrackItem }) {
  if (item.status === "done") {
    return (
      <span
        className={cn(
          "flex size-6 shrink-0 items-center justify-center rounded-full text-knockout",
          FILL[item.tone],
        )}
      >
        <Check aria-hidden="true" className="size-3.5" strokeWidth={3} />
      </span>
    );
  }
  if (item.status === "stopped") {
    return (
      <span className="flex size-6 shrink-0 items-center justify-center rounded-full border-2 border-danger bg-surface text-danger">
        <X aria-hidden="true" className="size-3.5" strokeWidth={3} />
      </span>
    );
  }
  if (item.status === "current") {
    return (
      <span
        className={cn(
          "flex size-6 shrink-0 items-center justify-center rounded-full border-2 bg-surface",
          RING[item.tone],
        )}
      >
        <span className={cn("size-2 rounded-full", FILL[item.tone])} />
      </span>
    );
  }
  return (
    <span className="flex size-6 shrink-0 items-center justify-center rounded-full border-2 border-border-strong bg-surface" />
  );
}

export function VacancyTrack({ label, items }: { label: string; items: TrackItem[] }) {
  return (
    <section aria-label={label} className="sheet px-5 py-4">
      <ol className="flex flex-col gap-0 sm:grid sm:grid-cols-5">
        {items.map((item, index) => {
          const next = items[index + 1];
          const reached = item.status === "done";
          return (
            <li
              key={item.key}
              aria-current={item.status === "current" ? "step" : undefined}
              className="relative flex gap-3 pb-4 last:pb-0 sm:flex-col sm:gap-2.5 sm:pr-3 sm:pb-0"
            >
              {next ? (
                <span
                  aria-hidden="true"
                  className={cn(
                    "absolute top-6 bottom-0 left-[0.6875rem] w-0.5 sm:top-[0.6875rem] sm:right-0 sm:bottom-auto sm:left-6 sm:h-0.5 sm:w-auto",
                    reached ? FILL[next.tone] : "bg-border",
                  )}
                />
              ) : null}
              <Marker item={item} />
              <div className="min-w-0">
                <p
                  className={cn(
                    "text-[0.8125rem] leading-tight font-semibold",
                    item.status === "upcoming" ? "text-ink-muted" : "text-ink",
                  )}
                >
                  {item.name}
                  <span className="sr-only">, {item.statusLabel}</span>
                </p>
                <p
                  className={cn(
                    "mt-0.5 text-xs leading-snug",
                    item.status === "stopped"
                      ? "font-medium text-danger-ink"
                      : item.status === "current"
                        ? "text-ink"
                        : "text-ink-muted",
                  )}
                >
                  {item.note}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
