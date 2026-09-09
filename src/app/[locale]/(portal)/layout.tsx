import { setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";

import { PortalShell } from "@/components/portal/portal-shell";
import { holdsPortalRole, toPublicSession } from "@/lib/auth/session";
import { clearSession, getSession } from "@/lib/auth/session.server";
import { ENTRY_ROUTE, localePath } from "@/lib/routing/routes";
import type { Locale } from "@/i18n/routing";

export const dynamic = "force-dynamic";

export default async function PortalLayout({
  children,
  params,
}: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await getSession();

  if (!session) {
    redirect(`${localePath(locale as Locale, ENTRY_ROUTE)}?session=expired`);
  }

  if (!holdsPortalRole(session)) {
    await clearSession();
    redirect(`${localePath(locale as Locale, ENTRY_ROUTE)}?session=wrongRole`);
  }

  return (
    <PortalShell locale={locale as Locale} session={toPublicSession(session)}>
      {children}
    </PortalShell>
  );
}
