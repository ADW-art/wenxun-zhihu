import { Check, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

type TimelineItem = {
  title: string;
  description?: string;
  time?: string;
  status?: string;
  tone?: "success" | "warning" | "info" | "danger" | "neutral";
};

const toneClasses = {
  success: "border-status-success bg-status-success text-text-inverse",
  warning: "border-status-warning bg-status-warning text-text-inverse",
  info: "border-status-info bg-status-info text-text-inverse",
  danger: "border-status-danger bg-status-danger text-text-inverse",
  neutral: "border-border-strong bg-surface-panel text-text-secondary",
} as const;

export function StatusTimeline({ items }: { items: TimelineItem[] }) {
  return (
    <ol className="space-y-0">
      {items.map((item, index) => {
        const tone = item.tone ?? "neutral";
        return (
          <li
            key={`${item.title}-${index}`}
            className="relative flex gap-4 pb-6 last:pb-0"
          >
            {index < items.length - 1 ? (
              <span
                aria-hidden="true"
                className="absolute top-5 bottom-0 left-[9px] w-px bg-border-default"
              />
            ) : null}
            <span
              className={cn(
                "relative z-10 mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border",
                toneClasses[tone],
              )}
            >
              {tone === "neutral" ? (
                <Circle className="size-2.5 fill-current" aria-hidden="true" />
              ) : (
                <Check className="size-3" aria-hidden="true" />
              )}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold text-text-primary">{item.title}</p>
                {item.status ? (
                  <span className="rounded-[4px] bg-surface-subtle px-2 py-1 text-[11px] font-semibold text-text-secondary">
                    {item.status}
                  </span>
                ) : null}
              </div>
              {item.description ? (
                <p className="mt-1 text-xs leading-5 text-text-secondary">
                  {item.description}
                </p>
              ) : null}
              {item.time ? (
                <p className="mt-1 font-mono text-[11px] text-text-disabled">
                  {item.time}
                </p>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
