import { redirect } from "next/navigation";

import { getSession } from "@/lib/auth/session.server";
import { holdsPortalRole } from "@/lib/auth/session";
import {
  ENTRY_ROUTE,
  HOME_ROUTE,
  PASSWORD_ROUTE,
  localePath,
} from "@/lib/routing/routes";
import type { Locale } from "@/i18n/routing";

export const dynamic = "force-dynamic";

export default async function LocaleIndex({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  const session = await getSession();

  if (!session || !holdsPortalRole(session)) {
    redirect(localePath(locale as Locale, ENTRY_ROUTE));
  }

  redirect(
    localePath(
      locale as Locale,
      session.passwordChangeRequired ? PASSWORD_ROUTE : HOME_ROUTE,
    ),
  );
}
