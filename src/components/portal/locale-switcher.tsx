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

function withLocale(pathname: string, locale: Locale): string {
  const segments = pathname.split("/");
  if (isLocale(segments[1])) {
    segments[1] = locale;
    return segments.join("/");
  }
  return `/${locale}${pathname === "/" ? "" : pathname}`;
}

export function LocaleSwitcher({ label }: { label: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams().toString();
  const [pending, startTransition] = useTransition();
  const segment = pathname.split("/")[1];
  const current = isLocale(segment) ? segment : defaultLocale;

  return (
    <label className="relative flex items-center">
      <span className="sr-only">{label}</span>
      <Languages
        aria-hidden="true"
        className="pointer-events-none absolute left-3 z-10 size-4 text-ink-muted"
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
        className="min-h-11 w-auto min-w-[8.5rem] pl-9 text-sm"
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
