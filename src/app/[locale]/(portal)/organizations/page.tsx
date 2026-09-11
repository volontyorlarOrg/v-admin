import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";

import { FilterForm, FilterSelect } from "@/components/forms/filter-form";
import {
  OrganizationDialog,
  type OrganizationDialogLabels,
} from "@/components/organizations/organization-dialog";
import { StatusBadge } from "@/components/portal/status-badge";
import { EmptyState } from "@/components/states/empty-state";
import { LoadFailure } from "@/components/states/load-failure";
import { PageHeader } from "@/components/states/page-header";
import { Button } from "@/components/ui/button";
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
import { failureOf, isReady } from "@/lib/api/load";
import {
  createOrganizationAction,
  updateOrganizationAction,
} from "@/lib/organizations/actions";
import { loadOrganizations } from "@/lib/organizations/data.server";
import { filterOrganizations } from "@/lib/organizations/filters";
import { navHref } from "@/lib/routing/routes";
import { readOption, readParam } from "@/lib/routing/search-params";
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

  const t = await getTranslations("organizations");
  const common = await getTranslations("common");
  const errors = await getTranslations("errors");

  const query = await searchParams;
  const q = readParam(query, "q");
  const verified = readOption(query, "verified", VERIFICATION);

  const loaded = await loadOrganizations();
  const failure = failureOf(loaded);
  const rows = isReady(loaded) ? filterOrganizations(loaded.data, { q, verified }) : [];
  const listPath = navHref("organizations");

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
                {t("new")}
              </Button>
            }
          />
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
            <FilterSelect id="filter-verified" label={t("filters.verified")}>
              <NativeSelect
                id="filter-verified"
                name="verified"
                defaultValue={verified ?? ""}
              >
                <NativeSelectOption value="">{t("verified.all")}</NativeSelectOption>
                <NativeSelectOption value="yes">{t("verified.yes")}</NativeSelectOption>
                <NativeSelectOption value="no">{t("verified.no")}</NativeSelectOption>
              </NativeSelect>
            </FilterSelect>
          </FilterForm>

          {rows.length === 0 ? (
            <EmptyState
              title={loaded.data.length === 0 ? t("empty.title") : t("noMatches.title")}
              description={
                loaded.data.length === 0
                  ? t("empty.description")
                  : t("noMatches.description")
              }
            />
          ) : (
            <div className="rounded-xl border border-border/70 panel-surface">
              <Table>
                <TableCaption className="sr-only">{t("table.caption")}</TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead scope="col">{t("table.name")}</TableHead>
                    <TableHead scope="col">{t("table.slug")}</TableHead>
                    <TableHead scope="col">{t("table.verified")}</TableHead>
                    <TableHead scope="col">
                      <span className="sr-only">{common("actions")}</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((organization) => (
                    <TableRow key={organization.id}>
                      <TableCell className="font-medium text-ink">
                        {organization.name}
                      </TableCell>
                      <TableCell className="text-ink-muted">
                        {organization.slug}
                      </TableCell>
                      <TableCell>
                        <StatusBadge
                          label={
                            organization.verified ? t("verified.yes") : t("verified.no")
                          }
                          tone={organization.verified ? "structure" : "neutral"}
                        />
                      </TableCell>
                      <TableCell className="text-right">
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
                            <Button type="button" variant="ghost" size="sm">
                              {t("table.edit")}
                              <span className="sr-only"> — {organization.name}</span>
                            </Button>
                          }
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </>
      ) : null}
    </>
  );
}
