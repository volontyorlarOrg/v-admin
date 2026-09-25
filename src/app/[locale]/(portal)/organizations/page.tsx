import { Plus } from "lucide-react";
import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";

import {
  OrganizationDialog,
  type OrganizationDialogLabels,
} from "@/components/organizations/organization-dialog";
import { StatusBadge, organizationStatus } from "@/components/portal/status-badge";
import { InlineDecision } from "@/components/register/inline-decision";
import {
  Register,
  RegisterNote,
  RegisterSearch,
  RegisterTabs,
} from "@/components/register/register";
import { LoadFailure } from "@/components/states/load-failure";
import { PageHeader } from "@/components/states/page-header";
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
import { failureOf, isReady } from "@/lib/api/load";
import {
  createOrganizationAction,
  updateOrganizationAction,
  verifyOrganizationAction,
} from "@/lib/organizations/actions";
import { loadOrganizations } from "@/lib/organizations/data.server";
import { filterOrganizations } from "@/lib/organizations/filters";
import { organizationDecisions } from "@/lib/queue/approval-decisions.server";
import { decisionLabels } from "@/lib/queue/decisions.server";
import { blockingOrganizations } from "@/lib/queue/today";
import { navHref } from "@/lib/routing/routes";
import { hrefWith, readOption, readParam } from "@/lib/routing/search-params";
import { loadVacancies } from "@/lib/vacancies/data.server";
import { errorCatalog } from "@/lib/vacancies/labels.server";

export const dynamic = "force-dynamic";

const VERIFICATION = ["yes", "no"] as const;

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/organizations">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "organizations" });
  return { title: t("title") };
}

export default async function OrganizationsPage({
  params,
  searchParams,
}: PageProps<"/[locale]/organizations">) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [t, common, errors, format] = await Promise.all([
    getTranslations("organizations"),
    getTranslations("common"),
    getTranslations("errors"),
    getFormatter(),
  ]);

  const query = await searchParams;
  const q = readParam(query, "q");
  const verified = readOption(query, "verified", VERIFICATION);

  const [loaded, vacancies] = await Promise.all([loadOrganizations(), loadVacancies()]);
  const failure = failureOf(loaded);
  const all = isReady(loaded) ? loaded.data : [];
  const rows = filterOrganizations(all, { q, ...(verified ? { verified } : {}) });
  const listPath = navHref("organizations");

  const vacancyRows = isReady(vacancies) ? vacancies.data : [];
  const held = new Map(
    blockingOrganizations(vacancyRows, all).map((entry) => [
      entry.organization.id,
      entry.vacancies.length,
    ]),
  );
  const totals = new Map<string, number>();
  for (const vacancy of vacancyRows) {
    totals.set(vacancy.organizationId, (totals.get(vacancy.organizationId) ?? 0) + 1);
  }

  const [labels, verifyOptions] = await Promise.all([
    decisionLabels(),
    organizationDecisions(),
  ]);

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
    "tooLong",
    "slug",
    "url",
    "slugUnavailable",
    "organizationNotFound",
  ]);

  const shared = {
    fields: {
      name: t("fields.name"),
      slug: t("fields.slug"),
      slugHelp: t("fields.slugHelp"),
      logoUrl: t("fields.logoUrl"),
      logoUrlHelp: t("fields.logoUrlHelp"),
      verified: t("fields.verified"),
      verifiedHelp: t("fields.verifiedHelp"),
    },
    cancel: common("cancel"),
    close: common("close"),
    summary: common("fixFields"),
    fallbackError: errors("server"),
    errors: catalog,
  };

  const createLabels: OrganizationDialogLabels = {
    ...shared,
    title: t("create.title"),
    description: t("create.description"),
    submit: t("create.submit"),
    pending: t("create.pending"),
    success: t("create.success"),
  };

  const updateLabels: OrganizationDialogLabels = {
    ...shared,
    title: t("update.title"),
    description: t("update.description"),
    submit: t("update.submit"),
    pending: t("update.pending"),
    success: t("update.success"),
  };

  const verifiedCount = all.filter((organization) => organization.verified).length;
  const tabs = [
    {
      key: "all",
      label: t("verified.all"),
      href: hrefWith(listPath, { q }),
      count: all.length,
      active: verified === undefined,
    },
    {
      key: "no",
      label: t("verified.no"),
      href: hrefWith(listPath, { q, verified: "no" }),
      count: all.length - verifiedCount,
      active: verified === "no",
    },
    {
      key: "yes",
      label: t("verified.yes"),
      href: hrefWith(listPath, { q, verified: "yes" }),
      count: verifiedCount,
      active: verified === "yes",
    },
  ];

  return (
    <>
      <PageHeader
        title={t("title")}
        description={t("description")}
        actions={
          <OrganizationDialog
            action={createOrganizationAction}
            labels={createLabels}
            trigger={
              <Button type="button" size="sm">
                <Plus aria-hidden="true" />
                {t("new")}
              </Button>
            }
          />
        }
      />

      {failure ? <LoadFailure failure={failure} /> : null}

      {isReady(loaded) ? (
        <Register
          title={t("listTitle")}
          count={rows.length}
          countLabel={t("countLabel")}
          toolbar={
            <div className="flex w-full flex-col gap-3">
              <RegisterTabs label={t("filters.verified")} items={tabs} />
              <RegisterSearch
                action={`/${locale}${listPath}`}
                label={t("filters.search")}
                submitLabel={common("search")}
                value={q}
                keep={{ verified }}
              />
            </div>
          }
        >
          {rows.length === 0 ? (
            <RegisterNote
              title={all.length === 0 ? t("empty.title") : t("noMatches.title")}
              description={
                all.length === 0 ? t("empty.description") : t("noMatches.description")
              }
            />
          ) : (
            <Table>
              <TableCaption className="sr-only">{t("table.caption")}</TableCaption>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead scope="col">{t("table.name")}</TableHead>
                  <TableHead scope="col">{t("table.verified")}</TableHead>
                  <TableHead scope="col">{t("table.vacancies")}</TableHead>
                  <TableHead scope="col">
                    <span className="sr-only">{common("actions")}</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((organization) => {
                  const chip = organizationStatus(organization.verified);
                  const holding = held.get(organization.id) ?? 0;
                  return (
                    <TableRow key={organization.id}>
                      <TableCell>
                        <span className="block font-semibold text-ink">
                          {organization.name}
                        </span>
                        <span className="block text-xs text-ink-muted">
                          {organization.slug}
                        </span>
                      </TableCell>
                      <TableCell>
                        <StatusBadge
                          label={
                            organization.verified ? t("verified.yes") : t("verified.no")
                          }
                          tone={chip.tone}
                          icon={chip.icon}
                        />
                      </TableCell>
                      <TableCell className="tabular">
                        {format.number(totals.get(organization.id) ?? 0)}
                        {holding > 0 ? (
                          <span className="ml-2 font-semibold text-danger-ink">
                            {t("table.held", { count: holding })}
                          </span>
                        ) : null}
                      </TableCell>
                      <TableCell>
                        <span className="flex flex-wrap items-center justify-end gap-2">
                          {organization.verified ? null : (
                            <InlineDecision
                              action={verifyOrganizationAction}
                              hidden={{ id: organization.id }}
                              subject={organization.name}
                              labels={labels}
                              options={verifyOptions({ name: organization.name })}
                              className="justify-end"
                            />
                          )}
                          <OrganizationDialog
                            action={updateOrganizationAction}
                            labels={updateLabels}
                            id={organization.id}
                            defaults={{
                              name: organization.name,
                              slug: organization.slug,
                              logoUrl: organization.logoUrl ?? "",
                              verified: organization.verified,
                            }}
                            trigger={
                              <Button type="button" variant="ghost" size="row">
                                {t("table.edit")}
                                <span className="sr-only"> — {organization.name}</span>
                              </Button>
                            }
                          />
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </Register>
      ) : null}
    </>
  );
}
