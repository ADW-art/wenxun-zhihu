import * as React from "react";
import { cn } from "@/lib/utils";

export function Textarea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "min-h-28 w-full resize-y rounded-[var(--radius-control)] border border-border-default bg-surface-panel px-3 py-3 text-sm leading-6 text-text-primary placeholder:text-text-secondary focus-visible:border-action-primary focus-visible:ring-2 focus-visible:ring-focus-ring/20 aria-invalid:border-status-danger aria-invalid:ring-status-danger/20 read-only:bg-surface-subtle read-only:text-text-secondary disabled:cursor-not-allowed disabled:text-text-disabled disabled:opacity-60",
        className,
      )}
      {...props}
    />
  );
}
