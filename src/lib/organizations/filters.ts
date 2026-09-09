import type { Organization } from "@/lib/api/schemas";

export function filterOrganizations(
  organizations: Organization[],
  { q, verified }: { q?: string; verified?: "yes" | "no" },
): Organization[] {
  const term = q?.trim().toLowerCase() ?? "";

  return [...organizations]
    .sort((a, b) => a.name.localeCompare(b.name))
    .filter((organization) => {
      if (verified === "yes" && !organization.verified) return false;
      if (verified === "no" && organization.verified) return false;
      if (!term) return true;
      return `${organization.name} ${organization.slug}`.toLowerCase().includes(term);
    });
}

export function publishableOrganizations(
  organizations: Organization[],
): Organization[] {
  return organizations.filter((organization) => organization.verified);
}
