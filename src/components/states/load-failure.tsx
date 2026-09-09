import {
  CircleSlash,
  Clock,
  FileQuestion,
  KeyRound,
  PlugZap,
  ServerCog,
  TriangleAlert,
} from "lucide-react";
import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";

import { StatePanel } from "@/components/states/state-panel";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { endpoints } from "@/lib/api/endpoints";
import type { Loaded } from "@/lib/api/load";
import { ENTRY_ROUTE, PASSWORD_ROUTE, navHref } from "@/lib/routing/routes";

type Failure = Exclude<Loaded<unknown>, { state: "ready" }>;

const ICONS: Record<Failure["state"], ReactNode> = {
  awaitingContract: <PlugZap aria-hidden="true" className="size-6" />,
  denied: <CircleSlash aria-hidden="true" className="size-6" />,
  expired: <Clock aria-hidden="true" className="size-6" />,
  passwordChangeRequired: <KeyRound aria-hidden="true" className="size-6" />,
  missing: <FileQuestion aria-hidden="true" className="size-6" />,
  unconfigured: <ServerCog aria-hidden="true" className="size-6" />,
  failed: <TriangleAlert aria-hidden="true" className="size-6" />,
};

export async function LoadFailure({ failure }: { failure: Failure }) {
  const t = await getTranslations("states");
  const errors = await getTranslations("errors");

  if (failure.state === "awaitingContract") {
    const endpoint = endpoints[failure.endpoint as keyof typeof endpoints];
    return (
      <StatePanel
        role="status"
        tone="notice"
        icon={ICONS.awaitingContract}
        title={t("awaitingContract.title")}
        description={t("awaitingContract.description", {
          endpoint: `${endpoint.method} ${endpoint.path}`,
        })}
      />
    );
  }

  if (failure.state === "expired") {
    return (
      <StatePanel
        role="alert"
        icon={ICONS.expired}
        title={t("expired.title")}
        description={t("expired.description")}
        actions={
          <Button size="sm" asChild>
            <Link href={`${navHref(ENTRY_ROUTE)}?session=expired`}>
              {t("expired.action")}
            </Link>
          </Button>
        }
      />
    );
  }

  if (failure.state === "passwordChangeRequired") {
    return (
      <StatePanel
        role="alert"
        tone="notice"
        icon={ICONS.passwordChangeRequired}
        title={t("passwordChangeRequired.title")}
        description={t("passwordChangeRequired.description")}
        actions={
          <Button size="sm" asChild>
            <Link href={navHref(PASSWORD_ROUTE)}>
              {t("passwordChangeRequired.action")}
            </Link>
          </Button>
        }
      />
    );
  }

  if (failure.state === "denied") {
    return (
      <StatePanel
        role="alert"
        icon={ICONS.denied}
        title={t("denied.title")}
        description={t("denied.description")}
      />
    );
  }

  if (failure.state === "missing") {
    return (
      <StatePanel
        role="status"
        icon={ICONS.missing}
        title={t("missing.title")}
        description={t("missing.description")}
      />
    );
  }

  if (failure.state === "unconfigured") {
    return (
      <StatePanel
        role="alert"
        tone="danger"
        icon={ICONS.unconfigured}
        title={t("unconfigured.title")}
        description={t("unconfigured.description")}
      />
    );
  }

  return (
    <StatePanel
      role="alert"
      tone="danger"
      icon={ICONS.failed}
      title={t("failed.title")}
      description={
        errors.has(failure.code) ? errors(failure.code) : t("failed.description")
      }
    />
  );
}
