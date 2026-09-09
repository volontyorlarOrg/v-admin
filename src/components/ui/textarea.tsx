import type { ComponentProps } from "react";

import { inputClass } from "@/components/ui/input";
import { cn } from "@/lib/utils";

function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(inputClass, "min-h-32 resize-y py-3 leading-relaxed", className)}
      {...props}
    />
  );
}

export { Textarea };
