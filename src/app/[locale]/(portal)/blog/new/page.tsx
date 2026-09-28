import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { NewBlogForm, type NewBlogLabels } from "@/components/blog/new-blog-form";
import { PageHeader } from "@/components/states/page-header";
import { navHref } from "@/lib/routing/routes";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/blog/new">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "blog" });
  return { title: t("create.pageTitle") };
}

export default async function NewBlogPage({ params }: PageProps<"/[locale]/blog/new">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("blog");
  const create = t.raw("create") as Omit<NewBlogLabels, "names"> & {
    pageTitle: string;
    description: string;
  };
  return (
    <>
      <PageHeader
        title={create.pageTitle}
        description={create.description}
        back={{ href: navHref("blog"), label: t("back") }}
      />
      <NewBlogForm
        uiLocale={locale}
        labels={{
          ...create,
          names: {
            uz: t("languageNames.uz"),
            ru: t("languageNames.ru"),
            en: t("languageNames.en"),
          },
        }}
      />
    </>
  );
}
