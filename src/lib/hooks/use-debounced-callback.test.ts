import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useDebouncedCallback } from "@/lib/hooks/use-debounced-callback";

describe("useDebouncedCallback", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("turns a burst of calls into one call after the quiet period", () => {
    const spy = vi.fn();
    const { result } = renderHook(() => useDebouncedCallback(spy, 1000));

    act(() => {
      result.current.run("a");
      vi.advanceTimersByTime(500);
      result.current.run("b");
      vi.advanceTimersByTime(500);
      result.current.run("c");
    });
    expect(spy).not.toHaveBeenCalled();

    act(() => vi.advanceTimersByTime(1000));
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith("c");
  });

  it("still calls through during nonstop activity once the longest wait passes", () => {
    const spy = vi.fn();
    const { result } = renderHook(() =>
      useDebouncedCallback(spy, 1000, { maxWait: 3000 }),
    );

    act(() => {
      for (let elapsed = 0; elapsed < 3000; elapsed += 400) {
        result.current.run(elapsed);
        vi.advanceTimersByTime(400);
      }
    });
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it("runs a pending call at once when flushed, and does nothing when idle", () => {
    const spy = vi.fn();
    const { result } = renderHook(() => useDebouncedCallback(spy, 1000));

    act(() => result.current.flush());
    expect(spy).not.toHaveBeenCalled();

    act(() => {
      result.current.run("now");
      result.current.flush();
    });
    expect(spy).toHaveBeenCalledWith("now");
    expect(result.current.isPending()).toBe(false);
  });

  it("drops a pending call when cancelled or unmounted", () => {
    const spy = vi.fn();
    const { result, unmount } = renderHook(() => useDebouncedCallback(spy, 1000));

    act(() => {
      result.current.run("cancelled");
      result.current.cancel();
      vi.advanceTimersByTime(1000);
    });
    act(() => result.current.run("unmounted"));
    unmount();
    act(() => vi.advanceTimersByTime(1000));
    expect(spy).not.toHaveBeenCalled();
  });

  it("calls the latest callback without restarting the timer on every render", () => {
    const first = vi.fn();
    const second = vi.fn();
    const { result, rerender } = renderHook(
      ({ callback }) => useDebouncedCallback(callback, 1000),
      { initialProps: { callback: first } },
    );
    const stable = result.current;

    act(() => result.current.run());
    rerender({ callback: second });
    act(() => vi.advanceTimersByTime(1000));

    expect(result.current).toBe(stable);
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });
});
