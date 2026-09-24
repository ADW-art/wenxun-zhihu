import type { RiskSeverity } from "@prisma/client";
import { cn } from "@/lib/utils";
import { severityLabels, severityTone } from "@/lib/domain/risk";

export function RiskBadge({
  severity,
  className,
}: {
  severity: RiskSeverity;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-semibold",
        severityTone[severity].badge,
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn("size-2 rounded-full", severityTone[severity].dot)}
      />
      {severityLabels[severity]}
    </span>
  );
}
