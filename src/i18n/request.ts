import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";

import { EVENT_TIME_ZONE } from "@/lib/datetime";

import { routing } from "./routing";

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default,
    timeZone: EVENT_TIME_ZONE,
    formats: {
      dateTime: {
        day: { day: "numeric", month: "short" },
        date: { day: "numeric", month: "long", year: "numeric" },
        stamp: {
          day: "numeric",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        },
        time: { hour: "2-digit", minute: "2-digit" },
      },
    },
  };
});
