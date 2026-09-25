"use client";

import { Menu, X } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Dialog as DialogPrimitive } from "radix-ui";

import { SidebarNav, type NavGroupItems } from "@/components/portal/sidebar-nav";

export function MobileHeader({
  brand,
  drawerBrand,
  groups,
  navLabel,
  openLabel,
  closeLabel,
  footer,
}: {
  brand: ReactNode;
  drawerBrand: ReactNode;
  groups: NavGroupItems[];
  navLabel: string;
  openLabel: string;
  closeLabel: string;
  footer: ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-surface px-4 lg:hidden">
      {brand}
      <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
        <DialogPrimitive.Trigger
          aria-label={openLabel}
          className="ml-auto flex size-11 items-center justify-center rounded-lg text-ink hover:bg-surface-sunk"
        >
          <Menu aria-hidden="true" className="size-5" />
        </DialogPrimitive.Trigger>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-shell/55" />
          <DialogPrimitive.Content
            aria-describedby={undefined}
            className="fixed inset-y-0 left-0 z-50 flex w-[min(20rem,88vw)] flex-col bg-shell shell-glow text-shell-ink outline-none [&_:focus-visible]:outline-shell-ink"
          >
            <div className="flex items-center justify-between gap-3 px-4 pt-4 pb-3">
              <DialogPrimitive.Title className="sr-only">
                {navLabel}
              </DialogPrimitive.Title>
              <div className="min-w-0">{drawerBrand}</div>
              <DialogPrimitive.Close
                aria-label={closeLabel}
                className="flex size-11 items-center justify-center rounded-lg text-shell-muted hover:bg-shell-raised hover:text-shell-ink"
              >
                <X aria-hidden="true" className="size-5" />
              </DialogPrimitive.Close>
            </div>
            <div className="flex-1 overflow-y-auto px-3 pb-3">
              <SidebarNav
                groups={groups}
                label={navLabel}
                onNavigate={() => setOpen(false)}
              />
            </div>
            <div className="border-t border-shell-line px-3 py-3">{footer}</div>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </header>
  );
}
