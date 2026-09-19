import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";

import { FilterForm, FilterSelect } from "@/components/forms/filter-form";
import { StatusBadge, applicationStatusTone } from "@/components/portal/status-badge";
import { EmptyState } from "@/components/states/empty-state";
import { LoadFailure } from "@/components/states/load-failure";
import { PageHeader } from "@/components/states/page-header";
import { Pagination } from "@/components/states/pagination";
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
import { loadApplications } from "@/lib/applications/data.server";
import {
  searchApplications,
  sortApplications,
  volunteerNameOf,
} from "@/lib/applications/filters";
import { SENT_APPLICATION_STATUSES } from "@/lib/domain/vocabulary";
import { applicationHref, navHref } from "@/lib/routing/routes";
import {
  DEFAULT_PAGE_SIZE,
  hrefWith,
  paginate,
  readOption,
  readPage,
  readParam,
} from "@/lib/routing/search-params";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/applications">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "applications" });
  return { title: t("title") };
}

export default async function ApplicationsPage({
  params,
  searchParams,
}: PageProps<"/[locale]/applications">) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("applications");
  const common = await getTranslations("common");
  const format = await getFormatter();

  const query = await searchParams;
  const q = readParam(query, "q");
  const status = readOption(query, "status", SENT_APPLICATION_STATUSES);
  const page = readPage(query);

  const loaded = await loadApplications(status ? { status } : {});
  const failure = failureOf(loaded);
  const rows = isReady(loaded)
    ? sortApplications(searchApplications(loaded.data, q))
    : [];
  const pageState = paginate(rows, page, DEFAULT_PAGE_SIZE);
  const listPath = navHref("applications");

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
            <FilterSelect id="filter-status" label={t("filters.status")}>
              <NativeSelect
                id="filter-status"
                name="status"
                defaultValue={status ?? ""}
              >
                <NativeSelectOption value="">{t("status.all")}</NativeSelectOption>
                {SENT_APPLICATION_STATUSES.map((value) => (
                  <NativeSelectOption key={value} value={value}>
                    {t(`status.${value}`)}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </FilterSelect>
          </FilterForm>

          {pageState.items.length === 0 ? (
            <EmptyState
              title={
                loaded.data.length === 0 && !q ? t("empty.title") : t("noMatches.title")
              }
              description={
                loaded.data.length === 0 && !q
                  ? t("empty.description")
                  : t("noMatches.description")
              }
            />
          ) : (
            <>
              <div className="rounded-xl border border-border/70 panel-surface">
                <Table>
                  <TableCaption className="sr-only">{t("table.caption")}</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead scope="col">{t("table.volunteer")}</TableHead>
                      <TableHead scope="col">{t("table.vacancy")}</TableHead>
                      <TableHead scope="col">{t("table.status")}</TableHead>
                      <TableHead scope="col">{t("table.submitted")}</TableHead>
                      <TableHead scope="col">
                        <span className="sr-only">{common("actions")}</span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pageState.items.map((application) => (
                      <TableRow key={application.id}>
                        <TableCell className="font-medium text-ink">
                          {volunteerNameOf(application) || common("notSet")}
                        </TableCell>
                        <TableCell>{application.opportunity?.title ?? "—"}</TableCell>
                        <TableCell>
                          <StatusBadge
                            label={t(`status.${application.status}`)}
                            tone={applicationStatusTone(application.status)}
                          />
                        </TableCell>
                        <TableCell className="tabular whitespace-nowrap">
                          {application.submittedAt
                            ? format.dateTime(new Date(application.submittedAt), "day")
                            : "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          <Link
                            href={applicationHref(application.id)}
                            className={buttonClass({ variant: "ghost", size: "sm" })}
                          >
                            {t("table.open")}
                            <span className="sr-only">
                              {" "}
                              — {volunteerNameOf(application)}
                            </span>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <Pagination
                state={pageState}
                hrefFor={(next) => hrefWith(listPath, { q, status, page: next })}
              />
            </>
          )}
        </>
      ) : null}
    </>
  );
}
