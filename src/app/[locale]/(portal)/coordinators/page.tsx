import { ShieldCheck, UserPlus } from "lucide-react";
import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";

import { Avatar } from "@/components/portal/avatar";
import { StatusBadge, coordinatorStatus } from "@/components/portal/status-badge";
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
import { loadCoordinators } from "@/lib/coordinators/data.server";
import { byStatus, countByStatus, statusOf } from "@/lib/coordinators/status";
import { COORDINATOR_STATUSES } from "@/lib/domain/vocabulary";
import { coordinatorHref, navHref } from "@/lib/routing/routes";
import {
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  hrefWith,
  paginate,
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

  const [t, users, common, format] = await Promise.all([
    getTranslations("coordinators"),
    getTranslations("users"),
    getTranslations("common"),
    getFormatter(),
  ]);

  const query = await searchParams;
  const q = readParam(query, "q");
  const status = readOption(query, "status", COORDINATOR_STATUSES);
  const page = readPage(query);

  const loaded = await loadCoordinators({ q, page: 1, pageSize: MAX_PAGE_SIZE });
  const failure = failureOf(loaded);
  const all = isReady(loaded) ? loaded.data.items : [];
  const counts = countByStatus(all);
  const rows = byStatus(all, status);
  const pageState = paginate(rows, page, DEFAULT_PAGE_SIZE);
  const listPath = navHref("coordinators");

  const tabs = [
    {
      key: "all",
      label: t("status.all"),
      href: hrefWith(listPath, { q }),
      count: all.length,
      active: status === undefined,
    },
    ...COORDINATOR_STATUSES.map((value) => ({
      key: value,
      label: t(`status.${value}`),
      href: hrefWith(listPath, { q, status: value }),
      count: counts[value],
      active: status === value,
    })),
  ];

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
            <UserPlus aria-hidden="true" />
            {t("new")}
          </Link>
        }
      />

      {failure ? <LoadFailure failure={failure} /> : null}

      {isReady(loaded) ? (
        <Register
          title={t("summary")}
          count={rows.length}
          countLabel={t("countLabel")}
          description={
            <span className="flex items-start gap-2">
              <ShieldCheck
                aria-hidden="true"
                className="mt-0.5 size-4 shrink-0 text-primary-ink"
              />
              {t("adminNotice")}
            </span>
          }
          toolbar={
            <div className="flex w-full flex-col gap-3">
              <RegisterTabs label={t("filters.status")} items={tabs} />
              <RegisterSearch
                action={`/${locale}${listPath}`}
                label={t("filters.search")}
                submitLabel={common("search")}
                value={q}
                keep={{ status }}
              />
            </div>
          }
        >
          {pageState.items.length === 0 ? (
            <RegisterNote
              title={all.length === 0 && !q ? t("empty.title") : t("noMatches.title")}
              description={
                all.length === 0 && !q
                  ? t("empty.description")
                  : t("noMatches.description")
              }
            />
          ) : (
            <>
              <Table>
                <TableCaption className="sr-only">{t("table.caption")}</TableCaption>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead scope="col">{t("table.name")}</TableHead>
                    <TableHead scope="col">{t("table.status")}</TableHead>
                    <TableHead scope="col">{t("table.vacancies")}</TableHead>
                    <TableHead scope="col">{t("table.passwordLogin")}</TableHead>
                    <TableHead scope="col">{t("table.created")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pageState.items.map((coordinator) => {
                    const state = statusOf(coordinator);
                    const chip = coordinatorStatus(state);
                    const password = passwordLoginState(coordinator);
                    return (
                      <TableRow key={coordinator.id}>
                        <TableCell>
                          <span className="flex min-w-[14rem] items-center gap-3">
                            <Avatar name={coordinator.displayName} size="sm" />
                            <span className="min-w-0">
                              <Link
                                href={coordinatorHref(coordinator.id)}
                                className="block font-semibold text-ink hover:text-primary-ink hover:underline"
                              >
                                {coordinator.displayName ?? common("notSet")}
                              </Link>
                              <span className="block truncate text-xs text-ink-muted">
                                {coordinator.email ?? common("notSet")}
                              </span>
                            </span>
                          </span>
                        </TableCell>
                        <TableCell>
                          <StatusBadge
                            label={t(`status.${state}`)}
                            tone={chip.tone}
                            icon={chip.icon}
                          />
                        </TableCell>
                        <TableCell className="tabular">
                          {format.number(coordinator._count?.createdOpportunities ?? 0)}
                        </TableCell>
                        <TableCell className="text-ink-muted">
                          {password.kind === "none"
                            ? users("passwordState.none")
                            : password.changeRequired
                              ? users("passwordState.required")
                              : users("passwordState.set")}
                        </TableCell>
                        <TableCell className="tabular whitespace-nowrap text-ink-muted">
                          {format.dateTime(new Date(coordinator.createdAt), "day")}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              <Pagination
                framed
                state={pageState}
                hrefFor={(next) => hrefWith(listPath, { q, status, page: next })}
              />
            </>
          )}
        </Register>
      ) : null}
    </>
  );
}
