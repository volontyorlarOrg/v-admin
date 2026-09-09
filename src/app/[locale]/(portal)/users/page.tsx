import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";

import { FilterForm } from "@/components/forms/filter-form";
import { EmptyState } from "@/components/states/empty-state";
import { LoadFailure } from "@/components/states/load-failure";
import { PageHeader } from "@/components/states/page-header";
import { Pagination } from "@/components/states/pagination";
import { buttonClass } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Link } from "@/i18n/navigation";
import { failureOf, isReady } from "@/lib/api/load";
import { navHref, userHref } from "@/lib/routing/routes";
import {
  DEFAULT_PAGE_SIZE,
  hrefWith,
  readPage,
  readParam,
} from "@/lib/routing/search-params";
import { loadUsers } from "@/lib/users/data.server";
import { passwordLoginState } from "@/lib/users/password-state";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/users">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "users" });
  return { title: t("title") };
}

export default async function UsersPage({
  params,
  searchParams,
}: PageProps<"/[locale]/users">) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("users");
  const common = await getTranslations("common");
  const format = await getFormatter();

  const query = await searchParams;
  const q = readParam(query, "q");
  const page = readPage(query);

  const loaded = await loadUsers({ q, page, pageSize: DEFAULT_PAGE_SIZE });
  const failure = failureOf(loaded);
  const listPath = navHref("users");

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
          />

          {loaded.data.items.length === 0 ? (
            <EmptyState
              title={q ? t("noMatches.title") : t("empty.title")}
              description={q ? t("noMatches.description") : t("empty.description")}
            />
          ) : (
            <>
              <div className="rounded-xl border border-border bg-card">
                <Table>
                  <TableCaption className="sr-only">{t("table.caption")}</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead scope="col">{t("table.name")}</TableHead>
                      <TableHead scope="col">{t("table.email")}</TableHead>
                      <TableHead scope="col">{t("table.applications")}</TableHead>
                      <TableHead scope="col">{t("table.passwordLogin")}</TableHead>
                      <TableHead scope="col">{t("table.joined")}</TableHead>
                      <TableHead scope="col">
                        <span className="sr-only">{common("actions")}</span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loaded.data.items.map((user) => {
                      const password = passwordLoginState(user);

                      return (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium text-ink">
                            {user.displayName ?? common("notSet")}
                          </TableCell>
                          <TableCell className="break-all">
                            {user.email ?? common("notSet")}
                          </TableCell>
                          <TableCell className="tabular">
                            {format.number(user._count?.applications ?? 0)}
                          </TableCell>
                          <TableCell>
                            {password.kind === "none"
                              ? t("passwordState.none")
                              : password.changeRequired
                                ? t("passwordState.required")
                                : t("passwordState.set")}
                          </TableCell>
                          <TableCell className="tabular whitespace-nowrap">
                            {format.dateTime(new Date(user.createdAt), "day")}
                          </TableCell>
                          <TableCell className="text-right">
                            <Link
                              href={userHref(user.id)}
                              className={buttonClass({ variant: "ghost", size: "sm" })}
                            >
                              {t("table.open")}
                              <span className="sr-only"> — {user.displayName}</span>
                            </Link>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              <Pagination
                state={loaded.data}
                hrefFor={(next) => hrefWith(listPath, { q, page: next })}
              />
            </>
          )}
        </>
      ) : null}
    </>
  );
}
