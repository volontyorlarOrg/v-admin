export function initialsOf(name: string | undefined): string {
  const words = (name ?? "").trim().split(/\s+/).filter(Boolean);

  return words
    .slice(0, 2)
    .map((word) => Array.from(word)[0] ?? "")
    .join("")
    .toLocaleUpperCase();
}
