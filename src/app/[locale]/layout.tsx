import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Onest, Source_Serif_4 } from "next/font/google";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { ThemeScript } from "@/components/portal/theme-script";
import { routing } from "@/i18n/routing";
import "../globals.css";

const onest = Onest({
  subsets: ["latin", "latin-ext", "cyrillic"],
  variable: "--font-onest",
  display: "swap",
});

const sourceSerif = Source_Serif_4({
  subsets: ["latin", "latin-ext", "cyrillic"],
  weight: ["400"],
  variable: "--font-source-serif",
  display: "swap",
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  const t = await getTranslations({ locale, namespace: "common" });

  return {
    title: {
      default: t("portalName"),
      template: `%s · ${t("portalName")}`,
    },
    applicationName: t("portalName"),
    robots: {
      index: false,
      follow: false,
      nocache: true,
      googleBot: { index: false, follow: false },
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  setRequestLocale(locale);

  return (
    <html
      lang={locale}
      data-theme="light"
      suppressHydrationWarning
      className={`${onest.variable} ${sourceSerif.variable} h-full`}
    >
      <head>
        <ThemeScript />
      </head>
      <body className="min-h-full">
        <NextIntlClientProvider messages={null}>{children}</NextIntlClientProvider>
      </body>
    </html>
  );
}
