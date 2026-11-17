import { getTranslations, setRequestLocale } from "next-intl/server";
import { Register, RegisterNote, RegisterSearch } from "@/components/register/register";
import { LoadFailure } from "@/components/states/load-failure";
import { PageHeader } from "@/components/states/page-header";
import { Pagination } from "@/components/states/pagination";
import { Link } from "@/i18n/navigation";
import { failureOf, isReady } from "@/lib/api/load";
import { navHref } from "@/lib/routing/routes";
import {
  DEFAULT_PAGE_SIZE,
  hrefWith,
  readPage,
  readParam,
} from "@/lib/routing/search-params";
import { loadUsers } from "@/lib/users/data.server";

export const dynamic = "force-dynamic";

export default async function VerificationPage({
  params,
  searchParams,
}: PageProps<"/[locale]/verification">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [t, common] = await Promise.all([
    getTranslations("verification"),
    getTranslations("common"),
  ]);
  const query = await searchParams;
  const q = readParam(query, "q");
  const page = readPage(query);
  const loaded = await loadUsers({ q, page, pageSize: DEFAULT_PAGE_SIZE });
  const failure = failureOf(loaded);
  const path = navHref("verification");
  return (
    <>
      <PageHeader title={t("title")} description={t("description")} />
      {failure ? <LoadFailure failure={failure} /> : null}
      {isReady(loaded) ? (
        <Register
          title={t("people")}
          count={loaded.data.total}
          countLabel={t("count")}
          toolbar={
            <RegisterSearch
              action={`/${locale}${path}`}
              label={t("search")}
              submitLabel={common("search")}
              value={q}
            />
          }
        >
          {loaded.data.items.length === 0 ? (
            <RegisterNote title={t("empty")} description={t("emptyHelp")} />
          ) : (
            <>
              <ul className="divide-y divide-border">
                {loaded.data.items.map((user) => (
                  <li key={user.id} className="px-5 py-3">
                    <Link
                      href={`${path}/${encodeURIComponent(user.id)}`}
                      className="font-semibold text-ink hover:text-primary-ink hover:underline"
                    >
                      {user.displayName ?? common("notSet")}
                    </Link>
                    {user.email ? (
                      <span className="block text-sm text-ink-muted">{user.email}</span>
                    ) : null}
                  </li>
                ))}
              </ul>
              <Pagination
                framed
                state={loaded.data}
                hrefFor={(next) => hrefWith(path, { q, page: next })}
              />
            </>
          )}
        </Register>
      ) : null}
    </>
  );
}
