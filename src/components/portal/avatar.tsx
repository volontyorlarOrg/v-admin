import Image from "next/image";
import { User } from "lucide-react";

import { initialsOf } from "@/lib/users/initials";
import { safeHttpUrl } from "@/lib/users/profile-links";
import { cn } from "@/lib/utils";

const SIZE = {
  sm: "size-8 text-[0.6875rem]",
  md: "size-9 text-xs",
  lg: "size-14 text-base",
  xl: "size-20 text-xl",
} as const;

export function Avatar({
  name,
  src,
  size = "md",
  person = false,
  className,
}: {
  name?: string | undefined;
  src?: string | undefined;
  size?: keyof typeof SIZE;
  person?: boolean;
  className?: string;
}) {
  const initials = initialsOf(name);
  const photo = safeHttpUrl(src);

  return (
    <span
      aria-hidden="true"
      className={cn(
        "relative flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary-muted font-semibold text-primary-deep",
        SIZE[size],
        person && "outline-1 outline-offset-2 outline-border-control/60",
        className,
      )}
    >
      {photo ? (
        <Image
          src={photo}
          alt=""
          fill
          unoptimized
          sizes="80px"
          className="object-cover"
        />
      ) : initials === "" ? (
        <User className="size-1/2 text-primary-deep/70" />
      ) : (
        initials
      )}
    </span>
  );
}
