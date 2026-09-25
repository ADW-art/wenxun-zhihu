import * as React from "react";
import { cn } from "@/lib/utils";

export function Input({
  className,
  type,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      type={type}
      className={cn(
        "h-11 w-full rounded-[var(--radius-control)] border border-border-default bg-surface-panel px-3 text-sm text-text-primary placeholder:text-text-secondary focus-visible:border-action-primary focus-visible:ring-2 focus-visible:ring-focus-ring/20 aria-invalid:border-status-danger aria-invalid:ring-status-danger/20 read-only:bg-surface-subtle read-only:text-text-secondary disabled:cursor-not-allowed disabled:text-text-disabled disabled:opacity-60",
        className,
      )}
      {...props}
    />
  );
}
