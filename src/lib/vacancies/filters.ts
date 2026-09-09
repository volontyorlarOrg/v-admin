import type { Vacancy } from "@/lib/api/schemas";
import { stageOf, type VacancyStage } from "@/lib/domain/vocabulary";

export type VacancyFilters = {
  q?: string;
  stage?: VacancyStage;
};

function sortByCreated(vacancies: Vacancy[]): Vacancy[] {
  return [...vacancies].sort(
    (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt),
  );
}

export function filterVacancies(
  vacancies: Vacancy[],
  { q, stage }: VacancyFilters,
): Vacancy[] {
  const term = q?.trim().toLowerCase() ?? "";

  return sortByCreated(vacancies).filter((vacancy) => {
    if (stage && stageOf(vacancy) !== stage) return false;
    if (!term) return true;
    return `${vacancy.title} ${vacancy.summary} ${vacancy.slug}`
      .toLowerCase()
      .includes(term);
  });
}
