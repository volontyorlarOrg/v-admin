import { ArrowRight } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { AuditTimeline } from "@/components/audit/audit-timeline";
import { Register, RegisterNote } from "@/components/register/register";
import { LoadFailure } from "@/components/states/load-failure";
import { Link } from "@/i18n/navigation";
import { failureOf, isReady, type Loaded } from "@/lib/api/load";
import type { AuditEvent } from "@/lib/api/schemas";
import type { AuditDirectory } from "@/lib/audit/directory";

export async function RecentActivity({
  recent,
  directory,
  now,
  href,
  showActor = true,
}: {
  recent: Loaded<{ items: readonly AuditEvent[] }>;
  directory: AuditDirectory;
  now: Date;
  href: string;
  showActor?: boolean;
}) {
  const t = await getTranslations("audit");
  const failure = failureOf(recent);
  const events = isReady(recent) ? recent.data.items : [];

  return (
    <Register
      id="activity"
      title={t("feed.title")}
      description={t("feed.description")}
      actions={
        <Link
          href={href}
          className="inline-flex min-h-8 items-center gap-1 text-sm font-semibold text-primary-ink hover:underline"
        >
          {t("feed.all")}
          <ArrowRight aria-hidden="true" className="size-4" />
        </Link>
      }
    >
      {failure ? (
        <div className="p-5">
          <LoadFailure failure={failure} />
        </div>
      ) : events.length === 0 ? (
        <RegisterNote title={t("feed.empty")} />
      ) : (
        <AuditTimeline
          id="recent"
          events={events}
          directory={directory}
          compact
          showActor={showActor}
          now={now}
        />
      )}
    </Register>
  );
}
