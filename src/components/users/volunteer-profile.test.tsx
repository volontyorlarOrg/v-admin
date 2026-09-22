import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  PROFILE_FIELD_KEYS,
  VolunteerProfile,
  type VolunteerProfileLabels,
} from "@/components/users/volunteer-profile";

const labels: VolunteerProfileLabels = {
  fields: Object.fromEntries(
    PROFILE_FIELD_KEYS.map((key) => [key, `label:${key}`]),
  ) as VolunteerProfileLabels["fields"],
};

function renderProfile(
  identity: { name: string; username?: string; avatarUrl?: string },
  profile: Parameters<typeof VolunteerProfile>[0]["profile"],
) {
  return render(
    <VolunteerProfile
      identity={identity}
      profile={profile}
      labels={labels}
      regionName={(region) => `region:${region}`}
      languageName={(code) => `language:${code}`}
    />,
  );
}

describe("VolunteerProfile", () => {
  it("shows the photo when the backend has one and initials when it does not", () => {
    const { container, unmount } = renderProfile(
      { name: "Dilnoza Karimova", avatarUrl: "https://media.example.org/a.webp" },
      {},
    );
    expect(container.querySelector("img")?.getAttribute("src")).toBe(
      "https://media.example.org/a.webp",
    );
    unmount();

    renderProfile({ name: "Dilnoza Karimova" }, {});
    expect(screen.getByText("DK")).toBeInTheDocument();
  });

  it("never loads a photo from an address that is not the web", () => {
    const { container } = renderProfile(
      { name: "Dilnoza Karimova", avatarUrl: "javascript:alert(1)" },
      {},
    );
    expect(container.querySelector("img")).toBeNull();
  });

  it("prints every filled field and leaves out the empty ones", () => {
    renderProfile(
      { name: "Dilnoza Karimova" },
      {
        username: "dilnoza_reads",
        bio: "I read to younger pupils.",
        region: "tashkent-city",
        city: "Chilonzor",
        gradeYear: "10",
        languages: ["uz", "en"],
        phone: "",
        telegram: "dilnoza_k",
        links: ["https://portfolio.example/dilnoza", "ftp://old.example/file"],
      },
    );

    expect(screen.getByText("@dilnoza_reads")).toBeInTheDocument();
    expect(screen.getByText("I read to younger pupils.")).toBeInTheDocument();
    expect(screen.getByText("region:tashkent-city")).toBeInTheDocument();
    expect(screen.getByText("language:uz, language:en")).toBeInTheDocument();
    expect(screen.queryByText("label:phone")).toBeNull();
    expect(screen.getByRole("link", { name: "@dilnoza_k" })).toHaveAttribute(
      "href",
      "https://t.me/dilnoza_k",
    );
    expect(
      screen.getAllByRole("link").map((link) => link.getAttribute("href")),
    ).toEqual(["https://t.me/dilnoza_k", "https://portfolio.example/dilnoza"]);
  });
});
