import { Plus } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import {
  ArticleCard,
  type ArticleCardData,
  type LanguageState,
} from "@/components/blog/blog-card";
import {
  RegisterNote,
  RegisterSearch,
  RegisterTabs,
} from "@/components/register/register";
import { LoadFailure } from "@/components/states/load-failure";
import { PageHeader } from "@/components/states/page-header";
import { buttonClass } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { failureOf, isReady } from "@/lib/api/load";
import type { BlogPost } from "@/lib/api/schemas";
import { articleState, BLOG_LOCALES, lastEdited } from "@/lib/blog/content";
import { loadBlogPosts } from "@/lib/blog/data.server";
import { EVENT_TIME_ZONE } from "@/lib/datetime";
import { navHref } from "@/lib/routing/routes";
import { hrefWith, readOption, readParam } from "@/lib/routing/search-params";

export const dynamic = "force-dynamic";

const FILTERS = ["all", "draft", "published", "archived"] as const;

type ListedPost = Pick<BlogPost, "id" | "slug" | "primaryLocale" | "archivedAt"> & {
  translations: {
    locale: BlogPost["primaryLocale"];
    draftTitle: string;
    publishedRevisionId: string | null;
  }[];
};

function liveUrl(post: ListedPost, webOrigin: string | null): string | null {
  if (!webOrigin || post.archivedAt) return null;
  const published = [post.primaryLocale, ...BLOG_LOCALES].find((lang) =>
    post.translations.some(
      (translation) => translation.locale === lang && translation.publishedRevisionId,
    ),
  );
  if (!published) return null;
  try {
    return new URL(`/${published}/blog/${post.slug}`, webOrigin).toString();
  } catch {
    return null;
  }
}

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
    timeZone: EVENT_TIME_ZONE,
  });
  const webOrigin = process.env.BLOG_WEB_ORIGIN?.trim() || null;
  const listPath = `/${locale}${navHref("blog")}`;
  const newArticle = (
    <Link href={navHref("newBlog")} className={buttonClass({ size: "sm" })}>
      <Plus aria-hidden="true" />
      {t("new")}
    </Link>
  );

  const cards: ArticleCardData[] = visible.map((post) => {
    const title =
      post.translations.find((translation) => translation.locale === post.primaryLocale)
        ?.draftTitle ||
      post.translations.find((translation) => translation.draftTitle)?.draftTitle ||
      null;
    return {
      id: post.id,
      slug: post.slug,
      title,
      state: post.state,
      edited: date.format(new Date(post.edited)),
      editedIso: post.edited,
      liveUrl: liveUrl(post, webOrigin),
      languages: BLOG_LOCALES.map((lang) => {
        const translation = post.translations.find((item) => item.locale === lang);
        const state: LanguageState = translation?.publishedRevisionId
          ? "published"
          : translation
            ? "draft"
            : "missing";
        return {
          locale: lang,
          name: t(`languageNames.${lang}`),
          state,
          stateLabel: t(`states.${state}`),
        };
      }),
    };
  });

  return (
    <>
      <PageHeader
        title={t("title")}
        description={t("description")}
        actions={newArticle}
      />
      {failure ? (
        <div className="mt-7">
          <LoadFailure failure={failure} />
        </div>
      ) : (
        <section aria-labelledby="blog-articles" className="mt-7 flex flex-col gap-5">
          <h2 id="blog-articles" className="sr-only">
            {t("listTitle")}
          </h2>
          <div className="flex flex-wrap items-center justify-between gap-3">
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
          </div>
          {posts.length === 0 ? (
            <div className="sheet">
              <RegisterNote
                title={t("emptyTitle")}
                description={t("emptyDescription")}
                action={newArticle}
              />
            </div>
          ) : visible.length === 0 ? (
            <div className="sheet">
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
            </div>
          ) : (
            <ul className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {cards.map((card) => (
                <li key={card.id} className="flex min-w-0 [&>article]:w-full">
                  <ArticleCard
                    article={card}
                    labels={{
                      untitled: t("untitled"),
                      state: t(`states.${card.state}`),
                      lastEdited: t("lastEditedLabel"),
                      languages: t("languages"),
                      viewOnSite: t("viewOnSite"),
                    }}
                  />
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </>
  );
}
