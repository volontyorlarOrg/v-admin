import type { Region } from "@/lib/domain/vocabulary";

export const TILE_COLUMNS = 7;
export const TILE_ROWS = 3;

export const REGION_TILES: Record<Region, { column: number; row: number }> = {
  karakalpakstan: { column: 0, row: 0 },
  navoiy: { column: 1, row: 0 },
  "tashkent-city": { column: 4, row: 0 },
  "tashkent-region": { column: 5, row: 0 },
  namangan: { column: 6, row: 0 },
  khorezm: { column: 0, row: 1 },
  bukhara: { column: 1, row: 1 },
  samarkand: { column: 2, row: 1 },
  jizzakh: { column: 3, row: 1 },
  sirdaryo: { column: 4, row: 1 },
  fergana: { column: 5, row: 1 },
  andijan: { column: 6, row: 1 },
  kashkadarya: { column: 2, row: 2 },
  surkhandarya: { column: 3, row: 2 },
};
