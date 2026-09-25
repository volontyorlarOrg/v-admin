"use client";

import { useEffect, useRef } from "react";

import { registerGroundWindow } from "@/components/portal/ground/window-store";

export function GroundWindow({ className }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    return registerGroundWindow(element);
  }, []);

  return (
    <div ref={ref} aria-hidden="true" data-slot="ground-window" className={className} />
  );
}

export function HeaderGround() {
  return (
    <div
      aria-hidden="true"
      className="relative hidden min-w-24 flex-1 self-stretch lg:block"
    >
      <GroundWindow className="absolute inset-x-0 -bottom-3 h-[calc(100%+3rem)] max-h-32 [--ground-align-x:1] [--ground-align-y:1]" />
    </div>
  );
}
