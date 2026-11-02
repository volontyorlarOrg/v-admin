export type Scale = { min: number; max: number; ticks: number[] };

function niceStep(rough: number, integer: boolean): number {
  if (!Number.isFinite(rough) || rough <= 0) return 1;
  const power = 10 ** Math.floor(Math.log10(rough));
  const fraction = rough / power;
  const nice =
    fraction <= 1
      ? 1
      : fraction <= 2
        ? 2
        : fraction <= 2.5
          ? 2.5
          : fraction <= 5
            ? 5
            : 10;
  const step = nice * power;
  if (!integer) return step;
  if (step < 1) return 1;
  return Number.isInteger(step) ? step : Math.ceil(step);
}

function range(min: number, max: number, step: number): number[] {
  const ticks: number[] = [];
  const count = Math.round((max - min) / step);
  for (let index = 0; index <= count; index += 1) {
    ticks.push(Number((min + index * step).toFixed(6)));
  }
  return ticks;
}

export function linearScale(
  values: readonly number[],
  {
    zero = true,
    ticks = 4,
    integer = true,
  }: { zero?: boolean; ticks?: number; integer?: boolean } = {},
): Scale {
  const finite = values.filter((value) => Number.isFinite(value));
  const high = Math.max(0, ...finite);

  if (zero) {
    if (high === 0) return { min: 0, max: 1, ticks: [0] };
    const step = niceStep(high / ticks, integer);
    const max = Math.ceil(high / step) * step;
    return { min: 0, max, ticks: range(0, max, step) };
  }

  const low = finite.length > 0 ? Math.min(...finite) : 0;
  if (high === low) {
    const pad = integer ? 1 : Math.max(Math.abs(high) * 0.1, 1);
    const min = Math.max(0, low - pad);
    return { min, max: high + pad, ticks: range(min, high + pad, pad) };
  }

  const step = niceStep((high - low) / ticks, integer);
  const min = Math.max(0, Math.floor(low / step) * step);
  const max = Math.ceil(high / step) * step;
  return { min, max, ticks: range(min, max, step) };
}

export function tickIndexes(length: number, count = 5): number[] {
  if (length <= 0) return [];
  if (length === 1) return [0];
  const wanted = Math.min(length, Math.max(2, count));
  const indexes = new Set<number>();
  for (let index = 0; index < wanted; index += 1) {
    indexes.add(Math.round((index * (length - 1)) / (wanted - 1)));
  }
  return [...indexes];
}

export function change(current: number, previous: number): number | null {
  if (!Number.isFinite(current) || !Number.isFinite(previous) || previous <= 0) {
    return null;
  }
  return (current - previous) / previous;
}
