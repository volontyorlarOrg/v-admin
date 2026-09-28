"use client";

import { useEditorState, type Editor } from "@tiptap/react";
import {
  Bold,
  Heading2,
  Heading3,
  ImagePlus,
  Italic,
  Link2,
  List,
  ListOrdered,
  Pilcrow,
  Quote,
  Redo2,
  Undo2,
  type LucideIcon,
} from "lucide-react";
import { useId, useState, type ChangeEvent, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { compactInputClass } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { BLOG_IMAGE_TYPES, normalizeHref } from "@/lib/blog/content";
import { cn } from "@/lib/utils";

export type BlogToolbarLabels = {
  toolbar: string;
  paragraph: string;
  heading2: string;
  heading3: string;
  bold: string;
  italic: string;
  bullet: string;
  ordered: string;
  quote: string;
  link: string;
  undo: string;
  redo: string;
  insertPicture: string;
  pictureHint: string;
  linkField: string;
  linkHint: string;
  linkInvalid: string;
  linkApply: string;
  linkRemove: string;
};

type Tool = {
  key: string;
  label: string;
  icon: LucideIcon;
  active: boolean;
  run: () => void;
};

const button =
  "inline-flex size-9 shrink-0 items-center justify-center rounded-full text-ink transition-colors hover:bg-surface-sunk disabled:pointer-events-none disabled:opacity-40 aria-pressed:bg-surface-soft aria-pressed:text-primary-ink [&_svg]:size-4";

export function syncSelection(editor: Editor | null) {
  if (!editor) return;
  const { view } = editor;
  const selection = window.getSelection();
  if (!selection?.rangeCount || !selection.anchorNode || !selection.focusNode) return;
  if (
    !view.dom.contains(selection.anchorNode) ||
    !view.dom.contains(selection.focusNode)
  )
    return;
  try {
    const anchor = view.posAtDOM(selection.anchorNode, selection.anchorOffset);
    const head = view.posAtDOM(selection.focusNode, selection.focusOffset);
    editor.commands.setTextSelection({
      from: Math.min(anchor, head),
      to: Math.max(anchor, head),
    });
  } catch {
    return;
  }
}

function LinkForm({
  editor,
  labels,
  siteOrigin,
  initialHref,
  active,
  onDone,
}: {
  editor: Editor;
  labels: BlogToolbarLabels;
  siteOrigin: string | null;
  initialHref: string;
  active: boolean;
  onDone: () => void;
}) {
  const id = useId();
  const [href, setHref] = useState(initialHref);
  const [invalid, setInvalid] = useState(false);

  function apply(event: FormEvent) {
    event.preventDefault();
    const normalized = normalizeHref(href, siteOrigin);
    if (!normalized) {
      setInvalid(true);
      return;
    }
    const chain = editor.chain().focus();
    if (editor.isActive("link")) {
      chain.extendMarkRange("link").setLink({ href: normalized }).run();
      editor.commands.setTextSelection(editor.state.selection.to);
    } else if (editor.state.selection.empty) {
      chain
        .insertContent({
          type: "text",
          text: href.trim(),
          marks: [{ type: "link", attrs: { href: normalized } }],
        })
        .run();
    } else {
      chain.setLink({ href: normalized }).run();
      editor.commands.setTextSelection(editor.state.selection.to);
    }
    onDone();
  }

  function remove() {
    editor.chain().focus().extendMarkRange("link").unsetLink().run();
    onDone();
  }

  return (
    <form onSubmit={apply} className="flex flex-col gap-2" noValidate>
      <label htmlFor={`${id}-href`} className="text-xs font-semibold text-ink">
        {labels.linkField}
      </label>
      <input
        id={`${id}-href`}
        value={href}
        autoFocus
        inputMode="url"
        autoComplete="off"
        spellCheck={false}
        aria-invalid={invalid || undefined}
        aria-describedby={`${id}-href-help`}
        onChange={(event) => {
          setHref(event.target.value);
          setInvalid(false);
        }}
        placeholder="https://"
        className={cn(
          compactInputClass,
          "rounded-lg aria-invalid:border-danger aria-invalid:bg-danger-muted",
        )}
      />
      <p
        id={`${id}-href-help`}
        role={invalid ? "alert" : undefined}
        className={cn(
          "text-xs leading-5",
          invalid ? "font-semibold text-danger-ink" : "text-ink-muted",
        )}
      >
        {invalid ? labels.linkInvalid : labels.linkHint}
      </p>
      <div className="mt-1 flex items-center justify-end gap-2">
        {active ? (
          <Button type="button" variant="ghost" size="row" onClick={remove}>
            {labels.linkRemove}
          </Button>
        ) : null}
        <Button type="submit" size="row" disabled={!href.trim()}>
          {labels.linkApply}
        </Button>
      </div>
    </form>
  );
}

export function BlogToolbar({
  editor,
  labels,
  siteOrigin,
  readOnly,
  linkOpen,
  onLinkOpenChange,
  onPictures,
}: {
  editor: Editor | null;
  labels: BlogToolbarLabels;
  siteOrigin: string | null;
  readOnly: boolean;
  linkOpen: boolean;
  onLinkOpenChange: (open: boolean) => void;
  onPictures: (files: File[]) => void;
}) {
  const state = useEditorState({
    editor,
    selector: ({ editor: current }) =>
      current
        ? {
            paragraph: current.isActive("paragraph"),
            heading2: current.isActive("heading", { level: 2 }),
            heading3: current.isActive("heading", { level: 3 }),
            bold: current.isActive("bold"),
            italic: current.isActive("italic"),
            bullet: current.isActive("bulletList"),
            ordered: current.isActive("orderedList"),
            quote: current.isActive("blockquote"),
            link: current.isActive("link"),
            href: String(current.getAttributes("link").href ?? ""),
            canUndo: current.can().undo(),
            canRedo: current.can().redo(),
          }
        : null,
  });
  const disabled = !editor || readOnly;
  const chain = () => editor!.chain().focus();

  const blocks: Tool[] = [
    {
      key: "paragraph",
      label: labels.paragraph,
      icon: Pilcrow,
      active: !!state?.paragraph && !state.bullet && !state.ordered && !state.quote,
      run: () => chain().setParagraph().run(),
    },
    {
      key: "heading2",
      label: labels.heading2,
      icon: Heading2,
      active: !!state?.heading2,
      run: () => chain().toggleHeading({ level: 2 }).run(),
    },
    {
      key: "heading3",
      label: labels.heading3,
      icon: Heading3,
      active: !!state?.heading3,
      run: () => chain().toggleHeading({ level: 3 }).run(),
    },
  ];
  const inline: Tool[] = [
    {
      key: "bold",
      label: labels.bold,
      icon: Bold,
      active: !!state?.bold,
      run: () => chain().toggleBold().run(),
    },
    {
      key: "italic",
      label: labels.italic,
      icon: Italic,
      active: !!state?.italic,
      run: () => chain().toggleItalic().run(),
    },
  ];
  const structure: Tool[] = [
    {
      key: "bullet",
      label: labels.bullet,
      icon: List,
      active: !!state?.bullet,
      run: () => chain().toggleBulletList().run(),
    },
    {
      key: "ordered",
      label: labels.ordered,
      icon: ListOrdered,
      active: !!state?.ordered,
      run: () => chain().toggleOrderedList().run(),
    },
    {
      key: "quote",
      label: labels.quote,
      icon: Quote,
      active: !!state?.quote,
      run: () => chain().toggleBlockquote().run(),
    },
  ];

  function renderGroup(tools: Tool[]) {
    return tools.map((tool) => (
      <button
        key={tool.key}
        type="button"
        className={button}
        onMouseDown={(event) => event.preventDefault()}
        onClick={tool.run}
        disabled={disabled}
        aria-pressed={tool.active}
        aria-label={tool.label}
        title={tool.label}
      >
        <tool.icon aria-hidden="true" />
      </button>
    ));
  }

  function pick(event: ChangeEvent<HTMLInputElement>) {
    const files = [...(event.target.files ?? [])];
    event.target.value = "";
    if (files.length) onPictures(files);
  }

  const divider = <span aria-hidden="true" className="mx-1 h-5 w-px bg-border" />;

  return (
    <div
      role="toolbar"
      aria-label={labels.toolbar}
      className="sticky top-14 z-20 flex flex-wrap items-center gap-0.5 border-y border-border bg-surface px-3 py-1.5 sm:px-5 lg:top-0"
    >
      {renderGroup(blocks)}
      {divider}
      {renderGroup(inline)}
      <Popover open={linkOpen} onOpenChange={onLinkOpenChange}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className={button}
            disabled={disabled}
            aria-pressed={!!state?.link}
            aria-label={labels.link}
            title={labels.link}
            onMouseDown={() => syncSelection(editor)}
          >
            <Link2 aria-hidden="true" />
          </button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className="w-80"
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            editor?.commands.focus();
          }}
        >
          {editor ? (
            <LinkForm
              editor={editor}
              labels={labels}
              siteOrigin={siteOrigin}
              initialHref={state?.href ?? ""}
              active={!!state?.link}
              onDone={() => onLinkOpenChange(false)}
            />
          ) : null}
        </PopoverContent>
      </Popover>
      {divider}
      {renderGroup(structure)}
      {divider}
      <button
        type="button"
        className={button}
        disabled={disabled || !state?.canUndo}
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => chain().undo().run()}
        aria-label={labels.undo}
        title={labels.undo}
      >
        <Undo2 aria-hidden="true" />
      </button>
      <button
        type="button"
        className={button}
        disabled={disabled || !state?.canRedo}
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => chain().redo().run()}
        aria-label={labels.redo}
        title={labels.redo}
      >
        <Redo2 aria-hidden="true" />
      </button>
      <label
        title={labels.pictureHint}
        className={cn(
          "ml-auto inline-flex min-h-9 cursor-pointer items-center gap-2 rounded-full px-3.5 text-sm font-semibold text-primary-ink transition-colors hover:bg-surface-soft has-focus-visible:outline-3 has-focus-visible:outline-offset-2 has-focus-visible:outline-primary-ink [&_svg]:size-4",
          disabled ? "pointer-events-none opacity-40" : null,
        )}
      >
        <ImagePlus aria-hidden="true" />
        {labels.insertPicture}
        <input
          type="file"
          multiple
          accept={BLOG_IMAGE_TYPES.join(",")}
          className="sr-only"
          disabled={disabled}
          onChange={pick}
        />
      </label>
    </div>
  );
}
