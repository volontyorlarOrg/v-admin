import Image from "next/image";
import type { ReactNode } from "react";

import { Avatar } from "@/components/portal/avatar";
import { DefinitionList, type Definition } from "@/components/portal/definition-list";
import { StatusBadge, type StatusTone } from "@/components/portal/status-badge";
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
}: {
  identity: { name: string; username?: string; avatarUrl?: string };
  profile: ProfileSnapshot;
  labels: VolunteerProfileLabels;
  status?: { label: string; tone: StatusTone; note?: string };
  regionName: (region: string) => string;
  languageName: (code: string) => string;
}) {
  const photo = safeHttpUrl(identity.avatarUrl);
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
  const items: Definition[] = rows.flatMap(([key, value]) =>
    value ? [{ term: labels.fields[key], value }] : [],
  );

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-4">
        {photo ? (
          <Image
            src={photo}
            alt=""
            width={56}
            height={56}
            unoptimized
            className="size-14 shrink-0 rounded-full border border-border/70 object-cover"
          />
        ) : (
          <Avatar name={identity.name} className="size-14 text-base" />
        )}
        <div className="min-w-0 flex-1">
          <p className="text-base font-semibold break-words text-ink">
            {identity.name}
          </p>
          {username ? (
            <p className="text-sm break-all text-ink-muted">
              <span className="sr-only">{labels.fields.username}: </span>
              {username}
            </p>
          ) : null}
        </div>
        {status ? <StatusBadge label={status.label} tone={status.tone} /> : null}
      </div>

      {status?.note ? <p className="text-sm text-ink-muted">{status.note}</p> : null}

      {profile.bio?.trim() ? (
        <div>
          <h3 className="eyebrow text-ink-muted">{labels.fields.bio}</h3>
          <p className="mt-1 max-w-prose text-sm leading-relaxed whitespace-pre-line text-ink">
            {profile.bio.trim()}
          </p>
        </div>
      ) : null}

      {items.length > 0 ? <DefinitionList items={items} /> : null}
    </div>
  );
}
