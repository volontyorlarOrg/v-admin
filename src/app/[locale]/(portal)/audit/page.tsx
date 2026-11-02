import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";

import { AuditTimeline } from "@/components/audit/audit-timeline";
import { Register, RegisterNote, RegisterTabs } from "@/components/register/register";
import { LoadFailure } from "@/components/states/load-failure";
import { PageHeader } from "@/components/states/page-header";
import { Pagination } from "@/components/states/pagination";
import { Button, buttonClass } from "@/components/ui/button";
import { compactInputClass } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Link } from "@/i18n/navigation";
import { failureOf, isReady } from "@/lib/api/load";
import { loadAudit } from "@/lib/audit/data.server";
import { loadAuditDirectory } from "@/lib/audit/directory.server";
import { AUDIT_RANGES, rangeDays } from "@/lib/audit/timeline";
import { getSession } from "@/lib/auth/session.server";
import { tashkentDayEnd, tashkentDayStart } from "@/lib/datetime";
import { auditActionGroups, auditActionKey } from "@/lib/domain/audit-actions";
import { navHref } from "@/lib/routing/routes";
import {
  DEFAULT_PAGE_SIZE,
  hrefWith,
  readPage,
  readParam,
} from "@/lib/routing/search-params";
import { cn } from "@/lib/utils";

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
  const now = new Date();

  const [loaded, directory] = await Promise.all([
    loadAudit({
      action: action || undefined,
      actorUserId: actorUserId || undefined,
      from: tashkentDayStart(from),
      to: tashkentDayEnd(to),
      page,
      pageSize: DEFAULT_PAGE_SIZE,
    }),
    loadAuditDirectory(),
  ]);

  const failure = failureOf(loaded);
  const events = isReady(loaded) ? loaded.data.items : [];
  const listPath = navHref("audit");
  const filtered = Boolean(action || actorParam || from || to);

  const label = (name: string) => {
    const key = `actions.${auditActionKey(name)}`;
    return t.has(key) ? t(key) : name;
  };
  const groups = auditActionGroups(events.map((event) => event.action));

  const people = [...directory.people].filter(([id]) => id !== directory.me);
  const coordinators = people.filter(([, person]) => person.role === "coordinator");
  const organizations = people.filter(([, person]) => person.role === "organization");
  const byName = (a: [string, { name: string }], b: [string, { name: string }]) =>
    a[1].name.localeCompare(b[1].name);

  const ranges = [
    { key: "any", from: "", to: "" },
    ...AUDIT_RANGES.map((range) => ({ key: range, ...rangeDays(range, now) })),
  ];
  const rangeTabs = ranges.map((range) => ({
    key: range.key,
    label: t(`ranges.${range.key}`),
    href: hrefWith(listPath, {
      action,
      actor: actorParam,
      from: range.from,
      to: range.to,
    }),
    active: range.from === from && range.to === to,
  }));

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
            <div className="grid w-full gap-3">
              <RegisterTabs label={t("filters.period")} items={rangeTabs} />
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
                    className="min-h-9 rounded-md text-sm"
                  >
                    <NativeSelectOption value="">
                      {t("filters.everything")}
                    </NativeSelectOption>
                    {groups.map((group) => (
                      <optgroup
                        key={group.family}
                        label={t(`families.${group.family}`)}
                      >
                        {group.actions.map((name) => (
                          <NativeSelectOption key={name} value={name}>
                            {label(name)}
                          </NativeSelectOption>
                        ))}
                      </optgroup>
                    ))}
                  </NativeSelect>
                </label>
                <label className={field}>
                  <span className={fieldLabel}>{t("filters.actor")}</span>
                  <NativeSelect
                    name="actor"
                    defaultValue={actorParam}
                    className="min-h-9 rounded-md text-sm"
                  >
                    <NativeSelectOption value="">
                      {t("filters.anyone")}
                    </NativeSelectOption>
                    {session ? (
                      <NativeSelectOption value="me">{t("you")}</NativeSelectOption>
                    ) : null}
                    {coordinators.length > 0 ? (
                      <optgroup label={t("families.coordinator")}>
                        {coordinators.sort(byName).map(([id, person]) => (
                          <NativeSelectOption key={id} value={id}>
                            {person.name}
                          </NativeSelectOption>
                        ))}
                      </optgroup>
                    ) : null}
                    {organizations.length > 0 ? (
                      <optgroup label={t("families.organization")}>
                        {organizations.sort(byName).map(([id, person]) => (
                          <NativeSelectOption key={id} value={id}>
                            {person.name}
                          </NativeSelectOption>
                        ))}
                      </optgroup>
                    ) : null}
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
            </div>
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
              <AuditTimeline events={events} directory={directory} now={now} />
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
