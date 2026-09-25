export const MAX_VACANCY_IMAGE_BYTES = 2_097_152;
export const VACANCY_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const MIN_VACANCY_IMAGE_LONG_SIDE = 640;
export const MIN_VACANCY_IMAGE_SHORT_SIDE = 360;

export function vacancyImageFileProblem(file: {
  type: string;
  size: number;
}): string | null {
  if (!VACANCY_IMAGE_TYPES.includes(file.type))
    return "opportunityImageFormatUnsupported";
  if (file.size > MAX_VACANCY_IMAGE_BYTES) return "opportunityImageTooLarge";
  if (file.size === 0) return "opportunityImageInvalid";
  return null;
}

export function vacancyImageDimensionProblem(
  dimensions: { width: number; height: number } | null,
): string | null {
  if (!dimensions) return "opportunityImageInvalid";
  const longSide = Math.max(dimensions.width, dimensions.height);
  const shortSide = Math.min(dimensions.width, dimensions.height);
  return longSide >= MIN_VACANCY_IMAGE_LONG_SIDE &&
    shortSide >= MIN_VACANCY_IMAGE_SHORT_SIDE
    ? null
    : "opportunityImageTooSmall";
}

export function storedVacancyImageUrl(value: string | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:"
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}
