export function safeHttpUrl(value: string | undefined): string | null {
  const raw = value?.trim();
  if (!raw) return null;
  try {
    const url = new URL(raw);
    return url.protocol === "https:" || url.protocol === "http:"
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}

function handleOf(value: string | undefined, pattern = /^[A-Za-z0-9._]{1,64}$/) {
  const handle = value?.trim().replace(/^@+/, "") ?? "";
  return pattern.test(handle) ? handle : null;
}

export function telegramHref(value: string | undefined): string | null {
  const handle = handleOf(value);
  return handle ? `https://t.me/${handle}` : null;
}

export function instagramHref(value: string | undefined): string | null {
  const handle = handleOf(value);
  return handle ? `https://www.instagram.com/${handle}/` : null;
}

export function linkedinHref(value: string | undefined): string | null {
  const url = safeHttpUrl(value);
  if (url) {
    const host = new URL(url).hostname;
    return host === "linkedin.com" || host.endsWith(".linkedin.com") ? url : null;
  }
  const handle = handleOf(value, /^[A-Za-z0-9_-]{3,100}$/);
  return handle ? `https://www.linkedin.com/in/${handle}` : null;
}

export function handleText(value: string | undefined): string | null {
  const handle = value?.trim().replace(/^@+/, "");
  return handle ? `@${handle}` : null;
}
