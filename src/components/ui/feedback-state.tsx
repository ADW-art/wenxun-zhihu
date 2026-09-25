import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function FeedbackState({
  icon: Icon,
  title,
  description,
  action,
  tone = "neutral",
  className,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  tone?: "neutral" | "danger" | "warning";
  className?: string;
}) {
  const iconTone = {
    neutral: "text-text-secondary",
    danger: "text-status-danger",
    warning: "text-status-warning",
  }[tone];

  return (
    <div
      className={cn(
        "grid min-h-56 place-items-center rounded-[var(--radius-card)] border border-dashed border-border-default bg-surface-panel p-8 text-center",
        className,
      )}
    >
      <div className="max-w-md">
        <Icon className={cn("mx-auto size-9", iconTone)} aria-hidden="true" />
        <p className="mt-4 font-serif text-lg font-semibold">{title}</p>
        {description ? (
          <p className="mt-2 text-sm leading-6 text-text-secondary">{description}</p>
        ) : null}
        {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
      </div>
    </div>
  );
}
