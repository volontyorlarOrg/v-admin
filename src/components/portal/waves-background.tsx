"use client";

import { useEffect, useRef } from "react";

import { subscribeToTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";

const PERMUTATION = [
  151, 160, 137, 91, 90, 15, 131, 13, 201, 95, 96, 53, 194, 233, 7, 225, 140, 36, 103,
  30, 69, 142, 8, 99, 37, 240, 21, 10, 23, 190, 6, 148, 247, 120, 234, 75, 0, 26, 197,
  62, 94, 252, 219, 203, 117, 35, 11, 32, 57, 177, 33, 88, 237, 149, 56, 87, 174, 20,
  125, 136, 171, 168, 68, 175, 74, 165, 71, 134, 139, 48, 27, 166, 77, 146, 158, 231,
  83, 111, 229, 122, 60, 211, 133, 230, 220, 105, 92, 41, 55, 46, 245, 40, 244, 102,
  143, 54, 65, 25, 63, 161, 1, 216, 80, 73, 209, 76, 132, 187, 208, 89, 18, 169, 200,
  196, 135, 130, 116, 188, 159, 86, 164, 100, 109, 198, 173, 186, 3, 64, 52, 217, 226,
  250, 124, 123, 5, 202, 38, 147, 118, 126, 255, 82, 85, 212, 207, 206, 59, 227, 47, 16,
  58, 17, 182, 189, 28, 42, 223, 183, 170, 213, 119, 248, 152, 2, 44, 154, 163, 70, 221,
  153, 101, 155, 167, 43, 172, 9, 129, 22, 39, 253, 19, 98, 108, 110, 79, 113, 224, 232,
  178, 185, 112, 104, 218, 246, 97, 228, 251, 34, 242, 193, 238, 210, 144, 12, 191, 179,
  162, 241, 81, 51, 145, 235, 249, 14, 239, 107, 49, 192, 214, 31, 181, 199, 106, 157,
  184, 84, 204, 176, 115, 121, 50, 45, 127, 4, 150, 254, 138, 236, 205, 93, 222, 114,
  67, 29, 24, 72, 243, 141, 128, 195, 78, 66, 215, 61, 156, 180,
];

const FLAT: readonly [number, number] = [0, 0];

const GRADIENTS: ReadonlyArray<readonly [number, number]> = [
  [1, 1],
  [-1, 1],
  [1, -1],
  [-1, -1],
  [1, 0],
  [-1, 0],
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
  [0, 1],
  [0, -1],
];

const X_GAP = 18;
const Y_GAP = 44;
const WAVE_SPEED_X = 0.0125;
const WAVE_SPEED_Y = 0.005;
const WAVE_AMPLITUDE_X = 26;
const WAVE_AMPLITUDE_Y = 14;
const FRICTION = 0.925;
const TENSION = 0.005;
const MAX_CURSOR_MOVE = 90;
const CURSOR_RADIUS = 175;
const MAX_PIXEL_RATIO = 2;

function createNoise(seed: number) {
  const permutation = new Array<number>(512);
  const gradients = new Array<readonly [number, number]>(512);

  let scrambled = seed > 0 && seed < 1 ? Math.floor(seed * 65536) : Math.floor(seed);
  if (scrambled < 256) scrambled |= scrambled << 8;

  for (let index = 0; index < 256; index += 1) {
    const source = PERMUTATION[index] ?? 0;
    const value =
      index & 1 ? source ^ (scrambled & 255) : source ^ ((scrambled >> 8) & 255);

    permutation[index] = value;
    permutation[index + 256] = value;
    gradients[index] = GRADIENTS[value % 12] ?? FLAT;
    gradients[index + 256] = GRADIENTS[value % 12] ?? FLAT;
  }

  const fade = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);
  const mix = (a: number, b: number, t: number) => (1 - t) * a + t * b;
  const dot = (index: number, x: number, y: number) => {
    const gradient = gradients[index] ?? FLAT;
    return gradient[0] * x + gradient[1] * y;
  };

  return function perlin2(x: number, y: number) {
    const cellX = Math.floor(x);
    const cellY = Math.floor(y);
    const localX = x - cellX;
    const localY = y - cellY;
    const wrappedX = cellX & 255;
    const wrappedY = cellY & 255;
    const rowLow = permutation[wrappedY] ?? 0;
    const rowHigh = permutation[wrappedY + 1] ?? 0;
    const horizontal = fade(localX);

    return mix(
      mix(
        dot(wrappedX + rowLow, localX, localY),
        dot(wrappedX + 1 + rowLow, localX - 1, localY),
        horizontal,
      ),
      mix(
        dot(wrappedX + rowHigh, localX, localY - 1),
        dot(wrappedX + 1 + rowHigh, localX - 1, localY - 1),
        horizontal,
      ),
      fade(localY),
    );
  };
}

type Point = {
  x: number;
  y: number;
  waveX: number;
  waveY: number;
  driftX: number;
  driftY: number;
  velocityX: number;
  velocityY: number;
};

export function WavesBackground({ className }: { className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    const noise = createNoise(Math.random());
    const bounds = { width: 0, height: 0 };
    const pointer = { x: -200, y: 0, smoothX: -200, smoothY: 0, lastX: 0, lastY: 0 };
    const motion = { speed: 0, angle: 0, engaged: false };
    let lines: Point[][] = [];
    let stroke = "transparent";
    let frame: number | null = null;

    const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");

    function readStroke() {
      stroke = getComputedStyle(container as HTMLElement).color;
    }

    function resize() {
      const rect = (container as HTMLElement).getBoundingClientRect();
      const ratio = Math.min(devicePixelRatio || 1, MAX_PIXEL_RATIO);

      bounds.width = rect.width;
      bounds.height = rect.height;
      (canvas as HTMLCanvasElement).width = Math.max(1, Math.round(rect.width * ratio));
      (canvas as HTMLCanvasElement).height = Math.max(
        1,
        Math.round(rect.height * ratio),
      );
      (context as CanvasRenderingContext2D).setTransform(ratio, 0, 0, ratio, 0, 0);
    }

    function build() {
      const columns = Math.ceil((bounds.width + 200) / X_GAP);
      const rows = Math.ceil((bounds.height + 30) / Y_GAP);
      const startX = (bounds.width - X_GAP * columns) / 2;
      const startY = (bounds.height - Y_GAP * rows) / 2;

      lines = Array.from({ length: columns + 1 }, (_, column) =>
        Array.from({ length: rows + 1 }, (_, row) => ({
          x: startX + X_GAP * column,
          y: startY + Y_GAP * row,
          waveX: 0,
          waveY: 0,
          driftX: 0,
          driftY: 0,
          velocityX: 0,
          velocityY: 0,
        })),
      );
    }

    function move(time: number) {
      for (const points of lines) {
        for (const point of points) {
          const angle =
            noise(
              (point.x + time * WAVE_SPEED_X) * 0.002,
              (point.y + time * WAVE_SPEED_Y) * 0.0015,
            ) * 12;

          point.waveX = Math.cos(angle) * WAVE_AMPLITUDE_X;
          point.waveY = Math.sin(angle) * WAVE_AMPLITUDE_Y;

          const offsetX = point.x - pointer.smoothX;
          const offsetY = point.y - pointer.smoothY;
          const distance = Math.hypot(offsetX, offsetY);
          const reach = Math.max(CURSOR_RADIUS, motion.speed);

          if (distance < reach) {
            const falloff = Math.cos(distance * 0.001) * (1 - distance / reach);
            const push = falloff * reach * motion.speed * 0.00065;
            point.velocityX += Math.cos(motion.angle) * push;
            point.velocityY += Math.sin(motion.angle) * push;
          }

          point.velocityX = (point.velocityX - point.driftX * TENSION) * FRICTION;
          point.velocityY = (point.velocityY - point.driftY * TENSION) * FRICTION;
          point.driftX = Math.min(
            MAX_CURSOR_MOVE,
            Math.max(-MAX_CURSOR_MOVE, point.driftX + point.velocityX * 2),
          );
          point.driftY = Math.min(
            MAX_CURSOR_MOVE,
            Math.max(-MAX_CURSOR_MOVE, point.driftY + point.velocityY * 2),
          );
        }
      }
    }

    function placed(point: Point, withDrift: boolean) {
      return {
        x: point.x + point.waveX + (withDrift ? point.driftX : 0),
        y: point.y + point.waveY + (withDrift ? point.driftY : 0),
      };
    }

    function draw() {
      const ctx = context as CanvasRenderingContext2D;

      ctx.clearRect(0, 0, bounds.width, bounds.height);
      ctx.lineWidth = 1;
      ctx.strokeStyle = stroke;
      ctx.beginPath();

      for (const points of lines) {
        const head = points[0];
        if (!head) continue;

        const start = placed(head, false);
        ctx.moveTo(start.x, start.y);

        points.forEach((point, index) => {
          const isLast = index === points.length - 1;
          const current = placed(point, !isLast);
          ctx.lineTo(current.x, current.y);
        });
      }

      ctx.stroke();
    }

    function tick(time: number) {
      pointer.smoothX += (pointer.x - pointer.smoothX) * 0.1;
      pointer.smoothY += (pointer.y - pointer.smoothY) * 0.1;

      const deltaX = pointer.x - pointer.lastX;
      const deltaY = pointer.y - pointer.lastY;
      const travelled = Math.hypot(deltaX, deltaY);

      motion.speed = Math.min(100, motion.speed + (travelled - motion.speed) * 0.1);
      motion.angle = Math.atan2(deltaY, deltaX);
      pointer.lastX = pointer.x;
      pointer.lastY = pointer.y;

      move(time);
      draw();
      frame = requestAnimationFrame(tick);
    }

    function trackPointer(x: number, y: number) {
      pointer.x = x;
      pointer.y = y;

      if (!motion.engaged) {
        pointer.smoothX = x;
        pointer.smoothY = y;
        pointer.lastX = x;
        pointer.lastY = y;
        motion.engaged = true;
      }
    }

    function onPointerMove(event: PointerEvent) {
      trackPointer(event.clientX, event.clientY);
    }

    function stop() {
      if (frame !== null) cancelAnimationFrame(frame);
      frame = null;
      removeEventListener("pointermove", onPointerMove);
    }

    function render() {
      stop();

      if (reducedMotion.matches) {
        move(0);
        draw();
        return;
      }

      addEventListener("pointermove", onPointerMove, { passive: true });
      frame = requestAnimationFrame(tick);
    }

    function onResize() {
      resize();
      build();
      if (reducedMotion.matches) render();
    }

    function onThemeChange() {
      readStroke();
      if (reducedMotion.matches) render();
    }

    readStroke();
    resize();
    build();
    render();

    const unsubscribeFromTheme = subscribeToTheme(onThemeChange);
    const observer = new ResizeObserver(onResize);
    observer.observe(container);
    reducedMotion.addEventListener("change", render);

    return () => {
      stop();
      observer.disconnect();
      reducedMotion.removeEventListener("change", render);
      unsubscribeFromTheme();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className={cn(
        "pointer-events-none fixed inset-0 -z-10 overflow-hidden text-border",
        className,
      )}
    >
      <canvas ref={canvasRef} className="block size-full opacity-60" />
    </div>
  );
}
