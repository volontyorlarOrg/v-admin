import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";

import { FilterForm, FilterSelect } from "@/components/forms/filter-form";
import { StatusBadge, vacancyStageTone } from "@/components/portal/status-badge";
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
import { VACANCY_STAGES, stageOf } from "@/lib/domain/vocabulary";
import { navHref, vacancyHref } from "@/lib/routing/routes";
import {
  DEFAULT_PAGE_SIZE,
  hrefWith,
  paginate,
  readOption,
  readPage,
  readParam,
} from "@/lib/routing/search-params";
import { loadVacancies } from "@/lib/vacancies/data.server";
import { filterVacancies } from "@/lib/vacancies/filters";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/vacancies">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "vacancies" });
  return { title: t("title") };
}

export default async function VacanciesPage({
  params,
  searchParams,
}: PageProps<"/[locale]/vacancies">) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("vacancies");
  const common = await getTranslations("common");
  const format = await getFormatter();

  const query = await searchParams;
  const q = readParam(query, "q");
  const stage = readOption(query, "stage", VACANCY_STAGES);
  const page = readPage(query);

  const loaded = await loadVacancies();
  const failure = failureOf(loaded);
  const filtered = isReady(loaded) ? filterVacancies(loaded.data, { q, stage }) : [];
  const pageState = paginate(filtered, page, DEFAULT_PAGE_SIZE);
  const listPath = navHref("vacancies");

  return (
    <>
      <PageHeader
        title={t("title")}
        description={t("description")}
        actions={
          <Link href={navHref("newVacancy")} className={buttonClass({ size: "sm" })}>
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
            <FilterSelect id="filter-stage" name="stage" label={t("filters.stage")}>
              <NativeSelect id="filter-stage" name="stage" defaultValue={stage ?? ""}>
                <NativeSelectOption value="">{t("stage.all")}</NativeSelectOption>
                {VACANCY_STAGES.map((value) => (
                  <NativeSelectOption key={value} value={value}>
                    {t(`stage.${value}`)}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </FilterSelect>
          </FilterForm>

          {pageState.items.length === 0 ? (
            <EmptyState
              title={loaded.data.length === 0 ? t("empty.title") : t("noMatches.title")}
              description={
                loaded.data.length === 0
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
                      <TableHead scope="col">{t("table.title")}</TableHead>
                      <TableHead scope="col">{t("table.stage")}</TableHead>
                      <TableHead scope="col">{t("table.deadline")}</TableHead>
                      <TableHead scope="col">{t("table.starts")}</TableHead>
                      <TableHead scope="col">
                        <span className="sr-only">{common("actions")}</span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pageState.items.map((vacancy) => (
                      <TableRow key={vacancy.id}>
                        <TableCell>
                          <span className="font-medium text-ink">{vacancy.title}</span>
                          <span className="mt-0.5 block text-xs text-ink-muted">
                            {vacancy.organization?.name ?? vacancy.slug}
                          </span>
                        </TableCell>
                        <TableCell>
                          <StatusBadge
                            label={t(`stage.${stageOf(vacancy)}`)}
                            tone={vacancyStageTone(stageOf(vacancy))}
                          />
                        </TableCell>
                        <TableCell className="tabular whitespace-nowrap">
                          {format.dateTime(
                            new Date(vacancy.applicationDeadline),
                            "day",
                          )}
                        </TableCell>
                        <TableCell className="tabular whitespace-nowrap">
                          {format.dateTime(new Date(vacancy.startsAt), "day")}
                        </TableCell>
                        <TableCell className="text-right">
                          <Link
                            href={vacancyHref(vacancy.id)}
                            className={buttonClass({ variant: "ghost", size: "sm" })}
                          >
                            {t("table.open")}
                            <span className="sr-only"> — {vacancy.title}</span>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <Pagination
                state={pageState}
                hrefFor={(next) => hrefWith(listPath, { q, stage, page: next })}
              />
            </>
          )}
        </>
      ) : null}
    </>
  );
}
