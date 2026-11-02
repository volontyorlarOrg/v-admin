import { describe, expect, it } from "vitest";

import { actorOf, buildDirectory, emptyDirectory, roleOf } from "@/lib/audit/directory";

const directory = buildDirectory({
  me: "admin-1",
  coordinators: [{ id: "coord-1", name: "Nodira Alimova" }],
  organizations: [
    { id: "org-1", name: "Green Corridor Group" },
    { id: "org-2", name: "" },
  ],
  organizationAccounts: [
    { userId: "org-user-1", organizationId: "org-1" },
    { userId: "org-user-2", organizationId: "org-2" },
  ],
  vacancies: [{ id: "vac-1", title: "Winter clothing drive" }],
  applications: [
    {
      id: "app-1",
      volunteerId: "vol-1",
      volunteerName: "Aziza Karimova",
      vacancyTitle: "Winter clothing drive",
    },
  ],
});

describe("who did it", () => {
  it("calls the signed-in account you", () => {
    expect(actorOf({ actorUserId: "admin-1" }, directory)).toEqual({ kind: "you" });
  });

  it("names a coordinator by the name the portal already holds", () => {
    expect(actorOf({ actorUserId: "coord-1" }, directory)).toEqual({
      kind: "person",
      name: "Nodira Alimova",
      role: "coordinator",
    });
  });

  it("names an organization's account after its organization", () => {
    expect(actorOf({ actorUserId: "org-user-1" }, directory)).toEqual({
      kind: "person",
      name: "Green Corridor Group",
      role: "organization",
    });
  });

  it("names a volunteer from their own applications", () => {
    expect(actorOf({ actorUserId: "vol-1" }, directory)).toMatchObject({
      name: "Aziza Karimova",
      role: "volunteer",
    });
  });

  it("says another account rather than inventing a name it does not hold", () => {
    expect(actorOf({ actorUserId: "unknown" }, directory)).toEqual({ kind: "someone" });
    expect(actorOf({ actorUserId: "org-user-2" }, directory)).toEqual({
      kind: "someone",
    });
  });

  it("says the actor was not recorded when the event has none", () => {
    expect(actorOf({}, directory)).toEqual({ kind: "unrecorded" });
  });

  it("works with an empty directory when every source failed", () => {
    expect(actorOf({ actorUserId: "coord-1" }, emptyDirectory())).toEqual({
      kind: "someone",
    });
  });
});

describe("roleOf", () => {
  it("tells an organization-run record from a coordinator's", () => {
    expect(roleOf("org-user-1", directory)).toBe("organization");
    expect(roleOf("coord-1", directory)).toBe("coordinator");
    expect(roleOf("admin-1", directory)).toBeNull();
    expect(roleOf(undefined, directory)).toBeNull();
  });
});
