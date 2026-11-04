import { z } from "zod";

export const REPORT_STATUSES = ["open", "resolved"] as const;
export const REPORT_VIEWS = ["open", "resolved", "all"] as const;
export type ReportView = (typeof REPORT_VIEWS)[number];
const personSchema = z.object({
  id: z.uuid(),
  displayName: z.string().nullable(),
  username: z.string(),
});
export const reportSchema = z.object({
  id: z.uuid(),
  description: z.string().min(1).max(5_000),
  pagePath: z.string().min(1).max(2_048),
  status: z.enum(REPORT_STATUSES),
  version: z.number().int().positive(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
  reporter: personSchema,
  resolvedBy: personSchema.nullable(),
  resolvedAt: z.iso.datetime().nullable(),
});
export const reportPageSchema = z.object({
  items: z.array(reportSchema),
  total: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  pageSize: z.number().int().min(1).max(100),
});
export const reportStatusSchema = z.object({
  id: z.uuid(),
  status: z.enum(REPORT_STATUSES),
  version: z.coerce.number().int().positive(),
});
export type Report = z.infer<typeof reportSchema>;

export function reportPageHref(
  pagePath: string,
  rawOrigin: string | undefined,
): string | null {
  if (!rawOrigin || !pagePath.startsWith("/") || pagePath.startsWith("//")) return null;
  try {
    const decoded = decodeURIComponent(pagePath);
    if (
      /[\\?#\s]/u.test(decoded) ||
      [...decoded].some(
        (char) => char.charCodeAt(0) < 32 || char.charCodeAt(0) === 127,
      ) ||
      decoded.startsWith("//") ||
      /%[a-f0-9]{2}/i.test(decoded)
    )
      return null;
    const origin = new URL(rawOrigin);
    if (
      !["https:", "http:"].includes(origin.protocol) ||
      origin.username ||
      origin.password
    )
      return null;
    const target = new URL(pagePath, origin.origin);
    return target.origin === origin.origin ? target.toString() : null;
  } catch {
    return null;
  }
}
