import type { FindingStatus, InspectionStatus, TaskStatus } from "@prisma/client";
import { cn } from "@/lib/utils";
import {
  findingStatusLabels,
  inspectionStatusLabels,
  taskStatusLabels,
} from "@/lib/domain/risk";

type Status = InspectionStatus | FindingStatus | TaskStatus;

function statusTone(status: Status) {
  if (["CLOSED", "RESOLVED"].includes(status)) {
    return "border-status-success-border bg-status-success-surface text-status-success-foreground";
  }
  if (["REJECTED", "CRITICAL"].includes(status)) {
    return "border-status-danger-border bg-status-danger-surface text-status-danger-foreground";
  }
  if (["PENDING_REVIEW", "PENDING_CLOSURE", "PROPOSED"].includes(status)) {
    return "border-status-warning-border bg-status-warning-surface text-status-warning-foreground";
  }
  if (["ANALYZING", "SUBMITTED", "IN_PROGRESS"].includes(status)) {
    return "border-status-info-border bg-status-info-surface text-status-info-foreground";
  }
  return "border-border-default bg-surface-subtle text-text-secondary";
}

export function StatusBadge({
  status,
  className,
}: {
  status: Status;
  className?: string;
}) {
  const label =
    inspectionStatusLabels[status as InspectionStatus] ??
    findingStatusLabels[status as FindingStatus] ??
    taskStatusLabels[status as TaskStatus] ??
    status;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold",
        statusTone(status),
        className,
      )}
    >
      {label}
    </span>
  );
}
