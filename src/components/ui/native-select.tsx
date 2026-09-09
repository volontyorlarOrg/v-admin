import { ChevronDown } from "lucide-react";
import type { ComponentProps } from "react";

import { inputClass } from "@/components/ui/input";
import { cn } from "@/lib/utils";

function NativeSelect({ className, ...props }: ComponentProps<"select">) {
  return (
    <span data-slot="native-select-wrapper" className="relative block w-full">
      <select
        data-slot="native-select"
        className={cn(inputClass, "appearance-none pr-11", className)}
        {...props}
      />
      <ChevronDown
        aria-hidden="true"
        data-slot="native-select-icon"
        className="pointer-events-none absolute top-1/2 right-4 size-4 -translate-y-1/2 text-muted-foreground"
      />
    </span>
  );
}

function NativeSelectOption(props: ComponentProps<"option">) {
  return <option data-slot="native-select-option" {...props} />;
}

export { NativeSelect, NativeSelectOption };
