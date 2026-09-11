import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";

import { Panel } from "@/components/portal/panel";
import { StatusBadge, attendanceTone } from "@/components/portal/status-badge";
import { EmptyState } from "@/components/states/empty-state";
import { LoadFailure } from "@/components/states/load-failure";
import { PageHeader } from "@/components/states/page-header";
import { Pagination } from "@/components/states/pagination";
import { buttonClass } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { failureOf, isReady } from "@/lib/api/load";
import { loadApplications } from "@/lib/applications/data.server";
import { volunteerNameOf } from "@/lib/applications/filters";
import { groupAttendance, unresolvedCount } from "@/lib/attendance/queue";
import { applicationHref, navHref, vacancyHref } from "@/lib/routing/routes";
import { hrefWith, paginate, readPage } from "@/lib/routing/search-params";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 10;

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/attendance">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "attendance" });
  return { title: t("title") };
}

export default async function AttendancePage({
  params,
  searchParams,
}: PageProps<"/[locale]/attendance">) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("attendance");
  const applicationsCopy = await getTranslations("applications");
  const format = await getFormatter();

  const query = await searchParams;
  const page = readPage(query);
  const now = new Date();

  const loaded = await loadApplications({ status: "accepted" });
  const failure = failureOf(loaded);
  const groups = isReady(loaded) ? groupAttendance(loaded.data, now) : [];
  const waiting = groups.filter((group) => group.unresolved.length > 0);
  const pageState = paginate(waiting, page, PAGE_SIZE);

  return (
    <>
      <PageHeader title={t("title")} description={t("description")} />

      {failure ? <LoadFailure failure={failure} /> : null}

      {isReady(loaded) ? (
        pageState.items.length === 0 ? (
          <EmptyState title={t("empty.title")} description={t("empty.description")} />
        ) : (
          <>
            <p role="status" className="text-sm text-ink-muted">
              {t("queue.total", { count: unresolvedCount(waiting) })}
            </p>

            {pageState.items.map((group) => (
              <Panel
                key={group.vacancyId}
                title={group.title}
                description={
                  group.open
                    ? t("queue.waiting", { count: group.unresolved.length })
                    : group.opensAt
                      ? t("queue.opensAt", {
                          when: format.dateTime(group.opensAt, "stamp"),
                        })
                      : t("queue.opensUnknown")
                }
                actions={
                  <Link
                    href={vacancyHref(group.vacancyId)}
                    className={buttonClass({ size: "sm" })}
                  >
                    {t("queue.open")}
                  </Link>
                }
              >
                <ul className="flex flex-col divide-y divide-border">
                  {group.unresolved.map((application) => (
                    <li
                      key={application.id}
                      className="flex items-center justify-between gap-4 py-3"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium text-ink">
                          {volunteerNameOf(application) || application.volunteerId}
                        </span>
                        <StatusBadge
                          label={
                            application.attendance
                              ? t(`outcome.${application.attendance.outcome}`)
                              : t("outcome.unknown")
                          }
                          tone={attendanceTone(
                            application.attendance?.outcome ?? "awaiting_confirmation",
                          )}
                        />
                      </span>
                      <Link
                        href={applicationHref(application.id)}
                        className={buttonClass({ variant: "ghost", size: "sm" })}
                      >
                        {applicationsCopy("table.open")}
                      </Link>
                    </li>
                  ))}
                </ul>

                {group.resolved.length > 0 ? (
                  <p className="mt-4 text-sm text-ink-muted">
                    {t("queue.resolvedCount", { count: group.resolved.length })}
                  </p>
                ) : null}
              </Panel>
            ))}

            <Pagination
              state={pageState}
              hrefFor={(next) => hrefWith(navHref("attendance"), { page: next })}
            />
          </>
        )
      ) : null}
    </>
  );
}
