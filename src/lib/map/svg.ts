import { MAP_EXTENT, type RegionGeometry } from "@/lib/map/region-geometry";

export const MAP_VIEW_BOX = `${-MAP_EXTENT.width / 2} ${-MAP_EXTENT.height / 2} ${MAP_EXTENT.width} ${MAP_EXTENT.height}`;

function ringToPath(ring: readonly number[]): string {
  let path = "";
  for (let index = 0; index < ring.length; index += 2) {
    path += `${index === 0 ? "M" : "L"}${ring[index]} ${-(ring[index + 1] as number)}`;
  }
  return `${path}Z`;
}

export function regionPath(region: RegionGeometry): string {
  return region.polygons
    .map((polygon) => [polygon.outer, ...polygon.holes].map(ringToPath).join(""))
    .join("");
}
