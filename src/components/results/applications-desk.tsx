"use client";

import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Check,
  ChevronLeft,
  ChevronRight,
  Mail,
  Pause,
  Search,
  Send,
  Undo2,
  X,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import { Avatar } from "@/components/portal/avatar";
import { StatusBadge, applicationStatus } from "@/components/portal/status-badge";
import { ApplicantDrawer } from "@/components/results/applicant-drawer";
import { DecisionSelect } from "@/components/results/decision-select";
import { SendDecisionsDialog } from "@/components/results/send-decisions-dialog";
import { Button } from "@/components/ui/button";
import { compactInputClass } from "@/components/ui/input";
import type { StagedDecision } from "@/lib/domain/vocabulary";
import { sendDecisionsAction, stageDecisionsAction } from "@/lib/results/actions";
import {
  DESK_FILTERS,
  countDesk,
  isDecidable,
  matchesFilter,
  matchesQuery,
  pageWindow,
  sortApplicants,
  type DeskApplicant,
  type DeskFilter,
  type DeskSort,
} from "@/lib/results/desk";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 15;

export function ApplicationsDesk({
  vacancyId,
  capacity,
  archived,
  applicants,
}: {
  vacancyId: string;
  capacity: number | null;
  archived: boolean;
  applicants: readonly DeskApplicant[];
}) {
  const t = useTranslations("results.desk");
  const errors = useTranslations("results.errors");
  const status = useTranslations("applications.status");
  const locale = useLocale();
  const [, startTransition] = useTransition();

  const [staged, setStaged] = useState<Record<string, StagedDecision | null>>(() =>
    Object.fromEntries(applicants.map((applicant) => [applicant.id, applicant.staged])),
  );
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set());
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<DeskFilter>("all");
  const [sort, setSort] = useState<DeskSort>({ key: "applied", direction: "asc" });
  const [page, setPage] = useState(1);
  const [openId, setOpenId] = useState<string | null>(null);
  const [drawerOrder, setDrawerOrder] = useState<readonly string[]>([]);
  const [sending, setSending] = useState(false);

  const decidable = (applicant: DeskApplicant) =>
    !archived && isDecidable(applicant.status);
  const counts = useMemo(() => countDesk(applicants, staged), [applicants, staged]);
  const visible = useMemo(
    () =>
      sortApplicants(
        applicants.filter(
          (applicant) =>
            matchesFilter(applicant, staged[applicant.id] ?? null, filter) &&
            matchesQuery(applicant, query),
        ),
        sort,
        locale,
      ),
    [applicants, staged, filter, query, sort, locale],
  );
  const pages = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
  const current = Math.min(page, pages);
  const rows = visible.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);
  const selectable = rows.filter(decidable);
  const chosen = selectable.filter((applicant) => selected.has(applicant.id));
  const allChosen = selectable.length > 0 && chosen.length === selectable.length;
  const openIndex = openId ? drawerOrder.indexOf(openId) : -1;
  const open = openId
    ? (applicants.find((applicant) => applicant.id === openId) ?? null)
    : null;

  function nameOf(id: string) {
    return applicants.find((applicant) => applicant.id === id)?.name ?? id;
  }

  function stage(ids: readonly string[], decision: StagedDecision | null) {
    if (ids.length === 0) return;
    const before = Object.fromEntries(ids.map((id) => [id, staged[id] ?? null]));
    setStaged((state) => ({
      ...state,
      ...Object.fromEntries(ids.map((id) => [id, decision])),
    }));
    startTransition(async () => {
      const result = await stageDecisionsAction(
        vacancyId,
        ids.map((applicationId) => ({ applicationId, decision })),
      );
      if (result.ok) return;
      setStaged((state) => ({ ...state, ...before }));
      toast.error(errors.has(result.code) ? errors(result.code) : errors("generic"));
    });
  }

  function toggleSort(key: DeskSort["key"]) {
    setSort((state) =>
      state.key === key
        ? { key, direction: state.direction === "asc" ? "desc" : "asc" }
        : { key, direction: "asc" },
    );
  }

  function openPanel(id: string) {
    setDrawerOrder(visible.map((applicant) => applicant.id));
    setOpenId(id);
  }

  function goTo(index: number) {
    const id = drawerOrder[index];
    if (!id) return;
    setOpenId(id);
    const position = visible.findIndex((applicant) => applicant.id === id);
    if (position >= 0) setPage(Math.floor(position / PAGE_SIZE) + 1);
  }

  const sortIcon = (key: DeskSort["key"]) =>
    sort.key !== key ? ArrowUpDown : sort.direction === "asc" ? ArrowUp : ArrowDown;
  const ariaSort = (key: DeskSort["key"]) =>
    sort.key === key ? (sort.direction === "asc" ? "ascending" : "descending") : "none";
  const sortButton = (column: DeskSort["key"]) => {
    const Icon = sortIcon(column);
    return (
      <button
        type="button"
        onClick={() => toggleSort(column)}
        className="inline-flex min-h-8 items-center gap-1.5 rounded-md font-semibold hover:text-primary-ink"
      >
        {t(`columns.${column}`)}
        <Icon aria-hidden="true" className="size-3.5" />
      </button>
    );
  };

  return (
    <section aria-labelledby="desk-title" className="flex min-w-0 flex-col">
      <div className="min-w-0 sheet">
        <header className="flex flex-col gap-3 border-b border-border px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <h2 id="desk-title" className="text-section text-ink">
              {t("title", { count: counts.total })}
            </h2>
            <p className="tabular mt-0.5 text-sm text-ink-muted">
              {[
                t("pending", { count: counts.pending }),
                capacity === null
                  ? t("acceptedCount", { count: counts.accepted })
                  : t("places", { filled: counts.accepted, capacity }),
              ].join(" · ")}
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <label className="relative min-w-0 sm:w-64">
              <span className="sr-only">{t("search")}</span>
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-ink-muted"
              />
              <input
                type="search"
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setPage(1);
                }}
                placeholder={t("search")}
                autoComplete="off"
                className={cn(compactInputClass, "pl-10")}
              />
            </label>
            <label className="relative">
              <span className="sr-only">{t("filterLabel")}</span>
              <select
                value={filter}
                onChange={(event) => {
                  setFilter(event.target.value as DeskFilter);
                  setPage(1);
                }}
                className={cn(
                  compactInputClass,
                  "appearance-none pr-9 font-semibold sm:w-48",
                )}
              >
                {DESK_FILTERS.map((value) => (
                  <option key={value} value={value}>
                    {t(`filters.${value}`)}
                  </option>
                ))}
              </select>
              <ArrowUpDown
                aria-hidden="true"
                className="pointer-events-none absolute top-1/2 right-3.5 size-3.5 -translate-y-1/2 text-ink-muted"
              />
            </label>
          </div>
        </header>

        {chosen.length > 0 ? (
          <div
            role="toolbar"
            aria-label={t("bulk.label")}
            className="bar-rise flex flex-wrap items-center gap-2 border-b border-border bg-surface-soft px-5 py-2.5"
          >
            <span className="tabular mr-2 text-sm font-semibold text-primary-ink">
              {t("bulk.selected", { count: chosen.length })}
            </span>
            <Button
              type="button"
              variant="outline"
              size="row"
              onClick={() =>
                stage(
                  chosen.map((item) => item.id),
                  "accept",
                )
              }
            >
              <Check aria-hidden="true" />
              {t("bulk.accept")}
            </Button>
            <Button
              type="button"
              variant="danger-outline"
              size="row"
              onClick={() =>
                stage(
                  chosen.map((item) => item.id),
                  "reject",
                )
              }
            >
              <X aria-hidden="true" />
              {t("bulk.reject")}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="row"
              onClick={() =>
                stage(
                  chosen.map((item) => item.id),
                  "hold",
                )
              }
            >
              <Pause aria-hidden="true" />
              {t("bulk.hold")}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="row"
              onClick={() =>
                stage(
                  chosen.map((item) => item.id),
                  null,
                )
              }
            >
              <Undo2 aria-hidden="true" />
              {t("bulk.undo")}
            </Button>
            <button
              type="button"
              onClick={() => setSelected(new Set())}
              className="ml-auto min-h-9 rounded-md px-2 text-sm font-semibold text-primary-ink hover:underline"
            >
              {t("bulk.clear")}
            </button>
          </div>
        ) : null}

        {selectable.length > 0 ? (
          <label className="flex min-h-11 items-center gap-3 border-b border-border px-5 text-sm font-semibold text-ink md:hidden">
            <input
              type="checkbox"
              checked={allChosen}
              onChange={(event) => {
                const next = new Set(selected);
                for (const applicant of selectable) {
                  if (event.target.checked) next.add(applicant.id);
                  else next.delete(applicant.id);
                }
                setSelected(next);
              }}
              className="size-4 accent-action"
            />
            {t("selectPage")}
          </label>
        ) : null}

        {applicants.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <p className="text-section text-ink">{t("empty.title")}</p>
            <p className="mx-auto mt-1 max-w-md text-sm text-ink-muted">
              {t("empty.description")}
            </p>
          </div>
        ) : rows.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <p className="text-section text-ink">{t("noMatches")}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <caption className="sr-only">{t("caption")}</caption>
              <thead className="hidden bg-surface-sunk/45 text-left text-xs text-ink-muted md:table-header-group">
                <tr className="border-b border-border">
                  <th scope="col" className="w-12 py-2 pl-5">
                    <input
                      type="checkbox"
                      aria-label={t("selectPage")}
                      checked={allChosen}
                      disabled={selectable.length === 0}
                      onChange={(event) => {
                        const next = new Set(selected);
                        for (const applicant of selectable) {
                          if (event.target.checked) next.add(applicant.id);
                          else next.delete(applicant.id);
                        }
                        setSelected(next);
                      }}
                      className="size-4 accent-action"
                    />
                  </th>
                  <th scope="col" aria-sort={ariaSort("name")} className="py-2 pr-4">
                    {sortButton("name")}
                  </th>
                  <th scope="col" aria-sort={ariaSort("applied")} className="py-2 pr-4">
                    {sortButton("applied")}
                  </th>
                  <th scope="col" aria-sort={ariaSort("status")} className="py-2 pr-4">
                    {sortButton("status")}
                  </th>
                  <th scope="col" className="py-2 pr-5 font-semibold">
                    {t("columns.decision")}
                  </th>
                </tr>
              </thead>
              <tbody className="block md:table-row-group">
                {rows.map((applicant) => {
                  const decision = staged[applicant.id] ?? null;
                  const chip = applicationStatus(applicant.status);
                  const canDecide = decidable(applicant);
                  return (
                    <tr
                      key={applicant.id}
                      data-selected={selected.has(applicant.id) || undefined}
                      className="grid grid-cols-[2.75rem_minmax(0,1fr)] gap-y-2 border-b border-border px-0 py-3 last:border-0 data-selected:bg-surface-soft/60 md:table-row md:py-0"
                    >
                      <td className="row-span-3 pl-5 md:py-3">
                        {canDecide ? (
                          <input
                            type="checkbox"
                            aria-label={t("select", { name: applicant.name })}
                            checked={selected.has(applicant.id)}
                            onChange={(event) => {
                              const next = new Set(selected);
                              if (event.target.checked) next.add(applicant.id);
                              else next.delete(applicant.id);
                              setSelected(next);
                            }}
                            className="mt-2.5 size-4 accent-action md:mt-0"
                          />
                        ) : null}
                      </td>
                      <td className="pr-5 md:py-3 md:pr-4">
                        <span className="flex min-w-0 items-center gap-3">
                          <Avatar
                            name={applicant.name}
                            src={applicant.avatarUrl ?? undefined}
                            size="md"
                            person
                          />
                          <span className="min-w-0">
                            <button
                              type="button"
                              onClick={() => openPanel(applicant.id)}
                              className="block max-w-full truncate text-left font-semibold text-ink hover:text-primary-ink hover:underline"
                            >
                              {applicant.name}
                            </button>
                            {applicant.username ? (
                              <span className="block truncate text-xs text-ink-muted">
                                @{applicant.username}
                              </span>
                            ) : null}
                          </span>
                        </span>
                      </td>
                      <td className="tabular pr-5 text-ink-muted md:py-3 md:pr-4 md:whitespace-nowrap">
                        <span className="md:hidden">{t("appliedShort")} </span>
                        {applicant.appliedLabel || "—"}
                      </td>
                      <td className="col-start-2 pr-5 md:py-3 md:pr-4">
                        <StatusBadge
                          label={status(applicant.status)}
                          tone={chip.tone}
                          icon={chip.icon}
                        />
                      </td>
                      <td className="col-start-2 pr-5 md:w-64 md:py-3">
                        {canDecide ? (
                          <span className="flex items-center gap-3">
                            <DecisionSelect
                              value={decision}
                              onChange={(next) => stage([applicant.id], next)}
                              label={t("decisionFor", { name: applicant.name })}
                              className="max-w-44"
                            />
                            {decision === "accept" || decision === "reject" ? (
                              <span className="inline-flex items-center gap-1.5 text-xs whitespace-nowrap text-accent-ink">
                                <span
                                  aria-hidden="true"
                                  className="size-1.5 rounded-full bg-accent"
                                />
                                {t("notSent")}
                              </span>
                            ) : null}
                          </span>
                        ) : applicant.decidedLabel &&
                          (applicant.status === "accepted" ||
                            applicant.status === "rejected" ||
                            applicant.status === "closed") ? (
                          <span className="inline-flex items-center gap-2 text-xs text-ink-muted">
                            <Mail aria-hidden="true" className="size-4" />
                            {t("sentOn", { when: applicant.decidedLabel })}
                          </span>
                        ) : (
                          <span className="text-ink-muted">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {visible.length > PAGE_SIZE ? (
          <nav
            aria-label={t("pagination.label")}
            className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-5 py-3"
          >
            <span className="tabular text-sm text-ink-muted">
              {t("pagination.showing", {
                from: (current - 1) * PAGE_SIZE + 1,
                to: Math.min(current * PAGE_SIZE, visible.length),
                total: visible.length,
              })}
            </span>
            <span className="flex items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                disabled={current === 1}
                onClick={() => setPage(current - 1)}
                aria-label={t("pagination.previous")}
              >
                <ChevronLeft aria-hidden="true" />
              </Button>
              {pageWindow(current, pages).map((number, index) =>
                number === null ? (
                  <span key={`gap-${index}`} className="px-1 text-ink-muted">
                    …
                  </span>
                ) : (
                  <button
                    key={number}
                    type="button"
                    aria-current={number === current ? "page" : undefined}
                    onClick={() => setPage(number)}
                    className={cn(
                      "tabular grid size-9 place-items-center rounded-full text-sm font-semibold",
                      number === current
                        ? "bg-action text-knockout"
                        : "text-ink-muted hover:bg-surface-sunk hover:text-ink",
                    )}
                  >
                    {number}
                  </button>
                ),
              )}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                disabled={current === pages}
                onClick={() => setPage(current + 1)}
                aria-label={t("pagination.next")}
              >
                <ChevronRight aria-hidden="true" />
              </Button>
            </span>
          </nav>
        ) : null}
      </div>

      {counts.pending > 0 && !archived ? (
        <div className="sticky bottom-3 z-20 mt-3">
          <div
            className={cn(
              "flex flex-col gap-3 rounded-xl border px-5 py-3 sm:flex-row sm:items-center sm:justify-between",
              counts.ready > 0
                ? "border-primary-ink/25 bg-surface-raised shadow-raised"
                : "border-border bg-surface",
            )}
          >
            <p className="text-sm text-ink-muted">
              {counts.ready > 0 ? (
                <span className="tabular font-semibold text-ink">
                  {[
                    t("footer.ready", { count: counts.ready }),
                    ...(counts.hold > 0
                      ? [t("footer.hold", { count: counts.hold })]
                      : []),
                  ].join(" · ")}
                </span>
              ) : (
                t("footer.idle")
              )}
              <span className="mt-0.5 block text-xs">{t("footer.help")}</span>
            </p>
            <Button
              type="button"
              size="sm"
              disabled={counts.ready === 0}
              onClick={() => setSending(true)}
            >
              <Send aria-hidden="true" />
              {t("footer.review")}
            </Button>
          </div>
        </div>
      ) : null}

      <SendDecisionsDialog
        open={sending}
        onOpenChange={setSending}
        counts={counts}
        capacity={capacity}
        send={() => sendDecisionsAction(vacancyId)}
        nameOf={nameOf}
      />

      <ApplicantDrawer
        applicant={open}
        decision={open ? (staged[open.id] ?? null) : null}
        decidable={open ? decidable(open) : false}
        position={{ index: Math.max(openIndex, 0), total: drawerOrder.length }}
        onDecide={(next) => {
          if (open) stage([open.id], next);
        }}
        onPrevious={openIndex > 0 ? () => goTo(openIndex - 1) : null}
        onNext={
          openIndex >= 0 && openIndex < drawerOrder.length - 1
            ? () => goTo(openIndex + 1)
            : null
        }
        onClose={() => setOpenId(null)}
      />
    </section>
  );
}
