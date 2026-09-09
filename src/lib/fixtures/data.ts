const DAY = 86_400_000;
const START = Date.UTC(2026, 8, 1, 6, 0, 0);

function at(days: number, hour = 9): string {
  return new Date(START + days * DAY + (hour - 6) * 3_600_000).toISOString();
}

export const FIXTURE_ADMIN_ID = "00000000-0000-4000-8000-000000000100";
export const FIXTURE_COORDINATOR_ID = "00000000-0000-4000-8000-000000000101";
export const SECOND_COORDINATOR_ID = "00000000-0000-4000-8000-000000000102";
export const REMOVED_COORDINATOR_ID = "00000000-0000-4000-8000-000000000103";

export const FIXTURE_ADMIN_EMAIL = "administrator@example.org";
export const FIXTURE_COORDINATOR_EMAIL = "coordinator@example.org";
export const FIXTURE_PASSWORD = "fixture-password";

export type FixtureOrganization = {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  verified: boolean;
};

export type FixtureVacancy = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  description: string;
  requirements: string[];
  region: string;
  city: string | null;
  format: string;
  status: string;
  startsAt: string;
  endsAt: string | null;
  applicationDeadline: string;
  locationName: string | null;
  imageUrl: string | null;
  capacity: number | null;
  publishedAt: string | null;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
  organizationId: string;
  createdById: string;
  questions: Array<{
    id: string;
    prompt: string;
    helpText: string | null;
    type: string;
    required: boolean;
    maxLength: number | null;
    options: Array<{ value: string; label: string }> | null;
    position: number;
  }>;
};

export type FixtureAttendance = {
  id: string;
  outcome: string;
  scheduledHours: string | null;
  confirmedHours: string | null;
  resolvedAt: string | null;
  applicationId: string;
  volunteerId: string;
  opportunityId: string;
};

export type FixtureApplication = {
  id: string;
  status: string;
  reviewerNote: string | null;
  profileSnapshot: Record<string, string> | null;
  submittedAt: string | null;
  reviewedAt: string | null;
  withdrawnAt: string | null;
  createdAt: string;
  updatedAt: string;
  volunteerId: string;
  opportunityId: string;
  answers: Array<{
    id: string;
    questionPrompt: string;
    questionType: string;
    applicationQuestionId: string | null;
    value: string | string[];
  }>;
  attendance: FixtureAttendance | null;
};

export type FixtureUser = {
  id: string;
  displayName: string;
  email: string | null;
  emailVerifiedAt: string | null;
  isActive: boolean;
  createdAt: string;
  roles: string[];
  profile: Record<string, string> | null;
  passwordCredential: {
    passwordChangedAt: string;
    requiresPasswordChange: boolean;
  } | null;
  coordinatorAccount: {
    userId: string;
    status: string;
    blockedAt: string | null;
    removedAt: string | null;
    createdAt: string;
  } | null;
};

export type FixtureAuditEvent = {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata: Record<string, string> | null;
  actorUserId: string | null;
  createdAt: string;
};

export type FixtureState = {
  organizations: FixtureOrganization[];
  vacancies: FixtureVacancy[];
  applications: FixtureApplication[];
  users: FixtureUser[];
  audit: FixtureAuditEvent[];
};

function coordinator(
  id: string,
  displayName: string,
  email: string,
  status: string,
  overrides: Partial<FixtureUser> = {},
): FixtureUser {
  return {
    id,
    displayName,
    email,
    emailVerifiedAt: null,
    isActive: status === "active",
    createdAt: at(-120),
    roles: status === "removed" ? [] : ["coordinator"],
    profile: null,
    passwordCredential: {
      passwordChangedAt: at(-110),
      requiresPasswordChange: false,
    },
    coordinatorAccount: {
      userId: id,
      status,
      blockedAt: status === "blocked" ? at(-10) : null,
      removedAt: status === "removed" ? at(-4) : null,
      createdAt: at(-120),
    },
    ...overrides,
  };
}

function volunteer(
  index: number,
  displayName: string,
  region: string,
  overrides: Partial<FixtureUser> = {},
): FixtureUser {
  const id = `00000000-0000-4000-8000-00000000020${index}`;
  return {
    id,
    displayName,
    email: `${displayName.split(" ")[0]!.toLowerCase()}@example.org`,
    emailVerifiedAt: at(-60),
    isActive: true,
    createdAt: at(-90 + index),
    roles: ["volunteer"],
    profile: {
      fullName: displayName,
      region,
      school: "School 143",
      phone: "+998 90 000 00 0" + index,
      telegram: displayName.split(" ")[0]!.toLowerCase(),
    },
    passwordCredential: {
      passwordChangedAt: at(-70 + index),
      requiresPasswordChange: false,
    },
    coordinatorAccount: null,
    ...overrides,
  };
}

export function initialFixtureState(): FixtureState {
  const organizations: FixtureOrganization[] = [
    {
      id: "00000000-0000-4000-8000-000000000301",
      name: "Chilonzor Reading Corners",
      slug: "chilonzor-reading-corners",
      logoUrl: null,
      verified: true,
    },
    {
      id: "00000000-0000-4000-8000-000000000302",
      name: "Green Corridor Group",
      slug: "green-corridor-group",
      logoUrl: null,
      verified: false,
    },
  ];

  const vacancies: FixtureVacancy[] = [
    {
      id: "00000000-0000-4000-8000-000000000401",
      slug: "winter-book-drive",
      title: "Winter book drive",
      summary: "Collect and sort books for neighbourhood reading corners.",
      description:
        "Sort donated books, label them and pack them for the reading corners.",
      requirements: ["Be 15 or older", "Free on the collection day"],
      region: "tashkent-city",
      city: "Tashkent",
      format: "onsite",
      status: "open",
      startsAt: at(12, 10),
      endsAt: at(12, 14),
      applicationDeadline: at(5, 18),
      locationName: "Chilonzor library",
      imageUrl: null,
      capacity: 20,
      publishedAt: at(-6),
      archivedAt: null,
      createdAt: at(-8),
      updatedAt: at(-6),
      organizationId: organizations[0]!.id,
      createdById: FIXTURE_COORDINATOR_ID,
      questions: [
        {
          id: "00000000-0000-4000-8000-000000000501",
          prompt: "Why does this matter to you?",
          helpText: "Two or three sentences.",
          type: "long_text",
          required: true,
          maxLength: 600,
          options: null,
          position: 0,
        },
      ],
    },
    {
      id: "00000000-0000-4000-8000-000000000402",
      slug: "reading-room-weekends",
      title: "Reading room weekends",
      summary: "Read with younger pupils on Saturday mornings.",
      description: "Two hours each Saturday for six weeks.",
      requirements: [],
      region: "tashkent-city",
      city: "Tashkent",
      format: "onsite",
      status: "open",
      startsAt: at(20, 9),
      endsAt: null,
      applicationDeadline: at(14, 18),
      locationName: null,
      imageUrl: null,
      capacity: null,
      publishedAt: null,
      archivedAt: null,
      createdAt: at(-2),
      updatedAt: at(-2),
      organizationId: organizations[0]!.id,
      createdById: FIXTURE_COORDINATOR_ID,
      questions: [],
    },
    {
      id: "00000000-0000-4000-8000-000000000403",
      slug: "riverbank-clean-up",
      title: "Riverbank clean-up",
      summary: "A morning clearing the riverbank.",
      description: "Gloves and bags are provided.",
      requirements: [],
      region: "samarkand",
      city: "Samarkand",
      format: "onsite",
      status: "closed",
      startsAt: at(-30, 8),
      endsAt: at(-30, 12),
      applicationDeadline: at(-40, 18),
      locationName: null,
      imageUrl: null,
      capacity: 15,
      publishedAt: at(-50),
      archivedAt: at(-20),
      createdAt: at(-55),
      updatedAt: at(-20),
      organizationId: organizations[1]!.id,
      createdById: FIXTURE_COORDINATOR_ID,
      questions: [],
    },
    {
      id: "00000000-0000-4000-8000-000000000404",
      slug: "city-sports-day",
      title: "City sports day",
      summary: "Support the district sports day.",
      description: "Help with registration and water stations.",
      requirements: ["Comfortable outdoors for a full day"],
      region: "fergana",
      city: "Fergana",
      format: "onsite",
      status: "open",
      startsAt: at(25, 8),
      endsAt: at(25, 17),
      applicationDeadline: at(18, 18),
      locationName: "Central stadium",
      imageUrl: null,
      capacity: 30,
      publishedAt: at(-3),
      archivedAt: null,
      createdAt: at(-5),
      updatedAt: at(-3),
      organizationId: organizations[0]!.id,
      createdById: SECOND_COORDINATOR_ID,
      questions: [],
    },
  ];

  const users: FixtureUser[] = [
    {
      id: FIXTURE_ADMIN_ID,
      displayName: "Volontyorlar Administrator",
      email: FIXTURE_ADMIN_EMAIL,
      emailVerifiedAt: at(-200),
      isActive: true,
      createdAt: at(-200),
      roles: ["admin"],
      profile: null,
      passwordCredential: {
        passwordChangedAt: at(-190),
        requiresPasswordChange: false,
      },
      coordinatorAccount: null,
    },
    coordinator(
      FIXTURE_COORDINATOR_ID,
      "Nodira Alimova",
      FIXTURE_COORDINATOR_EMAIL,
      "active",
    ),
    coordinator(
      SECOND_COORDINATOR_ID,
      "Bekzod Rustamov",
      "bekzod@example.org",
      "blocked",
    ),
    coordinator(
      REMOVED_COORDINATOR_ID,
      "Malika Yusupova",
      "malika@example.org",
      "removed",
    ),
    volunteer(1, "Dilnoza Karimova", "tashkent-city"),
    volunteer(2, "Sardor Toshmatov", "tashkent-city", {
      passwordCredential: {
        passwordChangedAt: at(-1),
        requiresPasswordChange: true,
      },
    }),
    volunteer(3, "Aziza Nazarova", "samarkand", { passwordCredential: null }),
    volunteer(4, "Jasur Ergashev", "fergana"),
  ];

  const applications: FixtureApplication[] = [
    {
      id: "00000000-0000-4000-8000-000000000601",
      status: "submitted",
      reviewerNote: null,
      profileSnapshot: {
        fullName: "Dilnoza Karimova",
        region: "tashkent-city",
        school: "School 143",
        phone: "+998 90 000 00 01",
        telegram: "dilnoza",
      },
      submittedAt: at(-4),
      reviewedAt: null,
      withdrawnAt: null,
      createdAt: at(-5),
      updatedAt: at(-4),
      volunteerId: "00000000-0000-4000-8000-000000000201",
      opportunityId: vacancies[0]!.id,
      answers: [
        {
          id: "00000000-0000-4000-8000-000000000701",
          questionPrompt: "Why does this matter to you?",
          questionType: "long_text",
          applicationQuestionId: "00000000-0000-4000-8000-000000000501",
          value: "The reading corner near my school has almost no books left.",
        },
      ],
      attendance: null,
    },
    {
      id: "00000000-0000-4000-8000-000000000602",
      status: "under_review",
      reviewerNote: null,
      profileSnapshot: {
        fullName: "Sardor Toshmatov",
        region: "tashkent-city",
        school: "School 21",
        phone: "+998 90 000 00 02",
        telegram: "sardor",
      },
      submittedAt: at(-3),
      reviewedAt: at(-2),
      withdrawnAt: null,
      createdAt: at(-3),
      updatedAt: at(-2),
      volunteerId: "00000000-0000-4000-8000-000000000202",
      opportunityId: vacancies[0]!.id,
      answers: [],
      attendance: null,
    },
    {
      id: "00000000-0000-4000-8000-000000000603",
      status: "accepted",
      reviewerNote: "Bring a friend if they can help too.",
      profileSnapshot: {
        fullName: "Aziza Nazarova",
        region: "samarkand",
        school: "School 5",
        phone: "+998 90 000 00 03",
        telegram: "aziza",
      },
      submittedAt: at(-45),
      reviewedAt: at(-42),
      withdrawnAt: null,
      createdAt: at(-46),
      updatedAt: at(-42),
      volunteerId: "00000000-0000-4000-8000-000000000203",
      opportunityId: vacancies[2]!.id,
      answers: [],
      attendance: {
        id: "00000000-0000-4000-8000-000000000801",
        outcome: "awaiting_confirmation",
        scheduledHours: "4.00",
        confirmedHours: null,
        resolvedAt: null,
        applicationId: "00000000-0000-4000-8000-000000000603",
        volunteerId: "00000000-0000-4000-8000-000000000203",
        opportunityId: vacancies[2]!.id,
      },
    },
    {
      id: "00000000-0000-4000-8000-000000000604",
      status: "accepted",
      reviewerNote: null,
      profileSnapshot: null,
      submittedAt: at(-44),
      reviewedAt: at(-41),
      withdrawnAt: null,
      createdAt: at(-45),
      updatedAt: at(-41),
      volunteerId: "00000000-0000-4000-8000-000000000201",
      opportunityId: vacancies[2]!.id,
      answers: [],
      attendance: {
        id: "00000000-0000-4000-8000-000000000802",
        outcome: "attended",
        scheduledHours: "4.00",
        confirmedHours: "4.00",
        resolvedAt: at(-28),
        applicationId: "00000000-0000-4000-8000-000000000604",
        volunteerId: "00000000-0000-4000-8000-000000000201",
        opportunityId: vacancies[2]!.id,
      },
    },
    {
      id: "00000000-0000-4000-8000-000000000605",
      status: "submitted",
      reviewerNote: null,
      profileSnapshot: null,
      submittedAt: at(-2),
      reviewedAt: null,
      withdrawnAt: null,
      createdAt: at(-2),
      updatedAt: at(-2),
      volunteerId: "00000000-0000-4000-8000-000000000204",
      opportunityId: vacancies[3]!.id,
      answers: [],
      attendance: null,
    },
  ];

  const audit: FixtureAuditEvent[] = [
    {
      id: "00000000-0000-4000-8000-000000000901",
      action: "opportunity.published",
      entityType: "Opportunity",
      entityId: vacancies[0]!.id,
      metadata: null,
      actorUserId: FIXTURE_COORDINATOR_ID,
      createdAt: at(-6),
    },
    {
      id: "00000000-0000-4000-8000-000000000902",
      action: "application.reviewed",
      entityType: "Application",
      entityId: applications[1]!.id,
      metadata: { status: "under_review" },
      actorUserId: FIXTURE_COORDINATOR_ID,
      createdAt: at(-2),
    },
    {
      id: "00000000-0000-4000-8000-000000000903",
      action: "coordinator.blocked",
      entityType: "User",
      entityId: SECOND_COORDINATOR_ID,
      metadata: null,
      actorUserId: FIXTURE_ADMIN_ID,
      createdAt: at(-10),
    },
    {
      id: "00000000-0000-4000-8000-000000000904",
      action: "coordinator.created",
      entityType: "User",
      entityId: SECOND_COORDINATOR_ID,
      metadata: null,
      actorUserId: FIXTURE_ADMIN_ID,
      createdAt: at(-120),
    },
    {
      id: "00000000-0000-4000-8000-000000000905",
      action: "attendance.resolved",
      entityType: "attendance",
      entityId: "00000000-0000-4000-8000-000000000802",
      metadata: { outcome: "attended" },
      actorUserId: FIXTURE_COORDINATOR_ID,
      createdAt: at(-28),
    },
  ];

  return { organizations, vacancies, applications, users, audit };
}
