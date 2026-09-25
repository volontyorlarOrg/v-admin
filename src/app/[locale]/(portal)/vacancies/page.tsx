import { Plus } from "lucide-react";
import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";

import { StatusBadge, vacancyStatus } from "@/components/portal/status-badge";
import {
  Register,
  RegisterNote,
  RegisterSearch,
  RegisterTabs,
} from "@/components/register/register";
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
import { loadApplications } from "@/lib/applications/data.server";
import { loadCoordinators } from "@/lib/coordinators/data.server";
import { VACANCY_STATES, type VacancyState } from "@/lib/domain/vocabulary";
import { navHref, vacancyHref } from "@/lib/routing/routes";
import {
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  hrefWith,
  paginate,
  readOption,
  readPage,
  readParam,
} from "@/lib/routing/search-params";
import { vacancyStateOf } from "@/lib/vacancies/approval";
import { loadVacancies } from "@/lib/vacancies/data.server";
import { countByState, filterVacancies } from "@/lib/vacancies/filters";

export const dynamic = "force-dynamic";

const TAB_ORDER: readonly VacancyState[] = [
  "pending_review",
  "changes_requested",
  "draft",
  "approved",
  "rejected",
  "archived",
];

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

  const [t, common, vocabulary, format] = await Promise.all([
    getTranslations("vacancies"),
    getTranslations("common"),
    getTranslations("vocabulary"),
    getFormatter(),
  ]);

  const query = await searchParams;
  const q = readParam(query, "q");
  const state = readOption(query, "state", VACANCY_STATES);
  const page = readPage(query);

  const [loaded, applications, coordinators] = await Promise.all([
    loadVacancies(),
    loadApplications(),
    loadCoordinators({ page: 1, pageSize: MAX_PAGE_SIZE }),
  ]);

  const failure = failureOf(loaded);
  const all = isReady(loaded) ? loaded.data : [];
  const counts = countByState(all);
  const filtered = filterVacancies(all, { q, ...(state ? { state } : {}) });
  const pageState = paginate(filtered, page, DEFAULT_PAGE_SIZE);
  const listPath = navHref("vacancies");

  const coordinatorNames = new Map(
    isReady(coordinators)
      ? coordinators.data.items.map((item) => [
          item.id,
          item.displayName ?? item.email ?? item.id,
        ])
      : [],
  );

  const load = new Map<string, { sent: number; waiting: number }>();
  if (isReady(applications)) {
    for (const application of applications.data) {
      const entry = load.get(application.opportunityId) ?? { sent: 0, waiting: 0 };
      entry.sent += 1;
      if (application.status === "submitted" || application.status === "under_review") {
        entry.waiting += 1;
      }
      load.set(application.opportunityId, entry);
    }
  }

  const tabs = [
    {
      key: "all",
      label: t("state.all"),
      href: hrefWith(listPath, { q }),
      count: all.length,
      active: state === undefined,
    },
    ...TAB_ORDER.map((value) => ({
      key: value,
      label: t(`state.${value}`),
      href: hrefWith(listPath, { q, state: value }),
      count: counts[value],
      active: state === value,
    })),
  ];

  return (
    <>
      <PageHeader
        title={t("title")}
        description={t("description")}
        actions={
          <Link href={navHref("newVacancy")} className={buttonClass({ size: "sm" })}>
            <Plus aria-hidden="true" />
            {t("new")}
          </Link>
        }
      />

      {failure ? <LoadFailure failure={failure} /> : null}

      {isReady(loaded) ? (
        <Register
          title={state ? t(`state.${state}`) : t("listTitle")}
          count={filtered.length}
          countLabel={t("countLabel")}
          toolbar={
            <div className="flex w-full flex-col gap-3">
              <RegisterTabs label={t("filters.state")} items={tabs} />
              <RegisterSearch
                action={`/${locale}${listPath}`}
                label={t("filters.search")}
                submitLabel={common("search")}
                value={q}
                keep={{ state }}
              />
            </div>
          }
        >
          {pageState.items.length === 0 ? (
            <RegisterNote
              title={all.length === 0 ? t("empty.title") : t("noMatches.title")}
              description={
                all.length === 0 ? t("empty.description") : t("noMatches.description")
              }
              {...(all.length === 0
                ? {
                    action: (
                      <Link
                        href={navHref("newVacancy")}
                        className={buttonClass({ size: "sm" })}
                      >
                        {t("new")}
                      </Link>
                    ),
                  }
                : {})}
            />
          ) : (
            <>
              <Table>
                <TableCaption className="sr-only">{t("table.caption")}</TableCaption>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead scope="col">{t("table.title")}</TableHead>
                    <TableHead scope="col">{t("table.state")}</TableHead>
                    <TableHead scope="col">{t("table.applications")}</TableHead>
                    <TableHead scope="col">{t("table.coordinator")}</TableHead>
                    <TableHead scope="col">{t("table.deadline")}</TableHead>
                    <TableHead scope="col">{t("table.starts")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pageState.items.map((vacancy) => {
                    const current = vacancyStateOf(vacancy);
                    const status = vacancyStatus(current);
                    const counted = load.get(vacancy.id);
                    return (
                      <TableRow key={vacancy.id}>
                        <TableCell className="max-w-[22rem]">
                          <Link
                            href={vacancyHref(vacancy.id)}
                            className="font-semibold text-ink hover:text-primary-ink hover:underline"
                          >
                            {vacancy.title}
                          </Link>
                          <span className="mt-0.5 block text-xs text-ink-muted">
                            {[
                              vacancy.organization?.name,
                              vocabulary(`regions.${vacancy.region}`),
                            ]
                              .filter(Boolean)
                              .join(" · ")}
                          </span>
                        </TableCell>
                        <TableCell>
                          <StatusBadge
                            label={t(`state.${current}`)}
                            tone={status.tone}
                            icon={status.icon}
                          />
                        </TableCell>
                        <TableCell className="tabular whitespace-nowrap">
                          {counted ? (
                            <>
                              {format.number(counted.sent)}
                              {counted.waiting > 0 ? (
                                <span className="ml-2 font-semibold text-primary-ink">
                                  {t("table.waiting", { count: counted.waiting })}
                                </span>
                              ) : null}
                            </>
                          ) : (
                            <span className="text-ink-muted">—</span>
                          )}
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
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              <Pagination
                framed
                state={pageState}
                hrefFor={(next) => hrefWith(listPath, { q, state, page: next })}
              />
            </>
          )}
        </Register>
      ) : null}
    </>
  );
}
