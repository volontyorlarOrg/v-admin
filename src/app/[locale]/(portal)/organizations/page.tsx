import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";

import { FilterForm, FilterSelect } from "@/components/forms/filter-form";
import { OrganizationForm } from "@/components/organizations/organization-form";
import { Panel } from "@/components/portal/panel";
import { StatusBadge } from "@/components/portal/status-badge";
import { EmptyState } from "@/components/states/empty-state";
import { LoadFailure } from "@/components/states/load-failure";
import { PageHeader } from "@/components/states/page-header";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
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

  const fieldLabels = {
    name: t("fields.name"),
    slug: t("fields.slug"),
    slugHelp: t("fields.slugHelp"),
    logoUrl: t("fields.logoUrl"),
    logoUrlHelp: t("fields.logoUrlHelp"),
    verified: t("fields.verified"),
    verifiedHelp: t("fields.verifiedHelp"),
    fallbackError: errors("server"),
    errors: catalog,
  };

  return (
    <>
      <PageHeader title={t("title")} description={t("description")} />

      {failure ? <LoadFailure failure={failure} /> : null}

      <Panel title={t("create.title")}>
        <OrganizationForm
          action={createOrganizationAction}
          labels={{
            ...fieldLabels,
            submit: t("create.submit"),
            pending: t("create.pending"),
            success: t("create.success"),
          }}
        />
      </Panel>

      {isReady(loaded) ? (
        <>
          <FilterForm
            action={`/${locale}${listPath}`}
            legend={t("filters.legend")}
            searchLabel={t("filters.search")}
            searchValue={q}
            resetHref={listPath}
          >
            <FilterSelect
              id="filter-verified"
              name="verified"
              label={t("filters.verified")}
            >
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
            rows.map((organization) => (
              <Panel
                key={organization.id}
                title={organization.name}
                description={organization.slug}
                actions={
                  <StatusBadge
                    label={organization.verified ? t("verified.yes") : t("verified.no")}
                    tone={organization.verified ? "structure" : "neutral"}
                  />
                }
              >
                <OrganizationForm
                  action={updateOrganizationAction}
                  id={organization.id}
                  defaults={{
                    name: organization.name,
                    slug: organization.slug,
                    logoUrl: organization.logoUrl ?? "",
                    verified: organization.verified,
                  }}
                  labels={{
                    ...fieldLabels,
                    submit: t("update.submit"),
                    pending: t("update.pending"),
                    success: t("update.success"),
                  }}
                />
              </Panel>
            ))
          )}

          <p className="sr-only">{common("actions")}</p>
        </>
      ) : null}
    </>
  );
}
