import type { ReactNode } from "react";

import type { BlogNode } from "@/lib/blog/content";

function Node({
  node,
  pictureLabel,
}: {
  node: BlogNode;
  pictureLabel: string;
}): ReactNode {
  const children = node.content?.map((child, index) => (
    <Node key={index} node={child} pictureLabel={pictureLabel} />
  ));
  switch (node.type) {
    case "doc":
      return <>{children}</>;
    case "paragraph":
      return node.content?.length ? <p>{children}</p> : null;
    case "heading":
      return node.attrs?.level === 3 ? <h3>{children}</h3> : <h2>{children}</h2>;
    case "bulletList":
      return <ul>{children}</ul>;
    case "orderedList":
      return <ol>{children}</ol>;
    case "listItem":
      return <li>{children}</li>;
    case "blockquote":
      return <blockquote>{children}</blockquote>;
    case "hardBreak":
      return <br />;
    case "image": {
      const alt = typeof node.attrs?.alt === "string" ? node.attrs.alt.trim() : "";
      return (
        <p className="rounded-md border border-dashed border-border-control px-3 py-2 text-sm text-ink-muted">
          {pictureLabel}
          {alt ? `: ${alt}` : ""}
        </p>
      );
    }
    case "text": {
      let text: ReactNode = node.text ?? "";
      for (const mark of node.marks ?? []) {
        if (mark.type === "bold") text = <strong>{text}</strong>;
        if (mark.type === "italic") text = <em>{text}</em>;
        if (mark.type === "link") text = <u>{text}</u>;
      }
      return text;
    }
    default:
      return null;
  }
}

export function BlogReference({
  title,
  summary,
  body,
  lang,
  pictureLabel,
}: {
  title: string;
  summary: string;
  body: unknown;
  lang: string;
  pictureLabel: string;
}) {
  return (
    <div
      lang={lang}
      className="article-editor article-reference max-h-[28rem] overflow-y-auto"
    >
      {title ? (
        <p className="font-serif text-2xl leading-tight text-ink">{title}</p>
      ) : null}
      {summary ? <p className="text-ink-muted">{summary}</p> : null}
      <Node node={body as BlogNode} pictureLabel={pictureLabel} />
    </div>
  );
}
