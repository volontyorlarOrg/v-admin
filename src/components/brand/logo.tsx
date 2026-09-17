import {
  ICON_GLYPH,
  ICON_HEART,
  ICON_TILE,
  WORDMARK,
  WORDMARK_HEART,
} from "@/components/brand/logo-paths";
import { cn } from "@/lib/utils";

export function BrandIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 1000 1000"
      aria-hidden="true"
      focusable="false"
      className={cn("shrink-0", className)}
    >
      <path d={ICON_TILE} className="fill-logo-blue" />
      <path d={ICON_GLYPH} fillRule="evenodd" className="fill-knockout" />
      <path d={ICON_HEART} fillRule="evenodd" className="fill-logo-orange" />
    </svg>
  );
}

export function BrandWordmark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 1000 210.74"
      aria-hidden="true"
      focusable="false"
      className={cn("shrink-0", className)}
    >
      <path d={WORDMARK} fillRule="evenodd" fill="currentColor" />
      <path d={WORDMARK_HEART} fillRule="evenodd" className="fill-logo-orange" />
    </svg>
  );
}

export function BrandLockup({
  name,
  portal,
  condensed = false,
  className,
}: {
  name: string;
  portal: string;
  condensed?: boolean;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex min-w-0 items-center gap-3", className)}>
      <span
        role="img"
        aria-label={name}
        className="inline-flex shrink-0 items-start [--logo:2.65rem]"
      >
        <BrandIcon className="size-(--logo)" />
        <BrandWordmark
          className={cn(
            "mt-[calc(var(--logo)*0.24)] ml-[calc(var(--logo)*0.3025)] h-[calc(var(--logo)*0.6006)] w-auto text-logo-word",
            condensed ? "hidden lg:block" : "hidden sm:block",
          )}
        />
      </span>
      <span
        aria-hidden="true"
        className={cn(
          "hidden h-6 w-px shrink-0 bg-border",
          condensed ? "lg:block" : "sm:block",
        )}
      />
      <span
        className={cn(
          "hidden truncate text-sm font-medium text-ink-muted",
          condensed ? "lg:block" : "sm:block",
        )}
      >
        {portal}
      </span>
    </span>
  );
}
