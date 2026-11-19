import { z } from "zod";

export const EXPORT_LISTS = ["applications", "attendance"] as const;
export type ExportList = (typeof EXPORT_LISTS)[number];

export const EXPORT_FORMATS = ["pdf", "xlsx", "google_sheets", "txt"] as const;
export type ExportFormat = (typeof EXPORT_FORMATS)[number];
export type FileFormat = Exclude<ExportFormat, "google_sheets">;

export const EXPORT_FIELDS = [
  "fullName",
  "telegram",
  "phone",
  "username",
  "region",
  "hometownRegion",
  "city",
  "school",
  "gradeYear",
  "languages",
  "instagram",
  "linkedin",
  "links",
  "bio",
  "applicationStatus",
  "appliedAt",
  "attendance",
  "hours",
  "placement",
  "addedManually",
] as const;
export type ExportField = (typeof EXPORT_FIELDS)[number];

export const FIELD_GROUPS = {
  contact: [
    "fullName",
    "telegram",
    "phone",
    "username",
    "instagram",
    "linkedin",
    "links",
  ],
  profile: [
    "region",
    "hometownRegion",
    "city",
    "school",
    "gradeYear",
    "languages",
    "bio",
  ],
  participation: [
    "applicationStatus",
    "appliedAt",
    "attendance",
    "hours",
    "placement",
    "addedManually",
  ],
} as const satisfies Record<string, readonly ExportField[]>;
export type FieldGroup = keyof typeof FIELD_GROUPS;

const fieldOption = z.object({
  key: z.enum(EXPORT_FIELDS),
  selected: z.boolean(),
});

export const exportOptionsSchema = z.object({
  formats: z.array(z.string()),
  applications: z.array(fieldOption),
  attendance: z.array(fieldOption),
  googleSheets: z.boolean(),
});
export type ExportOptions = z.infer<typeof exportOptionsSchema>;

export const googleAuthorizationSchema = z.object({
  authorizationUrl: z.url(),
  state: z.string().min(1),
});

export const googleSheetSchema = z.object({
  spreadsheetId: z.string(),
  spreadsheetUrl: z.url(),
  rows: z.number().int(),
  list: z.enum(EXPORT_LISTS),
  opportunityId: z.string(),
});

export type ExportRequest = {
  vacancyId: string;
  list: ExportList;
  fields: ExportField[];
  filter?: string;
  query?: string;
};

export const exportNoticeSchema = z.discriminatedUnion("status", [
  z.object({
    status: z.literal("created"),
    vacancyId: z.string(),
    url: z.url().refine((value) => value.startsWith("https://docs.google.com/")),
    rows: z.number().int(),
  }),
  z.object({
    status: z.literal("failed"),
    vacancyId: z.string(),
    code: z.string().max(80),
  }),
]);
export type ExportNotice = z.infer<typeof exportNoticeSchema>;

export const sheetsStartSchema = z.object({
  state: z.string().min(1),
  vacancyId: z.string(),
  list: z.enum(EXPORT_LISTS),
  locale: z.string(),
  title: z.string().max(300),
});
export type SheetsStart = z.infer<typeof sheetsStartSchema>;

export const sheetsGrantSchema = sheetsStartSchema.extend({
  code: z.string().min(1).max(2048),
});
export type SheetsGrant = z.infer<typeof sheetsGrantSchema>;

export const SHEETS_START_COOKIE = "admin_sheets_start";
export const SHEETS_GRANT_COOKIE = "admin_sheets_grant";
export const EXPORT_NOTICE_COOKIE = "admin_export_notice";
export const SHEETS_COOKIE_PATH = "/api/exports/google";

export function readJsonCookie<T>(value: string | undefined, schema: z.ZodType<T>) {
  if (!value) return null;
  try {
    const parsed = schema.safeParse(JSON.parse(value));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}
