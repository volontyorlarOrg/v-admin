import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";

import { FilterForm, FilterSelect } from "@/components/forms/filter-form";
import { StatusBadge, coordinatorStatusTone } from "@/components/portal/status-badge";
import { EmptyState } from "@/components/states/empty-state";
import { LoadFailure } from "@/components/states/load-failure";
import { PageHeader } from "@/components/states/page-header";
import { Pagination } from "@/components/states/pagination";
import { StatePanel } from "@/components/states/state-panel";
import { buttonClass } from "@/components/ui/button";
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
import { Link } from "@/i18n/navigation";
import { failureOf, isReady } from "@/lib/api/load";
import { loadCoordinators } from "@/lib/coordinators/data.server";
import { byStatus, statusOf } from "@/lib/coordinators/status";
import { COORDINATOR_STATUSES } from "@/lib/domain/vocabulary";
import { coordinatorHref, navHref } from "@/lib/routing/routes";
import {
  DEFAULT_PAGE_SIZE,
  hrefWith,
  readOption,
  readPage,
  readParam,
} from "@/lib/routing/search-params";
import { passwordLoginState } from "@/lib/users/password-state";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/coordinators">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "coordinators" });
  return { title: t("title") };
}

export default async function CoordinatorsPage({
  params,
  searchParams,
}: PageProps<"/[locale]/coordinators">) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("coordinators");
  const users = await getTranslations("users");
  const common = await getTranslations("common");
  const format = await getFormatter();

  const query = await searchParams;
  const q = readParam(query, "q");
  const status = readOption(query, "status", COORDINATOR_STATUSES);
  const page = readPage(query);

  const loaded = await loadCoordinators({ q, page, pageSize: DEFAULT_PAGE_SIZE });
  const failure = failureOf(loaded);
  const rows = isReady(loaded) ? byStatus(loaded.data.items, status) : [];
  const listPath = navHref("coordinators");

  return (
    <>
      <PageHeader
        title={t("title")}
        description={t("description")}
        actions={
          <Link
            href={navHref("newCoordinator")}
            className={buttonClass({ size: "sm" })}
          >
            {t("new")}
          </Link>
        }
      />

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
            <FilterSelect id="filter-status" label={t("filters.status")}>
              <NativeSelect
                id="filter-status"
                name="status"
                defaultValue={status ?? ""}
              >
                <NativeSelectOption value="">{t("status.all")}</NativeSelectOption>
                {COORDINATOR_STATUSES.map((value) => (
                  <NativeSelectOption key={value} value={value}>
                    {t(`status.${value}`)}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </FilterSelect>
          </FilterForm>

          {rows.length === 0 ? (
            <EmptyState
              title={
                loaded.data.items.length === 0 ? t("empty.title") : t("noMatches.title")
              }
              description={
                loaded.data.items.length === 0
                  ? t("empty.description")
                  : t("noMatches.description")
              }
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
                      <TableHead scope="col">{t("table.status")}</TableHead>
                      <TableHead scope="col">{t("table.vacancies")}</TableHead>
                      <TableHead scope="col">{t("table.passwordLogin")}</TableHead>
                      <TableHead scope="col">
                        <span className="sr-only">{common("actions")}</span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((coordinator) => {
                      const state = statusOf(coordinator);
                      const password = passwordLoginState(coordinator);

                      return (
                        <TableRow key={coordinator.id}>
                          <TableCell className="font-medium text-ink">
                            {coordinator.displayName ?? common("notSet")}
                          </TableCell>
                          <TableCell className="break-all">
                            {coordinator.email ?? common("notSet")}
                          </TableCell>
                          <TableCell>
                            <StatusBadge
                              label={t(`status.${state}`)}
                              tone={coordinatorStatusTone(state)}
                            />
                          </TableCell>
                          <TableCell className="tabular">
                            {format.number(
                              coordinator._count?.createdOpportunities ?? 0,
                            )}
                          </TableCell>
                          <TableCell>
                            {password.kind === "none"
                              ? users("passwordState.none")
                              : password.changeRequired
                                ? users("passwordState.required")
                                : users("passwordState.set")}
                          </TableCell>
                          <TableCell className="text-right">
                            <Link
                              href={coordinatorHref(coordinator.id)}
                              className={buttonClass({ variant: "ghost", size: "sm" })}
                            >
                              {t("table.open")}
                              <span className="sr-only">
                                {" "}
                                — {coordinator.displayName}
                              </span>
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
                hrefFor={(next) => hrefWith(listPath, { q, status, page: next })}
              />
            </>
          )}

          <StatePanel role="status" title={t("adminNotice")} />
        </>
      ) : null}
    </>
  );
}
