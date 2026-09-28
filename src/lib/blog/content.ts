export const BLOG_LOCALES = ["uz", "ru", "en"] as const;
export type BlogLocale = (typeof BLOG_LOCALES)[number];

export const BLOG_IMAGE_MAX_BYTES = 4_194_304;
export const BLOG_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

export const BLOG_LIMITS = {
  title: 180,
  summary: 500,
  seo: 160,
  author: 100,
  alt: 300,
  caption: 500,
  credit: 200,
  slug: 100,
} as const;

export type BlogNode = {
  type: string;
  text?: string;
  attrs?: Record<string, unknown>;
  marks?: { type: string; attrs?: Record<string, unknown> }[];
  content?: BlogNode[];
};

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const EMAIL = /^[^\s@/:]+@[^\s@/:]+\.[^\s@/:]+$/;
const DOMAIN = /^(?:www\.)?[a-z0-9-]+(?:\.[a-z0-9-]+)+(?::\d+)?(?:[/?#]\S*)?$/i;
const CONTAINERS = new Set([
  "doc",
  "paragraph",
  "heading",
  "bulletList",
  "orderedList",
  "listItem",
  "blockquote",
]);
const MARKS = new Set(["bold", "italic", "link"]);

export function normalizeHref(
  input: string,
  siteOrigin?: string | null,
): string | null {
  const value = input.trim();
  if (!value || /\s/.test(value)) return null;
  if (/^mailto:/i.test(value)) return EMAIL.test(value.slice(7)) ? value : null;
  if (/^https?:\/\//i.test(value)) {
    try {
      const url = new URL(value);
      return url.hostname.includes(".") || url.hostname === "localhost" ? value : null;
    } catch {
      return null;
    }
  }
  if (value.startsWith("/") && !value.startsWith("//")) {
    if (!siteOrigin) return null;
    try {
      return new URL(value, siteOrigin).toString();
    } catch {
      return null;
    }
  }
  if (EMAIL.test(value)) return `mailto:${value}`;
  if (DOMAIN.test(value)) return normalizeHref(`https://${value}`);
  return null;
}

function cleanMarks(marks: BlogNode["marks"]) {
  const kept: NonNullable<BlogNode["marks"]> = [];
  for (const mark of marks ?? []) {
    if (!mark || !MARKS.has(mark.type)) continue;
    if (mark.type === "link") {
      const href =
        typeof mark.attrs?.href === "string" ? normalizeHref(mark.attrs.href) : null;
      if (!href) continue;
      kept.push({ type: "link", attrs: { ...mark.attrs, href } });
    } else kept.push({ type: mark.type });
  }
  return kept;
}

function textOf(node: BlogNode): string {
  if (typeof node.text === "string") return node.text;
  return (node.content ?? []).map(textOf).join("");
}

function cleanNode(node: BlogNode, depth: number): BlogNode[] {
  if (!node || typeof node !== "object" || typeof node.type !== "string") return [];
  if (node.type === "text") {
    if (typeof node.text !== "string" || !node.text) return [];
    const marks = cleanMarks(node.marks);
    return [{ type: "text", text: node.text, ...(marks.length ? { marks } : {}) }];
  }
  if (node.type === "hardBreak") return [{ type: "hardBreak" }];
  if (node.type === "image") {
    const mediaId = node.attrs?.mediaId;
    if (typeof mediaId !== "string" || !UUID.test(mediaId)) return [];
    const text = (key: string, max: number) => {
      const value = node.attrs?.[key];
      return typeof value === "string" ? value.slice(0, max) : "";
    };
    return [
      {
        type: "image",
        attrs: {
          ...node.attrs,
          mediaId,
          alt: text("alt", BLOG_LIMITS.alt),
          caption: text("caption", BLOG_LIMITS.caption),
          credit: text("credit", BLOG_LIMITS.credit),
        },
      },
    ];
  }
  if (!CONTAINERS.has(node.type)) {
    const text = textOf(node).trim();
    return text ? [{ type: "paragraph", content: [{ type: "text", text }] }] : [];
  }
  if (depth > 10) {
    const text = textOf(node).trim();
    return text ? [{ type: "text", text }] : [];
  }
  const content = (node.content ?? []).flatMap((child) => cleanNode(child, depth + 1));
  if (node.type === "heading") {
    const level = Number(node.attrs?.level);
    return [
      {
        type: "heading",
        attrs: { ...node.attrs, level: level <= 2 ? 2 : 3 },
        content,
      },
    ];
  }
  if (
    (node.type === "bulletList" || node.type === "orderedList") &&
    content.length === 0
  )
    return [];
  return [
    {
      type: node.type,
      ...(node.attrs ? { attrs: node.attrs } : {}),
      ...(content.length || node.type !== "doc" ? { content } : {}),
    },
  ];
}

export function cleanBody(value: unknown): BlogNode {
  const [doc] =
    value && typeof value === "object" ? cleanNode(value as BlogNode, 0) : [];
  if (!doc || doc.type !== "doc")
    return { type: "doc", content: [{ type: "paragraph", content: [] }] };
  return doc.content?.length
    ? doc
    : { type: "doc", content: [{ type: "paragraph", content: [] }] };
}

export type BodyFacts = {
  words: number;
  images: number;
  missingAlt: number;
  hasText: boolean;
};

export function bodyFacts(value: unknown): BodyFacts {
  let images = 0;
  let missingAlt = 0;
  const blocks: string[] = [];
  const visit = (node: BlogNode | undefined) => {
    if (!node || typeof node !== "object") return;
    if (node.type === "image") {
      images += 1;
      if (typeof node.attrs?.alt !== "string" || !node.attrs.alt.trim())
        missingAlt += 1;
      return;
    }
    if (node.type === "paragraph" || node.type === "heading") {
      blocks.push(textOf(node));
      return;
    }
    node.content?.forEach(visit);
  };
  visit(value as BlogNode);
  const text = blocks.join(" ").trim();
  return {
    words: text ? text.split(/\s+/u).length : 0,
    images,
    missingAlt,
    hasText: text.length > 0,
  };
}

export function plainText(value: unknown): string {
  const blocks: string[] = [];
  const visit = (node: BlogNode | undefined) => {
    if (!node || typeof node !== "object") return;
    if (node.type === "paragraph" || node.type === "heading") {
      const text = textOf(node).trim();
      if (text) blocks.push(text);
      return;
    }
    node.content?.forEach(visit);
  };
  visit(value as BlogNode);
  return blocks.join("\n\n");
}

export type ChecklistKey = "title" | "summary" | "body" | "imageAlt" | "coverAlt";
export type ChecklistItem = { key: ChecklistKey; done: boolean; missing?: number };

export function publishChecklist(draft: {
  title: string;
  summary: string;
  facts: BodyFacts;
  coverMediaId: string | null;
  coverAlt: string;
}): ChecklistItem[] {
  const { facts } = draft;
  const items: ChecklistItem[] = [
    { key: "title", done: draft.title.trim().length > 0 },
    { key: "summary", done: draft.summary.trim().length > 0 },
    { key: "body", done: facts.hasText },
  ];
  if (facts.images > 0)
    items.push({
      key: "imageAlt",
      done: facts.missingAlt === 0,
      missing: facts.missingAlt,
    });
  if (draft.coverMediaId)
    items.push({ key: "coverAlt", done: !!draft.coverAlt.trim() });
  return items;
}

export type TranslationState = "missing" | "draft" | "published" | "changes";

export function translationState(
  translation: { version: number; publishedRevisionId: string | null } | undefined,
  revisions: { id: string; version: number }[],
): TranslationState {
  if (!translation) return "missing";
  if (!translation.publishedRevisionId) return "draft";
  const published = revisions.find(
    (revision) => revision.id === translation.publishedRevisionId,
  );
  if (!published) return "changes";
  return translation.version > published.version ? "changes" : "published";
}

export type ArticleState = "draft" | "published" | "archived";

export function articleState(post: {
  archivedAt: string | null;
  translations: { publishedRevisionId: string | null }[];
}): ArticleState {
  if (post.archivedAt) return "archived";
  return post.translations.some((translation) => translation.publishedRevisionId)
    ? "published"
    : "draft";
}

export function lastEdited(post: {
  updatedAt: string;
  translations: { updatedAt: string }[];
}): string {
  return [post.updatedAt, ...post.translations.map((item) => item.updatedAt)].reduce(
    (latest, value) =>
      new Date(value).getTime() > new Date(latest).getTime() ? value : latest,
  );
}

export type RevisionEntry<T> = { revision: T; saves: number };

export function groupRevisions<
  T extends { createdAt: string; publishedAt: string | null },
>(revisions: T[], gapMinutes = 10): RevisionEntry<T>[] {
  const sorted = [...revisions].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
  const entries: (RevisionEntry<T> & { oldest: number })[] = [];
  for (const revision of sorted) {
    const time = new Date(revision.createdAt).getTime();
    const current = entries.at(-1);
    if (
      current &&
      !revision.publishedAt &&
      !current.revision.publishedAt &&
      current.oldest - time <= gapMinutes * 60_000
    ) {
      current.saves += 1;
      current.oldest = time;
    } else entries.push({ revision, saves: 1, oldest: time });
  }
  return entries.map(({ revision, saves }) => ({ revision, saves }));
}

const CYRILLIC: Record<string, string> = {
  а: "a",
  б: "b",
  в: "v",
  г: "g",
  д: "d",
  е: "e",
  ё: "yo",
  ж: "zh",
  з: "z",
  и: "i",
  й: "y",
  к: "k",
  л: "l",
  м: "m",
  н: "n",
  о: "o",
  п: "p",
  р: "r",
  с: "s",
  т: "t",
  у: "u",
  ф: "f",
  х: "x",
  ц: "ts",
  ч: "ch",
  ш: "sh",
  щ: "sch",
  ъ: "",
  ы: "y",
  ь: "",
  э: "e",
  ю: "yu",
  я: "ya",
  ў: "o",
  қ: "q",
  ғ: "g",
  ҳ: "h",
};

export function slugFromTitle(value: string): string {
  return value
    .toLowerCase()
    .replace(/[а-яёўқғҳ]/g, (letter) => CYRILLIC[letter] ?? letter)
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .replace(/[ʻʼ‘’'`]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80)
    .replace(/-$/, "");
}

export function isValidSlug(value: string): boolean {
  return value.length <= BLOG_LIMITS.slug && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
}

export function imageProblem(file: File): "type" | "size" | null {
  if (!(BLOG_IMAGE_TYPES as readonly string[]).includes(file.type)) return "type";
  if (!file.size || file.size > BLOG_IMAGE_MAX_BYTES) return "size";
  return null;
}
