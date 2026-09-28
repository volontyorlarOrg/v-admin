import { useCallback, useEffect, useMemo, useRef } from "react";

export type DebouncedCallback<Args extends unknown[]> = {
  run: (...args: Args) => void;
  flush: () => void;
  cancel: () => void;
  isPending: () => boolean;
};

type Pending<Args> = {
  timer?: ReturnType<typeof setTimeout>;
  firstCallAt?: number;
  args?: Args;
};

export function useDebouncedCallback<Args extends unknown[]>(
  callback: (...args: Args) => void,
  delay: number,
  { maxWait }: { maxWait?: number } = {},
): DebouncedCallback<Args> {
  const callbackRef = useRef(callback);
  const pending = useRef<Pending<Args>>({});

  useEffect(() => {
    callbackRef.current = callback;
  });

  const cancel = useCallback(() => {
    if (pending.current.timer !== undefined) clearTimeout(pending.current.timer);
    pending.current = {};
  }, []);

  const flush = useCallback(() => {
    const { timer, args } = pending.current;
    if (timer === undefined) return;
    clearTimeout(timer);
    pending.current = {};
    if (args) callbackRef.current(...args);
  }, []);

  const run = useCallback(
    (...args: Args) => {
      const now = Date.now();
      const firstCallAt = pending.current.firstCallAt ?? now;
      if (pending.current.timer !== undefined) clearTimeout(pending.current.timer);
      const wait =
        maxWait === undefined
          ? delay
          : Math.max(0, Math.min(delay, firstCallAt + maxWait - now));
      pending.current = { firstCallAt, args, timer: setTimeout(flush, wait) };
    },
    [delay, maxWait, flush],
  );

  const isPending = useCallback(() => pending.current.timer !== undefined, []);

  useEffect(() => cancel, [cancel]);

  return useMemo(
    () => ({ run, flush, cancel, isPending }),
    [run, flush, cancel, isPending],
  );
}
