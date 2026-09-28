"use client";

import Image from "@tiptap/extension-image";
import {
  NodeViewWrapper,
  ReactNodeViewRenderer,
  type NodeViewProps,
} from "@tiptap/react";
import { ArrowDown, ArrowUp, Trash2 } from "lucide-react";
import { useId } from "react";

import { compactInputClass } from "@/components/ui/input";
import { BLOG_LIMITS } from "@/lib/blog/content";
import { cn } from "@/lib/utils";

export type BlogImageLabels = {
  imageAlt: string;
  imageAltHint: string;
  imageAltMissing: string;
  imageCaption: string;
  imageCredit: string;
  moveUp: string;
  moveDown: string;
  removePicture: string;
};

function BlogImageView({
  node,
  editor,
  getPos,
  selected,
  updateAttributes,
  deleteNode,
  labels,
  mediaSrc,
}: NodeViewProps & { labels: BlogImageLabels; mediaSrc: (id: string) => string }) {
  const id = useId();
  const attrs = node.attrs as {
    mediaId?: string | null;
    alt?: string | null;
    caption?: string | null;
    credit?: string | null;
    width?: number | null;
    height?: number | null;
  };
  const editable = editor.isEditable;
  const alt = attrs.alt ?? "";
  const missing = !alt.trim();

  function move(direction: -1 | 1) {
    const pos = getPos();
    if (typeof pos !== "number") return;
    const { state } = editor;
    const $pos = state.doc.resolve(pos);
    const index = $pos.index();
    const parent = $pos.parent;
    const tr = state.tr;
    let next: number;
    if (direction < 0) {
      if (index === 0) return;
      const previous = parent.child(index - 1);
      next = pos - previous.nodeSize;
      tr.delete(pos, pos + node.nodeSize).insert(next, node);
    } else {
      if (index >= parent.childCount - 1) return;
      const following = parent.child(index + 1);
      next = pos + following.nodeSize;
      tr.insert(pos + node.nodeSize + following.nodeSize, node).delete(
        pos,
        pos + node.nodeSize,
      );
    }
    editor.view.dispatch(tr.scrollIntoView());
    editor.commands.setNodeSelection(next);
  }

  const control =
    "inline-flex size-9 items-center justify-center rounded-full text-ink transition-colors hover:bg-surface-soft hover:text-primary-ink [&_svg]:size-4";

  return (
    <NodeViewWrapper className="my-7" data-blog-image="">
      <figure
        className={cn(
          "overflow-hidden rounded-lg border bg-surface",
          selected ? "border-primary-ink ring-2 ring-primary-ink/20" : "border-border",
          editable && missing ? "border-danger/60" : null,
        )}
      >
        <div className="relative bg-surface-sunk">
          {attrs.mediaId ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={mediaSrc(attrs.mediaId)}
              alt={alt}
              width={attrs.width ?? undefined}
              height={attrs.height ?? undefined}
              draggable={false}
              className="mx-auto h-auto max-h-[28rem] w-auto max-w-full object-contain"
            />
          ) : null}
          {editable ? (
            <div className="absolute top-2 right-2 flex gap-0.5 rounded-full border border-border bg-surface p-0.5 shadow-sheet">
              <button
                type="button"
                className={control}
                onClick={() => move(-1)}
                aria-label={labels.moveUp}
                title={labels.moveUp}
              >
                <ArrowUp aria-hidden="true" />
              </button>
              <button
                type="button"
                className={control}
                onClick={() => move(1)}
                aria-label={labels.moveDown}
                title={labels.moveDown}
              >
                <ArrowDown aria-hidden="true" />
              </button>
              <button
                type="button"
                className={cn(control, "hover:bg-danger-muted hover:text-danger-ink")}
                onClick={() => deleteNode()}
                aria-label={labels.removePicture}
                title={labels.removePicture}
              >
                <Trash2 aria-hidden="true" />
              </button>
            </div>
          ) : null}
        </div>
        <div className="grid gap-3 border-t border-border p-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5 sm:col-span-2" htmlFor={`${id}-alt`}>
            <span className="text-xs font-semibold text-ink">{labels.imageAlt}</span>
            <input
              id={`${id}-alt`}
              value={alt}
              readOnly={!editable}
              maxLength={BLOG_LIMITS.alt}
              aria-invalid={editable && missing ? true : undefined}
              aria-describedby={`${id}-alt-help`}
              onChange={(event) => updateAttributes({ alt: event.target.value })}
              className={cn(
                compactInputClass,
                "rounded-lg read-only:bg-surface-sunk aria-invalid:border-danger aria-invalid:bg-danger-muted",
              )}
            />
            <span
              id={`${id}-alt-help`}
              className={cn(
                "text-xs leading-5",
                editable && missing
                  ? "font-semibold text-danger-ink"
                  : "text-ink-muted",
              )}
            >
              {editable && missing ? labels.imageAltMissing : labels.imageAltHint}
            </span>
          </label>
          <label className="flex flex-col gap-1.5" htmlFor={`${id}-caption`}>
            <span className="text-xs font-semibold text-ink">
              {labels.imageCaption}
            </span>
            <input
              id={`${id}-caption`}
              value={attrs.caption ?? ""}
              readOnly={!editable}
              maxLength={BLOG_LIMITS.caption}
              onChange={(event) => updateAttributes({ caption: event.target.value })}
              className={cn(compactInputClass, "rounded-lg read-only:bg-surface-sunk")}
            />
          </label>
          <label className="flex flex-col gap-1.5" htmlFor={`${id}-credit`}>
            <span className="text-xs font-semibold text-ink">{labels.imageCredit}</span>
            <input
              id={`${id}-credit`}
              value={attrs.credit ?? ""}
              readOnly={!editable}
              maxLength={BLOG_LIMITS.credit}
              onChange={(event) => updateAttributes({ credit: event.target.value })}
              className={cn(compactInputClass, "rounded-lg read-only:bg-surface-sunk")}
            />
          </label>
        </div>
      </figure>
    </NodeViewWrapper>
  );
}

export function createBlogImage(
  labels: BlogImageLabels,
  mediaSrc: (id: string) => string,
) {
  return Image.extend({
    addAttributes() {
      return {
        ...this.parent?.(),
        mediaId: {
          default: null,
          parseHTML: (element) => element.getAttribute("data-media-id"),
          renderHTML: (attributes) =>
            attributes.mediaId ? { "data-media-id": attributes.mediaId } : {},
        },
        caption: {
          default: "",
          parseHTML: (element) => element.getAttribute("data-caption") ?? "",
          renderHTML: (attributes) =>
            attributes.caption ? { "data-caption": attributes.caption } : {},
        },
        credit: {
          default: "",
          parseHTML: (element) => element.getAttribute("data-credit") ?? "",
          renderHTML: (attributes) =>
            attributes.credit ? { "data-credit": attributes.credit } : {},
        },
      };
    },
    parseHTML() {
      return [{ tag: "img[data-media-id]" }];
    },
    addNodeView() {
      return ReactNodeViewRenderer((props: NodeViewProps) => (
        <BlogImageView {...props} labels={labels} mediaSrc={mediaSrc} />
      ));
    },
  });
}
