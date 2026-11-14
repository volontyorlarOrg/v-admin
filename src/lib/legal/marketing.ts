export type PolicyPage = "privacy" | "terms";

export function policyHref(
  locale: string,
  page: PolicyPage,
  rawOrigin = process.env.NEXT_PUBLIC_MARKETING_URL,
): string | null {
  const raw = rawOrigin?.trim();
  if (!raw) return null;
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    return new URL(`/${locale}/${page}`, url.origin).toString();
  } catch {
    return null;
  }
}
