import {
  Ban,
  BadgeCheck,
  CalendarCheck,
  CircleCheck,
  CircleX,
  Lock,
  Undo2,
} from "lucide-react";
import { getFormatter, getTranslations } from "next-intl/server";

import { StatusBadge, type Status } from "@/components/portal/status-badge";
import { Register } from "@/components/register/register";
import { Link } from "@/i18n/navigation";
import { volunteerNameOf } from "@/lib/applications/filters";
import type { Cleared } from "@/lib/queue/dashboard";
import { applicationHref, vacancyHref } from "@/lib/routing/routes";

type Mark = Status & { word: string };

export async function ClearedToday({ cleared }: { cleared: Cleared[] }) {
  const [t, format] = await Promise.all([getTranslations("desk"), getFormatter()]);

  const mark = (item: Cleared): Mark => {
    if (item.kind === "rollCall") {
      return { word: t("cleared.word.recorded"), tone: "person", icon: CalendarCheck };
    }
    if (item.kind === "vacancy") {
      return item.decision === "approved"
        ? { word: t("cleared.word.approved"), tone: "live", icon: BadgeCheck }
        : item.decision === "rejected"
          ? { word: t("cleared.word.rejected"), tone: "danger", icon: Ban }
          : { word: t("cleared.word.returned"), tone: "returned", icon: Undo2 };
    }
    return item.decision === "accepted"
      ? { word: t("cleared.word.accepted"), tone: "person", icon: CircleCheck }
      : item.decision === "closed"
        ? { word: t("cleared.word.closed"), tone: "final", icon: Lock }
        : { word: t("cleared.word.notSelected"), tone: "danger", icon: CircleX };
  };

  const link = "hover:text-primary-ink hover:underline";

  return (
    <Register
      id="cleared"
      title={t("cleared.title")}
      count={cleared.length}
      countLabel={t("cleared.countLabel")}
    >
      {cleared.length === 0 ? (
        <p className="px-4 py-4 text-[0.8125rem] text-ink-muted">
          {t("cleared.empty")}
        </p>
      ) : (
        <ol className="divide-y divide-border">
          {cleared.map((item) => {
            const stamp = mark(item);
            const key =
              item.kind === "vacancy"
                ? `vacancy-${item.vacancy.id}`
                : item.kind === "application"
                  ? `application-${item.application.id}`
                  : `roll-${item.vacancyId}`;
            return (
              <li key={key} className="grid gap-1 px-4 py-2.5">
                <div className="flex items-center justify-between gap-3">
                  <StatusBadge label={stamp.word} tone={stamp.tone} icon={stamp.icon} />
                  <time
                    dateTime={item.at}
                    className="tabular shrink-0 text-xs text-ink-muted"
                  >
                    {format.dateTime(new Date(item.at), "time")}
                  </time>
                </div>
                <p className="text-sm font-semibold break-words text-ink">
                  {item.kind === "vacancy" ? (
                    <Link href={vacancyHref(item.vacancy.id)} className={link}>
                      {item.vacancy.title}
                    </Link>
                  ) : item.kind === "application" ? (
                    <Link href={applicationHref(item.application.id)} className={link}>
                      {volunteerNameOf(item.application) || t("decide.unnamed")}
                    </Link>
                  ) : (
                    <Link href={vacancyHref(item.vacancyId)} className={link}>
                      {item.title}
                    </Link>
                  )}
                </p>
                {item.kind === "application" || item.kind === "rollCall" ? (
                  <p className="text-[0.8125rem] text-ink-muted">
                    {item.kind === "application"
                      ? (item.application.opportunity?.title ?? "")
                      : t("cleared.rollCall", {
                          attended: item.attended,
                          other: item.other,
                        })}
                  </p>
                ) : null}
              </li>
            );
          })}
        </ol>
      )}
    </Register>
  );
}
