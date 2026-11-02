import { getFormatter, getTranslations } from "next-intl/server";

import { Avatar } from "@/components/portal/avatar";
import { NavIcon } from "@/components/portal/nav-icon";
import { Link } from "@/i18n/navigation";
import type { AuditEvent } from "@/lib/api/schemas";
import { describeSubject } from "@/lib/audit/describe";
import { actorOf, type AuditActor, type AuditDirectory } from "@/lib/audit/directory";
import { detailsOf, groupByDay, type AuditDetail } from "@/lib/audit/timeline";
import { shiftDay, tashkentDay } from "@/lib/datetime";
import {
  AUDIT_FAMILY_ICONS,
  auditActionKey,
  auditFamilyOf,
} from "@/lib/domain/audit-actions";
import { IS_ADMIN_PORTAL } from "@/lib/portal";
import { cn } from "@/lib/utils";

const SELF_ROLE = IS_ADMIN_PORTAL ? "administrator" : "organization";

export async function AuditTimeline({
  id = "audit",
  events,
  directory,
  showActor = true,
  compact = false,
  now = new Date(),
}: {
  id?: string;
  events: readonly AuditEvent[];
  directory: AuditDirectory;
  showActor?: boolean;
  compact?: boolean;
  now?: Date;
}) {
  const [t, attendance, format] = await Promise.all([
    getTranslations("audit"),
    getTranslations("attendance"),
    getFormatter(),
  ]);

  const today = tashkentDay(now);
  const yesterday = shiftDay(today, -1);
  const thisYear = today.slice(0, 4);

  const dayLabel = (day: string) => {
    if (day === today) return t("day.today");
    if (day === yesterday) return t("day.yesterday");
    return format.dateTime(new Date(`${day}T12:00:00+05:00`), {
      weekday: "long",
      day: "numeric",
      month: "long",
      ...(day.startsWith(thisYear) ? {} : { year: "numeric" }),
    });
  };

  const actionOf = (action: string) => {
    const key = `actions.${auditActionKey(action)}`;
    return t.has(key) ? t(key) : action;
  };

  const detailOf = (detail: AuditDetail) => {
    if (detail.kind === "outcome") {
      const key = `outcome.${detail.outcome}`;
      return attendance.has(key) ? attendance(key) : null;
    }
    return t(`details.${detail.kind}`);
  };

  const actorName = (actor: AuditActor) =>
    actor.kind === "you"
      ? t("you")
      : actor.kind === "person"
        ? actor.name
        : actor.kind === "someone"
          ? t("someone")
          : t("unknownActor");

  const actorRole = (actor: AuditActor) =>
    actor.kind === "person"
      ? t(`roles.${actor.role}`)
      : actor.kind === "you"
        ? t(`roles.${SELF_ROLE}`)
        : null;

  const days = groupByDay(events);

  return (
    <div data-slot="audit-timeline" className="divide-y divide-border">
      {days.map((day) => {
        const headingId = `${id}-day-${day.day}`;
        return (
          <div key={day.day} role="group" aria-labelledby={headingId}>
            <header
              className={cn(
                "flex flex-wrap items-baseline gap-x-2 bg-surface-sunk/60 px-5",
                compact ? "py-1.5" : "py-2",
              )}
            >
              <h3
                id={headingId}
                className="text-sm font-semibold text-ink first-letter:uppercase"
              >
                {dayLabel(day.day)}
              </h3>
              <span className="tabular text-xs text-ink-muted">
                {t("day.count", { count: day.events.length })}
              </span>
            </header>
            <ol className="divide-y divide-border">
              {day.events.map((event) => {
                const subject = describeSubject(event, directory);
                const actor = actorOf(event, directory);
                const role = actorRole(actor);
                const details = detailsOf(event)
                  .map(detailOf)
                  .filter((detail): detail is string => Boolean(detail));
                const family = auditFamilyOf(event.action);
                const kind = t(`subjects.${subject.kind}`);
                return (
                  <li
                    key={event.id}
                    data-slot="audit-entry"
                    className={cn(
                      "grid grid-cols-[4.5rem_minmax(0,1fr)] gap-x-3 gap-y-2 px-5",
                      compact ? "py-2.5" : "py-3",
                      showActor && !compact
                        ? "sm:grid-cols-[4.5rem_2rem_minmax(0,1fr)_minmax(0,14rem)] sm:items-center"
                        : "sm:grid-cols-[4.5rem_2rem_minmax(0,1fr)] sm:items-center",
                    )}
                  >
                    <time
                      dateTime={event.createdAt}
                      className="tabular pt-0.5 text-sm whitespace-nowrap text-ink-muted sm:pt-0"
                    >
                      {format.dateTime(new Date(event.createdAt), "time")}
                    </time>
                    <span
                      aria-hidden="true"
                      className="hidden size-8 items-center justify-center rounded-md bg-surface-soft text-primary-ink sm:flex"
                    >
                      <NavIcon name={AUDIT_FAMILY_ICONS[family]} className="size-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold break-words text-ink">
                        {actionOf(event.action)}
                      </p>
                      <p className="mt-0.5 text-sm break-words text-ink-muted">
                        {subject.href ? (
                          <>
                            {subject.name ? <span>{kind} · </span> : null}
                            <Link
                              href={subject.href}
                              className="font-medium text-primary-ink hover:underline"
                            >
                              {subject.name ?? kind}
                            </Link>
                          </>
                        ) : (
                          <span>
                            {subject.name ? `${kind} · ${subject.name}` : kind}
                          </span>
                        )}
                        {showActor && compact ? (
                          <span>
                            {" · "}
                            {actorName(actor)}
                          </span>
                        ) : null}
                      </p>
                      {details.length > 0 ? (
                        <p className="mt-1.5 flex flex-wrap gap-1.5">
                          {details.map((detail) => (
                            <span
                              key={detail}
                              className="rounded-sm bg-surface-sunk px-1.5 py-0.5 text-xs text-ink-muted"
                            >
                              {detail}
                            </span>
                          ))}
                        </p>
                      ) : null}
                    </div>
                    {showActor && !compact ? (
                      <div className="col-start-2 flex min-w-0 items-center gap-2.5 sm:col-start-auto">
                        <Avatar
                          size="sm"
                          name={actor.kind === "person" ? actor.name : undefined}
                        />
                        <span className="min-w-0 text-sm">
                          <span className="block truncate text-ink">
                            {actorName(actor)}
                          </span>
                          {role ? (
                            <span className="block truncate text-xs text-ink-muted">
                              {role}
                            </span>
                          ) : null}
                        </span>
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ol>
          </div>
        );
      })}
    </div>
  );
}
