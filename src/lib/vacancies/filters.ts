import type { Vacancy } from "@/lib/api/schemas";
import type { VacancyState } from "@/lib/domain/vocabulary";
import { vacancyStateOf } from "@/lib/vacancies/approval";

export type VacancyFilters = {
  q?: string;
  state?: VacancyState;
};

function sortByCreated(vacancies: Vacancy[]): Vacancy[] {
  return [...vacancies].sort(
    (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt),
  );
}

export function filterVacancies(
  vacancies: Vacancy[],
  { q, state }: VacancyFilters,
): Vacancy[] {
  const term = q?.trim().toLowerCase() ?? "";

  return sortByCreated(vacancies).filter((vacancy) => {
    if (state && vacancyStateOf(vacancy) !== state) return false;
    if (!term) return true;
    return `${vacancy.title} ${vacancy.summary} ${vacancy.slug}`
      .toLowerCase()
      .includes(term);
  });
}

export function awaitingDecision(vacancies: Vacancy[]): Vacancy[] {
  return sortByCreated(vacancies).filter(
    (vacancy) => vacancyStateOf(vacancy) === "pending_review",
  );
}
