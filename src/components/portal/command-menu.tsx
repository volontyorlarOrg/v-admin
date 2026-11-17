"use client";

import { CornerDownLeft, Search } from "lucide-react";
import { Dialog as DialogPrimitive } from "radix-ui";
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";

import { NavIcon } from "@/components/portal/nav-icon";
import { useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

export type CommandItem = {
  key: string;
  label: string;
  href: string;
  icon: string;
  context?: string;
};

export type CommandGroup = { key: string; label: string; items: CommandItem[] };

export type CommandSearch = {
  key: string;
  template: string;
  href: string;
  icon: string;
};

export type CommandMenuCopy = {
  open: string;
  title: string;
  placeholder: string;
  empty: string;
  hint: string;
  searchGroup: string;
};

const MARKS = /[ʻʼ’‘'`]/g;

function normalize(value: string): string {
  return value.toLocaleLowerCase().replace(MARKS, "").trim();
}

function subscribePlatform() {
  return () => {};
}

function readShortcut(): string {
  return /Mac|iPhone|iPad/.test(navigator.platform) ? "⌘K" : "Ctrl K";
}

function typingInField(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)
  );
}

export function CommandMenu({
  groups,
  searches,
  copy,
}: {
  groups: CommandGroup[];
  searches: CommandSearch[];
  copy: CommandMenuCopy;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const listRef = useRef<HTMLUListElement>(null);
  const baseId = useId();
  const shortcut = useSyncExternalStore(subscribePlatform, readShortcut, () => null);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const combo = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k";
      const slash = event.key === "/" && !typingInField(event.target);
      if (combo) {
        event.preventDefault();
        setOpen((value) => !value);
      } else if (slash) {
        event.preventDefault();
        setOpen(true);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const term = normalize(query);

  const sections = useMemo((): CommandGroup[] => {
    const matched = groups
      .map((group) => ({
        ...group,
        items: term
          ? group.items.filter((item) =>
              normalize(`${item.label} ${item.context ?? ""}`).includes(term),
            )
          : group.items,
      }))
      .filter((group) => group.items.length > 0);
    if (!term) return matched;
    const raw = query.trim();
    return [
      ...matched,
      {
        key: "search",
        label: copy.searchGroup,
        items: searches.map((search) => ({
          key: `search-${search.key}`,
          label: search.template.replace("{query}", raw),
          href: `${search.href}?q=${encodeURIComponent(raw)}`,
          icon: search.icon,
        })),
      },
    ];
  }, [groups, searches, term, query, copy.searchGroup]);

  const flat = sections.flatMap((section) => section.items);
  const selected = Math.min(active, Math.max(0, flat.length - 1));

  const go = useCallback(
    (item: CommandItem | undefined) => {
      if (!item) return;
      setOpen(false);
      router.push(item.href);
    },
    [router],
  );

  useEffect(() => {
    listRef.current
      ?.querySelector(`[data-index="${selected}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [selected]);

  function onOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      setQuery("");
      setActive(0);
    }
  }

  let index = -1;

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Trigger
        aria-label={copy.open}
        className="group flex h-9 items-center gap-2 rounded-md border border-border-strong bg-surface px-2.5 text-sm text-ink-muted transition-colors duration-150 hover:border-border-control hover:text-ink sm:w-60 lg:w-64"
      >
        <Search aria-hidden="true" className="size-4 shrink-0" />
        <span className="hidden flex-1 truncate text-left sm:block">{copy.open}</span>
        {shortcut ? (
          <kbd className="hidden rounded-sm border border-border bg-surface-sunk px-1.5 font-sans text-[0.6875rem] leading-5 font-medium text-ink-muted sm:block">
            {shortcut}
          </kbd>
        ) : null}
      </DialogPrimitive.Trigger>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-ink/25" />
        <DialogPrimitive.Content
          aria-describedby={`${baseId}-hint`}
          className="fixed top-[max(1rem,12vh)] left-1/2 z-50 flex max-h-[min(34rem,76vh)] w-[min(36rem,calc(100vw-2rem))] -translate-x-1/2 flex-col overflow-hidden rounded-2xl border border-border bg-surface-raised shadow-raised outline-none"
        >
          <DialogPrimitive.Title className="sr-only">
            {copy.title}
          </DialogPrimitive.Title>
          <div className="flex items-center gap-3 border-b border-border px-4">
            <Search
              aria-hidden="true"
              className="size-[1.125rem] shrink-0 text-ink-muted"
            />
            <input
              role="combobox"
              aria-expanded="true"
              aria-controls={`${baseId}-list`}
              aria-activedescendant={flat.length ? `${baseId}-${selected}` : undefined}
              aria-label={copy.title}
              autoComplete="off"
              spellCheck={false}
              value={query}
              placeholder={copy.placeholder}
              onChange={(event) => {
                setQuery(event.target.value);
                setActive(0);
              }}
              onKeyDown={(event) => {
                if (event.key === "ArrowDown") {
                  event.preventDefault();
                  setActive((value) => (flat.length ? (value + 1) % flat.length : 0));
                } else if (event.key === "ArrowUp") {
                  event.preventDefault();
                  setActive((value) =>
                    flat.length ? (value - 1 + flat.length) % flat.length : 0,
                  );
                } else if (event.key === "Enter") {
                  event.preventDefault();
                  go(flat[selected]);
                }
              }}
              className="h-14 min-w-0 flex-1 bg-transparent text-base text-ink outline-none placeholder:text-ink-muted"
            />
          </div>
          <ul
            ref={listRef}
            id={`${baseId}-list`}
            role="listbox"
            aria-label={copy.title}
            className="flex-1 overflow-y-auto p-2"
          >
            {flat.length === 0 ? (
              <li
                role="presentation"
                className="px-3 py-6 text-center text-sm text-ink-muted"
              >
                {copy.empty.replace("{query}", query.trim())}
              </li>
            ) : (
              sections.map((section) => (
                <li key={section.key} role="presentation" className="pb-1">
                  <p
                    role="presentation"
                    className="px-3 pt-2 pb-1 text-xs font-semibold text-ink-muted"
                  >
                    {section.label}
                  </p>
                  <ul role="group" aria-label={section.label}>
                    {section.items.map((item) => {
                      index += 1;
                      const position = index;
                      const isActive = position === selected;
                      return (
                        <li
                          key={item.key}
                          id={`${baseId}-${position}`}
                          role="option"
                          aria-selected={isActive}
                          data-index={position}
                          onPointerMove={() => setActive(position)}
                          onClick={() => go(item)}
                          className={cn(
                            "flex min-h-10 cursor-pointer items-center gap-3 rounded-md px-3 text-sm",
                            isActive ? "bg-surface-sunk text-ink" : "text-ink",
                          )}
                        >
                          <NavIcon
                            name={item.icon}
                            className={cn(
                              "size-4 shrink-0",
                              isActive ? "text-primary-ink" : "text-ink-muted",
                            )}
                          />
                          <span className="min-w-0 flex-1 truncate font-medium">
                            {item.label}
                          </span>
                          {item.context ? (
                            <span className="shrink-0 text-xs text-ink-muted">
                              {item.context}
                            </span>
                          ) : null}
                          {isActive ? (
                            <CornerDownLeft
                              aria-hidden="true"
                              className="size-3.5 shrink-0 text-ink-muted"
                            />
                          ) : null}
                        </li>
                      );
                    })}
                  </ul>
                </li>
              ))
            )}
          </ul>
          <p
            id={`${baseId}-hint`}
            className="border-t border-border bg-surface-sunk px-4 py-2 text-xs text-ink-muted"
          >
            {copy.hint}
          </p>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
