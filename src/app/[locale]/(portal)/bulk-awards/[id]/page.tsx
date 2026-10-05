import type { Metadata } from "next";
import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";

import { RevokeAward } from "@/components/bulk-awards/revoke-award";
import { VolunteerSearch } from "@/components/bulk-awards/volunteer-search";
import { Avatar } from "@/components/portal/avatar";
import { Facts, FigureRow } from "@/components/register/facts";
import { Register, RegisterNote } from "@/components/register/register";
import { LoadFailure } from "@/components/states/load-failure";
import { PageHeader } from "@/components/states/page-header";
import { Pagination } from "@/components/states/pagination";
import { StatePanel } from "@/components/states/state-panel";
import { Link } from "@/i18n/navigation";
import { failureOf, isReady } from "@/lib/api/load";
import { loadAwardRecipients, loadBulkAward } from "@/lib/bulk-awards/data.server";
import { navHref, userHref } from "@/lib/routing/routes";
import { hrefWith, readPage, readParam } from "@/lib/routing/search-params";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/bulk-awards/[id]">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "bulkAwards" });
  return { title: t("detail.title") };
}

export default async function BulkAwardPage({
  params,
  searchParams,
}: PageProps<"/[locale]/bulk-awards/[id]">) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const query = await searchParams;
  const q = readParam(query, "q");
  const page = readPage(query);
  const listPath = navHref("bulkAwards");
  const path = `${listPath}/${encodeURIComponent(id)}`;

  const [t, common, format, loaded, recipients] = await Promise.all([
    getTranslations("bulkAwards"),
    getTranslations("common"),
    getFormatter(),
    loadBulkAward(id),
    loadAwardRecipients(id, q, page),
  ]);
  const amounts = (xp: number, hours: number) =>
    [
      xp > 0 ? t("xpAmount", { value: xp }) : null,
      hours > 0 ? t("hoursAmount", { value: hours }) : null,
    ]
      .filter(Boolean)
      .join(" · ");
  const failure = failureOf(loaded);
  const back = { href: listPath, label: t("title") };

  if (!isReady(loaded)) {
    return (
      <>
        <PageHeader title={t("detail.title")} back={back} />
        {failure ? <LoadFailure failure={failure} /> : null}
      </>
    );
  }

  const award = loaded.data;
  const unknown = t("unknownPerson");
  const given = t("detail.given", {
    date: format.dateTime(new Date(award.createdAt), "stamp"),
    by: award.createdBy?.displayName ?? unknown,
  });
  const recipientFailure = failureOf(recipients);

  return (
    <>
      <PageHeader title={award.reason} back={back} description={given} />

      {award.revokedAt ? (
        <StatePanel
          tone="notice"
          title={t("detail.revokedTitle")}
          description={t("detail.revokedDescription", {
            date: format.dateTime(new Date(award.revokedAt), "stamp"),
            by: award.revokedBy?.displayName ?? unknown,
          })}
        />
      ) : null}

      <section aria-label={t("detail.summary")} className="flex flex-col gap-4">
        <FigureRow
          className={
            award.xp > 0 && award.hours > 0
              ? "sm:grid-cols-3 xl:grid-cols-3"
              : "sm:grid-cols-2 xl:grid-cols-2"
          }
          items={[
            { label: t("detail.recipients"), value: format.number(award.recipients) },
            ...(award.xp > 0
              ? [{ label: t("detail.xpEach"), value: `+${format.number(award.xp)}` }]
              : []),
            ...(award.hours > 0
              ? [
                  {
                    label: t("detail.hoursEach"),
                    value: `+${format.number(award.hours)}`,
                  },
                ]
              : []),
          ]}
        />
        <div className="sheet px-5 py-2">
          <Facts
            items={[
              {
                term: t("detail.scope"),
                value:
                  award.scope === "all"
                    ? t("detail.scopeAll")
                    : t("detail.scopeSelected"),
              },
              {
                term: t("detail.total"),
                value: amounts(
                  award.xp * award.recipients,
                  award.hours * award.recipients,
                ),
              },
              ...(award.skipped > 0
                ? [
                    {
                      term: t("detail.skipped"),
                      value: t("detail.skippedValue", { count: award.skipped }),
                    },
                  ]
                : []),
            ]}
          />
        </div>
      </section>

      {recipientFailure ? <LoadFailure failure={recipientFailure} /> : null}
      {isReady(recipients) && !award.revokedAt ? (
        <Register
          id="award-recipients"
          title={t("detail.recipientsTitle")}
          count={recipients.data.total}
          countLabel={t("detail.countLabel")}
          toolbar={
            <VolunteerSearch
              action={`/${locale}${path}`}
              label={t("search")}
              submitLabel={common("search")}
              value={q}
            />
          }
        >
          {recipients.data.items.length ? (
            <ul className="divide-y divide-border">
              {recipients.data.items.map((person) => (
                <li key={person.id}>
                  <Link
                    href={userHref(person.id)}
                    className="flex min-h-14 items-center gap-3 px-5 py-2.5 transition-colors hover:bg-surface-soft"
                  >
                    <Avatar name={person.displayName ?? undefined} size="sm" person />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-ink">
                        {person.displayName ?? `@${person.username}`}
                      </span>
                      <span className="block truncate text-xs text-ink-muted">
                        @{person.username}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <RegisterNote title={t("detail.noMatches")} />
          )}
          <Pagination
            framed
            state={recipients.data}
            hrefFor={(next) => hrefWith(path, { q, page: next })}
          />
        </Register>
      ) : null}

      {award.revokedAt ? null : (
        <section
          aria-labelledby="award-revoke"
          className="flex flex-col gap-3 sheet px-5 py-5 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="min-w-0">
            <h2 id="award-revoke" className="text-section text-ink">
              {t("revoke.title")}
            </h2>
            <p className="mt-1 max-w-prose text-sm leading-relaxed text-ink-muted">
              {t("revoke.description")}
            </p>
          </div>
          <RevokeAward
            awardId={award.id}
            trigger={t("revoke.trigger")}
            consequence={t("revoke.dialogDescription", {
              recipients: award.recipients,
              amounts: amounts(award.xp, award.hours),
            })}
            labels={{
              title: t("revoke.dialogTitle"),
              submit: t("revoke.submit"),
              pending: t("revoke.pending"),
              cancel: common("cancel"),
              close: common("close"),
              success: t("revoke.success"),
              summary: common("fixFields"),
              fallbackError: t("composer.error"),
              errors: t.raw("errors") as Record<string, string>,
            }}
          />
        </section>
      )}
    </>
  );
}
