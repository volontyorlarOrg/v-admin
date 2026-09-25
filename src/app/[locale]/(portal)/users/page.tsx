import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";

import { Avatar } from "@/components/portal/avatar";
import { Register, RegisterNote, RegisterSearch } from "@/components/register/register";
import { LoadFailure } from "@/components/states/load-failure";
import { PageHeader } from "@/components/states/page-header";
import { Pagination } from "@/components/states/pagination";
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

  const [t, common, format] = await Promise.all([
    getTranslations("users"),
    getTranslations("common"),
    getFormatter(),
  ]);

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
        <Register
          title={q ? t("found") : t("listTitle")}
          count={loaded.data.total}
          countLabel={t("countLabel")}
          toolbar={
            <RegisterSearch
              action={`/${locale}${listPath}`}
              label={t("filters.search")}
              submitLabel={common("search")}
              value={q}
            />
          }
        >
          {loaded.data.items.length === 0 ? (
            <RegisterNote
              title={q ? t("noMatches.title") : t("empty.title")}
              description={q ? t("noMatches.description") : t("empty.description")}
            />
          ) : (
            <>
              <Table>
                <TableCaption className="sr-only">{t("table.caption")}</TableCaption>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead scope="col">{t("table.name")}</TableHead>
                    <TableHead scope="col">{t("table.applications")}</TableHead>
                    <TableHead scope="col">{t("table.accepted")}</TableHead>
                    <TableHead scope="col">{t("table.passwordLogin")}</TableHead>
                    <TableHead scope="col">{t("table.joined")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loaded.data.items.map((user) => {
                    const password = passwordLoginState(user);
                    return (
                      <TableRow key={user.id}>
                        <TableCell>
                          <span className="flex min-w-[14rem] items-center gap-3">
                            <Avatar name={user.displayName} size="sm" person />
                            <span className="min-w-0">
                              <Link
                                href={userHref(user.id)}
                                className="block font-semibold text-ink hover:text-primary-ink hover:underline"
                              >
                                {user.displayName ?? common("notSet")}
                              </Link>
                              <span className="block truncate text-xs text-ink-muted">
                                {user.email ?? t("noEmail")}
                              </span>
                            </span>
                          </span>
                        </TableCell>
                        <TableCell className="tabular">
                          {format.number(user._count?.applications ?? 0)}
                        </TableCell>
                        <TableCell className="tabular">
                          {format.number(user._count?.attendanceRecords ?? 0)}
                        </TableCell>
                        <TableCell className="text-ink-muted">
                          {password.kind === "none"
                            ? t("passwordState.none")
                            : password.changeRequired
                              ? t("passwordState.required")
                              : t("passwordState.set")}
                        </TableCell>
                        <TableCell className="tabular whitespace-nowrap text-ink-muted">
                          {format.dateTime(new Date(user.createdAt), "day")}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              <Pagination
                framed
                state={loaded.data}
                hrefFor={(next) => hrefWith(listPath, { q, page: next })}
              />
            </>
          )}
        </Register>
      ) : null}
    </>
  );
}
