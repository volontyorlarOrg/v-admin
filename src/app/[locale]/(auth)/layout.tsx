import { getTranslations, setRequestLocale } from "next-intl/server";

import { BrandLockup } from "@/components/brand/logo";
import { CountryGround } from "@/components/portal/country-ground";
import { GroundWindow } from "@/components/portal/ground/ground-window";
import { LocaleSwitcher } from "@/components/portal/locale-switcher";
import { ThemeToggle } from "@/components/portal/theme-toggle";

export default async function AuthLayout({
  children,
  params,
}: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "common" });

  return (
    <div className="relative flex min-h-dvh flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:rounded-lg focus:bg-action focus:px-4 focus:py-3 focus:text-sm focus:font-semibold focus:text-knockout"
      >
        {t("skipToContent")}
      </a>

      <CountryGround variant="doorway" />

      <header className="flex min-h-16 items-center justify-between gap-4 px-4 sm:px-8">
        <BrandLockup name={t("organizationName")} portal={t("portalName")} />
        <div className="flex items-center gap-2">
          <LocaleSwitcher label={t("language")} className="w-40" />
          <ThemeToggle label={t("theme")} />
        </div>
      </header>

      <main
        id="main"
        className="flex flex-1 flex-col gap-2 px-4 pt-2 pb-10 sm:px-8 lg:flex-row lg:gap-12 lg:pt-[12vh] lg:pb-[9vh]"
      >
        <GroundWindow className="min-h-32 flex-1 [--ground-align-x:0.5] [--ground-align-y:1] lg:order-last lg:-mt-[7vh] lg:[--ground-align-y:0.55]" />
        <div className="mx-auto w-full max-w-md lg:mx-0 lg:ml-[8vw] lg:shrink-0 lg:self-start">
          {children}
        </div>
      </main>
    </div>
  );
}
