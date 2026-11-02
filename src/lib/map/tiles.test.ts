import { describe, expect, it } from "vitest";

import { REGIONS } from "@/lib/domain/vocabulary";
import { REGION_TILES, TILE_COLUMNS, TILE_ROWS } from "@/lib/map/tiles";

describe("the region tile map", () => {
  it("places all fourteen regions, so a region with no vacancy still shows up as a gap", () => {
    expect(Object.keys(REGION_TILES).sort()).toEqual([...REGIONS].sort());
  });

  it("never stacks two regions on one tile", () => {
    const places = Object.values(REGION_TILES).map(
      ({ column, row }) => `${column}:${row}`,
    );
    expect(new Set(places).size).toBe(places.length);
  });

  it("keeps every tile inside the grid it is drawn on", () => {
    for (const { column, row } of Object.values(REGION_TILES)) {
      expect(column).toBeGreaterThanOrEqual(0);
      expect(column).toBeLessThan(TILE_COLUMNS);
      expect(row).toBeGreaterThanOrEqual(0);
      expect(row).toBeLessThan(TILE_ROWS);
    }
  });

  it("keeps the country's west-to-east order: Karakalpakstan west of Tashkent, Andijan furthest east", () => {
    expect(REGION_TILES.karakalpakstan.column).toBeLessThan(
      REGION_TILES["tashkent-city"].column,
    );
    expect(REGION_TILES.andijan.column).toBe(TILE_COLUMNS - 1);
  });
});
