import { getTranslations, setRequestLocale } from "next-intl/server";

import { LocaleSwitcher } from "@/components/portal/locale-switcher";
import { ThemeToggle } from "@/components/portal/theme-toggle";
import { BrandLockup } from "@/components/brand/logo";

export default async function AuthLayout({
  children,
  params,
}: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "common" });

  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:rounded-lg focus:bg-action focus:px-4 focus:py-3 focus:text-sm focus:font-semibold focus:text-knockout"
      >
        {t("skipToContent")}
      </a>

      <header className="flex min-h-16 items-center justify-between gap-4 px-4 sm:px-6">
        <BrandLockup name={t("organizationName")} portal={t("portalName")} />
        <div className="flex items-center gap-2">
          <LocaleSwitcher label={t("language")} />
          <ThemeToggle label={t("theme")} />
        </div>
      </header>

      <main id="main" className="flex flex-1 flex-col justify-center px-4 py-8 sm:px-6">
        <div className="mx-auto w-full max-w-md">{children}</div>
      </main>
    </div>
  );
}
