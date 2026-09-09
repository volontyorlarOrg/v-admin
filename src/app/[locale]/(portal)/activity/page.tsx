import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";

import { FilterForm, FilterSelect } from "@/components/forms/filter-form";
import { EmptyState } from "@/components/states/empty-state";
import { LoadFailure } from "@/components/states/load-failure";
import { PageHeader } from "@/components/states/page-header";
import { Pagination } from "@/components/states/pagination";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { failureOf, isReady } from "@/lib/api/load";
import { loadAudit } from "@/lib/audit/data.server";
import { actionNames, filterAudit } from "@/lib/audit/filters";
import { getSession } from "@/lib/auth/session.server";
import { navHref } from "@/lib/routing/routes";
import {
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  hrefWith,
  paginate,
  readPage,
  readParam,
} from "@/lib/routing/search-params";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/activity">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "activity" });
  return { title: t("title") };
}

export default async function ActivityPage({
  params,
  searchParams,
}: PageProps<"/[locale]/activity">) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("activity");
  const common = await getTranslations("common");
  const format = await getFormatter();

  const query = await searchParams;
  const q = readParam(query, "q");
  const action = readParam(query, "action");
  const page = readPage(query);

  const session = await getSession();
  const loaded = await loadAudit({
    ...(session ? { actorUserId: session.userId } : {}),
    page: 1,
    pageSize: MAX_PAGE_SIZE,
  });
  const failure = failureOf(loaded);
  const all = isReady(loaded)
    ? loaded.data.items.filter((event) => event.actorUserId === session?.userId)
    : [];
  const filtered = filterAudit(all, { q, action });
  const pageState = paginate(filtered, page, DEFAULT_PAGE_SIZE);
  const listPath = navHref("activity");

  return (
    <>
      <PageHeader title={t("title")} description={t("description")} />

      {failure ? <LoadFailure failure={failure} /> : null}

      {isReady(loaded) ? (
        <>
          <FilterForm
            action={`/${locale}${listPath}`}
            legend={t("filters.legend")}
            searchLabel={t("filters.search")}
            searchValue={q}
            resetHref={listPath}
          >
            <FilterSelect id="filter-action" name="action" label={t("filters.action")}>
              <NativeSelect id="filter-action" name="action" defaultValue={action}>
                <NativeSelectOption value="">{common("all")}</NativeSelectOption>
                {actionNames(all).map((name) => (
                  <NativeSelectOption key={name} value={name}>
                    {name}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </FilterSelect>
          </FilterForm>

          {pageState.items.length === 0 ? (
            <EmptyState
              title={all.length === 0 ? t("empty.title") : t("noMatches.title")}
              description={
                all.length === 0 ? t("empty.description") : t("noMatches.description")
              }
            />
          ) : (
            <>
              <div className="rounded-xl border border-border bg-card">
                <Table>
                  <TableCaption className="sr-only">{t("table.caption")}</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead scope="col">{t("table.action")}</TableHead>
                      <TableHead scope="col">{t("table.entity")}</TableHead>
                      <TableHead scope="col">{t("table.when")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pageState.items.map((event) => (
                      <TableRow key={event.id}>
                        <TableCell className="font-medium text-ink">
                          {event.action}
                        </TableCell>
                        <TableCell className="break-all text-ink-muted">
                          {event.entityType} · {event.entityId}
                        </TableCell>
                        <TableCell className="tabular whitespace-nowrap">
                          {format.dateTime(new Date(event.createdAt), "stamp")}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <Pagination
                state={pageState}
                hrefFor={(next) => hrefWith(listPath, { q, action, page: next })}
              />
            </>
          )}
        </>
      ) : null}
    </>
  );
}
