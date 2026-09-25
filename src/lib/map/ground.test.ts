import { describe, expect, it } from "vitest";

import {
  buildField,
  countryPolygons,
  drapeRings,
  rasterizeMask,
  regionOutlines,
  reliefAt,
  sampleMask,
  softenMask,
} from "@/lib/map/ground";
import { REGION_GEOMETRY } from "@/lib/map/region-geometry";

const square = [-0.5, -0.5, 0.5, -0.5, 0.5, 0.5, -0.5, 0.5];

function insideRing(ring: readonly number[], x: number, y: number): boolean {
  let inside = false;
  const count = ring.length / 2;
  for (
    let index = 0, previous = count - 1;
    index < count;
    previous = index, index += 1
  ) {
    const xi = ring[index * 2]!;
    const yi = ring[index * 2 + 1]!;
    const xj = ring[previous * 2]!;
    const yj = ring[previous * 2 + 1]!;
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

describe("the country mask", () => {
  it("fills a polygon and nothing outside it", () => {
    const mask = rasterizeMask([[square]], { columns: 40, rows: 26 });

    expect(sampleMask(mask, 0, 0)).toBe(1);
    expect(sampleMask(mask, 0.9, 0.6)).toBe(0);
  });

  it("fills the inside of every region and leaves the neighbours outside", () => {
    const columns = 220;
    const rows = 144;
    const mask = rasterizeMask(countryPolygons(), { columns, rows });
    const cell = 2 / columns;

    for (const region of REGION_GEOMETRY) {
      const ring = region.polygons[0]!.outer;
      const xs = ring.filter((_, index) => index % 2 === 0);
      const ys = ring.filter((_, index) => index % 2 === 1);
      const interior: Array<[number, number]> = [];
      for (let x = Math.min(...xs); x <= Math.max(...xs); x += cell) {
        for (let y = Math.min(...ys); y <= Math.max(...ys); y += cell) {
          const deep = [-2, -1, 0, 1, 2].every((dx) =>
            [-2, -1, 0, 1, 2].every((dy) =>
              insideRing(ring, x + dx * cell, y + dy * cell),
            ),
          );
          if (deep) interior.push([x, y]);
        }
      }

      if (region.areaShare >= 0.01) {
        expect(interior.length, region.id).toBeGreaterThan(0);
      }
      for (const [x, y] of interior.slice(0, 12)) {
        expect(sampleMask(mask, x, y), region.id).toBe(1);
      }
    }
    expect(sampleMask(mask, -0.98, -0.64)).toBe(0);
    expect(sampleMask(mask, 0.98, 0.64)).toBe(0);
  });

  it("softens the edge without leaving the zero to one range", () => {
    const soft = softenMask(rasterizeMask([[square]], { columns: 40, rows: 26 }), 2);
    const values = Array.from(soft.values);

    expect(Math.min(...values)).toBeGreaterThanOrEqual(0);
    expect(Math.max(...values)).toBeLessThanOrEqual(1);
    expect(values.some((value) => value > 0 && value < 1)).toBe(true);
  });
});

describe("the relief", () => {
  const mask = softenMask(
    rasterizeMask(countryPolygons(), { columns: 220, rows: 144 }),
    2,
  );

  it("stays flat outside the country", () => {
    expect(reliefAt(mask, -0.98, -0.64)).toBe(0);
  });

  it("rises toward the mountainous east", () => {
    const west = REGION_GEOMETRY.find((region) => region.id === "karakalpakstan");
    const east = REGION_GEOMETRY.find((region) => region.id === "namangan");
    expect(west && east).toBeTruthy();

    const samples = (x: number, y: number) =>
      [-0.02, 0, 0.02].reduce(
        (total, offset) => total + reliefAt(mask, x + offset, y),
        0,
      );

    expect(samples(east!.anchor[0], east!.anchor[1])).toBeGreaterThan(
      samples(west!.anchor[0], west!.anchor[1]),
    );
  });

  it("builds one vertex per sample on every line and drapes each border edge", () => {
    const field = buildField(mask, {
      lines: 4,
      samples: 10,
      spanX: 1.2,
      nearY: -1,
      farY: 1,
    });
    const outlines = regionOutlines();
    const edges = outlines.reduce((total, ring) => total + ring.length / 2, 0);

    expect(field.positions).toHaveLength(4 * 10 * 3);
    expect(field.inside).toHaveLength(40);
    expect(drapeRings(mask, outlines)).toHaveLength(edges * 2 * 3);
  });
});
