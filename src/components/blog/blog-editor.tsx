"use client";

import Placeholder from "@tiptap/extension-placeholder";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  ArrowUpRight,
  Check,
  CircleCheck,
  CircleDashed,
  ImagePlus,
  LoaderCircle,
  TriangleAlert,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type ReactNode,
} from "react";
import { toast } from "sonner";

import { BlogCardPreview } from "@/components/blog/blog-card";
import { createBlogImage, type BlogImageLabels } from "@/components/blog/blog-image";
import { BlogReference } from "@/components/blog/blog-reference";
import { blogStatus, fill } from "@/components/blog/blog-status";
import {
  BlogToolbar,
  syncSelection,
  type BlogToolbarLabels,
} from "@/components/blog/blog-toolbar";
import { ConfirmDialog } from "@/components/blog/confirm-dialog";
import { Panel } from "@/components/portal/panel";
import { StatusBadge } from "@/components/portal/status-badge";
import { StatePanel } from "@/components/states/state-panel";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { compactInputClass } from "@/components/ui/input";
import { Link } from "@/i18n/navigation";
import type { BlogPost, BlogRevisionDetail, BlogTranslation } from "@/lib/api/schemas";
import {
  archiveBlog,
  changeBlogSlug,
  createBlogPreview,
  getBlogRevision,
  getCurrentBlogPost,
  publishBlogLanguage,
  restoreBlogDraft,
  saveBlogDraft,
  unpublishBlogLanguage,
  uploadBlogImage,
} from "@/lib/blog/actions";
import {
  BLOG_IMAGE_TYPES,
  BLOG_LIMITS,
  BLOG_LOCALES,
  bodyFacts,
  cleanBody,
  groupRevisions,
  imageProblem,
  isValidSlug,
  normalizeHref,
  publishChecklist,
  slugFromTitle,
  translationState,
  type BlogLocale,
  type BodyFacts,
  type ChecklistKey,
  type TranslationState,
} from "@/lib/blog/content";
import { useDebouncedCallback } from "@/lib/hooks/use-debounced-callback";
import { blogHref } from "@/lib/routing/routes";
import { cn } from "@/lib/utils";

export type BlogEditorLabels = BlogToolbarLabels &
  BlogImageLabels & {
    untitled: string;
    cancel: string;
    close: string;
    error: string;
    languagesLabel: string;
    missingTitle: string;
    missingBody: string;
    referenceToggle: string;
    picture: string;
    titleField: string;
    summary: string;
    summaryHint: string;
    bodyLabel: string;
    bodyPlaceholder: string;
    counter: string;
    words: string;
    uploading: string;
    uploadFailed: string;
    uploadTooLarge: string;
    uploadInvalid: string;
    retry: string;
    dismiss: string;
    statusSaved: string;
    statusClean: string;
    statusDirty: string;
    statusSaving: string;
    statusRetrying: string;
    saveNow: string;
    errorContent: string;
    errorMedia: string;
    errorArchived: string;
    errorSession: string;
    errorGeneric: string;
    conflictTitle: string;
    conflictBody: string;
    conflictMine: string;
    conflictTheirs: string;
    keepMine: string;
    useTheirs: string;
    leaveTitle: string;
    leaveBody: string;
    leaveConfirm: string;
    stay: string;
    preview: string;
    previewOpening: string;
    previewFailed: string;
    previewUnavailable: string;
    publish: string;
    publishChanges: string;
    publishedNoChanges: string;
    publishTitle: string;
    publishChangesTitle: string;
    publishLanguage: string;
    publishAddress: string;
    publishFallback: string;
    publishLive: string;
    publishBlocked: string;
    rights: string;
    publishConfirm: string;
    publishingPending: string;
    publishedToast: string;
    viewLive: string;
    errorIncomplete: string;
    errorRights: string;
    errorConflict: string;
    errorPublish: string;
    checklistTitle: string;
    checkMissing: string;
    checkReady: string;
    check: Record<ChecklistKey, string>;
    panelPublishing: string;
    notLive: string;
    publishedOn: string;
    unpublish: string;
    unpublishTitle: string;
    unpublishFallback: string;
    unpublishLast: string;
    unpublishConfirm: string;
    unpublishing: string;
    unpublishedToast: string;
    cover: string;
    coverHint: string;
    cardPreview: string;
    coverUpload: string;
    coverReplace: string;
    coverRemove: string;
    coverAlt: string;
    coverCaption: string;
    coverCredit: string;
    details: string;
    slug: string;
    slugHint: string;
    slugFrozen: string;
    slugSave: string;
    slugUseTitle: string;
    slugInvalid: string;
    slugTaken: string;
    slugSaved: string;
    author: string;
    authorHint: string;
    seo: string;
    seoHint: string;
    history: string;
    historyEmpty: string;
    historySaves: string;
    compare: string;
    restore: string;
    compareCurrent: string;
    compareVersion: string;
    restoreTitle: string;
    restoreBody: string;
    restoreConfirm: string;
    restoring: string;
    restoredToast: string;
    archive: string;
    archiveTitle: string;
    archiveBody: string;
    archiveConfirm: string;
    archiving: string;
    archivedToast: string;
    archivedTitle: string;
    archivedBody: string;
    states: Record<TranslationState | "archived", string>;
    languageNames: Record<BlogLocale, string>;
  };

type Draft = {
  title: string;
  summary: string;
  coverMediaId: string | null;
  coverAlt: string;
  coverCaption: string;
  coverCredit: string;
  authorName: string;
  seoDescription: string;
};

type SaveState =
  "clean" | "saved" | "dirty" | "saving" | "retrying" | "failed" | "conflict";

type Upload = {
  key: number;
  kind: "cover" | "inline";
  file: File;
  preview: string;
  state: "uploading" | "failed";
  problem?: "type" | "size" | "network";
};

const RETRYABLE = new Set([
  "network",
  "timeout",
  "server",
  "unavailable",
  "rateLimited",
]);
const AUTOSAVE_DELAY_MS = 3000;
const AUTOSAVE_MAX_WAIT_MS = 20_000;
const FACTS_DELAY_MS = 300;
const RETRY_FIRST_MS = 5000;
const RETRY_MAX_MS = 60_000;

function draftOf(translation: BlogTranslation | undefined, title = ""): Draft {
  return {
    title: translation?.title || title,
    summary: translation?.summary ?? "",
    coverMediaId: translation?.coverMediaId ?? null,
    coverAlt: translation?.coverAlt ?? "",
    coverCaption: translation?.coverCaption ?? "",
    coverCredit: translation?.coverCredit ?? "",
    authorName: translation?.authorName ?? "",
    seoDescription: translation?.seoDescription ?? "",
  };
}

function snapshotOf(draft: Draft, body: unknown) {
  return JSON.stringify({ draft, body });
}

function sameFacts(a: BodyFacts, b: BodyFacts) {
  return (
    a.words === b.words &&
    a.images === b.images &&
    a.missingAlt === b.missingAlt &&
    a.hasText === b.hasText
  );
}

function mediaPath(uiLocale: string, id: string, variant = "md") {
  return `/${uiLocale}/blog/media/${id}/${variant}`;
}

function imageFiles(data: DataTransfer | null): File[] {
  return [...(data?.files ?? [])].filter((file) => file.type.startsWith("image/"));
}

function Counter({ value, max, label }: { value: string; max: number; label: string }) {
  if (value.length < max * 0.8) return null;
  return (
    <span
      className={cn(
        "tabular text-xs",
        value.length >= max ? "font-semibold text-danger-ink" : "text-ink-muted",
      )}
    >
      {fill(label, { count: value.length, max })}
    </span>
  );
}

function FieldText({
  id,
  label,
  hint,
  children,
  aside,
}: {
  id: string;
  label: string;
  hint?: ReactNode;
  children: ReactNode;
  aside?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-xs font-semibold text-ink">
          {label}
        </label>
        {aside}
      </div>
      {children}
      {hint ? <p className="text-xs leading-5 text-ink-muted">{hint}</p> : null}
    </div>
  );
}

export function BlogEditor({
  post,
  locale,
  uiLocale,
  labels,
  webOrigin,
  recoveredTitle,
}: {
  post: BlogPost;
  locale: BlogLocale;
  uiLocale: string;
  labels: BlogEditorLabels;
  webOrigin: string | null;
  recoveredTitle: string | null;
}) {
  const router = useRouter();
  const id = useId();
  const current = post.translations.find(
    (translation) => translation.locale === locale,
  );
  const archived = !!post.archivedAt;
  const initialBody = useMemo(() => cleanBody(current?.body), [current?.body]);

  const [draft, setDraft] = useState<Draft>(() =>
    draftOf(current, recoveredTitle ?? ""),
  );
  const [version, setVersion] = useState(current?.version ?? 0);
  const recovering = !!recoveredTitle && !current?.title;
  const [saveState, setSaveState] = useState<SaveState>(recovering ? "dirty" : "clean");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [touched, setTouched] = useState(recovering);
  const [facts, setFacts] = useState(() => bodyFacts(initialBody));
  const [conflict, setConflict] = useState<BlogTranslation | null>(null);
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [linkOpen, setLinkOpen] = useState(false);
  const [dialog, setDialog] = useState<
    "publish" | "unpublish" | "archive" | "restore" | "leave" | null
  >(null);
  const [rights, setRights] = useState(false);
  const [leaveTo, setLeaveTo] = useState<string | null>(null);
  const [restoreId, setRestoreId] = useState<string | null>(null);
  const [comparing, setComparing] = useState<BlogRevisionDetail | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const [slug, setSlug] = useState(post.slug);
  const [slugBase, setSlugBase] = useState(post.slug);
  const [slugError, setSlugError] = useState<string | null>(null);
  const [slugPending, setSlugPending] = useState(false);

  if (post.slug !== slugBase) {
    setSlugBase(post.slug);
    if (slug === slugBase) setSlug(post.slug);
  }

  const draftRef = useRef(draft);
  const versionRef = useRef(version);
  const dirtyRef = useRef(false);
  const editsRef = useRef(0);
  const activeSave = useRef<Promise<boolean> | null>(null);
  const conflictRef = useRef(false);
  const leavingRef = useRef(false);
  const retryTimer = useRef<number | undefined>(undefined);
  const retryDelay = useRef(RETRY_FIRST_MS);
  const baselineRef = useRef<string | null>(null);
  const uploadKey = useRef(0);
  const saveRef = useRef<() => Promise<boolean>>(async () => true);
  const editorRef = useRef<Editor | null>(null);
  const uploadRef = useRef<
    (kind: "cover" | "inline", files: File[], at?: number) => void
  >(() => undefined);

  const scheduleSave = useDebouncedCallback(
    () => void saveRef.current(),
    AUTOSAVE_DELAY_MS,
    { maxWait: AUTOSAVE_MAX_WAIT_MS },
  );

  const refreshFacts = useDebouncedCallback(() => {
    const instance = editorRef.current;
    if (!instance) return;
    const next = bodyFacts(instance.getJSON());
    setFacts((previous) => (sameFacts(previous, next) ? previous : next));
  }, FACTS_DELAY_MS);

  const markDirty = useCallback(() => {
    if (archived) return;
    dirtyRef.current = true;
    editsRef.current += 1;
    setTouched(true);
    setSaveState((state) => (state === "conflict" ? state : "dirty"));
    scheduleSave.run();
  }, [archived, scheduleSave]);

  function update(patch: Partial<Draft>) {
    const next = { ...draftRef.current, ...patch };
    draftRef.current = next;
    setDraft(next);
    markDirty();
  }

  const mediaSrc = useCallback(
    (mediaId: string) => mediaPath(uiLocale, mediaId),
    [uiLocale],
  );
  const blogImage = useMemo(
    () => createBlogImage(labels, mediaSrc),
    [labels, mediaSrc],
  );

  const editor = useEditor(
    {
      immediatelyRender: false,
      editable: !archived,
      extensions: [
        StarterKit.configure({
          heading: { levels: [2, 3] },
          code: false,
          codeBlock: false,
          strike: false,
          underline: false,
          horizontalRule: false,
          link: {
            openOnClick: false,
            autolink: false,
            linkOnPaste: true,
            defaultProtocol: "https",
            isAllowedUri: (url) => normalizeHref(url) !== null,
          },
        }),
        blogImage,
        Placeholder.configure({ placeholder: labels.bodyPlaceholder }),
      ],
      content: initialBody,
      onCreate: ({ editor: instance }) => {
        const body = cleanBody(instance.getJSON());
        baselineRef.current = snapshotOf(draftOf(current), body);
        setFacts(bodyFacts(body));
      },
      onUpdate: ({ transaction }) => {
        if (!transaction.docChanged) return;
        markDirty();
        refreshFacts.run();
      },
      editorProps: {
        attributes: {
          class: "article-editor min-h-[22rem] outline-none",
          "aria-label": labels.bodyLabel,
          lang: locale,
        },
        handleKeyDown: (_view, event) => {
          if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
            event.preventDefault();
            syncSelection(editorRef.current);
            setLinkOpen(true);
            return true;
          }
          return false;
        },
        handlePaste: (_view, event) => {
          const files = imageFiles(event.clipboardData);
          if (!files.length) return false;
          event.preventDefault();
          uploadRef.current("inline", files);
          return true;
        },
        handleDrop: (view, event, _slice, moved) => {
          if (moved) return false;
          const files = imageFiles(event.dataTransfer);
          if (!files.length) return false;
          event.preventDefault();
          const at = view.posAtCoords({ left: event.clientX, top: event.clientY })?.pos;
          uploadRef.current("inline", files, at);
          return true;
        },
      },
    },
    [post.id, locale],
  );

  useEffect(() => {
    editorRef.current = editor;
  }, [editor]);

  useEffect(() => {
    if (editor && editor.isEditable === archived) editor.setEditable(!archived, false);
  }, [editor, archived]);

  const failSave = useCallback(
    (code: string) => {
      if (RETRYABLE.has(code)) {
        setSaveState("retrying");
        window.clearTimeout(retryTimer.current);
        const wait = retryDelay.current;
        retryDelay.current = Math.min(wait * 2, RETRY_MAX_MS);
        retryTimer.current = window.setTimeout(() => void saveRef.current(), wait);
        return;
      }
      setSaveState("failed");
      setSaveError(
        code === "blogContentInvalid"
          ? labels.errorContent
          : code === "blogMediaInvalid"
            ? labels.errorMedia
            : code === "blogPostNotFound"
              ? labels.errorArchived
              : code === "sessionExpired"
                ? labels.errorSession
                : labels.errorGeneric,
      );
    },
    [labels],
  );

  const saveNow = useCallback(async (): Promise<boolean> => {
    scheduleSave.cancel();
    while (activeSave.current) await activeSave.current;
    if (!dirtyRef.current || archived) return true;
    if (conflictRef.current) return false;
    window.clearTimeout(retryTimer.current);
    const sent = editsRef.current;
    const draftToSend = draftRef.current;
    const body = cleanBody(editor ? editor.getJSON() : initialBody);
    const snapshot = snapshotOf(draftToSend, body);
    if (snapshot === baselineRef.current) {
      dirtyRef.current = false;
      setSaveState("saved");
      return true;
    }
    const task = (async () => {
      setSaveState("saving");
      setSaveError(null);
      let response: Awaited<ReturnType<typeof saveBlogDraft>>;
      try {
        response = await saveBlogDraft(post.id, locale, {
          version: versionRef.current,
          ...draftToSend,
          body,
        });
      } catch {
        failSave("network");
        return false;
      }
      if (response.result.status === "ok" && response.data) {
        versionRef.current = response.data.version;
        baselineRef.current = snapshot;
        retryDelay.current = RETRY_FIRST_MS;
        setVersion(response.data.version);
        setSavedAt(response.data.savedAt);
        if (editsRef.current === sent) {
          dirtyRef.current = false;
          setSaveState("saved");
        } else setSaveState("dirty");
        return true;
      }
      const code = response.result.status === "error" ? response.result.code : "server";
      if (code === "blogVersionConflict") {
        conflictRef.current = true;
        setSaveState("conflict");
        const latest = await getCurrentBlogPost(post.id);
        setConflict(
          latest?.state === "ready"
            ? (latest.data.translations.find((item) => item.locale === locale) ?? null)
            : null,
        );
        return false;
      }
      failSave(code);
      return false;
    })();
    activeSave.current = task;
    try {
      return await task;
    } finally {
      activeSave.current = null;
    }
  }, [archived, editor, failSave, initialBody, locale, post.id, scheduleSave]);

  useEffect(() => {
    saveRef.current = saveNow;
  }, [saveNow]);

  useEffect(() => {
    if (!recovering) return;
    dirtyRef.current = true;
    editsRef.current += 1;
    scheduleSave.run();
    router.replace(`/${uiLocale}${blogHref(post.id)}?lang=${locale}`, {
      scroll: false,
    });
  }, [locale, post.id, recovering, router, scheduleSave, uiLocale]);

  useEffect(() => {
    const pending = () => dirtyRef.current || !!activeSave.current;
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (leavingRef.current || !pending()) return;
      event.preventDefault();
      event.returnValue = "";
    };
    const hidden = () => {
      if (document.visibilityState === "hidden" && pending()) void saveRef.current();
    };
    const click = (event: MouseEvent) => {
      if (leavingRef.current || !pending()) return;
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      )
        return;
      const anchor = (event.target as Element | null)?.closest?.("a[href]");
      if (!(anchor instanceof HTMLAnchorElement)) return;
      if (anchor.target === "_blank" || anchor.hasAttribute("download")) return;
      if (anchor.closest(".ProseMirror")) return;
      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      event.preventDefault();
      event.stopPropagation();
      const destination = `${url.pathname}${url.search}${url.hash}`;
      void saveRef.current().then((saved) => {
        if (saved) {
          leavingRef.current = true;
          router.push(destination);
        } else {
          setLeaveTo(destination);
          setDialog("leave");
        }
      });
    };
    window.addEventListener("beforeunload", beforeUnload);
    document.addEventListener("visibilitychange", hidden);
    document.addEventListener("click", click, true);
    return () => {
      window.removeEventListener("beforeunload", beforeUnload);
      document.removeEventListener("visibilitychange", hidden);
      document.removeEventListener("click", click, true);
      window.clearTimeout(retryTimer.current);
    };
  }, [router]);

  async function uploadOne(kind: "cover" | "inline", file: File, at?: number) {
    const key = ++uploadKey.current;
    const preview = URL.createObjectURL(file);
    const problem = imageProblem(file);
    if (problem) {
      setUploads((list) => [
        ...list,
        { key, kind, file, preview, state: "failed", problem },
      ]);
      return false;
    }
    setUploads((list) => [...list, { key, kind, file, preview, state: "uploading" }]);
    const form = new FormData();
    form.set("image", file);
    let response: Awaited<ReturnType<typeof uploadBlogImage>> | null = null;
    try {
      response = await uploadBlogImage(post.id, form);
    } catch {
      response = null;
    }
    if (!response || response.result.status !== "ok" || !response.data) {
      const code =
        response?.result.status === "error" ? response.result.code : "network";
      setUploads((list) =>
        list.map((item) =>
          item.key === key
            ? {
                ...item,
                state: "failed",
                problem:
                  code === "blogImageTooLarge"
                    ? "size"
                    : code === "blogImageInvalid"
                      ? "type"
                      : "network",
              }
            : item,
        ),
      );
      return false;
    }
    const media = response.data;
    setUploads((list) => list.filter((item) => item.key !== key));
    URL.revokeObjectURL(preview);
    if (kind === "cover") {
      update({
        coverMediaId: media.id,
        coverAlt: "",
        coverCaption: "",
        coverCredit: "",
      });
    } else if (editor) {
      const node = {
        type: "image",
        attrs: {
          mediaId: media.id,
          alt: "",
          caption: "",
          credit: "",
          width: media.width,
          height: media.height,
        },
      };
      const chain = editor.chain().focus();
      (typeof at === "number"
        ? chain.insertContentAt(at, node)
        : chain.insertContent(node)
      ).run();
    }
    return true;
  }

  async function uploadFiles(kind: "cover" | "inline", files: File[], at?: number) {
    let position = at;
    for (const file of kind === "cover" ? files.slice(0, 1) : files) {
      await uploadOne(kind, file, position);
      position = undefined;
    }
  }

  useEffect(() => {
    uploadRef.current = (kind, files, at) => void uploadFiles(kind, files, at);
  });

  function dismissUpload(upload: Upload) {
    URL.revokeObjectURL(upload.preview);
    setUploads((list) => list.filter((item) => item.key !== upload.key));
  }

  function retryUpload(upload: Upload) {
    dismissUpload(upload);
    void uploadOne(upload.kind, upload.file);
  }

  const translations = useMemo(
    () =>
      Object.fromEntries(
        BLOG_LOCALES.map((lang) => [
          lang,
          post.translations.find((translation) => translation.locale === lang),
        ]),
      ) as Record<BlogLocale, BlogTranslation | undefined>,
    [post.translations],
  );
  const stateOf = (lang: BlogLocale): TranslationState | "archived" =>
    archived && (translations[lang] || lang === locale)
      ? "archived"
      : lang === locale
        ? current
          ? translationState(
              { version, publishedRevisionId: current.publishedRevisionId },
              post.revisions,
            )
          : touched || version > 0
            ? "draft"
            : "missing"
        : translationState(translations[lang], post.revisions);
  const state = stateOf(locale) as TranslationState;
  const checklist = publishChecklist({ ...draft, facts });
  const blocking = checklist.filter((item) => !item.done);
  const uploading = uploads.some((upload) => upload.state === "uploading");
  const pictures = facts.images > 0 || !!draft.coverMediaId;
  const otherPublished = post.translations.filter(
    (translation) => translation.locale !== locale && translation.publishedRevisionId,
  );
  const unstarted = BLOG_LOCALES.filter(
    (lang) => lang !== locale && !translations[lang]?.publishedRevisionId,
  );
  const path = `/${locale}/blog/${post.slug}`;
  const liveUrl = webOrigin ? new URL(path, webOrigin).toString() : null;
  const address = webOrigin ? `${new URL(webOrigin).host}${path}` : path;
  const referenceLocale = [post.primaryLocale, ...BLOG_LOCALES].find(
    (lang) =>
      lang !== locale &&
      (translations[lang]?.title || bodyFacts(translations[lang]?.body).hasText),
  );
  const reference = referenceLocale ? translations[referenceLocale] : undefined;
  const entries = groupRevisions(
    post.revisions.filter((revision) => revision.locale === locale),
  );
  const dateTime = (value: string) =>
    new Intl.DateTimeFormat(uiLocale, {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));
  const time = (value: string) =>
    new Intl.DateTimeFormat(uiLocale, { hour: "2-digit", minute: "2-digit" }).format(
      new Date(value),
    );

  function focusField(key: ChecklistKey) {
    setDialog(null);
    window.setTimeout(() => {
      if (key === "title") document.getElementById(`${id}-title`)?.focus();
      else if (key === "summary") document.getElementById(`${id}-summary`)?.focus();
      else if (key === "coverAlt") document.getElementById(`${id}-cover-alt`)?.focus();
      else if (key === "imageAlt")
        (
          document.querySelector(
            ".ProseMirror [data-blog-image] input[aria-invalid]",
          ) as HTMLInputElement | null
        )?.focus();
      else editor?.commands.focus("end");
    }, 50);
  }

  async function publish(): Promise<string | null> {
    if (!(await saveNow())) return labels.errorGeneric;
    const result = await publishBlogLanguage(post.id, locale, rights);
    if (result.status === "ok") {
      toast.success(labels.publishedToast, {
        ...(liveUrl
          ? {
              action: {
                label: labels.viewLive,
                onClick: () => window.open(liveUrl, "_blank", "noopener"),
              },
            }
          : {}),
      });
      return null;
    }
    const code = result.status === "error" ? result.code : "";
    return code === "blogPublishIncomplete"
      ? labels.errorIncomplete
      : code === "blogPictureRightsRequired"
        ? labels.errorRights
        : code === "blogVersionConflict" || code === "blogDraftNotSaved"
          ? labels.errorConflict
          : code === "blogMediaInvalid"
            ? labels.errorMedia
            : labels.errorPublish;
  }

  async function unpublish(): Promise<string | null> {
    const result = await unpublishBlogLanguage(post.id, locale);
    if (result.status !== "ok") return labels.error;
    toast.success(labels.unpublishedToast);
    return null;
  }

  async function archive(): Promise<string | null> {
    if (!(await saveNow())) return labels.errorGeneric;
    const result = await archiveBlog(post.id);
    if (result.status !== "ok") return labels.error;
    toast.success(labels.archivedToast);
    return null;
  }

  async function restore(revisionId: string): Promise<string | null> {
    if (!(await saveNow())) return labels.errorGeneric;
    const detail = await getBlogRevision(post.id, revisionId);
    if (detail?.state !== "ready") return labels.error;
    const response = await restoreBlogDraft(
      post.id,
      locale,
      revisionId,
      versionRef.current,
    );
    if (response.result.status !== "ok" || !response.data)
      return response.result.status === "error" &&
        response.result.code === "blogVersionConflict"
        ? labels.errorConflict
        : labels.error;
    const restored = detail.data;
    const next: Draft = {
      title: restored.title,
      summary: restored.summary,
      coverMediaId: restored.coverMediaId,
      coverAlt: restored.coverAlt,
      coverCaption: restored.coverCaption,
      coverCredit: restored.coverCredit,
      authorName: restored.authorName,
      seoDescription: restored.seoDescription,
    };
    draftRef.current = next;
    setDraft(next);
    editor?.commands.setContent(cleanBody(restored.body), { emitUpdate: false });
    const restoredBody = cleanBody(editor ? editor.getJSON() : restored.body);
    baselineRef.current = snapshotOf(next, restoredBody);
    setFacts(bodyFacts(restoredBody));
    versionRef.current = response.data.version;
    setVersion(response.data.version);
    setSavedAt(response.data.savedAt);
    dirtyRef.current = false;
    setSaveState("saved");
    setComparing(null);
    toast.success(labels.restoredToast);
    return null;
  }

  function keepMine() {
    if (!conflict) return;
    versionRef.current = conflict.version;
    conflictRef.current = false;
    setConflict(null);
    baselineRef.current = null;
    dirtyRef.current = true;
    void saveNow();
  }

  function useTheirs() {
    if (!conflict) return;
    const next = draftOf(conflict);
    draftRef.current = next;
    setDraft(next);
    editor?.commands.setContent(cleanBody(conflict.body), { emitUpdate: false });
    const theirBody = cleanBody(editor ? editor.getJSON() : conflict.body);
    baselineRef.current = snapshotOf(next, theirBody);
    setFacts(bodyFacts(theirBody));
    versionRef.current = conflict.version;
    setVersion(conflict.version);
    conflictRef.current = false;
    dirtyRef.current = false;
    setConflict(null);
    setSaveState("clean");
  }

  async function preview() {
    const tab = window.open("", `blog-preview-${post.id}-${locale}`);
    setPreviewing(true);
    try {
      if (!(await saveNow())) {
        tab?.close();
        toast.error(labels.previewFailed);
        return;
      }
      const result = await createBlogPreview(post.id, locale);
      if (result.result.status !== "ok" || !result.data || !result.origin) {
        tab?.close();
        toast.error(
          result.result.status === "error" &&
            result.result.code === "blogPreviewUnavailable"
            ? labels.previewUnavailable
            : labels.previewFailed,
        );
        return;
      }
      const form = document.createElement("form");
      form.method = "POST";
      form.action = new URL("/api/blog/preview-session", result.origin).toString();
      form.target = tab?.name || "_blank";
      for (const [name, value] of Object.entries({
        token: result.data.token,
        slug: result.data.slug,
        locale: result.data.locale,
      })) {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = name;
        input.value = value;
        form.append(input);
      }
      document.body.append(form);
      form.submit();
      form.remove();
    } finally {
      setPreviewing(false);
    }
  }

  async function saveSlug() {
    if (!isValidSlug(slug)) {
      setSlugError(labels.slugInvalid);
      return;
    }
    setSlugPending(true);
    const result = await changeBlogSlug(post.id, slug);
    setSlugPending(false);
    if (result.status === "ok") {
      setSlugError(null);
      toast.success(labels.slugSaved);
      return;
    }
    const code = result.status === "error" ? result.code : "";
    setSlugError(
      code === "blogSlugTaken"
        ? labels.slugTaken
        : code === "blogSlugInvalid" || code === "validationFailed"
          ? labels.slugInvalid
          : code === "blogSlugFrozen"
            ? labels.slugFrozen
            : labels.error,
    );
  }

  function pickCover(event: ChangeEvent<HTMLInputElement>) {
    const files = [...(event.target.files ?? [])];
    event.target.value = "";
    if (files.length) void uploadFiles("cover", files);
  }

  const publishLabel =
    state === "changes"
      ? labels.publishChanges
      : state === "published"
        ? labels.publishedNoChanges
        : labels.publish;

  const status = (() => {
    switch (saveState) {
      case "saving":
        return {
          icon: LoaderCircle,
          spin: true,
          text: labels.statusSaving,
          tone: "muted",
        };
      case "dirty":
        return { icon: CircleDashed, text: labels.statusDirty, tone: "muted" };
      case "retrying":
        return {
          icon: LoaderCircle,
          spin: true,
          text: labels.statusRetrying,
          tone: "danger",
        };
      case "failed":
        return {
          icon: TriangleAlert,
          text: saveError ?? labels.errorGeneric,
          tone: "danger",
        };
      case "conflict":
        return { icon: TriangleAlert, text: labels.conflictTitle, tone: "danger" };
      case "saved":
        return {
          icon: Check,
          text: savedAt
            ? fill(labels.statusSaved, { time: time(savedAt) })
            : labels.statusClean,
          tone: "muted",
        };
      default:
        return { icon: Check, text: labels.statusClean, tone: "muted" };
    }
  })();

  return (
    <div className="mt-6 flex flex-col gap-6">
      {archived ? (
        <StatePanel
          role="status"
          title={fill(labels.archivedTitle, { date: dateTime(post.archivedAt!) })}
          description={labels.archivedBody}
        />
      ) : null}

      {conflict ? (
        <section
          aria-labelledby={`${id}-conflict`}
          className="rounded-xl border border-danger/40 bg-danger-muted px-5 py-5"
        >
          <h2 id={`${id}-conflict`} className="text-section text-ink">
            {labels.conflictTitle}
          </h2>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-ink-muted">
            {labels.conflictBody}
          </p>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border border-border bg-surface p-4">
              <p className="mb-3 text-xs font-semibold text-ink-muted">
                {labels.conflictMine}
              </p>
              <BlogReference
                title={draft.title}
                summary={draft.summary}
                body={editor?.getJSON()}
                lang={locale}
                pictureLabel={labels.picture}
              />
            </div>
            <div className="rounded-lg border border-border bg-surface p-4">
              <p className="mb-3 text-xs font-semibold text-ink-muted">
                {fill(labels.conflictTheirs, { time: time(conflict.updatedAt) })}
              </p>
              <BlogReference
                title={conflict.title}
                summary={conflict.summary}
                body={conflict.body}
                lang={locale}
                pictureLabel={labels.picture}
              />
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button size="sm" onClick={keepMine}>
              {labels.keepMine}
            </Button>
            <Button size="sm" variant="outline" onClick={useTheirs}>
              {labels.useTheirs}
            </Button>
          </div>
        </section>
      ) : null}

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <section aria-label={labels.bodyLabel} className="flex min-w-0 flex-col sheet">
          <nav
            aria-label={labels.languagesLabel}
            className="flex flex-wrap items-center gap-1 px-4 py-3 sm:px-6"
          >
            {BLOG_LOCALES.map((lang) => {
              const active = lang === locale;
              const langState = stateOf(lang);
              return (
                <Link
                  key={lang}
                  href={`${blogHref(post.id)}?lang=${lang}`}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "inline-flex min-h-9 items-center gap-2 rounded-full px-3.5 text-sm font-semibold whitespace-nowrap transition-colors",
                    active
                      ? "bg-action text-knockout"
                      : "text-ink-muted hover:bg-surface-sunk hover:text-ink",
                  )}
                >
                  {labels.languageNames[lang]}
                  <span
                    className={cn(
                      "text-xs font-normal",
                      active ? "text-band-copy" : "text-ink-muted",
                    )}
                  >
                    {labels.states[langState]}
                  </span>
                </Link>
              );
            })}
          </nav>

          {!current && !archived ? (
            <div className="border-t border-border bg-surface-soft px-5 py-4 sm:px-8">
              <p className="text-sm font-semibold text-ink">
                {fill(labels.missingTitle, { language: labels.languageNames[locale] })}
              </p>
              <p className="mt-1 max-w-2xl text-sm leading-relaxed text-ink-muted">
                {labels.missingBody}
              </p>
            </div>
          ) : null}

          {reference && referenceLocale ? (
            <details className="group border-t border-border px-5 py-3 sm:px-8">
              <summary className="cursor-pointer text-sm font-semibold text-primary-ink hover:underline">
                {fill(labels.referenceToggle, {
                  language: labels.languageNames[referenceLocale],
                })}
              </summary>
              <div className="mt-3 rounded-lg bg-surface-sunk p-4">
                <BlogReference
                  title={reference.title}
                  summary={reference.summary}
                  body={reference.body}
                  lang={referenceLocale}
                  pictureLabel={labels.picture}
                />
              </div>
            </details>
          ) : null}

          <fieldset
            disabled={archived}
            className="flex flex-col gap-5 border-t border-border px-5 py-6 sm:px-8"
          >
            <FieldText
              id={`${id}-title`}
              label={labels.titleField}
              aside={
                <Counter
                  value={draft.title}
                  max={BLOG_LIMITS.title}
                  label={labels.counter}
                />
              }
            >
              <textarea
                id={`${id}-title`}
                value={draft.title}
                rows={1}
                lang={locale}
                maxLength={BLOG_LIMITS.title}
                placeholder={labels.untitled}
                onChange={(event) =>
                  update({ title: event.target.value.replace(/\n/g, " ") })
                }
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    document.getElementById(`${id}-summary`)?.focus();
                  }
                }}
                className="[field-sizing:content] w-full resize-none border-0 bg-transparent p-0 font-serif text-[2rem] leading-tight text-ink placeholder:text-ink-muted/70 focus-visible:outline-none"
              />
            </FieldText>
            <FieldText
              id={`${id}-summary`}
              label={labels.summary}
              hint={labels.summaryHint}
              aside={
                <Counter
                  value={draft.summary}
                  max={BLOG_LIMITS.summary}
                  label={labels.counter}
                />
              }
            >
              <textarea
                id={`${id}-summary`}
                value={draft.summary}
                rows={2}
                lang={locale}
                maxLength={BLOG_LIMITS.summary}
                onChange={(event) => update({ summary: event.target.value })}
                className={cn(
                  compactInputClass,
                  "[field-sizing:content] min-h-20 resize-y rounded-lg py-2.5 text-base leading-relaxed disabled:bg-surface-sunk disabled:text-ink-muted",
                )}
              />
            </FieldText>
          </fieldset>

          <BlogToolbar
            editor={editor}
            labels={labels}
            siteOrigin={webOrigin}
            readOnly={archived}
            linkOpen={linkOpen}
            onLinkOpenChange={setLinkOpen}
            onPictures={(files) => void uploadFiles("inline", files)}
          />

          {uploads.filter((upload) => upload.kind === "inline").length ? (
            <ul className="flex flex-col divide-y divide-border border-b border-border bg-surface-sunk">
              {uploads
                .filter((upload) => upload.kind === "inline")
                .map((upload) => (
                  <UploadRow
                    key={upload.key}
                    upload={upload}
                    labels={labels}
                    onRetry={() => retryUpload(upload)}
                    onDismiss={() => dismissUpload(upload)}
                  />
                ))}
            </ul>
          ) : null}

          <div className="px-5 py-6 sm:px-8">
            <EditorContent editor={editor} />
          </div>

          <div className="sticky bottom-0 z-20 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-b-[inherit] border-t border-border bg-surface px-5 py-3 sm:px-8">
            <p
              role="status"
              aria-live="polite"
              className={cn(
                "flex min-w-0 items-center gap-2 text-sm",
                status.tone === "danger"
                  ? "font-semibold text-danger-ink"
                  : "text-ink-muted",
              )}
            >
              <status.icon
                aria-hidden="true"
                className={cn("size-4 shrink-0", status.spin ? "animate-spin" : null)}
              />
              <span className="min-w-0">{status.text}</span>
            </p>
            {saveState === "failed" || saveState === "retrying" ? (
              <Button size="row" variant="outline" onClick={() => void saveNow()}>
                {labels.saveNow}
              </Button>
            ) : null}
            <span className="tabular hidden text-xs text-ink-muted sm:inline">
              {fill(labels.words, { count: facts.words })}
            </span>
            {!archived ? (
              <div className="ml-auto flex flex-wrap items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => void preview()}
                  disabled={previewing || (!current && !touched)}
                >
                  {previewing ? labels.previewOpening : labels.preview}
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    refreshFacts.flush();
                    setRights(false);
                    setDialog("publish");
                  }}
                  disabled={state === "published" || saveState === "conflict"}
                >
                  {publishLabel}
                </Button>
              </div>
            ) : null}
          </div>
        </section>

        <aside className="flex min-w-0 flex-col gap-6">
          <Panel title={labels.panelPublishing}>
            <ul className="flex flex-col divide-y divide-border">
              {BLOG_LOCALES.map((lang) => {
                const langState = stateOf(lang);
                const chip = blogStatus(langState);
                const publishedAt = translations[lang]?.publishedAt;
                return (
                  <li
                    key={lang}
                    className="flex items-center justify-between gap-3 py-2"
                  >
                    <span className="min-w-0">
                      <span
                        className={cn(
                          "block text-sm text-ink",
                          lang === locale ? "font-semibold" : null,
                        )}
                      >
                        {labels.languageNames[lang]}
                      </span>
                      {publishedAt && translations[lang]?.publishedRevisionId ? (
                        <span className="tabular block text-xs text-ink-muted">
                          {fill(labels.publishedOn, { date: dateTime(publishedAt) })}
                        </span>
                      ) : null}
                    </span>
                    <StatusBadge
                      label={labels.states[langState]}
                      tone={chip.tone}
                      icon={chip.icon}
                    />
                  </li>
                );
              })}
            </ul>
            {!archived ? (
              <div className="mt-4 border-t border-border pt-4">
                <p className="text-xs font-semibold text-ink">
                  {labels.checklistTitle}
                </p>
                <ul className="mt-2 flex flex-col gap-1.5">
                  {checklist.map((item) => (
                    <li key={item.key}>
                      <button
                        type="button"
                        onClick={() => focusField(item.key)}
                        className={cn(
                          "flex w-full items-center gap-2 rounded-md text-left text-sm hover:underline",
                          item.done ? "text-ink-muted" : "font-semibold text-ink",
                        )}
                      >
                        {item.done ? (
                          <CircleCheck
                            aria-hidden="true"
                            className="size-4 shrink-0 text-primary-ink"
                          />
                        ) : (
                          <CircleDashed
                            aria-hidden="true"
                            className="size-4 shrink-0 text-danger-ink"
                          />
                        )}
                        <span>
                          {labels.check[item.key]}
                          {!item.done && item.missing
                            ? ` · ${fill(labels.checkMissing, { count: item.missing })}`
                            : ""}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
                {!blocking.length ? (
                  <p className="mt-2 text-xs text-ink-muted">{labels.checkReady}</p>
                ) : null}
              </div>
            ) : null}
            <div className="mt-4 flex flex-col gap-2 border-t border-border pt-4">
              <p className="text-xs break-all text-ink-muted">
                {current?.publishedRevisionId ? null : `${labels.notLive} · `}
                <span className="tabular">{address}</span>
              </p>
              <div className="flex flex-wrap gap-2">
                {current?.publishedRevisionId && liveUrl && !archived ? (
                  <a
                    href={liveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-9 items-center gap-1.5 rounded-full px-3.5 text-sm font-semibold text-primary-ink hover:bg-surface-soft [&_svg]:size-4"
                  >
                    {labels.viewLive}
                    <ArrowUpRight aria-hidden="true" />
                  </a>
                ) : null}
                {current?.publishedRevisionId && !archived ? (
                  <Button
                    size="row"
                    variant="danger-outline"
                    onClick={() => setDialog("unpublish")}
                  >
                    {labels.unpublish}
                  </Button>
                ) : null}
              </div>
            </div>
          </Panel>

          <Panel title={labels.cover} description={labels.coverHint}>
            <fieldset disabled={archived} className="flex flex-col gap-4">
              <figure className="flex flex-col gap-2">
                <BlogCardPreview
                  title={draft.title}
                  summary={draft.summary}
                  cover={draft.coverMediaId ? mediaSrc(draft.coverMediaId) : null}
                  lang={locale}
                  untitled={labels.untitled}
                />
                <figcaption className="text-xs text-ink-muted">
                  {labels.cardPreview}
                </figcaption>
              </figure>
              {uploads
                .filter((upload) => upload.kind === "cover")
                .map((upload) => (
                  <ul key={upload.key} className="rounded-lg bg-surface-sunk">
                    <UploadRow
                      upload={upload}
                      labels={labels}
                      onRetry={() => retryUpload(upload)}
                      onDismiss={() => dismissUpload(upload)}
                    />
                  </ul>
                ))}
              <div className="flex flex-wrap items-center gap-2">
                <label
                  title={labels.pictureHint}
                  className={cn(
                    "inline-flex min-h-9 cursor-pointer items-center gap-2 rounded-full border border-border-control px-3.5 text-sm font-semibold text-ink transition-colors hover:border-primary-ink hover:bg-surface-soft hover:text-primary-ink has-focus-visible:outline-3 has-focus-visible:outline-offset-2 has-focus-visible:outline-primary-ink [&_svg]:size-4",
                    archived ? "pointer-events-none opacity-55" : null,
                  )}
                >
                  <ImagePlus aria-hidden="true" />
                  {draft.coverMediaId ? labels.coverReplace : labels.coverUpload}
                  <input
                    type="file"
                    accept={BLOG_IMAGE_TYPES.join(",")}
                    className="sr-only"
                    onChange={pickCover}
                  />
                </label>
                {draft.coverMediaId ? (
                  <Button
                    size="row"
                    variant="ghost"
                    onClick={() =>
                      update({
                        coverMediaId: null,
                        coverAlt: "",
                        coverCaption: "",
                        coverCredit: "",
                      })
                    }
                  >
                    {labels.coverRemove}
                  </Button>
                ) : null}
              </div>
              <p className="text-xs text-ink-muted">{labels.pictureHint}</p>
              {draft.coverMediaId ? (
                <>
                  <FieldText
                    id={`${id}-cover-alt`}
                    label={labels.coverAlt}
                    hint={
                      draft.coverAlt.trim() ? (
                        labels.imageAltHint
                      ) : (
                        <span className="font-semibold text-danger-ink">
                          {labels.imageAltMissing}
                        </span>
                      )
                    }
                  >
                    <input
                      id={`${id}-cover-alt`}
                      value={draft.coverAlt}
                      maxLength={BLOG_LIMITS.alt}
                      aria-invalid={!draft.coverAlt.trim() || undefined}
                      onChange={(event) => update({ coverAlt: event.target.value })}
                      className={cn(
                        compactInputClass,
                        "rounded-lg disabled:bg-surface-sunk aria-invalid:border-danger aria-invalid:bg-danger-muted",
                      )}
                    />
                  </FieldText>
                  <FieldText id={`${id}-cover-caption`} label={labels.coverCaption}>
                    <input
                      id={`${id}-cover-caption`}
                      value={draft.coverCaption}
                      maxLength={BLOG_LIMITS.caption}
                      onChange={(event) => update({ coverCaption: event.target.value })}
                      className={cn(
                        compactInputClass,
                        "rounded-lg disabled:bg-surface-sunk disabled:text-ink-muted",
                      )}
                    />
                  </FieldText>
                  <FieldText id={`${id}-cover-credit`} label={labels.coverCredit}>
                    <input
                      id={`${id}-cover-credit`}
                      value={draft.coverCredit}
                      maxLength={BLOG_LIMITS.credit}
                      onChange={(event) => update({ coverCredit: event.target.value })}
                      className={cn(
                        compactInputClass,
                        "rounded-lg disabled:bg-surface-sunk disabled:text-ink-muted",
                      )}
                    />
                  </FieldText>
                </>
              ) : null}
            </fieldset>
          </Panel>

          <Panel title={labels.details}>
            <div className="flex flex-col gap-5">
              <FieldText
                id={`${id}-slug`}
                label={labels.slug}
                hint={
                  post.firstPublishedAt ? (
                    labels.slugFrozen
                  ) : slugError ? (
                    <span role="alert" className="font-semibold text-danger-ink">
                      {slugError}
                    </span>
                  ) : (
                    labels.slugHint
                  )
                }
              >
                <input
                  id={`${id}-slug`}
                  value={slug}
                  maxLength={BLOG_LIMITS.slug}
                  readOnly={!!post.firstPublishedAt || archived}
                  aria-invalid={!!slugError || undefined}
                  spellCheck={false}
                  autoComplete="off"
                  onChange={(event) => {
                    setSlug(event.target.value.toLowerCase().replace(/\s+/g, "-"));
                    setSlugError(null);
                  }}
                  className={cn(
                    compactInputClass,
                    "rounded-lg font-mono text-[0.8125rem] read-only:bg-surface-sunk aria-invalid:border-danger aria-invalid:bg-danger-muted",
                  )}
                />
              </FieldText>
              {!post.firstPublishedAt && !archived ? (
                <div className="-mt-2 flex flex-wrap gap-2">
                  <Button
                    size="row"
                    variant="outline"
                    disabled={slug === post.slug || slugPending}
                    onClick={() => void saveSlug()}
                  >
                    {labels.slugSave}
                  </Button>
                  <Button
                    size="row"
                    variant="ghost"
                    disabled={!slugFromTitle(draft.title)}
                    onClick={() => {
                      setSlug(slugFromTitle(draft.title));
                      setSlugError(null);
                    }}
                  >
                    {labels.slugUseTitle}
                  </Button>
                </div>
              ) : null}
              <fieldset disabled={archived} className="flex flex-col gap-5">
                <FieldText
                  id={`${id}-author`}
                  label={labels.author}
                  hint={labels.authorHint}
                >
                  <input
                    id={`${id}-author`}
                    value={draft.authorName}
                    maxLength={BLOG_LIMITS.author}
                    onChange={(event) => update({ authorName: event.target.value })}
                    className={cn(
                      compactInputClass,
                      "rounded-lg disabled:bg-surface-sunk disabled:text-ink-muted",
                    )}
                  />
                </FieldText>
                <FieldText
                  id={`${id}-seo`}
                  label={labels.seo}
                  hint={labels.seoHint}
                  aside={
                    <Counter
                      value={draft.seoDescription}
                      max={BLOG_LIMITS.seo}
                      label={labels.counter}
                    />
                  }
                >
                  <textarea
                    id={`${id}-seo`}
                    value={draft.seoDescription}
                    rows={3}
                    maxLength={BLOG_LIMITS.seo}
                    lang={locale}
                    onChange={(event) => update({ seoDescription: event.target.value })}
                    className={cn(
                      compactInputClass,
                      "min-h-20 resize-y rounded-lg py-2.5 disabled:bg-surface-sunk disabled:text-ink-muted",
                    )}
                  />
                </FieldText>
              </fieldset>
            </div>
          </Panel>

          <details
            className="group sheet"
            onToggle={(event) => {
              if ((event.currentTarget as HTMLDetailsElement).open) router.refresh();
            }}
          >
            <summary className="flex min-h-12 cursor-pointer items-center justify-between gap-3 px-5 py-3.5 text-section text-ink">
              {labels.history}
              <span className="tabular rounded-full bg-surface-sunk px-2 py-0.5 text-xs font-semibold text-ink-muted">
                {entries.length}
              </span>
            </summary>
            <div className="border-t border-border px-5 py-3">
              {entries.length ? (
                <ul className="flex flex-col divide-y divide-border">
                  {entries.map(({ revision, saves }) => (
                    <li
                      key={revision.id}
                      className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 py-2.5"
                    >
                      <span className="min-w-0 text-sm">
                        <span className="tabular block text-ink">
                          {dateTime(revision.createdAt)}
                        </span>
                        <span className="block text-xs text-ink-muted">
                          {revision.publishedAt
                            ? labels.states.published
                            : fill(labels.historySaves, { count: saves })}
                        </span>
                      </span>
                      {!archived ? (
                        <span className="flex gap-1">
                          <Button
                            size="row"
                            variant="ghost"
                            onClick={async () => {
                              const result = await getBlogRevision(
                                post.id,
                                revision.id,
                              );
                              if (result?.state === "ready") setComparing(result.data);
                              else toast.error(labels.error);
                            }}
                          >
                            {labels.compare}
                          </Button>
                          <Button
                            size="row"
                            variant="ghost"
                            onClick={() => {
                              setRestoreId(revision.id);
                              setDialog("restore");
                            }}
                          >
                            {labels.restore}
                          </Button>
                        </span>
                      ) : null}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="py-2 text-sm text-ink-muted">{labels.historyEmpty}</p>
              )}
            </div>
          </details>

          {!archived ? (
            <Button
              variant="danger-outline"
              size="sm"
              className="self-start"
              onClick={() => setDialog("archive")}
            >
              {labels.archive}
            </Button>
          ) : null}
        </aside>
      </div>

      <ConfirmDialog
        open={dialog === "publish"}
        onOpenChange={(open) => setDialog(open ? "publish" : null)}
        title={state === "changes" ? labels.publishChangesTitle : labels.publishTitle}
        description={state === "changes" ? labels.publishLive : undefined}
        confirmLabel={labels.publishConfirm}
        pendingLabel={labels.publishingPending}
        cancelLabel={labels.cancel}
        closeLabel={labels.close}
        disabled={blocking.length > 0 || uploading || (pictures && !rights)}
        onConfirm={publish}
      >
        <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-1.5">
          <dt className="text-ink-muted">{labels.publishLanguage}</dt>
          <dd className="font-semibold">{labels.languageNames[locale]}</dd>
          <dt className="text-ink-muted">{labels.publishAddress}</dt>
          <dd className="tabular break-all">{address}</dd>
        </dl>
        {state !== "changes" && unstarted.length ? (
          <p className="text-ink-muted">{labels.publishFallback}</p>
        ) : null}
        {blocking.length ? (
          <div className="rounded-lg border border-danger/40 bg-danger-muted px-4 py-3">
            <p className="font-semibold">{labels.publishBlocked}</p>
            <ul className="mt-1.5 flex flex-col gap-1">
              {blocking.map((item) => (
                <li key={item.key}>
                  <button
                    type="button"
                    onClick={() => focusField(item.key)}
                    className="text-left text-primary-ink underline-offset-2 hover:underline"
                  >
                    {labels.check[item.key]}
                    {item.missing
                      ? ` · ${fill(labels.checkMissing, { count: item.missing })}`
                      : ""}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        {pictures && !blocking.length ? (
          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              checked={rights}
              onChange={(event) => setRights(event.target.checked)}
              className="mt-0.5 size-4 shrink-0 accent-(--color-action)"
            />
            <span>{labels.rights}</span>
          </label>
        ) : null}
      </ConfirmDialog>

      <ConfirmDialog
        open={dialog === "unpublish"}
        onOpenChange={(open) => setDialog(open ? "unpublish" : null)}
        title={labels.unpublishTitle}
        description={
          otherPublished.length ? labels.unpublishFallback : labels.unpublishLast
        }
        confirmLabel={labels.unpublishConfirm}
        pendingLabel={labels.unpublishing}
        cancelLabel={labels.cancel}
        closeLabel={labels.close}
        tone="danger"
        onConfirm={unpublish}
      />

      <ConfirmDialog
        open={dialog === "archive"}
        onOpenChange={(open) => setDialog(open ? "archive" : null)}
        title={labels.archiveTitle}
        description={labels.archiveBody}
        confirmLabel={labels.archiveConfirm}
        pendingLabel={labels.archiving}
        cancelLabel={labels.cancel}
        closeLabel={labels.close}
        tone="danger"
        onConfirm={archive}
      />

      <ConfirmDialog
        open={dialog === "restore"}
        onOpenChange={(open) => setDialog(open ? "restore" : null)}
        title={labels.restoreTitle}
        description={labels.restoreBody}
        confirmLabel={labels.restoreConfirm}
        pendingLabel={labels.restoring}
        cancelLabel={labels.cancel}
        closeLabel={labels.close}
        onConfirm={() => (restoreId ? restore(restoreId) : Promise.resolve(null))}
      />

      <ConfirmDialog
        open={dialog === "leave"}
        onOpenChange={(open) => setDialog(open ? "leave" : null)}
        title={labels.leaveTitle}
        description={labels.leaveBody}
        confirmLabel={labels.leaveConfirm}
        pendingLabel={labels.leaveConfirm}
        cancelLabel={labels.stay}
        closeLabel={labels.close}
        tone="danger"
        onConfirm={async () => {
          if (leaveTo) {
            leavingRef.current = true;
            router.push(leaveTo);
          }
          return null;
        }}
      />

      <Dialog
        open={!!comparing}
        onOpenChange={(open) => (open ? null : setComparing(null))}
      >
        <DialogContent size="lg" closeLabel={labels.close}>
          <DialogHeader>
            <DialogTitle className="font-sans text-lg font-semibold">
              {comparing
                ? fill(labels.compareVersion, { date: dateTime(comparing.createdAt) })
                : null}
            </DialogTitle>
          </DialogHeader>
          <DialogBody className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border border-border p-4">
              <p className="mb-3 text-xs font-semibold text-ink-muted">
                {comparing
                  ? fill(labels.compareVersion, { date: dateTime(comparing.createdAt) })
                  : null}
              </p>
              {comparing ? (
                <BlogReference
                  title={comparing.title}
                  summary={comparing.summary}
                  body={comparing.body}
                  lang={locale}
                  pictureLabel={labels.picture}
                />
              ) : null}
            </div>
            <div className="rounded-lg border border-border p-4">
              <p className="mb-3 text-xs font-semibold text-ink-muted">
                {labels.compareCurrent}
              </p>
              <BlogReference
                title={draft.title}
                summary={draft.summary}
                body={editor?.getJSON()}
                lang={locale}
                pictureLabel={labels.picture}
              />
            </div>
          </DialogBody>
          <DialogFooter>
            <Button variant="ghost" size="sm" onClick={() => setComparing(null)}>
              {labels.close}
            </Button>
            <Button
              size="sm"
              onClick={() => {
                if (!comparing) return;
                setRestoreId(comparing.id);
                setComparing(null);
                setDialog("restore");
              }}
            >
              {labels.restore}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function UploadRow({
  upload,
  labels,
  onRetry,
  onDismiss,
}: {
  upload: Upload;
  labels: BlogEditorLabels;
  onRetry: () => void;
  onDismiss: () => void;
}) {
  const message =
    upload.state === "uploading"
      ? labels.uploading
      : upload.problem === "size"
        ? labels.uploadTooLarge
        : upload.problem === "type"
          ? labels.uploadInvalid
          : labels.uploadFailed;
  return (
    <li className="flex items-center gap-3 px-5 py-2.5 sm:px-8">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={upload.preview}
        alt=""
        className="size-12 shrink-0 rounded-md bg-surface object-cover"
      />
      <p
        role={upload.state === "failed" ? "alert" : "status"}
        className={cn(
          "min-w-0 flex-1 text-sm",
          upload.state === "failed"
            ? "font-semibold text-danger-ink"
            : "text-ink-muted",
        )}
      >
        {upload.state === "uploading" ? (
          <LoaderCircle
            aria-hidden="true"
            className="mr-1.5 inline size-4 animate-spin"
          />
        ) : null}
        {fill(message, { name: upload.file.name })}
      </p>
      {upload.state === "failed" ? (
        <span className="flex shrink-0 gap-1">
          {upload.problem === "network" ? (
            <Button size="row" variant="outline" onClick={onRetry}>
              {labels.retry}
            </Button>
          ) : null}
          <Button size="row" variant="ghost" onClick={onDismiss}>
            {labels.dismiss}
          </Button>
        </span>
      ) : null}
    </li>
  );
}
