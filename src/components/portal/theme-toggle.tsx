"use client";

import { Moon, Sun } from "lucide-react";
import { useSyncExternalStore } from "react";

import { applyTheme, readTheme, subscribeToTheme, type Theme } from "@/lib/theme";

const SERVER_THEME: Theme = "light";

export function ThemeToggle({ label }: { label: string }) {
  const theme = useSyncExternalStore(subscribeToTheme, readTheme, () => SERVER_THEME);

  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={theme === "dark"}
      onClick={() => applyTheme(theme === "dark" ? "light" : "dark")}
      className="flex size-11 items-center justify-center rounded-lg text-ink-muted hover:bg-surface-sunk hover:text-ink"
    >
      {theme === "dark" ? (
        <Sun aria-hidden="true" className="size-4" />
      ) : (
        <Moon aria-hidden="true" className="size-4" />
      )}
    </button>
  );
}
