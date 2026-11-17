"use client";

import { Moon, UserRound } from "lucide-react";
import { useState, useSyncExternalStore, type ReactNode } from "react";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { applyTheme, readTheme, subscribeToTheme, type Theme } from "@/lib/theme";
import { cn } from "@/lib/utils";

const SERVER_THEME: Theme = "light";

export function AccountMenu({
  label,
  heading,
  caption,
  children,
}: {
  label: string;
  heading: string;
  caption: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        aria-label={label}
        className="flex size-9 shrink-0 items-center justify-center rounded-full border border-border-strong bg-surface text-ink-muted transition-colors duration-150 hover:border-border-control hover:text-ink data-[state=open]:border-border-control data-[state=open]:text-ink"
      >
        <UserRound aria-hidden="true" className="size-[1.125rem]" />
      </PopoverTrigger>
      <PopoverContent
        aria-label={label}
        className="w-[min(19rem,calc(100vw-1.5rem))] rounded-xl p-0 shadow-raised"
      >
        <div className="border-b border-border px-4 py-3">
          <p className="text-sm font-semibold text-ink">{heading}</p>
          <p className="mt-0.5 text-[0.8125rem] text-ink-muted">{caption}</p>
        </div>
        <div
          className="flex flex-col gap-1 p-2"
          onClickCapture={(event) => {
            if ((event.target as HTMLElement).closest("a")) setOpen(false);
          }}
        >
          {children}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function AccountMenuRow({
  icon,
  children,
  className,
}: {
  icon: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex min-h-10 items-center gap-3 rounded-md px-2 text-sm text-ink",
        className,
      )}
    >
      <span aria-hidden="true" className="flex size-4 shrink-0 text-ink-muted">
        {icon}
      </span>
      {children}
    </div>
  );
}

export function ThemeSwitch({ label }: { label: string }) {
  const theme = useSyncExternalStore(subscribeToTheme, readTheme, () => SERVER_THEME);
  const dark = theme === "dark";

  return (
    <button
      type="button"
      role="switch"
      aria-checked={dark}
      onClick={() => applyTheme(dark ? "light" : "dark")}
      className="flex min-h-10 w-full items-center gap-3 rounded-md px-2 text-left text-sm font-medium text-ink transition-colors duration-150 hover:bg-surface-sunk"
    >
      <Moon aria-hidden="true" className="size-4 shrink-0 text-ink-muted" />
      <span className="flex-1">{label}</span>
      <span
        aria-hidden="true"
        className={cn(
          "relative h-5 w-9 shrink-0 rounded-full transition-colors duration-150",
          dark ? "bg-action" : "bg-border-strong",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 size-4 rounded-full bg-knockout transition-[left] duration-150",
            dark ? "left-[1.125rem]" : "left-0.5",
          )}
        />
      </span>
    </button>
  );
}
