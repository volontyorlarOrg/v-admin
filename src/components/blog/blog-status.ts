import {
  Archive,
  BadgeCheck,
  CircleDashed,
  FilePenLine,
  PencilLine,
} from "lucide-react";

import type { Status } from "@/components/portal/status-badge";
import type { ArticleState, TranslationState } from "@/lib/blog/content";

const STATUS: Record<ArticleState | TranslationState, Status> = {
  draft: { tone: "draft", icon: PencilLine },
  published: { tone: "live", icon: BadgeCheck },
  changes: { tone: "returned", icon: FilePenLine },
  missing: { tone: "neutral", icon: CircleDashed },
  archived: { tone: "final", icon: Archive },
};

export function blogStatus(state: ArticleState | TranslationState): Status {
  return STATUS[state];
}

export function fill(template: string, values: Record<string, string | number>) {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in values ? String(values[key]) : match,
  );
}
