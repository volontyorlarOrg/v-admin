import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { BlogEditor, type BlogEditorLabels } from "@/components/blog/blog-editor";
import { blogStatus, fill } from "@/components/blog/blog-status";
import { StatusBadge } from "@/components/portal/status-badge";
import { LoadFailure } from "@/components/states/load-failure";
import { PageHeader } from "@/components/states/page-header";
import { failureOf, isReady } from "@/lib/api/load";
import {
  articleState,
  BLOG_LOCALES,
  lastEdited,
  type BlogLocale,
} from "@/lib/blog/content";
import { loadBlogPost } from "@/lib/blog/data.server";
import { navHref } from "@/lib/routing/routes";
import { readOption, readParam } from "@/lib/routing/search-params";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/blog/[id]">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "blog" });
  return { title: t("editor.metaTitle") };
}

export default async function BlogEditorPage({
  params,
  searchParams,
}: PageProps<"/[locale]/blog/[id]">) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("blog");
  const loaded = await loadBlogPost(id);
  const failure = failureOf(loaded);
  if (failure)
    return (
      <>
        <PageHeader
          title={t("editor.metaTitle")}
          back={{ href: navHref("blog"), label: t("back") }}
        />
        <div className="mt-7">
          <LoadFailure failure={failure} />
        </div>
      </>
    );
  if (!isReady(loaded)) return null;
  const post = loaded.data;
  const query = await searchParams;
  const selected: BlogLocale =
    readOption(query, "lang", BLOG_LOCALES) ?? post.primaryLocale;
  const recoveredTitle = readParam(query, "title").slice(0, 180) || null;
  const labels = t.raw("editor") as BlogEditorLabels;
  const title =
    post.translations.find((translation) => translation.locale === selected)?.title ||
    post.translations.find((translation) => translation.locale === post.primaryLocale)
      ?.title ||
    post.translations.find((translation) => translation.title)?.title ||
    labels.untitled;
  const state = articleState(post);
  const chip = blogStatus(state);
  const edited = new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(lastEdited(post)));
  const webOrigin = process.env.BLOG_WEB_ORIGIN?.trim() || null;

  return (
    <>
      <PageHeader
        title={title}
        back={{ href: navHref("blog"), label: t("back") }}
        meta={
          <>
            <StatusBadge
              label={t(`states.${state}`)}
              tone={chip.tone}
              icon={chip.icon}
            />
            <span className="tabular">
              {fill(t.raw("lastEdited") as string, { date: edited })}
            </span>
          </>
        }
      />
      <BlogEditor
        key={`${post.id}:${selected}`}
        post={post}
        locale={selected}
        uiLocale={locale}
        labels={labels}
        webOrigin={webOrigin}
        recoveredTitle={recoveredTitle}
      />
    </>
  );
}
