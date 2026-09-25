import { Ban, CircleCheck } from "lucide-react";
import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { AuditTable } from "@/components/audit/audit-table";
import { RemoveCoordinator } from "@/components/coordinators/remove-coordinator";
import { FormDialog } from "@/components/forms/form-dialog";
import { Panel } from "@/components/portal/panel";
import {
  StatusBadge,
  coordinatorStatus,
  vacancyStatus,
} from "@/components/portal/status-badge";
import { TemporaryPasswordForm } from "@/components/portal/temporary-password-form";
import { Facts } from "@/components/register/facts";
import { Register, RegisterNote } from "@/components/register/register";
import { LoadFailure } from "@/components/states/load-failure";
import { PageHeader } from "@/components/states/page-header";
import { StatePanel } from "@/components/states/state-panel";
import { Button } from "@/components/ui/button";
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
import {
  blockCoordinatorAction,
  replaceCoordinatorPasswordAction,
  unblockCoordinatorAction,
} from "@/lib/coordinators/actions";
import { loadCoordinator, loadCoordinators } from "@/lib/coordinators/data.server";
import {
  activeVacanciesOf,
  needsReassignment,
  reassignmentCandidates,
  statusOf,
} from "@/lib/coordinators/status";
import { MAX_PAGE_SIZE } from "@/lib/routing/search-params";
import { navHref, vacancyHref } from "@/lib/routing/routes";
import { passwordLoginState } from "@/lib/users/password-state";
import { vacancyStateOf } from "@/lib/vacancies/approval";
import { errorCatalog } from "@/lib/vacancies/labels.server";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/coordinators/[id]">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "coordinators" });
  return { title: t("record") };
}

export default async function CoordinatorPage({
  params,
}: PageProps<"/[locale]/coordinators/[id]">) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const [t, vacancies, users, auth, common, errors, format] = await Promise.all([
    getTranslations("coordinators"),
    getTranslations("vacancies"),
    getTranslations("users"),
    getTranslations("auth"),
    getTranslations("common"),
    getTranslations("errors"),
    getFormatter(),
  ]);
  const back = { href: navHref("coordinators"), label: t("title") };

  const loaded = await loadCoordinator(id);
  const failure = failureOf(loaded);

  if (failure) {
    return (
      <>
        <PageHeader back={back} title={t("record")} />
        <LoadFailure failure={failure} />
      </>
    );
  }

  if (!isReady(loaded)) notFound();

  const coordinator = loaded.data;
  const status = statusOf(coordinator);
  const chip = coordinatorStatus(status);
  const password = passwordLoginState(coordinator);
  const mustReassign = needsReassignment(coordinator);
  const open = activeVacanciesOf(coordinator);

  const directory = await loadCoordinators({ page: 1, pageSize: MAX_PAGE_SIZE });
  const candidates = isReady(directory)
    ? reassignmentCandidates(directory.data.items, coordinator.id)
    : [];

  const confirmErrors = await errorCatalog([
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
    "coordinatorNotFound",
    "coordinatorHasActiveOpportunities",
    "invalidCoordinatorReassignment",
  ]);
  const shared = {
    cancel: common("cancel"),
    close: common("close"),
    summary: common("fixFields"),
    fallbackError: errors("server"),
    errors: confirmErrors,
  };

  return (
    <>
      <PageHeader
        back={back}
        title={coordinator.displayName ?? common("notSet")}
        meta={
          <>
            <StatusBadge
              label={t(`status.${status}`)}
              tone={chip.tone}
              icon={chip.icon}
            />
            <span>{coordinator.email ?? common("notSet")}</span>
            <span>
              {t("createdOn", {
                when: format.dateTime(new Date(coordinator.createdAt), "date"),
              })}
            </span>
          </>
        }
        actions={
          status === "removed" ? undefined : (
            <>
              {status === "active" ? (
                <FormDialog
                  action={blockCoordinatorAction}
                  size="sm"
                  tone="danger"
                  fields={{ id: coordinator.id }}
                  labels={{
                    ...shared,
                    title: t("block.title"),
                    description: t("block.description"),
                    submit: t("block.confirm"),
                    pending: t("block.pending"),
                    success: t("block.success"),
                  }}
                  trigger={
                    <Button type="button" size="sm" variant="outline">
                      <Ban aria-hidden="true" />
                      {t("block.trigger")}
                    </Button>
                  }
                />
              ) : (
                <FormDialog
                  action={unblockCoordinatorAction}
                  size="sm"
                  fields={{ id: coordinator.id }}
                  labels={{
                    ...shared,
                    title: t("unblock.title"),
                    description: t("unblock.description"),
                    submit: t("unblock.confirm"),
                    pending: t("unblock.pending"),
                    success: t("unblock.success"),
                  }}
                  trigger={
                    <Button type="button" size="sm" variant="outline">
                      <CircleCheck aria-hidden="true" />
                      {t("unblock.trigger")}
                    </Button>
                  }
                />
              )}

              <RemoveCoordinator
                coordinatorId={coordinator.id}
                needsReassignment={mustReassign}
                candidates={candidates.map((candidate) => ({
                  id: candidate.id,
                  name: candidate.displayName ?? candidate.id,
                }))}
                trigger={t("remove.trigger")}
                reassignLabel={t("remove.reassign")}
                reassignHelp={t("remove.reassignHelp")}
                reassignPlaceholder={t("remove.reassignPlaceholder")}
                labels={{
                  ...shared,
                  title: t("remove.title"),
                  description: t("remove.description"),
                  submit: t("remove.confirm"),
                  pending: t("remove.pending"),
                  success: t("remove.success"),
                }}
              />
            </>
          )
        }
      />

      {status === "blocked" ? (
        <StatePanel role="status" tone="danger" title={t("blockedNotice")} />
      ) : null}

      {mustReassign && candidates.length === 0 && status !== "removed" ? (
        <StatePanel role="status" tone="notice" title={t("remove.noCandidates")} />
      ) : null}

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="flex min-w-0 flex-col gap-6">
          <Register
            title={t("detail.vacancies")}
            count={coordinator.createdOpportunities.length}
            countLabel={vacancies("countLabel")}
            description={
              open.length > 0 && status !== "removed"
                ? t("detail.openVacancies", { count: open.length })
                : undefined
            }
          >
            {coordinator.createdOpportunities.length === 0 ? (
              <RegisterNote title={t("detail.noVacancies")} />
            ) : (
              <Table>
                <TableCaption className="sr-only">{t("detail.vacancies")}</TableCaption>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead scope="col">{vacancies("table.title")}</TableHead>
                    <TableHead scope="col">{vacancies("table.state")}</TableHead>
                    <TableHead scope="col">{t("table.created")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {coordinator.createdOpportunities.map((vacancy) => {
                    const state = vacancyStateOf(vacancy);
                    const stateChip = vacancyStatus(state);
                    return (
                      <TableRow key={vacancy.id}>
                        <TableCell className="max-w-[24rem]">
                          <Link
                            href={vacancyHref(vacancy.id)}
                            className="font-semibold text-ink hover:text-primary-ink hover:underline"
                          >
                            {vacancy.title}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <StatusBadge
                            label={vacancies(`state.${state}`)}
                            tone={stateChip.tone}
                            icon={stateChip.icon}
                          />
                        </TableCell>
                        <TableCell className="tabular whitespace-nowrap text-ink-muted">
                          {format.dateTime(new Date(vacancy.createdAt), "day")}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </Register>

          <Register
            title={t("detail.activity")}
            count={coordinator.auditLogs.length}
            countLabel={t("detail.activityLabel")}
          >
            {coordinator.auditLogs.length === 0 ? (
              <RegisterNote title={t("detail.noActivity")} />
            ) : (
              <AuditTable
                events={coordinator.auditLogs}
                caption={t("detail.activity")}
                showActor={false}
              />
            )}
          </Register>
        </div>

        <aside className="flex min-w-0 flex-col gap-6">
          <Panel title={t("detail.account")}>
            <Facts
              items={[
                {
                  term: t("table.email"),
                  value: coordinator.email ?? common("notSet"),
                },
                {
                  term: t("table.passwordLogin"),
                  value:
                    password.kind === "none"
                      ? users("passwordState.none")
                      : password.changeRequired
                        ? users("passwordState.required")
                        : users("passwordState.set"),
                },
                ...(password.kind === "set"
                  ? [
                      {
                        term: users("table.passwordChangedAt"),
                        value: password.changedAt
                          ? format.dateTime(new Date(password.changedAt), "stamp")
                          : users("passwordState.neverChanged"),
                      },
                    ]
                  : []),
              ]}
            />
          </Panel>

          {status === "removed" ? null : (
            <Panel title={t("password.title")} description={t("password.description")}>
              <TemporaryPasswordForm
                action={replaceCoordinatorPasswordAction}
                targetId={coordinator.id}
                labels={{
                  label: t("password.label"),
                  help: t("password.help"),
                  privacy: t("password.privacy"),
                  showPassword: auth("showPassword"),
                  hidePassword: auth("hidePassword"),
                  submit: t("password.confirm"),
                  pending: t("password.pending"),
                  success: t("password.success"),
                  fallbackError: errors("server"),
                  errors: await errorCatalog([
                    "server",
                    "network",
                    "timeout",
                    "rateLimited",
                    "unavailable",
                    "forbidden",
                    "notFound",
                    "validationFailed",
                    "awaitingContract",
                    "sessionExpired",
                    "required",
                    "passwordShort",
                    "passwordLong",
                    "weakPassword",
                    "userNotFound",
                    "coordinatorNotFound",
                  ]),
                }}
              />
            </Panel>
          )}
        </aside>
      </div>
    </>
  );
}
