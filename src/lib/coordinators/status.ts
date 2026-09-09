import type { Coordinator, CoordinatorDetail } from "@/lib/api/schemas";
import type { CoordinatorStatus } from "@/lib/domain/vocabulary";

export function statusOf(coordinator: Coordinator): CoordinatorStatus {
  return coordinator.coordinatorAccount?.status ?? "active";
}

export function byStatus(
  coordinators: Coordinator[],
  status: CoordinatorStatus | undefined,
): Coordinator[] {
  if (!status) return coordinators;
  return coordinators.filter((coordinator) => statusOf(coordinator) === status);
}

export function activeVacanciesOf(coordinator: CoordinatorDetail) {
  return coordinator.createdOpportunities.filter((vacancy) => !vacancy.archivedAt);
}

export function needsReassignment(coordinator: CoordinatorDetail): boolean {
  return activeVacanciesOf(coordinator).length > 0;
}

export function reassignmentCandidates(
  coordinators: Coordinator[],
  removingId: string,
): Coordinator[] {
  return coordinators.filter(
    (coordinator) =>
      coordinator.id !== removingId && statusOf(coordinator) === "active",
  );
}
