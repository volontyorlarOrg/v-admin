import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";

import { ConfirmAction } from "@/components/forms/confirm-action";
import { RemoveCoordinator } from "@/components/coordinators/remove-coordinator";
import { DefinitionList } from "@/components/portal/definition-list";
import { Panel } from "@/components/portal/panel";
import {
  StatusBadge,
  coordinatorStatusTone,
  vacancyStageTone,
} from "@/components/portal/status-badge";
import { TemporaryPasswordForm } from "@/components/portal/temporary-password-form";
import { LoadFailure } from "@/components/states/load-failure";
import { PageHeader } from "@/components/states/page-header";
import { StatePanel } from "@/components/states/state-panel";
import { buttonClass } from "@/components/ui/button";
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
import { stageOf } from "@/lib/domain/vocabulary";
import { MAX_PAGE_SIZE } from "@/lib/routing/search-params";
import { vacancyHref } from "@/lib/routing/routes";
import { passwordLoginState } from "@/lib/users/password-state";
import { errorCatalog } from "@/lib/vacancies/labels.server";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/coordinators/[id]">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "coordinators" });
  return { title: t("detail.eyebrow") };
}

export default async function CoordinatorPage({
  params,
}: PageProps<"/[locale]/coordinators/[id]">) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("coordinators");
  const vacancies = await getTranslations("vacancies");
  const users = await getTranslations("users");
  const activity = await getTranslations("activity");
  const auth = await getTranslations("auth");
  const common = await getTranslations("common");
  const errors = await getTranslations("errors");
  const format = await getFormatter();

  const loaded = await loadCoordinator(id);
  const failure = failureOf(loaded);

  if (failure) {
    return (
      <>
        <PageHeader eyebrow={t("detail.eyebrow")} title={t("title")} />
        <LoadFailure failure={failure} />
      </>
    );
  }

  if (!isReady(loaded)) return null;

  const coordinator = loaded.data;
  const status = statusOf(coordinator);
  const password = passwordLoginState(coordinator);
  const mustReassign = needsReassignment(coordinator);

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

  return (
    <>
      <PageHeader
        eyebrow={t("detail.eyebrow")}
        title={coordinator.displayName ?? common("notSet")}
        description={coordinator.email ?? undefined}
        actions={
          status === "removed" ? undefined : (
            <>
              {status === "active" ? (
                <ConfirmAction
                  action={blockCoordinatorAction}
                  fields={{ id: coordinator.id }}
                  labels={{
                    trigger: t("block.trigger"),
                    title: t("block.title"),
                    description: t("block.description"),
                    confirm: t("block.confirm"),
                    cancel: common("cancel"),
                    pending: t("block.pending"),
                    fallbackError: errors("server"),
                    errors: confirmErrors,
                  }}
                />
              ) : (
                <ConfirmAction
                  action={unblockCoordinatorAction}
                  fields={{ id: coordinator.id }}
                  labels={{
                    trigger: t("unblock.trigger"),
                    title: t("unblock.title"),
                    description: t("unblock.description"),
                    confirm: t("unblock.confirm"),
                    cancel: common("cancel"),
                    pending: t("unblock.pending"),
                    fallbackError: errors("server"),
                    errors: confirmErrors,
                  }}
                />
              )}

              <RemoveCoordinator
                coordinatorId={coordinator.id}
                needsReassignment={mustReassign}
                candidates={candidates.map((candidate) => ({
                  id: candidate.id,
                  name: candidate.displayName ?? candidate.id,
                }))}
                reassignLabel={t("remove.reassign")}
                reassignHelp={t("remove.reassignHelp")}
                reassignPlaceholder={t("remove.reassignPlaceholder")}
                labels={{
                  trigger: t("remove.trigger"),
                  title: t("remove.title"),
                  description: t("remove.description"),
                  confirm: t("remove.confirm"),
                  cancel: common("cancel"),
                  pending: t("remove.pending"),
                  fallbackError: errors("server"),
                  errors: confirmErrors,
                }}
              />
            </>
          )
        }
      />

      <div>
        <StatusBadge
          label={t(`status.${status}`)}
          tone={coordinatorStatusTone(status)}
        />
      </div>

      {mustReassign && candidates.length === 0 ? (
        <StatePanel role="status" tone="notice" title={t("remove.noCandidates")} />
      ) : null}

      <Panel title={t("detail.account")}>
        <DefinitionList
          items={[
            { term: t("table.email"), value: coordinator.email ?? common("notSet") },
            {
              term: t("table.created"),
              value: format.dateTime(new Date(coordinator.createdAt), "date"),
            },
            {
              term: t("table.passwordLogin"),
              value:
                password.kind === "none"
                  ? users("passwordState.none")
                  : users("passwordState.set"),
            },
            {
              term: users("table.passwordChangedAt"),
              value:
                password.kind === "set" && password.changedAt
                  ? format.dateTime(new Date(password.changedAt), "stamp")
                  : users("passwordState.neverChanged"),
            },
            {
              term: users("table.passwordChangeRequired"),
              value:
                password.kind === "set" && password.changeRequired
                  ? common("yes")
                  : common("no"),
            },
          ]}
        />
      </Panel>

      <Panel
        title={t("detail.vacancies")}
        description={mustReassign ? t("remove.reassignHelp") : undefined}
      >
        {coordinator.createdOpportunities.length === 0 ? (
          <p className="text-sm text-ink-muted">{t("detail.noVacancies")}</p>
        ) : (
          <ul className="flex flex-col divide-y divide-border">
            {coordinator.createdOpportunities.map((vacancy) => (
              <li
                key={vacancy.id}
                className="flex items-center justify-between gap-4 py-3"
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-ink">
                    {vacancy.title}
                  </span>
                  <StatusBadge
                    label={vacancies(`stage.${stageOf(vacancy)}`)}
                    tone={vacancyStageTone(stageOf(vacancy))}
                  />
                </span>
                <Link
                  href={vacancyHref(vacancy.id)}
                  className={buttonClass({ variant: "ghost", size: "sm" })}
                >
                  {vacancies("table.open")}
                </Link>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-4 text-sm text-ink-muted">
          {format.number(activeVacanciesOf(coordinator).length)} ·{" "}
          {vacancies("stage.published")}
        </p>
      </Panel>

      <Panel title={t("detail.activity")}>
        {coordinator.auditLogs.length === 0 ? (
          <p className="text-sm text-ink-muted">{t("detail.noActivity")}</p>
        ) : (
          <ul className="flex flex-col divide-y divide-border">
            {coordinator.auditLogs.map((event) => (
              <li key={event.id} className="flex justify-between gap-4 py-3 text-sm">
                <span className="min-w-0">
                  <span className="block font-medium text-ink">{event.action}</span>
                  <span className="block truncate text-xs text-ink-muted">
                    {event.entityType} · {event.entityId}
                  </span>
                </span>
                <span className="tabular shrink-0 text-ink-muted">
                  {format.dateTime(new Date(event.createdAt), "stamp")}
                </span>
              </li>
            ))}
          </ul>
        )}
        <p className="sr-only">{activity("table.caption")}</p>
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
    </>
  );
}
