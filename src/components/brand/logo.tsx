import { cn } from "@/lib/utils";

export function BrandMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 200"
      aria-hidden="true"
      focusable="false"
      className={cn("shrink-0", className)}
    >
      <circle cx="100" cy="76" r="20" fill="currentColor" />
      <path
        d="M 41.74 81.30 A 59 59 0 0 0 158.26 81.30"
        fill="none"
        stroke="currentColor"
        strokeWidth="13"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function BrandLockup({
  name,
  portal,
  className,
}: {
  name: string;
  portal: string;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <BrandMark className="size-8 text-primary" />
      <span className="flex min-w-0 flex-col leading-none">
        <span className="truncate text-sm leading-none font-bold tracking-[-0.02em] text-ink lowercase">
          {name}
        </span>
        <span className="mt-1 truncate text-eyebrow text-ink-muted">{portal}</span>
      </span>
    </span>
  );
}
