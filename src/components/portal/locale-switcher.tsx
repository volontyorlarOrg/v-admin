"use client";

import { Languages } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import {
  defaultLocale,
  isLocale,
  localeNames,
  locales,
  type Locale,
} from "@/i18n/routing";
import { cn } from "@/lib/utils";

function withLocale(pathname: string, locale: Locale): string {
  const segments = pathname.split("/");
  if (isLocale(segments[1])) {
    segments[1] = locale;
    return segments.join("/");
  }
  return `/${locale}${pathname === "/" ? "" : pathname}`;
}

export function LocaleSwitcher({
  label,
  tone = "default",
  className,
}: {
  label: string;
  tone?: "default" | "shell";
  className?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams().toString();
  const [pending, startTransition] = useTransition();
  const segment = pathname.split("/")[1];
  const current = isLocale(segment) ? segment : defaultLocale;
  const shell = tone === "shell";

  return (
    <label className={cn("relative flex min-w-0 items-center", className)}>
      <span className="sr-only">{label}</span>
      <Languages
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute left-3 z-10 size-4",
          shell ? "text-shell-muted" : "text-ink-muted",
        )}
      />
      <NativeSelect
        value={current}
        disabled={pending}
        onChange={(event) => {
          const next = withLocale(pathname, event.target.value as Locale);
          startTransition(() => {
            router.replace(search ? `${next}?${search}` : next);
          });
        }}
        iconClassName={shell ? "text-shell-muted" : undefined}
        className={cn(
          "min-h-10 w-full rounded-lg pl-9 text-sm",
          shell &&
            "border-shell-line bg-shell-raised text-shell-ink hover:border-shell-muted [&_option]:bg-shell [&_option]:text-shell-ink",
        )}
      >
        {locales.map((locale) => (
          <NativeSelectOption key={locale} value={locale}>
            {localeNames[locale]}
          </NativeSelectOption>
        ))}
      </NativeSelect>
    </label>
  );
}
