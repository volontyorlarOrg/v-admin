import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";

import { Avatar } from "@/components/portal/avatar";
import {
  StatusBadge,
  applicationStatus,
  attendanceStatus,
} from "@/components/portal/status-badge";
import { InlineDecision } from "@/components/register/inline-decision";
import {
  Register,
  RegisterNote,
  RegisterSearch,
  RegisterTabs,
} from "@/components/register/register";
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
import { reviewApplicationAction } from "@/lib/applications/actions";
import { loadApplications } from "@/lib/applications/data.server";
import {
  APPLICATION_VIEWS,
  applicationsInView,
  countByView,
  searchApplications,
  sortApplications,
  volunteerNameOf,
} from "@/lib/applications/filters";
import { applicationDecisions, decisionLabels } from "@/lib/queue/decisions.server";
import { applicationHref, navHref, vacancyHref } from "@/lib/routing/routes";
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

  const [t, attendance, common, format] = await Promise.all([
    getTranslations("applications"),
    getTranslations("attendance"),
    getTranslations("common"),
    getFormatter(),
  ]);

  const query = await searchParams;
  const q = readParam(query, "q");
  const view = readOption(query, "view", APPLICATION_VIEWS) ?? "all";
  const page = readPage(query);

  const loaded = await loadApplications();
  const failure = failureOf(loaded);
  const all = isReady(loaded) ? loaded.data : [];
  const counts = countByView(all);
  const rows = sortApplications(searchApplications(applicationsInView(all, view), q));
  const pageState = paginate(rows, page, DEFAULT_PAGE_SIZE);
  const listPath = navHref("applications");

  const [labels, options] = await Promise.all([
    decisionLabels(),
    applicationDecisions(),
  ]);

  const tabs = APPLICATION_VIEWS.map((value) => ({
    key: value,
    label: t(`views.${value}`),
    href: hrefWith(listPath, { q, view: value === "all" ? undefined : value }),
    count: counts[value],
    active: view === value,
  }));

  return (
    <>
      <PageHeader title={t("title")} description={t("description")} />

      {failure ? <LoadFailure failure={failure} /> : null}

      {isReady(loaded) ? (
        <Register
          title={view === "all" ? t("listTitle") : t(`views.${view}`)}
          count={rows.length}
          countLabel={t("countLabel")}
          toolbar={
            <div className="flex w-full flex-col gap-3">
              <RegisterTabs label={t("filters.status")} items={tabs} />
              <RegisterSearch
                action={`/${locale}${listPath}`}
                label={t("filters.search")}
                submitLabel={common("search")}
                value={q}
                keep={{ view: view === "all" ? undefined : view }}
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
                  {pageState.items.map((application) => {
                    const name = volunteerNameOf(application) || common("notSet");
                    const chip = applicationStatus(application.status);
                    const outcome = application.attendance?.outcome;
                    const outcomeChip = outcome ? attendanceStatus(outcome) : null;
                    const waiting =
                      application.status === "submitted" ||
                      application.status === "under_review";
                    return (
                      <TableRow key={application.id}>
                        <TableCell>
                          <span className="flex min-w-[12rem] items-center gap-3">
                            <Avatar
                              name={name}
                              src={application.volunteer?.avatarUrl}
                              size="sm"
                              person
                            />
                            <span className="min-w-0">
                              <Link
                                href={applicationHref(application.id)}
                                className="block font-semibold text-ink hover:text-primary-ink hover:underline"
                              >
                                {name}
                              </Link>
                              {application.volunteer?.username ? (
                                <span className="block text-xs text-ink-muted">
                                  @{application.volunteer.username}
                                </span>
                              ) : null}
                            </span>
                          </span>
                        </TableCell>
                        <TableCell className="max-w-[16rem]">
                          {application.opportunity ? (
                            <Link
                              href={vacancyHref(application.opportunity.id)}
                              className="text-ink hover:text-primary-ink hover:underline"
                            >
                              {application.opportunity.title}
                            </Link>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="flex flex-wrap gap-1.5">
                            <StatusBadge
                              label={t(`status.${application.status}`)}
                              tone={chip.tone}
                              icon={chip.icon}
                            />
                            {outcome && outcomeChip ? (
                              <StatusBadge
                                label={attendance(`outcome.${outcome}`)}
                                tone={outcomeChip.tone}
                                icon={outcomeChip.icon}
                              />
                            ) : null}
                          </span>
                        </TableCell>
                        <TableCell className="tabular whitespace-nowrap text-ink-muted">
                          {application.submittedAt
                            ? format.dateTime(new Date(application.submittedAt), "day")
                            : "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          {waiting ? (
                            <InlineDecision
                              action={reviewApplicationAction}
                              hidden={{ id: application.id }}
                              subject={name}
                              labels={labels}
                              options={options({ name, status: application.status })}
                              className="justify-end lg:flex-nowrap"
                              expandClassName="mt-2 text-left"
                            />
                          ) : null}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              <Pagination
                framed
                state={pageState}
                hrefFor={(next) =>
                  hrefWith(listPath, {
                    q,
                    view: view === "all" ? undefined : view,
                    page: next,
                  })
                }
              />
            </>
          )}
        </Register>
      ) : null}
    </>
  );
}
