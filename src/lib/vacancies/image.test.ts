import { describe, expect, it } from "vitest";

import {
  storedVacancyImageUrl,
  vacancyImageDimensionProblem,
  vacancyImageFileProblem,
} from "@/lib/vacancies/image";

describe("storedVacancyImageUrl", () => {
  it("shows only HTTP images from the stored record", () => {
    expect(storedVacancyImageUrl("https://media.example.org/photo.webp")).toBe(
      "https://media.example.org/photo.webp",
    );
    expect(storedVacancyImageUrl("javascript:alert(1)")).toBeNull();
    expect(storedVacancyImageUrl("/relative.png")).toBeNull();
  });
});

describe("vacancyImageFileProblem", () => {
  it("accepts the formats and size the backend stores", () => {
    expect(vacancyImageFileProblem({ type: "image/webp", size: 2_097_152 })).toBeNull();
  });

  it.each([
    [{ type: "image/gif", size: 10 }, "opportunityImageFormatUnsupported"],
    [{ type: "image/png", size: 2_097_153 }, "opportunityImageTooLarge"],
    [{ type: "image/jpeg", size: 0 }, "opportunityImageInvalid"],
  ])("names the reason a file cannot be uploaded", (file, code) => {
    expect(vacancyImageFileProblem(file)).toBe(code);
  });
});

describe("vacancyImageDimensionProblem", () => {
  it("accepts 640 × 360 in either orientation, since the backend reads unrotated pixels", () => {
    expect(vacancyImageDimensionProblem({ width: 640, height: 360 })).toBeNull();
    expect(vacancyImageDimensionProblem({ width: 360, height: 640 })).toBeNull();
    expect(vacancyImageDimensionProblem({ width: 4032, height: 3024 })).toBeNull();
  });

  it("refuses a photo the backend would reject as too small", () => {
    expect(vacancyImageDimensionProblem({ width: 639, height: 360 })).toBe(
      "opportunityImageTooSmall",
    );
    expect(vacancyImageDimensionProblem({ width: 1280, height: 359 })).toBe(
      "opportunityImageTooSmall",
    );
  });

  it("treats an image the browser cannot decode as invalid", () => {
    expect(vacancyImageDimensionProblem(null)).toBe("opportunityImageInvalid");
  });
});
