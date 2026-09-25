import { getFormatter, getTranslations } from "next-intl/server";

import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Link } from "@/i18n/navigation";
import type { AuditEvent } from "@/lib/api/schemas";
import { subjectOf } from "@/lib/audit/describe";
import { auditActionKey } from "@/lib/domain/audit-actions";

function metadataOf(event: AuditEvent): Record<string, unknown> {
  return event.metadata && typeof event.metadata === "object"
    ? (event.metadata as Record<string, unknown>)
    : {};
}

export async function AuditTable({
  events,
  caption,
  actors,
  coordinatorIds,
  showActor = true,
}: {
  events: readonly AuditEvent[];
  caption: string;
  actors?: ReadonlyMap<string, string>;
  coordinatorIds?: ReadonlySet<string>;
  showActor?: boolean;
}) {
  const [t, attendance, format] = await Promise.all([
    getTranslations("audit"),
    getTranslations("attendance"),
    getFormatter(),
  ]);

  const actionOf = (action: string) => {
    const key = `actions.${auditActionKey(action)}`;
    return t.has(key) ? t(key) : action;
  };

  const detailOf = (event: AuditEvent) => {
    const metadata = metadataOf(event);
    if (
      event.action === "attendance.resolved" &&
      typeof metadata.outcome === "string"
    ) {
      return attendance.has(`outcome.${metadata.outcome}`)
        ? attendance(`outcome.${metadata.outcome}`)
        : null;
    }
    if (
      event.action === "application.closed" &&
      metadata.reason === "opportunity.archived"
    ) {
      return t("details.closedByArchive");
    }
    if (event.action === "application.accepted" && metadata.automatic === true) {
      return t("details.automatic");
    }
    if (event.action === "coordinator.removed" && metadata.reassignToCoordinatorId) {
      return t("details.reassigned");
    }
    return null;
  };

  return (
    <Table>
      <TableCaption className="sr-only">{caption}</TableCaption>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead scope="col">{t("table.when")}</TableHead>
          <TableHead scope="col">{t("table.action")}</TableHead>
          <TableHead scope="col">{t("table.entity")}</TableHead>
          {showActor ? <TableHead scope="col">{t("table.actor")}</TableHead> : null}
        </TableRow>
      </TableHeader>
      <TableBody>
        {events.map((event) => {
          const subject = subjectOf(event, coordinatorIds);
          const detail = detailOf(event);
          return (
            <TableRow key={event.id}>
              <TableCell className="tabular whitespace-nowrap text-ink-muted">
                {format.dateTime(new Date(event.createdAt), "stamp")}
              </TableCell>
              <TableCell>
                <span className="font-semibold text-ink">{actionOf(event.action)}</span>
                {detail ? (
                  <span className="mt-0.5 block text-xs text-ink-muted">{detail}</span>
                ) : null}
              </TableCell>
              <TableCell>
                {subject.href ? (
                  <Link
                    href={subject.href}
                    className="text-primary-ink hover:underline"
                  >
                    {t(`subjects.${subject.kind}`)}
                  </Link>
                ) : (
                  <span className="text-ink-muted">
                    {t(`subjects.${subject.kind}`)}
                  </span>
                )}
              </TableCell>
              {showActor ? (
                <TableCell className="text-ink-muted">
                  {event.actorUserId
                    ? (actors?.get(event.actorUserId) ?? t("someone"))
                    : t("unknownActor")}
                </TableCell>
              ) : null}
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
