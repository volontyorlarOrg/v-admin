import type { ReactNode } from "react";

import { Avatar } from "@/components/portal/avatar";
import { StatusBadge, type StatusTone } from "@/components/portal/status-badge";
import { Facts, type Fact } from "@/components/register/facts";
import type { ProfileSnapshot } from "@/lib/api/schemas";
import {
  handleText,
  instagramHref,
  linkedinHref,
  safeHttpUrl,
  telegramHref,
} from "@/lib/users/profile-links";

export const PROFILE_FIELD_KEYS = [
  "username",
  "fullName",
  "bio",
  "region",
  "city",
  "school",
  "gradeYear",
  "languages",
  "phone",
  "telegram",
  "instagram",
  "linkedin",
  "links",
] as const;

export type ProfileFieldKey = (typeof PROFILE_FIELD_KEYS)[number];

export type VolunteerProfileLabels = {
  fields: Record<ProfileFieldKey, string>;
};

function ExternalLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="font-medium break-all text-primary-ink underline-offset-4 hover:underline"
    >
      {children}
    </a>
  );
}

function linkedOrText(text: string | null, href: string | null): ReactNode {
  if (!text) return null;
  return href ? <ExternalLink href={href}>{text}</ExternalLink> : text;
}

export function VolunteerProfile({
  identity,
  profile,
  labels,
  status,
  regionName,
  languageName,
  completion,
}: {
  identity: {
    name: string;
    username?: string | undefined;
    avatarUrl?: string | undefined;
  };
  profile: ProfileSnapshot;
  labels: VolunteerProfileLabels;
  status?: { label: string; tone: StatusTone; note?: string | undefined };
  regionName: (region: string) => string;
  languageName: (code: string) => string;
  completion?: { share: number; label: string } | undefined;
}) {
  const username = handleText(identity.username ?? profile.username);
  const links = (profile.links ?? []).flatMap((link) => {
    const href = safeHttpUrl(link);
    return href ? [href] : [];
  });

  const rows: Array<[ProfileFieldKey, ReactNode]> = [
    ["region", profile.region ? regionName(profile.region) : null],
    ["city", profile.city?.trim() || null],
    ["school", profile.school?.trim() || null],
    ["gradeYear", profile.gradeYear?.trim() || null],
    ["languages", profile.languages?.map(languageName).join(", ") || null],
    ["phone", profile.phone?.trim() || null],
    [
      "telegram",
      linkedOrText(handleText(profile.telegram), telegramHref(profile.telegram)),
    ],
    [
      "instagram",
      linkedOrText(handleText(profile.instagram), instagramHref(profile.instagram)),
    ],
    [
      "linkedin",
      linkedOrText(profile.linkedin?.trim() || null, linkedinHref(profile.linkedin)),
    ],
    [
      "links",
      links.length > 0 ? (
        <span className="flex flex-col gap-1">
          {links.map((href) => (
            <ExternalLink key={href} href={href}>
              {href}
            </ExternalLink>
          ))}
        </span>
      ) : null,
    ],
  ];
  const items: Fact[] = rows.flatMap(([key, value]) =>
    value ? [{ term: labels.fields[key], value }] : [],
  );

  return (
    <div className="flex flex-col">
      {completion ? (
        <div className="-mx-5 -mt-4 mb-4">
          <div
            role="meter"
            aria-label={completion.label}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(completion.share * 100)}
            className="h-[3px] w-full bg-surface-sunk"
          >
            <div
              className="h-full bg-accent"
              style={{ width: `${Math.round(completion.share * 100)}%` }}
            />
          </div>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-4">
        <Avatar name={identity.name} src={identity.avatarUrl} size="lg" person />
        <div className="min-w-0 flex-1">
          <p className="display-face text-2xl break-words text-ink">{identity.name}</p>
          {username ? (
            <p className="mt-0.5 text-sm break-all text-ink-muted">
              <span className="sr-only">{labels.fields.username}: </span>
              {username}
            </p>
          ) : null}
        </div>
        {status ? <StatusBadge label={status.label} tone={status.tone} /> : null}
      </div>

      {status?.note ? (
        <p className="mt-3 text-sm leading-relaxed text-ink-muted">{status.note}</p>
      ) : null}

      {profile.bio?.trim() ? (
        <p className="mt-4 max-w-prose text-lead leading-relaxed whitespace-pre-line text-ink">
          {profile.bio.trim()}
        </p>
      ) : null}

      {items.length > 0 ? (
        <Facts items={items} className="mt-4 border-t border-border" />
      ) : null}
    </div>
  );
}
