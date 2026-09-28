"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { failedResult, type ActionResult } from "@/lib/api/action-result";
import {
  read,
  write,
  writeMultipartReturning,
  writeReturning,
} from "@/lib/api/gateway.server";
import {
  blogMediaSchema,
  blogPostSchema,
  blogPreviewSessionSchema,
  blogRevisionDetailSchema,
  blogSaveResultSchema,
} from "@/lib/api/schemas";
import { cleanBody, imageProblem } from "@/lib/blog/content";
import { blogHref } from "@/lib/routing/routes";

const localeSchema = z.enum(["uz", "ru", "en"]);
const idSchema = z.uuid();
const draftSchema = z.object({
  version: z.number().int().nonnegative(),
  title: z.string().max(180),
  summary: z.string().max(500),
  body: z.record(z.string(), z.unknown()),
  coverMediaId: z.string().nullable().optional(),
  coverAlt: z.string().max(300).optional(),
  coverCaption: z.string().max(500).optional(),
  coverCredit: z.string().max(200).optional(),
  seoDescription: z.string().max(160).optional(),
  authorName: z.string().max(100).optional(),
});

export async function createBlogAction(
  _previous: ActionResult,
  form: FormData,
): Promise<ActionResult> {
  const locale = localeSchema.safeParse(form.get("locale"));
  const title = z.string().trim().min(1).max(180).safeParse(form.get("title"));
  const uiLocale = localeSchema.safeParse(form.get("uiLocale"));
  if (!locale.success || !title.success || !uiLocale.success) {
    return failedResult("validationFailed");
  }
  const created = await writeReturning("createBlogPost", {
    schema: blogPostSchema,
    body: { locale: locale.data },
  });
  if (created.result.status !== "ok" || !created.data) return created.result;
  const saved = await writeReturning("saveBlogTranslation", {
    schema: blogSaveResultSchema,
    params: { id: created.data.id, locale: locale.data },
    body: {
      version: 0,
      title: title.data,
      summary: "",
      body: { type: "doc", content: [{ type: "paragraph", content: [] }] },
    },
  });
  revalidatePath("/", "layout");
  const editor = `/${uiLocale.data}${blogHref(created.data.id)}`;
  if (saved.result.status !== "ok")
    redirect(`${editor}?${new URLSearchParams({ title: title.data })}`);
  redirect(editor);
}

export async function saveBlogDraft(id: string, locale: string, input: unknown) {
  const parsedId = idSchema.safeParse(id);
  const parsedLocale = localeSchema.safeParse(locale);
  const parsed = draftSchema.safeParse(input);
  if (!parsedId.success || !parsedLocale.success || !parsed.success)
    return { result: failedResult("validationFailed") };
  return writeReturning("saveBlogTranslation", {
    schema: blogSaveResultSchema,
    params: { id: parsedId.data, locale: parsedLocale.data },
    body: { ...parsed.data, body: cleanBody(parsed.data.body) },
  });
}

export async function changeBlogSlug(id: string, slug: string) {
  if (!idSchema.safeParse(id).success || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug))
    return failedResult("validationFailed");
  const result = await write("updateBlogPost", { params: { id }, body: { slug } });
  if (result.status === "ok") revalidatePath("/", "layout");
  return result;
}

export async function publishBlogLanguage(
  id: string,
  locale: string,
  rightsConfirmed: boolean,
) {
  if (!idSchema.safeParse(id).success || !localeSchema.safeParse(locale).success)
    return failedResult("validationFailed");
  const result = await write("publishBlogTranslation", {
    params: { id, locale },
    body: { rightsConfirmed },
  });
  if (result.status === "ok") revalidatePath("/", "layout");
  return result;
}

export async function unpublishBlogLanguage(id: string, locale: string) {
  if (!idSchema.safeParse(id).success || !localeSchema.safeParse(locale).success)
    return failedResult("validationFailed");
  const result = await write("unpublishBlogTranslation", { params: { id, locale } });
  if (result.status === "ok") revalidatePath("/", "layout");
  return result;
}

export async function archiveBlog(id: string) {
  if (!idSchema.safeParse(id).success) return failedResult("validationFailed");
  const result = await write("archiveBlogPost", { params: { id } });
  if (result.status === "ok") revalidatePath("/", "layout");
  return result;
}

export async function restoreBlogDraft(
  id: string,
  locale: string,
  revisionId: string,
  version: number,
) {
  if (
    ![id, revisionId].every((value) => idSchema.safeParse(value).success) ||
    !localeSchema.safeParse(locale).success ||
    !Number.isInteger(version)
  )
    return { result: failedResult("validationFailed") };
  const response = await writeReturning("restoreBlogRevision", {
    schema: blogSaveResultSchema,
    params: { id, locale },
    body: { revisionId, version },
  });
  if (response.result.status === "ok") revalidatePath("/", "layout");
  return response;
}

export async function uploadBlogImage(id: string, form: FormData) {
  if (!idSchema.safeParse(id).success)
    return { result: failedResult("validationFailed") };
  const image = form.get("image");
  if (!(image instanceof File)) return { result: failedResult("blogImageInvalid") };
  const problem = imageProblem(image);
  if (problem)
    return {
      result: failedResult(
        problem === "size" ? "blogImageTooLarge" : "blogImageInvalid",
      ),
    };
  const body = new FormData();
  body.set("image", image);
  return writeMultipartReturning("uploadBlogMedia", { id }, body, blogMediaSchema);
}

export async function createBlogPreview(
  id: string,
  locale: string,
): Promise<{
  result: ActionResult;
  data?: z.infer<typeof blogPreviewSessionSchema>;
  origin?: string;
}> {
  if (!idSchema.safeParse(id).success || !localeSchema.safeParse(locale).success)
    return { result: failedResult("validationFailed") };
  const origin = process.env.BLOG_WEB_ORIGIN?.trim();
  if (!origin) return { result: failedResult("blogPreviewUnavailable") };
  try {
    const url = new URL(origin);
    if (!["http:", "https:"].includes(url.protocol) || url.origin !== origin)
      throw new Error();
  } catch {
    return { result: failedResult("blogPreviewUnavailable") };
  }
  const response = await writeReturning("blogPreviewSession", {
    schema: blogPreviewSessionSchema,
    params: { id, locale },
  });
  return { ...response, origin };
}

export async function getCurrentBlogPost(id: string) {
  if (!idSchema.safeParse(id).success) return null;
  return read("blogPost", { schema: blogPostSchema, params: { id } });
}

export async function getBlogRevision(id: string, revisionId: string) {
  if (!idSchema.safeParse(id).success || !idSchema.safeParse(revisionId).success)
    return null;
  return read("blogRevision", {
    schema: blogRevisionDetailSchema,
    params: { id, revisionId },
  });
}
