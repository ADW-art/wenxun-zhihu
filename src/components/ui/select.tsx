import * as React from "react";
import { cn } from "@/lib/utils";

export function Select({
  className,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "h-11 w-full cursor-pointer rounded-[var(--radius-control)] border border-border-default bg-surface-panel px-3 text-sm text-text-primary focus-visible:border-action-primary focus-visible:ring-2 focus-visible:ring-focus-ring/20 aria-invalid:border-status-danger aria-invalid:ring-status-danger/20 disabled:cursor-not-allowed disabled:text-text-disabled disabled:opacity-60",
        className,
      )}
      {...props}
    />
  );
}
