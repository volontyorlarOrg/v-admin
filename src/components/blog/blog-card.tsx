import { ArrowUpRight, BadgeCheck, CircleDashed, PencilLine } from "lucide-react";

import { blogStatus } from "@/components/blog/blog-status";
import { WORDMARK_HEART } from "@/components/brand/logo-paths";
import { StatusBadge } from "@/components/portal/status-badge";
import { Link } from "@/i18n/navigation";
import type { ArticleState, BlogLocale } from "@/lib/blog/content";
import { blogHref } from "@/lib/routing/routes";
import { cn } from "@/lib/utils";

export type LanguageState = "published" | "draft" | "missing";

export type ArticleCardData = {
  id: string;
  slug: string;
  title: string | null;
  state: ArticleState;
  edited: string;
  editedIso: string;
  liveUrl: string | null;
  languages: {
    locale: BlogLocale;
    name: string;
    state: LanguageState;
    stateLabel: string;
  }[];
};

export type ArticleCardLabels = {
  untitled: string;
  state: string;
  lastEdited: string;
  languages: string;
  viewOnSite: string;
};

const LANGUAGE_STATE = {
  published: { icon: BadgeCheck, className: "font-semibold text-primary-ink" },
  draft: { icon: PencilLine, className: "text-ink" },
  missing: { icon: CircleDashed, className: "text-ink-muted" },
} as const;

export function BlogPlate({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      data-slot="blog-plate"
      className={cn(
        "blog-plate flex items-center justify-center overflow-hidden",
        className,
      )}
    >
      <svg
        viewBox="295.14 145.73 103.47 65"
        focusable="false"
        className="w-[clamp(3.5rem,30%,7rem)] shrink-0 text-primary/25"
      >
        <path d={WORDMARK_HEART} fillRule="evenodd" fill="currentColor" />
      </svg>
    </div>
  );
}

export function ArticleCard({
  article,
  labels,
}: {
  article: ArticleCardData;
  labels: ArticleCardLabels;
}) {
  const chip = blogStatus(article.state);
  return (
    <article className="group relative isolate flex min-w-0 flex-col sheet transition-colors duration-200 hover:border-border-control has-[a[data-card-link]:focus-visible]:outline-3 has-[a[data-card-link]:focus-visible]:outline-offset-2 has-[a[data-card-link]:focus-visible]:outline-primary-ink">
      <div className="flex items-center justify-between gap-3 px-5 pt-4">
        <StatusBadge label={labels.state} tone={chip.tone} icon={chip.icon} />
        <time dateTime={article.editedIso} className="tabular text-xs text-ink-muted">
          <span className="sr-only">{labels.lastEdited} </span>
          {article.edited}
        </time>
      </div>
      <div className="px-5 pt-3 pb-4">
        <h3 className="line-clamp-3 text-base leading-snug font-semibold break-words">
          <Link
            href={blogHref(article.id)}
            data-card-link=""
            className={cn(
              "transition-colors group-hover:text-primary-ink after:absolute after:inset-0 after:z-10 after:rounded-[inherit] after:content-[''] focus-visible:outline-none",
              article.title ? "text-ink" : "text-ink-muted italic",
            )}
          >
            {article.title ?? labels.untitled}
          </Link>
        </h3>
        <p className="mt-1 truncate font-mono text-xs text-ink-muted">
          /{article.slug}
        </p>
      </div>
      <ul
        aria-label={labels.languages}
        className="relative z-20 mt-auto flex flex-col border-t border-border p-1.5"
      >
        {article.languages.map((language) => {
          const look = LANGUAGE_STATE[language.state];
          return (
            <li key={language.locale}>
              <Link
                href={`${blogHref(article.id)}?lang=${language.locale}`}
                className="flex min-h-9 items-center justify-between gap-3 rounded-lg px-3.5 text-sm transition-colors hover:bg-surface-sunk focus-visible:-outline-offset-3"
              >
                <span className="text-ink">{language.name}</span>
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 text-xs whitespace-nowrap",
                    look.className,
                  )}
                >
                  <look.icon aria-hidden="true" className="size-3.5 shrink-0" />
                  {language.stateLabel}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
      {article.liveUrl ? (
        <div className="relative z-20 border-t border-border px-2 py-1.5">
          <a
            href={article.liveUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-9 items-center gap-1.5 rounded-full px-3.5 text-sm font-semibold text-primary-ink transition-colors hover:bg-surface-soft [&_svg]:size-4"
          >
            {labels.viewOnSite}
            <ArrowUpRight aria-hidden="true" />
          </a>
        </div>
      ) : null}
    </article>
  );
}

export function BlogCardPreview({
  title,
  summary,
  cover,
  lang,
  untitled,
}: {
  title: string;
  summary: string;
  cover: string | null;
  lang: string;
  untitled: string;
}) {
  return (
    <div
      lang={lang}
      className="overflow-hidden rounded-xl border border-border bg-surface"
    >
      {cover ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={cover}
          alt=""
          className="aspect-[3/2] w-full border-b border-border bg-surface-sunk object-cover"
        />
      ) : (
        <BlogPlate className="aspect-[3/2] border-b border-border" />
      )}
      <div className="flex flex-col gap-1.5 px-4 py-3.5">
        <p
          className={cn(
            "line-clamp-3 text-[0.9375rem] leading-snug font-semibold break-words",
            title.trim() ? "text-ink" : "text-ink-muted italic",
          )}
        >
          {title.trim() || untitled}
        </p>
        {summary.trim() ? (
          <p className="line-clamp-3 text-xs leading-relaxed text-ink-muted">
            {summary}
          </p>
        ) : null}
      </div>
    </div>
  );
}
