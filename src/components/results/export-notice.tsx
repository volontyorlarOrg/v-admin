"use client";

import { CircleAlert, ExternalLink, FileSpreadsheet } from "lucide-react";
import { useEffect } from "react";

import { buttonClass } from "@/components/ui/button";
import { EXPORT_NOTICE_COOKIE } from "@/lib/exports/schemas";

export function ExportNotice({
  tone,
  title,
  description,
  link,
}: {
  tone: "done" | "failed";
  title: string;
  description: string;
  link?: { href: string; label: string };
}) {
  useEffect(() => {
    document.cookie = `${EXPORT_NOTICE_COOKIE}=; Max-Age=0; Path=/; SameSite=Lax`;
  }, []);

  const Icon = tone === "done" ? FileSpreadsheet : CircleAlert;
  return (
    <section
      role={tone === "done" ? "status" : "alert"}
      className="flex flex-col gap-3 rounded-xl border border-border bg-surface px-4 py-3.5 sm:flex-row sm:items-center"
    >
      <span
        aria-hidden="true"
        className={
          tone === "done"
            ? "grid size-9 shrink-0 place-items-center rounded-md bg-success-muted text-success-ink"
            : "grid size-9 shrink-0 place-items-center rounded-md bg-danger-muted text-danger-ink"
        }
      >
        <Icon className="size-4.5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-ink">{title}</p>
        <p className="mt-0.5 text-sm text-ink-muted">{description}</p>
      </div>
      {link ? (
        <a
          href={link.href}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonClass({ variant: "outline", size: "sm" })}
        >
          <ExternalLink aria-hidden="true" />
          {link.label}
        </a>
      ) : null}
    </section>
  );
}
