import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";

import { FilterForm, FilterSelect } from "@/components/forms/filter-form";
import { StatusBadge, vacancyStateTone } from "@/components/portal/status-badge";
import { EmptyState } from "@/components/states/empty-state";
import { LoadFailure } from "@/components/states/load-failure";
import { PageHeader } from "@/components/states/page-header";
import { Pagination } from "@/components/states/pagination";
import { VacancyDialog } from "@/components/vacancies/vacancy-dialog";
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
import { REGIONS, VACANCY_FORMATS, VACANCY_STATES } from "@/lib/domain/vocabulary";
import { navHref, vacancyHref } from "@/lib/routing/routes";
import { MAX_PAGE_SIZE } from "@/lib/routing/search-params";
import {
  DEFAULT_PAGE_SIZE,
  hrefWith,
  paginate,
  readOption,
  readPage,
  readParam,
} from "@/lib/routing/search-params";
import { createVacancyAction } from "@/lib/vacancies/actions";
import { vacancyStateOf } from "@/lib/vacancies/approval";
import { loadOrganizations, loadVacancies } from "@/lib/vacancies/data.server";
import { filterVacancies } from "@/lib/vacancies/filters";
import { vacancyDialogLabels } from "@/lib/vacancies/labels.server";

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
  const state = readOption(query, "state", VACANCY_STATES);
  const page = readPage(query);

  const [loaded, organizations, coordinators] = await Promise.all([
    loadVacancies(),
    loadOrganizations(),
    loadCoordinators({ page: 1, pageSize: MAX_PAGE_SIZE }),
  ]);

  const failure = failureOf(loaded);
  const all = isReady(loaded) ? loaded.data : [];
  const filtered = isReady(loaded) ? filterVacancies(loaded.data, { q, state }) : [];
  const pageState = paginate(filtered, page, DEFAULT_PAGE_SIZE);
  const listPath = navHref("vacancies");

  const waiting = all.filter(
    (vacancy) => vacancyStateOf(vacancy) === "pending_review",
  ).length;

  const coordinatorNames = new Map(
    isReady(coordinators)
      ? coordinators.data.items.map((item) => [
          item.id,
          item.displayName ?? item.email ?? item.id,
        ])
      : [],
  );

  const createLabels = await vacancyDialogLabels("create");

  return (
    <>
      <PageHeader
        title={t("title")}
        description={t("description")}
        actions={
          <VacancyDialog
            action={createVacancyAction}
            labels={createLabels}
            defaults={{}}
            organizations={
              isReady(organizations)
                ? organizations.data.map((organization) => ({
                    id: organization.id,
                    name: organization.name,
                    verified: organization.verified,
                  }))
                : []
            }
            regions={REGIONS}
            formats={VACANCY_FORMATS}
            triggerLabel={t("new")}
            triggerHref={`/${locale}${navHref("newVacancy")}`}
          />
        }
      />

      {failure ? <LoadFailure failure={failure} /> : null}

      {isReady(loaded) ? (
        <>
          {waiting > 0 && state !== "pending_review" ? (
            <Link
              href={hrefWith(listPath, { state: "pending_review" })}
              className="flex items-center justify-between gap-4 rounded-xl border border-primary-muted bg-surface-soft px-5 py-4 text-sm font-medium text-ink transition-colors hover:border-primary-ink"
            >
              <span>{t("decide.queue")}</span>
              <span className="tabular text-section font-semibold text-primary-ink">
                {format.number(waiting)}
              </span>
            </Link>
          ) : null}

          <FilterForm
            action={`/${locale}${listPath}`}
            legend={t("filters.legend")}
            searchLabel={t("filters.search")}
            searchValue={q}
            resetHref={listPath}
          >
            <FilterSelect id="filter-state" label={t("filters.state")}>
              <NativeSelect id="filter-state" name="state" defaultValue={state ?? ""}>
                <NativeSelectOption value="">{t("state.all")}</NativeSelectOption>
                {VACANCY_STATES.map((value) => (
                  <NativeSelectOption key={value} value={value}>
                    {t(`state.${value}`)}
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
              <div className="rounded-xl border border-border/70 panel-surface">
                <Table>
                  <TableCaption className="sr-only">{t("table.caption")}</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead scope="col">{t("table.title")}</TableHead>
                      <TableHead scope="col">{t("table.state")}</TableHead>
                      <TableHead scope="col">{t("table.coordinator")}</TableHead>
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
                            label={t(`state.${vacancyStateOf(vacancy)}`)}
                            tone={vacancyStateTone(vacancyStateOf(vacancy))}
                          />
                        </TableCell>
                        <TableCell className="text-ink-muted">
                          {(vacancy.createdById
                            ? coordinatorNames.get(vacancy.createdById)
                            : undefined) ?? common("notSet")}
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
                hrefFor={(next) => hrefWith(listPath, { q, state, page: next })}
              />
            </>
          )}
        </>
      ) : null}
    </>
  );
}
