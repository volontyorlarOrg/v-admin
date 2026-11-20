export const MAX_BADGE_BYTES = 1_048_576;
export const BADGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const BADGE_ACCEPT = BADGE_TYPES.join(",");

/** The same checks the backend makes, so a bad file fails before it uploads. */
export function badgeFileProblem(file: { type: string; size: number }): string | null {
  if (file.size === 0) return "badgeImageInvalid";
  if (!BADGE_TYPES.includes(file.type)) return "badgeImageFormatUnsupported";
  if (file.size > MAX_BADGE_BYTES) return "badgeImageTooLarge";
  return null;
}

export function badgeFromFormData(formData: FormData): {
  file?: File;
  error?: string;
} {
  const value = formData.get("badge");
  if (!(value instanceof File)) return { error: "badgeImageInvalid" };
  const error = badgeFileProblem(value);
  return error ? { error } : { file: value };
}
