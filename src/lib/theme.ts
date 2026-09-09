import { readPreferenceCookie, writePreferenceCookie } from "@/lib/preferences";

export type Theme = "light" | "dark";

export const THEME_COOKIE_NAME = "theme";

export const THEME_BOOT_SCRIPT = `(function(){var r=document.documentElement;try{var m=document.cookie.match(/(?:^|;\\s*)${THEME_COOKIE_NAME}=(dark|light)/),v=m&&m[1];r.dataset.theme=(v?v==="dark":matchMedia("(prefers-color-scheme: dark)").matches)?"dark":"light"}catch(e){}try{if(!matchMedia("(prefers-reduced-motion: reduce)").matches)r.dataset.motion=""}catch(e){}})()`;

export function storedTheme(): Theme | null {
  const value = readPreferenceCookie(THEME_COOKIE_NAME);
  return value === "dark" || value === "light" ? value : null;
}

export function preferredTheme(): Theme {
  return (
    storedTheme() ??
    (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
  );
}

export function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  writePreferenceCookie(THEME_COOKIE_NAME, theme);
}

export function readTheme(): Theme {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

export function subscribeToTheme(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });
  return () => observer.disconnect();
}
