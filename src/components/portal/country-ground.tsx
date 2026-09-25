"use client";

import { useEffect, useRef, useState } from "react";
import type { Vector3 } from "three";

import type {
  GroundPalette,
  GroundPlacement,
  GroundScene,
} from "@/components/portal/ground/scene";
import {
  groundWindow,
  subscribeToGroundWindow,
} from "@/components/portal/ground/window-store";
import { REGION_GEOMETRY } from "@/lib/map/region-geometry";
import { MAP_VIEW_BOX, regionPath } from "@/lib/map/svg";
import { subscribeToTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";

const FRAME_INTERVAL_MS = 1000 / 30;
const IDLE_RESUME_MS = 2600;
const MAX_PIXEL_RATIO = 1.5;
const MIN_WINDOW_WIDTH = 160;
const MIN_WINDOW_HEIGHT = 48;

const COUNTRY_PATH = REGION_GEOMETRY.map(regionPath).join("");

type Rgb = [number, number, number];

function tokenRgb(name: string): Rgb {
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
  const probe = document.createElement("canvas").getContext("2d");
  if (!probe || !value) return [0.5, 0.55, 0.6];
  probe.fillStyle = "#808b96";
  probe.fillStyle = value;
  const hex = probe.fillStyle;
  const match = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex);
  if (!match) return [0.5, 0.55, 0.6];
  return [1, 2, 3].map((group) => parseInt(match[group] as string, 16) / 255) as Rgb;
}

function alignment(value: string): number {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? Math.min(1, Math.max(0, parsed)) : 0.5;
}

function windowPlacement(box: DOMRect): GroundPlacement | null {
  const element = groundWindow();
  if (!element) return null;
  const rect = element.getBoundingClientRect();
  if (rect.width < MIN_WINDOW_WIDTH || rect.height < MIN_WINDOW_HEIGHT) return null;
  const style = getComputedStyle(element);
  return {
    x: rect.left - box.left,
    y: rect.top + window.scrollY - box.top,
    width: rect.width,
    height: rect.height,
    alignX: alignment(style.getPropertyValue("--ground-align-x")),
    alignY: alignment(style.getPropertyValue("--ground-align-y")),
  };
}

function palette(vector: (rgb: Rgb) => Vector3): GroundPalette {
  const dark = document.documentElement.dataset.theme === "dark";
  return dark
    ? {
        line: vector(tokenRgb("--color-primary")),
        country: vector(tokenRgb("--color-primary")),
        border: vector(tokenRgb("--color-primary-ink")),
        lineAlpha: 0.12,
        countryAlpha: 0.38,
        borderAlpha: 0.4,
      }
    : {
        line: vector(tokenRgb("--color-primary-deep")),
        country: vector(tokenRgb("--color-primary")),
        border: vector(tokenRgb("--color-primary-ink")),
        lineAlpha: 0.14,
        countryAlpha: 0.4,
        borderAlpha: 0.46,
      };
}

export function CountryGround({
  variant = "workspace",
}: {
  variant?: "workspace" | "doorway";
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [live, setLive] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas || !("WebGLRenderingContext" in window)) return;

    let disposed = false;
    let cleanup = () => {};

    async function mount() {
      const [{ Vector3 }, { createGroundScene }] = await Promise.all([
        import("three"),
        import("@/components/portal/ground/scene"),
      ]);
      if (disposed || !container || !canvas) return;

      const vector = (rgb: Rgb) => new Vector3(...rgb);
      let scene: GroundScene;
      try {
        scene = createGroundScene(canvas, palette(vector), variant);
      } catch {
        return;
      }

      const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
      const finePointer = matchMedia("(pointer: fine)");
      const lean = { x: 0, y: 0 };
      const leanTarget = { x: 0, y: 0 };
      let time = 0;
      let speed = 1;
      let targetSpeed = 1;
      let frame: number | null = null;
      let last = 0;
      let idle: ReturnType<typeof setTimeout> | undefined;

      const paint = () => scene.render(time, lean);

      function measure() {
        const box = (container as HTMLDivElement).getBoundingClientRect();
        scene.resize(
          box.width,
          box.height,
          Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO),
        );
        scene.place(windowPlacement(box), true);
      }

      function replace() {
        const box = (container as HTMLDivElement).getBoundingClientRect();
        const glide = !reducedMotion.matches && !document.hidden;
        scene.place(windowPlacement(box), !glide);
        if (glide) start();
        else paint();
      }

      function settled() {
        return (
          speed < 0.002 &&
          Math.abs(leanTarget.x - lean.x) < 0.001 &&
          Math.abs(leanTarget.y - lean.y) < 0.001 &&
          !scene.placing()
        );
      }

      function tick(now: number) {
        frame = requestAnimationFrame(tick);
        if (last && now - last < FRAME_INTERVAL_MS) return;
        const seconds = last ? Math.min(0.1, (now - last) / 1000) : 0;
        last = now;
        speed += (targetSpeed - speed) * (1 - Math.exp(-seconds * 3.2));
        time += seconds * speed;
        lean.x += (leanTarget.x - lean.x) * (1 - Math.exp(-seconds * 1.8));
        lean.y += (leanTarget.y - lean.y) * (1 - Math.exp(-seconds * 1.8));
        paint();
        if (targetSpeed === 0 && settled()) stop();
      }

      function start() {
        if (frame !== null || document.hidden || reducedMotion.matches) return;
        last = 0;
        frame = requestAnimationFrame(tick);
      }

      function stop() {
        if (frame !== null) cancelAnimationFrame(frame);
        frame = null;
      }

      function still() {
        targetSpeed = 0;
        if (idle) clearTimeout(idle);
        idle = setTimeout(() => {
          targetSpeed = 1;
          start();
        }, IDLE_RESUME_MS);
      }

      function onPointerMove(event: PointerEvent) {
        if (!finePointer.matches) return;
        leanTarget.x = (event.clientX / window.innerWidth - 0.5) * 2;
        leanTarget.y = (event.clientY / window.innerHeight - 0.5) * 2;
        start();
      }

      function onVisibility() {
        if (document.hidden) stop();
        else start();
      }

      function onMotionPreference() {
        stop();
        if (reducedMotion.matches) paint();
        else start();
      }

      function onContextLost(event: Event) {
        event.preventDefault();
        stop();
        setLive(false);
      }

      measure();
      paint();
      setLive(true);
      start();

      let watched: HTMLElement | null = groundWindow();
      const observer = new ResizeObserver((entries) => {
        if (entries.some((entry) => entry.target === container)) {
          measure();
          paint();
        } else {
          replace();
        }
      });
      observer.observe(container);
      if (watched) observer.observe(watched);
      const unwatch = subscribeToGroundWindow(() => {
        if (watched) observer.unobserve(watched);
        watched = groundWindow();
        if (watched) observer.observe(watched);
        replace();
      });
      if ("fonts" in document) {
        void document.fonts.ready.then(() => {
          if (!disposed) replace();
        });
      }
      const unsubscribe = subscribeToTheme(() => {
        scene.setPalette(palette(vector));
        paint();
      });

      window.addEventListener("pointermove", onPointerMove, { passive: true });
      document.addEventListener("pointerdown", still, { passive: true });
      document.addEventListener("keydown", still);
      document.addEventListener("wheel", still, { passive: true });
      document.addEventListener("touchmove", still, { passive: true });
      document.addEventListener("visibilitychange", onVisibility);
      reducedMotion.addEventListener("change", onMotionPreference);
      canvas.addEventListener("webglcontextlost", onContextLost);

      cleanup = () => {
        stop();
        if (idle) clearTimeout(idle);
        observer.disconnect();
        unwatch();
        unsubscribe();
        window.removeEventListener("pointermove", onPointerMove);
        document.removeEventListener("pointerdown", still);
        document.removeEventListener("keydown", still);
        document.removeEventListener("wheel", still);
        document.removeEventListener("touchmove", still);
        document.removeEventListener("visibilitychange", onVisibility);
        reducedMotion.removeEventListener("change", onMotionPreference);
        canvas.removeEventListener("webglcontextlost", onContextLost);
        scene.dispose();
      };
    }

    void mount();

    return () => {
      disposed = true;
      cleanup();
    };
  }, [variant]);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      data-slot="country-ground"
      data-live={live ? "" : undefined}
      className={cn(
        "pointer-events-none fixed inset-0 -z-10 overflow-hidden workspace-wash",
        variant === "workspace" && "lg:left-(--sidebar-width)",
      )}
    >
      <svg
        viewBox={MAP_VIEW_BOX}
        preserveAspectRatio="xMidYMid meet"
        className={cn(
          "absolute top-[-6%] left-1/2 w-[min(78rem,120%)] [transform-origin:50%_0] -translate-x-1/2 [transform:perspective(60rem)_rotateX(58deg)] transition-opacity duration-700",
          live ? "opacity-0" : "opacity-100",
        )}
      >
        <defs>
          <pattern
            id="ground-ruling"
            width="2"
            height="0.028"
            patternUnits="userSpaceOnUse"
          >
            <line
              x1="-1"
              x2="1"
              y1="0.014"
              y2="0.014"
              stroke="var(--color-primary)"
              strokeOpacity="0.4"
              strokeWidth="0.0035"
            />
          </pattern>
        </defs>
        <path d={COUNTRY_PATH} fill="url(#ground-ruling)" />
        <path
          d={COUNTRY_PATH}
          fill="none"
          stroke="var(--color-primary-ink)"
          strokeOpacity="0.4"
          strokeWidth="0.004"
          strokeLinejoin="round"
        />
      </svg>
      <canvas
        ref={canvasRef}
        className={cn(
          "absolute inset-0 size-full transition-opacity duration-700",
          live ? "opacity-100" : "opacity-0",
        )}
      />
    </div>
  );
}
