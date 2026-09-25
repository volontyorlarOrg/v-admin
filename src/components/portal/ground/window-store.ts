const RELEASE_DELAY_MS = 450;

let current: HTMLElement | null = null;
let release: ReturnType<typeof setTimeout> | undefined;
const listeners = new Set<() => void>();

function notify() {
  for (const listener of listeners) listener();
}

export function registerGroundWindow(element: HTMLElement): () => void {
  if (release) clearTimeout(release);
  release = undefined;
  current = element;
  notify();

  return () => {
    if (current !== element) return;
    if (release) clearTimeout(release);
    release = setTimeout(() => {
      release = undefined;
      if (current !== element) return;
      current = null;
      notify();
    }, RELEASE_DELAY_MS);
  };
}

export function groundWindow(): HTMLElement | null {
  return current?.isConnected ? current : null;
}

export function subscribeToGroundWindow(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
