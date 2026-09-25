import { ArrowRight } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";

import { AuditTable } from "@/components/audit/audit-table";
import { Register, RegisterNote } from "@/components/register/register";
import { LoadFailure } from "@/components/states/load-failure";
import { PageHeader } from "@/components/states/page-header";
import { Pagination } from "@/components/states/pagination";
import { Button, buttonClass } from "@/components/ui/button";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Link } from "@/i18n/navigation";
import { failureOf, isReady } from "@/lib/api/load";
import { loadAudit } from "@/lib/audit/data.server";
import { actionNames, filterAudit } from "@/lib/audit/filters";
import { getSession } from "@/lib/auth/session.server";
import { auditActionKey } from "@/lib/domain/audit-actions";
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

  const [t, audit, common, session] = await Promise.all([
    getTranslations("activity"),
    getTranslations("audit"),
    getTranslations("common"),
    getSession(),
  ]);

  const query = await searchParams;
  const action = readParam(query, "action");
  const page = readPage(query);

  const loaded = await loadAudit({
    ...(session ? { actorUserId: session.userId } : {}),
    page: 1,
    pageSize: MAX_PAGE_SIZE,
  });
  const failure = failureOf(loaded);
  const all = isReady(loaded)
    ? loaded.data.items.filter((event) => event.actorUserId === session?.userId)
    : [];
  const filtered = filterAudit(all, { action });
  const pageState = paginate(filtered, page, DEFAULT_PAGE_SIZE);
  const listPath = navHref("activity");

  const label = (name: string) => {
    const key = `actions.${auditActionKey(name)}`;
    return audit.has(key) ? audit(key) : name;
  };

  return (
    <>
      <PageHeader
        title={t("title")}
        description={t("description")}
        actions={
          <Link
            href={`${navHref("audit")}?actor=me`}
            className={buttonClass({ variant: "outline", size: "sm" })}
          >
            {t("everything")}
            <ArrowRight aria-hidden="true" />
          </Link>
        }
      />

      {failure ? <LoadFailure failure={failure} /> : null}

      {isReady(loaded) ? (
        <Register
          title={t("listTitle")}
          count={filtered.length}
          countLabel={audit("countLabel")}
          toolbar={
            <form
              method="get"
              action={`/${locale}${listPath}`}
              className="flex w-full flex-wrap items-end gap-3"
            >
              <label className="flex min-w-[14rem] flex-col gap-1.5">
                <span className="text-xs font-semibold text-ink-muted">
                  {t("filters.action")}
                </span>
                <NativeSelect
                  name="action"
                  defaultValue={action}
                  className="min-h-10 rounded-full text-sm"
                >
                  <NativeSelectOption value="">{common("all")}</NativeSelectOption>
                  {actionNames(all).map((name) => (
                    <NativeSelectOption key={name} value={name}>
                      {label(name)}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </label>
              <Button type="submit" size="sm">
                {common("apply")}
              </Button>
              {action ? (
                <Link
                  href={listPath}
                  className={buttonClass({ variant: "ghost", size: "sm" })}
                >
                  {common("reset")}
                </Link>
              ) : null}
            </form>
          }
        >
          {pageState.items.length === 0 ? (
            <RegisterNote
              title={all.length === 0 ? t("empty.title") : t("noMatches.title")}
              description={
                all.length === 0 ? t("empty.description") : t("noMatches.description")
              }
            />
          ) : (
            <>
              <AuditTable
                events={pageState.items}
                caption={t("table.caption")}
                showActor={false}
              />
              <Pagination
                framed
                state={pageState}
                hrefFor={(next) => hrefWith(listPath, { action, page: next })}
              />
            </>
          )}
        </Register>
      ) : null}
    </>
  );
}
