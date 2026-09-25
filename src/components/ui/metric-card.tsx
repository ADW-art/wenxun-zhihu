import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const toneClasses = {
  primary: "bg-action-primary/8 text-action-primary",
  info: "bg-status-info-surface text-status-info-foreground",
  warning: "bg-status-warning-surface text-status-warning-foreground",
  danger: "bg-status-danger-surface text-status-danger-foreground",
  success: "bg-status-success-surface text-status-success-foreground",
} as const;

export function MetricCard({
  label,
  value,
  detail,
  icon: Icon,
  tone = "primary",
}: {
  label: string;
  value: string | number;
  detail?: string;
  icon: LucideIcon;
  tone?: keyof typeof toneClasses;
}) {
  return (
    <div className="rounded-[var(--radius-card)] border border-border-default bg-surface-panel p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-text-secondary">{label}</p>
          <p className="mt-3 font-mono text-3xl font-bold text-text-primary">{value}</p>
          {detail ? <p className="mt-2 text-xs text-text-secondary">{detail}</p> : null}
        </div>
        <span
          className={cn(
            "grid size-10 shrink-0 place-items-center rounded-[var(--radius-control)]",
            toneClasses[tone],
          )}
        >
          <Icon className="size-5" aria-hidden="true" />
        </span>
      </div>
    </div>
  );
}
