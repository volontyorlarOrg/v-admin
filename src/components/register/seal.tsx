import { useId } from "react";

import { cn } from "@/lib/utils";

export type SealTone = "institution" | "person" | "neutral";

const TONE: Record<SealTone, string> = {
  institution: "text-primary-ink",
  person: "text-accent-ink",
  neutral: "text-ink-muted",
};

export function Seal({
  word,
  date,
  label,
  issuer,
  tone = "institution",
  fresh = false,
  size = 64,
  className,
}: {
  word: string;
  date: string;
  label: string;
  issuer: string;
  tone?: SealTone;
  fresh?: boolean;
  size?: number;
  className?: string;
}) {
  const id = useId().replace(/:/g, "");
  const top = `seal-top-${id}`;
  const bottom = `seal-bottom-${id}`;

  return (
    <svg
      role="img"
      aria-label={label}
      viewBox="0 0 100 100"
      width={size}
      height={size}
      data-fresh={fresh ? "" : undefined}
      className={cn("seal shrink-0 font-sans", TONE[tone], className)}
    >
      <defs>
        <path id={top} d="M 15 50 A 35 35 0 0 1 85 50" />
        <path id={bottom} d="M 19.5 50 A 30.5 30.5 0 0 0 80.5 50" />
      </defs>
      <circle
        cx="50"
        cy="50"
        r="46.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.6"
      />
      <circle
        cx="50"
        cy="50"
        r="39"
        fill="none"
        stroke="currentColor"
        strokeWidth="0.9"
      />
      <text
        fill="currentColor"
        fontSize="8.6"
        fontWeight="700"
        letterSpacing="1.4"
        aria-hidden="true"
      >
        <textPath href={`#${top}`} startOffset="50%" textAnchor="middle">
          {issuer.toLocaleUpperCase()}
        </textPath>
      </text>
      <text
        fill="currentColor"
        fontSize="7.4"
        fontWeight="700"
        letterSpacing="1.1"
        aria-hidden="true"
      >
        <textPath href={`#${bottom}`} startOffset="50%" textAnchor="middle">
          {word.toLocaleUpperCase()}
        </textPath>
      </text>
      <line
        x1="31"
        y1="41.5"
        x2="69"
        y2="41.5"
        stroke="currentColor"
        strokeWidth="0.9"
      />
      <line
        x1="31"
        y1="58.5"
        x2="69"
        y2="58.5"
        stroke="currentColor"
        strokeWidth="0.9"
      />
      <text
        x="50"
        y="53.6"
        fill="currentColor"
        fontSize="10.4"
        fontWeight="700"
        textAnchor="middle"
        className="tabular"
        aria-hidden="true"
      >
        {date}
      </text>
    </svg>
  );
}
