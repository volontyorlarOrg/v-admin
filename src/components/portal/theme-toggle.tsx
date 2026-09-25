"use client";

import { Moon, Sun } from "lucide-react";
import { useSyncExternalStore } from "react";

import { applyTheme, readTheme, subscribeToTheme, type Theme } from "@/lib/theme";
import { cn } from "@/lib/utils";

const SERVER_THEME: Theme = "light";

export function ThemeToggle({
  label,
  tone = "default",
  className,
}: {
  label: string;
  tone?: "default" | "shell";
  className?: string;
}) {
  const theme = useSyncExternalStore(subscribeToTheme, readTheme, () => SERVER_THEME);
  const shell = tone === "shell";

  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={theme === "dark"}
      onClick={() => applyTheme(theme === "dark" ? "light" : "dark")}
      className={cn(
        "flex size-10 shrink-0 items-center justify-center rounded-lg border transition-colors",
        shell
          ? "border-shell-line bg-shell-raised text-shell-muted hover:border-shell-muted hover:text-shell-ink"
          : "border-border-control text-ink-muted hover:border-primary-ink hover:text-primary-ink",
        className,
      )}
    >
      {theme === "dark" ? (
        <Sun aria-hidden="true" className="size-4" />
      ) : (
        <Moon aria-hidden="true" className="size-4" />
      )}
    </button>
  );
}
