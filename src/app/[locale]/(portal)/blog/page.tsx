import { Plus } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { blogStatus } from "@/components/blog/blog-status";
import { StatusBadge } from "@/components/portal/status-badge";
import {
  Register,
  RegisterNote,
  RegisterSearch,
  RegisterTabs,
} from "@/components/register/register";
import { LoadFailure } from "@/components/states/load-failure";
import { PageHeader } from "@/components/states/page-header";
import { buttonClass } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { failureOf, isReady } from "@/lib/api/load";
import {
  articleState,
  BLOG_LOCALES,
  lastEdited,
  type ArticleState,
} from "@/lib/blog/content";
import { loadBlogPosts } from "@/lib/blog/data.server";
import { blogHref, navHref } from "@/lib/routing/routes";
import { hrefWith, readOption, readParam } from "@/lib/routing/search-params";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const FILTERS = ["all", "draft", "published", "archived"] as const;

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/blog">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "blog" });
  return { title: t("title") };
}

export default async function BlogListPage({
  params,
  searchParams,
}: PageProps<"/[locale]/blog">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("blog");
  const query = await searchParams;
  const q = readParam(query, "q").slice(0, 100);
  const filter = readOption(query, "state", FILTERS) ?? "all";
  const loaded = await loadBlogPosts();
  const failure = failureOf(loaded);
  const posts = (isReady(loaded) ? loaded.data : [])
    .map((post) => ({ ...post, state: articleState(post), edited: lastEdited(post) }))
    .sort((a, b) => new Date(b.edited).getTime() - new Date(a.edited).getTime());
  const counts = Object.fromEntries(
    FILTERS.map((key) => [
      key,
      key === "all"
        ? posts.filter((post) => post.state !== "archived").length
        : posts.filter((post) => post.state === key).length,
    ]),
  ) as Record<(typeof FILTERS)[number], number>;
  const needle = q.toLowerCase();
  const visible = posts
    .filter((post) =>
      filter === "all" ? post.state !== "archived" : post.state === filter,
    )
    .filter(
      (post) =>
        !needle ||
        post.slug.includes(needle) ||
        post.translations.some((translation) =>
          translation.draftTitle.toLowerCase().includes(needle),
        ),
    );
  const date = new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
  const listPath = `/${locale}${navHref("blog")}`;

  return (
    <>
      <PageHeader
        title={t("title")}
        description={t("description")}
        actions={
          <Link href={navHref("newBlog")} className={buttonClass({ size: "sm" })}>
            <Plus aria-hidden="true" />
            {t("new")}
          </Link>
        }
      />
      {failure ? (
        <div className="mt-7">
          <LoadFailure failure={failure} />
        </div>
      ) : (
        <Register
          className="mt-7"
          title={t("listTitle")}
          count={visible.length}
          countLabel={t("countLabel")}
          toolbar={
            <>
              <RegisterTabs
                label={t("filtersLabel")}
                items={FILTERS.map((key) => ({
                  key,
                  label: t(`filters.${key}`),
                  count: counts[key],
                  href: hrefWith(navHref("blog"), {
                    state: key === "all" ? undefined : key,
                    q: q || undefined,
                  }),
                  active: filter === key,
                }))}
              />
              <RegisterSearch
                action={listPath}
                label={t("search")}
                submitLabel={t("searchSubmit")}
                value={q}
                keep={{ state: filter === "all" ? undefined : filter }}
              />
            </>
          }
        >
          {posts.length === 0 ? (
            <RegisterNote
              title={t("emptyTitle")}
              description={t("emptyDescription")}
              action={
                <Link href={navHref("newBlog")} className={buttonClass({ size: "sm" })}>
                  <Plus aria-hidden="true" />
                  {t("new")}
                </Link>
              }
            />
          ) : visible.length === 0 ? (
            <RegisterNote
              title={q ? t("noMatchesTitle", { query: q }) : t("noneInState")}
              description={q ? t("noMatchesDescription") : undefined}
              action={
                q ? (
                  <Link
                    href={hrefWith(navHref("blog"), {
                      state: filter === "all" ? undefined : filter,
                    })}
                    className={buttonClass({ size: "sm", variant: "outline" })}
                  >
                    {t("clearSearch")}
                  </Link>
                ) : undefined
              }
            />
          ) : (
            <ul className="divide-y divide-border">
              {visible.map((post) => (
                <ArticleRow
                  key={post.id}
                  post={post}
                  state={post.state}
                  edited={date.format(new Date(post.edited))}
                  editedIso={post.edited}
                  labels={{
                    untitled: t("untitled"),
                    languages: t("languages"),
                    state: t(`states.${post.state}`),
                    lastEdited: t("lastEditedLabel"),
                    languageStates: Object.fromEntries(
                      BLOG_LOCALES.map((lang) => {
                        const translation = post.translations.find(
                          (item) => item.locale === lang,
                        );
                        const key = translation?.publishedRevisionId
                          ? "published"
                          : translation
                            ? "draft"
                            : "missing";
                        return [
                          lang,
                          `${t(`languageNames.${lang}`)}: ${t(`states.${key}`)}`,
                        ];
                      }),
                    ),
                  }}
                />
              ))}
            </ul>
          )}
        </Register>
      )}
    </>
  );
}

function ArticleRow({
  post,
  state,
  edited,
  editedIso,
  labels,
}: {
  post: {
    id: string;
    slug: string;
    primaryLocale: string;
    translations: {
      locale: string;
      draftTitle: string;
      publishedRevisionId: string | null;
    }[];
  };
  state: ArticleState;
  edited: string;
  editedIso: string;
  labels: {
    untitled: string;
    languages: string;
    state: string;
    lastEdited: string;
    languageStates: Record<string, string>;
  };
}) {
  const primary = post.translations.find(
    (translation) => translation.locale === post.primaryLocale,
  );
  const title =
    primary?.draftTitle ||
    post.translations.find((translation) => translation.draftTitle)?.draftTitle ||
    labels.untitled;
  const chip = blogStatus(state);
  return (
    <li>
      <Link
        href={blogHref(post.id)}
        className="grid gap-3 px-5 py-3.5 transition-colors hover:bg-surface-sunk focus-visible:-outline-offset-3 sm:grid-cols-[minmax(0,1fr)_auto_9rem_8rem] sm:items-center sm:gap-6"
      >
        <span className="min-w-0">
          <span
            className={cn(
              "block truncate text-sm font-semibold",
              title === labels.untitled ? "text-ink-muted italic" : "text-ink",
            )}
          >
            {title}
          </span>
          <span className="block truncate font-mono text-xs text-ink-muted">
            /{post.slug}
          </span>
        </span>
        <span className="flex gap-1" role="list" aria-label={labels.languages}>
          {BLOG_LOCALES.map((lang) => {
            const translation = post.translations.find((item) => item.locale === lang);
            return (
              <span
                key={lang}
                role="listitem"
                title={labels.languageStates[lang]}
                className={cn(
                  "inline-flex min-w-9 items-center justify-center rounded-full px-2 py-0.5 text-[0.6875rem] font-semibold uppercase",
                  translation?.publishedRevisionId
                    ? "bg-action text-knockout"
                    : translation
                      ? "border border-border-control text-ink"
                      : "border border-dashed border-border text-ink-muted/70",
                )}
              >
                <span aria-hidden="true">{lang}</span>
                <span className="sr-only">{labels.languageStates[lang]}</span>
              </span>
            );
          })}
        </span>
        <span>
          <StatusBadge label={labels.state} tone={chip.tone} icon={chip.icon} />
        </span>
        <time
          dateTime={editedIso}
          className="tabular text-xs text-ink-muted sm:text-right"
        >
          <span className="sr-only">{labels.lastEdited} </span>
          {edited}
        </time>
      </Link>
    </li>
  );
}
