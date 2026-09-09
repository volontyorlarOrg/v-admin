import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";

import { FilterForm, FilterSelect } from "@/components/forms/filter-form";
import { EmptyState } from "@/components/states/empty-state";
import { LoadFailure } from "@/components/states/load-failure";
import { PageHeader } from "@/components/states/page-header";
import { Pagination } from "@/components/states/pagination";
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
import { loadAudit } from "@/lib/audit/data.server";
import { actionNames } from "@/lib/audit/filters";
import { loadCoordinators } from "@/lib/coordinators/data.server";
import { auditActionOptions } from "@/lib/domain/audit-actions";
import { navHref } from "@/lib/routing/routes";
import {
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  hrefWith,
  readPage,
  readParam,
} from "@/lib/routing/search-params";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/audit">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "audit" });
  return { title: t("title") };
}

export default async function AuditPage({
  params,
  searchParams,
}: PageProps<"/[locale]/audit">) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("audit");
  const common = await getTranslations("common");
  const format = await getFormatter();

  const query = await searchParams;
  const action = readParam(query, "action");
  const actorUserId = readParam(query, "actor");
  const from = readParam(query, "from");
  const to = readParam(query, "to");
  const page = readPage(query);

  const [loaded, coordinators] = await Promise.all([
    loadAudit({
      ...(action ? { action } : {}),
      ...(actorUserId ? { actorUserId } : {}),
      ...(from ? { from: new Date(from).toISOString() } : {}),
      ...(to ? { to: new Date(to).toISOString() } : {}),
      page,
      pageSize: DEFAULT_PAGE_SIZE,
    }),
    loadCoordinators({ page: 1, pageSize: MAX_PAGE_SIZE }),
  ]);

  const failure = failureOf(loaded);
  const events = isReady(loaded) ? loaded.data.items : [];
  const listPath = navHref("audit");

  const actors = new Map(
    (isReady(coordinators) ? coordinators.data.items : []).map((coordinator) => [
      coordinator.id,
      coordinator.displayName ?? coordinator.id,
    ]),
  );

  return (
    <>
      <PageHeader title={t("title")} description={t("description")} />

      {failure ? <LoadFailure failure={failure} /> : null}

      {isReady(loaded) ? (
        <>
          <FilterForm
            action={`/${locale}${listPath}`}
            legend={t("filters.legend")}
            searchName="action"
            searchLabel={t("filters.search")}
            searchValue=""
            resetHref={listPath}
            hideSearch
          >
            <FilterSelect id="filter-action" label={t("filters.action")}>
              <NativeSelect id="filter-action" name="action" defaultValue={action}>
                <NativeSelectOption value="">{common("all")}</NativeSelectOption>
                {auditActionOptions(actionNames(events)).map((name) => (
                  <NativeSelectOption key={name} value={name}>
                    {name}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </FilterSelect>

            <FilterSelect id="filter-actor" label={t("filters.actor")}>
              <NativeSelect id="filter-actor" name="actor" defaultValue={actorUserId}>
                <NativeSelectOption value="">{common("all")}</NativeSelectOption>
                {[...actors].map(([id, name]) => (
                  <NativeSelectOption key={id} value={id}>
                    {name}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </FilterSelect>

            <FilterDate
              id="filter-from"
              name="from"
              label={t("filters.from")}
              value={from}
            />
            <FilterDate id="filter-to" name="to" label={t("filters.to")} value={to} />
          </FilterForm>

          {events.length === 0 ? (
            <EmptyState
              title={
                action || actorUserId || from || to
                  ? t("noMatches.title")
                  : t("empty.title")
              }
              description={
                action || actorUserId || from || to
                  ? t("noMatches.description")
                  : t("empty.description")
              }
            />
          ) : (
            <>
              <div className="rounded-xl border border-border bg-card">
                <Table>
                  <TableCaption className="sr-only">{t("table.caption")}</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead scope="col">{t("table.action")}</TableHead>
                      <TableHead scope="col">{t("table.entity")}</TableHead>
                      <TableHead scope="col">{t("table.actor")}</TableHead>
                      <TableHead scope="col">{t("table.when")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {events.map((event) => (
                      <TableRow key={event.id}>
                        <TableCell className="font-medium text-ink">
                          {event.action}
                        </TableCell>
                        <TableCell className="break-all text-ink-muted">
                          {event.entityType} · {event.entityId}
                        </TableCell>
                        <TableCell>
                          {event.actorUserId
                            ? (actors.get(event.actorUserId) ?? event.actorUserId)
                            : t("unknownActor")}
                        </TableCell>
                        <TableCell className="tabular whitespace-nowrap">
                          {format.dateTime(new Date(event.createdAt), "stamp")}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <Pagination
                state={loaded.data}
                hrefFor={(next) =>
                  hrefWith(listPath, {
                    action,
                    actor: actorUserId,
                    from,
                    to,
                    page: next,
                  })
                }
              />
            </>
          )}
        </>
      ) : null}
    </>
  );
}

function FilterDate({
  id,
  name,
  label,
  value,
}: {
  id: string;
  name: string;
  label: string;
  value: string;
}) {
  return (
    <div className="flex w-full flex-col gap-2 lg:w-48">
      <label htmlFor={id} className="text-sm font-semibold text-foreground">
        {label}
      </label>
      <input
        id={id}
        name={name}
        type="date"
        defaultValue={value}
        className="min-h-12 w-full rounded-lg border border-input bg-surface px-4 text-base text-foreground"
      />
    </div>
  );
}
