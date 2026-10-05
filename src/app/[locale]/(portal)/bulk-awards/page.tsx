import { randomUUID } from "node:crypto";
import type { Metadata } from "next";
import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";

import { AwardComposer } from "@/components/bulk-awards/award-composer";
import { VolunteerSearch } from "@/components/bulk-awards/volunteer-search";
import { Register, RegisterNote } from "@/components/register/register";
import { LoadFailure } from "@/components/states/load-failure";
import { PageHeader } from "@/components/states/page-header";
import { Pagination } from "@/components/states/pagination";
import { Badge } from "@/components/ui/badge";
import { Link } from "@/i18n/navigation";
import { failureOf, isReady } from "@/lib/api/load";
import { loadAwardVolunteers, loadBulkAwards } from "@/lib/bulk-awards/data.server";
import type { ComposerLabels } from "@/lib/bulk-awards/labels";
import { navHref } from "@/lib/routing/routes";
import { hrefWith, readPage, readParam } from "@/lib/routing/search-params";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/bulk-awards">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "bulkAwards" });
  return { title: t("title") };
}

export default async function BulkAwardsPage({
  params,
  searchParams,
}: PageProps<"/[locale]/bulk-awards">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const query = await searchParams;
  const q = readParam(query, "q");
  const page = readPage(query);
  const historyPage = readPage({ page: readParam(query, "history") });
  const listPath = navHref("bulkAwards");

  const [t, common, format, volunteers, history] = await Promise.all([
    getTranslations("bulkAwards"),
    getTranslations("common"),
    getFormatter(),
    loadAwardVolunteers(q, page),
    loadBulkAwards(historyPage),
  ]);
  const labels = {
    ...(t.raw("composer") as Omit<ComposerLabels, "errors">),
    errors: t.raw("errors") as Record<string, string>,
  } satisfies ComposerLabels;
  const amounts = (xp: number, hours: number) =>
    [
      xp > 0 ? t("xpAmount", { value: xp }) : null,
      hours > 0 ? t("hoursAmount", { value: hours }) : null,
    ]
      .filter(Boolean)
      .join(" · ");
  const failure = failureOf(volunteers);
  const historyFailure = failureOf(history);

  return (
    <>
      <PageHeader title={t("title")} description={t("description")} />

      {failure ? <LoadFailure failure={failure} /> : null}
      {isReady(volunteers) ? (
        <AwardComposer
          volunteers={volunteers.data}
          q={q}
          submissionId={randomUUID()}
          labels={labels}
          locale={locale}
          search={
            <VolunteerSearch
              action={`/${locale}${listPath}`}
              label={t("search")}
              submitLabel={common("search")}
              value={q}
            />
          }
          pagination={
            <Pagination
              framed
              state={volunteers.data}
              hrefFor={(next) => hrefWith(listPath, { q, page: next })}
            />
          }
        />
      ) : null}

      {historyFailure ? <LoadFailure failure={historyFailure} /> : null}
      {isReady(history) ? (
        <Register
          id="award-history"
          title={t("history.title")}
          count={history.data.total}
          countLabel={t("history.countLabel")}
        >
          {history.data.items.length ? (
            <ul className="divide-y divide-border">
              {history.data.items.map((award) => (
                <li key={award.id}>
                  <Link
                    href={`${listPath}/${award.id}`}
                    className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-5 py-4 transition-colors hover:bg-surface-soft"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-ink">
                        {award.reason}
                      </span>
                      <span className="mt-1 block text-xs text-ink-muted">
                        {t("history.meta", {
                          recipients: award.recipients,
                          by: award.createdBy?.displayName ?? t("unknownPerson"),
                          date: format.dateTime(new Date(award.createdAt), "day"),
                        })}
                      </span>
                    </span>
                    <span className="flex shrink-0 items-center gap-2">
                      {award.revokedAt ? (
                        <Badge variant="neutral">{t("history.revoked")}</Badge>
                      ) : null}
                      <span
                        className={
                          award.revokedAt
                            ? "tabular text-sm text-ink-muted line-through"
                            : "tabular text-sm font-semibold text-ink"
                        }
                      >
                        {amounts(award.xp, award.hours)}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <RegisterNote
              title={t("history.emptyTitle")}
              description={t("history.emptyDescription")}
            />
          )}
          <Pagination
            framed
            state={history.data}
            hrefFor={(next) => hrefWith(listPath, { q, page, history: next })}
          />
        </Register>
      ) : null}
    </>
  );
}
