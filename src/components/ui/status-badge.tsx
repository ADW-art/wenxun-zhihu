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
    return "border-emerald-200 bg-emerald-50 text-emerald-800";
  }
  if (["REJECTED", "CRITICAL"].includes(status)) {
    return "border-red-200 bg-red-50 text-red-800";
  }
  if (["PENDING_REVIEW", "PENDING_CLOSURE", "PROPOSED"].includes(status)) {
    return "border-amber-200 bg-amber-50 text-amber-800";
  }
  if (["ANALYZING", "SUBMITTED", "IN_PROGRESS"].includes(status)) {
    return "border-sky-200 bg-sky-50 text-sky-800";
  }
  return "border-border bg-muted text-muted-foreground";
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
