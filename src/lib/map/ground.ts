import {
  MAP_EXTENT,
  REGION_GEOMETRY,
  type RegionGeometry,
} from "@/lib/map/region-geometry";

export type Mask = {
  readonly columns: number;
  readonly rows: number;
  readonly minX: number;
  readonly maxX: number;
  readonly minY: number;
  readonly maxY: number;
  readonly values: Float32Array;
};

export type Ring = readonly number[];

export type Polygon = readonly Ring[];

export const HALF_WIDTH = MAP_EXTENT.width / 2;
export const HALF_HEIGHT = MAP_EXTENT.height / 2;

export function countryPolygons(
  regions: readonly RegionGeometry[] = REGION_GEOMETRY,
): Polygon[] {
  return regions.flatMap((region) =>
    region.polygons.map((polygon) => [polygon.outer, ...polygon.holes]),
  );
}

export function regionOutlines(
  regions: readonly RegionGeometry[] = REGION_GEOMETRY,
): Ring[] {
  return regions.flatMap((region) => region.polygons.map((polygon) => polygon.outer));
}

function crossings(rings: readonly Ring[], y: number): number[] {
  const hits: number[] = [];
  for (const ring of rings) {
    const count = ring.length / 2;
    for (let index = 0; index < count; index += 1) {
      const next = (index + 1) % count;
      const x1 = ring[index * 2] as number;
      const y1 = ring[index * 2 + 1] as number;
      const x2 = ring[next * 2] as number;
      const y2 = ring[next * 2 + 1] as number;
      if (y1 === y2) continue;
      const low = Math.min(y1, y2);
      const high = Math.max(y1, y2);
      if (y < low || y >= high) continue;
      hits.push(x1 + ((y - y1) / (y2 - y1)) * (x2 - x1));
    }
  }
  return hits.sort((a, b) => a - b);
}

export function rasterizeMask(
  polygons: readonly Polygon[],
  { columns, rows, margin = 0 }: { columns: number; rows: number; margin?: number },
): Mask {
  const minX = -HALF_WIDTH - margin;
  const maxX = HALF_WIDTH + margin;
  const minY = -HALF_HEIGHT - margin;
  const maxY = HALF_HEIGHT + margin;
  const values = new Float32Array(columns * rows);

  for (let row = 0; row < rows; row += 1) {
    const y = minY + ((row + 0.5) / rows) * (maxY - minY);
    for (const polygon of polygons) {
      const hits = crossings(polygon, y);
      for (let pair = 0; pair + 1 < hits.length; pair += 2) {
        const from = hits[pair] as number;
        const to = hits[pair + 1] as number;
        const first = Math.max(
          0,
          Math.ceil(((from - minX) / (maxX - minX)) * columns - 0.5),
        );
        const last = Math.min(
          columns - 1,
          Math.floor(((to - minX) / (maxX - minX)) * columns - 0.5),
        );
        for (let column = first; column <= last; column += 1) {
          values[row * columns + column] = 1;
        }
      }
    }
  }

  return { columns, rows, minX, maxX, minY, maxY, values };
}

function blurPass(values: Float32Array, columns: number, rows: number, radius: number) {
  const scratch = new Float32Array(values.length);
  const width = radius * 2 + 1;

  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      let total = 0;
      for (let offset = -radius; offset <= radius; offset += 1) {
        const sample = Math.min(columns - 1, Math.max(0, column + offset));
        total += values[row * columns + sample] as number;
      }
      scratch[row * columns + column] = total / width;
    }
  }

  for (let column = 0; column < columns; column += 1) {
    for (let row = 0; row < rows; row += 1) {
      let total = 0;
      for (let offset = -radius; offset <= radius; offset += 1) {
        const sample = Math.min(rows - 1, Math.max(0, row + offset));
        total += scratch[sample * columns + column] as number;
      }
      values[row * columns + column] = total / width;
    }
  }
}

export function softenMask(mask: Mask, radius: number, passes = 2): Mask {
  const values = new Float32Array(mask.values);
  for (let pass = 0; pass < passes; pass += 1) {
    blurPass(values, mask.columns, mask.rows, radius);
  }
  return { ...mask, values };
}

export function sampleMask(mask: Mask, x: number, y: number): number {
  const u = ((x - mask.minX) / (mask.maxX - mask.minX)) * mask.columns - 0.5;
  const v = ((y - mask.minY) / (mask.maxY - mask.minY)) * mask.rows - 0.5;
  if (u < -0.5 || v < -0.5 || u > mask.columns - 0.5 || v > mask.rows - 0.5) return 0;

  const column = Math.min(mask.columns - 1, Math.max(0, Math.floor(u)));
  const row = Math.min(mask.rows - 1, Math.max(0, Math.floor(v)));
  const nextColumn = Math.min(mask.columns - 1, column + 1);
  const nextRow = Math.min(mask.rows - 1, row + 1);
  const fx = Math.min(1, Math.max(0, u - column));
  const fy = Math.min(1, Math.max(0, v - row));
  const at = (c: number, r: number) => mask.values[r * mask.columns + c] as number;

  const top = at(column, row) * (1 - fx) + at(nextColumn, row) * fx;
  const bottom = at(column, nextRow) * (1 - fx) + at(nextColumn, nextRow) * fx;
  return top * (1 - fy) + bottom * fy;
}

function hash(x: number, y: number): number {
  const value = Math.sin(x * 127.1 + y * 311.7) * 43_758.545_312_3;
  return value - Math.floor(value);
}

function valueNoise(x: number, y: number): number {
  const cellX = Math.floor(x);
  const cellY = Math.floor(y);
  const fx = x - cellX;
  const fy = y - cellY;
  const ease = (t: number) => t * t * (3 - 2 * t);
  const a = hash(cellX, cellY);
  const b = hash(cellX + 1, cellY);
  const c = hash(cellX, cellY + 1);
  const d = hash(cellX + 1, cellY + 1);
  const u = ease(fx);
  const v = ease(fy);
  return a * (1 - u) * (1 - v) + b * u * (1 - v) + c * (1 - u) * v + d * u * v;
}

export function ridges(x: number, y: number): number {
  let total = 0;
  let amplitude = 0.5;
  let frequency = 3.1;
  let weight = 0;
  for (let octave = 0; octave < 3; octave += 1) {
    const sample =
      1 - Math.abs(valueNoise(x * frequency + 17.3, y * frequency - 4.1) * 2 - 1);
    total += sample * sample * amplitude;
    weight += amplitude;
    amplitude *= 0.5;
    frequency *= 2.03;
  }
  return total / weight;
}

function smoothstep(edge0: number, edge1: number, value: number): number {
  const t = Math.min(1, Math.max(0, (value - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

export const PLATEAU_HEIGHT = 0.035;
export const MOUNTAIN_HEIGHT = 0.17;

export function reliefAt(mask: Mask, x: number, y: number): number {
  const inside = sampleMask(mask, x, y);
  if (inside <= 0) return 0;
  const east = smoothstep(0.05, 0.92, x);
  const peaks = ridges(x, y);
  return inside * (PLATEAU_HEIGHT + MOUNTAIN_HEIGHT * east * peaks + 0.018 * peaks);
}

export type Field = {
  readonly lines: number;
  readonly samples: number;
  readonly positions: Float32Array;
  readonly inside: Float32Array;
};

export function buildField(
  mask: Mask,
  {
    lines,
    samples,
    spanX,
    nearY,
    farY,
  }: { lines: number; samples: number; spanX: number; nearY: number; farY: number },
): Field {
  const positions = new Float32Array(lines * samples * 3);
  const inside = new Float32Array(lines * samples);

  for (let line = 0; line < lines; line += 1) {
    const y = nearY + (line / (lines - 1)) * (farY - nearY);
    for (let sample = 0; sample < samples; sample += 1) {
      const x = -spanX + (sample / (samples - 1)) * spanX * 2;
      const index = line * samples + sample;
      positions[index * 3] = x;
      positions[index * 3 + 1] = reliefAt(mask, x, y);
      positions[index * 3 + 2] = -y;
      inside[index] = sampleMask(mask, x, y);
    }
  }

  return { lines, samples, positions, inside };
}

export function drapeRings(
  mask: Mask,
  rings: readonly Ring[],
  lift = 0.004,
): Float32Array {
  const segments = rings.reduce((total, ring) => total + ring.length / 2, 0);
  const positions = new Float32Array(segments * 2 * 3);
  let cursor = 0;

  for (const ring of rings) {
    const count = ring.length / 2;
    for (let index = 0; index < count; index += 1) {
      const next = (index + 1) % count;
      for (const point of [index, next]) {
        const x = ring[point * 2] as number;
        const y = ring[point * 2 + 1] as number;
        positions[cursor] = x;
        positions[cursor + 1] = reliefAt(mask, x, y) + lift;
        positions[cursor + 2] = -y;
        cursor += 3;
      }
    }
  }

  return positions;
}
