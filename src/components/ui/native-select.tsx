import { ChevronDown } from "lucide-react";
import type { ComponentProps } from "react";

import { inputClass } from "@/components/ui/input";
import { cn } from "@/lib/utils";

function NativeSelect({
  className,
  wrapperClassName,
  iconClassName,
  ...props
}: ComponentProps<"select"> & { wrapperClassName?: string; iconClassName?: string }) {
  return (
    <span
      data-slot="native-select-wrapper"
      className={cn("relative block w-full", wrapperClassName)}
    >
      <select
        data-slot="native-select"
        className={cn(inputClass, "appearance-none pr-11", className)}
        {...props}
      />
      <ChevronDown
        aria-hidden="true"
        data-slot="native-select-icon"
        className={cn(
          "pointer-events-none absolute top-1/2 right-4 size-4 -translate-y-1/2 text-muted-foreground",
          iconClassName,
        )}
      />
    </span>
  );
}

function NativeSelectOption(props: ComponentProps<"option">) {
  return <option data-slot="native-select-option" {...props} />;
}

export { NativeSelect, NativeSelectOption };
