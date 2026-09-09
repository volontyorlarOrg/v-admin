"use client";

import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";

import { SidebarNav, type NavItem } from "@/components/portal/sidebar-nav";
import { cn } from "@/lib/utils";

export function MobileNav({
  items,
  navLabel,
  openLabel,
  closeLabel,
}: {
  items: NavItem[];
  navLabel: string;
  openLabel: string;
  closeLabel: string;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-controls="portal-mobile-nav"
        aria-label={open ? closeLabel : openLabel}
        className="flex size-11 items-center justify-center rounded-lg text-ink hover:bg-surface-sunk"
      >
        {open ? (
          <X aria-hidden="true" className="size-5" />
        ) : (
          <Menu aria-hidden="true" className="size-5" />
        )}
      </button>

      <div
        id="portal-mobile-nav"
        hidden={!open}
        className={cn(
          "absolute inset-x-0 top-full z-40 border-b border-border bg-surface px-4 py-3 shadow-[0_18px_40px_-32px_rgb(28_36_43/0.45)]",
        )}
      >
        <SidebarNav items={items} label={navLabel} onNavigate={() => setOpen(false)} />
      </div>
    </div>
  );
}
