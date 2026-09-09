import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";

import { ResolveAttendanceForm } from "@/components/attendance/resolve-form";
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
import {
  acceptedApplications,
  sortApplications,
  unresolvedFirst,
  volunteerNameOf,
} from "@/lib/applications/filters";
import { RESOLVABLE_ATTENDANCE_OUTCOMES } from "@/lib/domain/vocabulary";
import { applicationHref, navHref } from "@/lib/routing/routes";
import { hrefWith, paginate, readPage } from "@/lib/routing/search-params";
import { errorCatalog } from "@/lib/vacancies/labels.server";

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
  const errors = await getTranslations("errors");
  const format = await getFormatter();

  const query = await searchParams;
  const page = readPage(query);

  const loaded = await loadApplications({ status: "accepted" });
  const failure = failureOf(loaded);
  const rows = isReady(loaded)
    ? unresolvedFirst(sortApplications(acceptedApplications(loaded.data)))
    : [];
  const pageState = paginate(rows, page, PAGE_SIZE);

  const catalog = await errorCatalog([
    "server",
    "network",
    "timeout",
    "rateLimited",
    "unavailable",
    "forbidden",
    "notFound",
    "conflict",
    "validationFailed",
    "awaitingContract",
    "sessionExpired",
    "required",
    "hours",
    "confirmedHoursRequired",
    "attendanceNotFound",
    "attendanceOutcomeNotResolved",
    "adminWorkflowsDisabled",
  ]);

  const outcomeLabels = Object.fromEntries(
    RESOLVABLE_ATTENDANCE_OUTCOMES.map((outcome) => [outcome, t(`outcome.${outcome}`)]),
  );

  return (
    <>
      <PageHeader title={t("title")} description={t("description")} />

      {failure ? <LoadFailure failure={failure} /> : null}

      {isReady(loaded) ? (
        pageState.items.length === 0 ? (
          <EmptyState title={t("empty.title")} description={t("empty.description")} />
        ) : (
          <>
            {pageState.items.map((application) => (
              <Panel
                key={application.id}
                title={volunteerNameOf(application) || application.volunteerId}
                description={application.opportunity?.title}
                actions={
                  <Link
                    href={applicationHref(application.id)}
                    className={buttonClass({ variant: "ghost", size: "sm" })}
                  >
                    {applicationsCopy("table.open")}
                  </Link>
                }
              >
                <div className="mb-4 flex flex-wrap items-center gap-3">
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
                  {application.attendance?.resolvedAt ? (
                    <span className="tabular text-sm text-ink-muted">
                      {t("resolved", {
                        when: format.dateTime(
                          new Date(application.attendance.resolvedAt),
                          "date",
                        ),
                      })}
                    </span>
                  ) : application.submittedAt ? (
                    <span className="tabular text-sm text-ink-muted">
                      {format.dateTime(new Date(application.submittedAt), "date")}
                    </span>
                  ) : null}
                  {application.attendance?.confirmedHours === undefined ? null : (
                    <span className="tabular text-sm text-ink-muted">
                      {t("table.hours")}:{" "}
                      {format.number(application.attendance.confirmedHours)}
                    </span>
                  )}
                </div>

                <ResolveAttendanceForm
                  applicationId={application.id}
                  outcomes={RESOLVABLE_ATTENDANCE_OUTCOMES}
                  {...(application.attendance?.outcome
                    ? { currentOutcome: application.attendance.outcome }
                    : {})}
                  {...(application.attendance?.confirmedHours === undefined
                    ? {}
                    : { currentHours: String(application.attendance.confirmedHours) })}
                  labels={{
                    outcome: t("resolve.outcome"),
                    outcomes: outcomeLabels,
                    hours: t("resolve.hours"),
                    hoursHelp: t("resolve.hoursHelp"),
                    submit: t("resolve.confirm"),
                    pending: t("resolve.pending"),
                    success: t("resolve.success"),
                    fallbackError: errors("server"),
                    errors: catalog,
                  }}
                />
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
