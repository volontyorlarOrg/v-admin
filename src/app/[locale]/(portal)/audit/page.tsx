import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";

import { AuditTable } from "@/components/audit/audit-table";
import { Register, RegisterNote } from "@/components/register/register";
import { LoadFailure } from "@/components/states/load-failure";
import { PageHeader } from "@/components/states/page-header";
import { Pagination } from "@/components/states/pagination";
import { Button, buttonClass } from "@/components/ui/button";
import { compactInputClass } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Link } from "@/i18n/navigation";
import { failureOf, isReady } from "@/lib/api/load";
import { loadAudit } from "@/lib/audit/data.server";
import { actionNames } from "@/lib/audit/filters";
import { getSession } from "@/lib/auth/session.server";
import { loadCoordinators } from "@/lib/coordinators/data.server";
import { tashkentDayEnd, tashkentDayStart } from "@/lib/datetime";
import { auditActionKey, auditActionOptions } from "@/lib/domain/audit-actions";
import { navHref } from "@/lib/routing/routes";
import {
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  hrefWith,
  readPage,
  readParam,
} from "@/lib/routing/search-params";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const FAMILIES = [
  "opportunity",
  "application",
  "attendance",
  "coordinator",
  "organization",
  "user",
];

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

  const [t, common, session] = await Promise.all([
    getTranslations("audit"),
    getTranslations("common"),
    getSession(),
  ]);

  const query = await searchParams;
  const action = readParam(query, "action");
  const actorParam = readParam(query, "actor");
  const actorUserId = actorParam === "me" ? (session?.userId ?? "") : actorParam;
  const from = readParam(query, "from");
  const to = readParam(query, "to");
  const page = readPage(query);
  const fromIso = tashkentDayStart(from);
  const toIso = tashkentDayEnd(to);

  const [loaded, coordinators] = await Promise.all([
    loadAudit({
      ...(action ? { action } : {}),
      ...(actorUserId ? { actorUserId } : {}),
      ...(fromIso ? { from: fromIso } : {}),
      ...(toIso ? { to: toIso } : {}),
      page,
      pageSize: DEFAULT_PAGE_SIZE,
    }),
    loadCoordinators({ page: 1, pageSize: MAX_PAGE_SIZE }),
  ]);

  const failure = failureOf(loaded);
  const events = isReady(loaded) ? loaded.data.items : [];
  const listPath = navHref("audit");
  const filtered = Boolean(action || actorParam || from || to);

  const coordinatorItems = isReady(coordinators) ? coordinators.data.items : [];
  const actors = new Map<string, string>(
    coordinatorItems.map((coordinator) => [
      coordinator.id,
      coordinator.displayName ?? coordinator.email ?? coordinator.id,
    ]),
  );
  if (session) actors.set(session.userId, t("you"));
  const coordinatorIds = new Set(coordinatorItems.map((coordinator) => coordinator.id));

  const label = (name: string) => {
    const key = `actions.${auditActionKey(name)}`;
    return t.has(key) ? t(key) : name;
  };
  const options = auditActionOptions(actionNames(events));
  const grouped = FAMILIES.map((family) => ({
    family,
    names: options.filter((name) => name.startsWith(`${family}.`)),
  })).filter((group) => group.names.length > 0);
  const others = options.filter(
    (name) => !FAMILIES.some((family) => name.startsWith(`${family}.`)),
  );

  const field = "flex min-w-0 flex-col gap-1.5";
  const fieldLabel = "text-xs font-semibold text-ink-muted";

  return (
    <>
      <PageHeader title={t("title")} description={t("description")} />

      {failure ? <LoadFailure failure={failure} /> : null}

      {isReady(loaded) ? (
        <Register
          title={filtered ? t("filteredTitle") : t("listTitle")}
          count={loaded.data.total}
          countLabel={t("countLabel")}
          toolbar={
            <form
              method="get"
              action={`/${locale}${listPath}`}
              className="grid w-full gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_10rem_10rem_auto] lg:items-end"
            >
              <label className={field}>
                <span className={fieldLabel}>{t("filters.action")}</span>
                <NativeSelect
                  name="action"
                  defaultValue={action}
                  className="min-h-10 rounded-full text-sm"
                >
                  <NativeSelectOption value="">
                    {t("filters.everything")}
                  </NativeSelectOption>
                  {grouped.map((group) => (
                    <optgroup key={group.family} label={t(`families.${group.family}`)}>
                      {group.names.map((name) => (
                        <NativeSelectOption key={name} value={name}>
                          {label(name)}
                        </NativeSelectOption>
                      ))}
                    </optgroup>
                  ))}
                  {others.map((name) => (
                    <NativeSelectOption key={name} value={name}>
                      {label(name)}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </label>
              <label className={field}>
                <span className={fieldLabel}>{t("filters.actor")}</span>
                <NativeSelect
                  name="actor"
                  defaultValue={actorParam}
                  className="min-h-10 rounded-full text-sm"
                >
                  <NativeSelectOption value="">
                    {t("filters.anyone")}
                  </NativeSelectOption>
                  {session ? (
                    <NativeSelectOption value="me">{t("you")}</NativeSelectOption>
                  ) : null}
                  {coordinatorItems.map((coordinator) => (
                    <NativeSelectOption key={coordinator.id} value={coordinator.id}>
                      {coordinator.displayName ?? coordinator.email ?? coordinator.id}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </label>
              <label className={field}>
                <span className={fieldLabel}>{t("filters.from")}</span>
                <input
                  type="date"
                  name="from"
                  defaultValue={from}
                  className={cn(compactInputClass, "tabular")}
                />
              </label>
              <label className={field}>
                <span className={fieldLabel}>{t("filters.to")}</span>
                <input
                  type="date"
                  name="to"
                  defaultValue={to}
                  className={cn(compactInputClass, "tabular")}
                />
              </label>
              <span className="flex gap-2">
                <Button type="submit" size="sm">
                  {common("apply")}
                </Button>
                {filtered ? (
                  <Link
                    href={listPath}
                    className={buttonClass({ variant: "ghost", size: "sm" })}
                  >
                    {common("reset")}
                  </Link>
                ) : null}
              </span>
            </form>
          }
        >
          {events.length === 0 ? (
            <RegisterNote
              title={filtered ? t("noMatches.title") : t("empty.title")}
              description={
                filtered ? t("noMatches.description") : t("empty.description")
              }
            />
          ) : (
            <>
              <AuditTable
                events={events}
                caption={t("table.caption")}
                actors={actors}
                coordinatorIds={coordinatorIds}
              />
              <Pagination
                framed
                state={loaded.data}
                hrefFor={(next) =>
                  hrefWith(listPath, {
                    action,
                    actor: actorParam,
                    from,
                    to,
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
