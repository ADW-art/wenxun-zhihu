import Image from "next/image";
import { ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function EvidenceGallery({
  items,
  className,
}: {
  items: Array<{
    id: string;
    src?: string;
    alt: string;
    title: string;
    meta?: string;
    href?: string;
  }>;
  className?: string;
}) {
  if (items.length === 0) {
    return (
      <div className="rounded-[var(--radius-card)] border border-dashed border-border-default bg-surface-page p-6 text-center">
        <ImageIcon className="mx-auto size-6 text-text-disabled" aria-hidden="true" />
        <p className="mt-2 text-sm text-text-secondary">暂无现场证据</p>
      </div>
    );
  }

  return (
    <div className={cn("grid gap-3 sm:grid-cols-2 xl:grid-cols-3", className)}>
      {items.map((item, index) => {
        const content = (
          <>
            <div className="relative aspect-[4/3] overflow-hidden bg-surface-subtle">
              {item.src ? (
                <Image
                  src={item.src}
                  alt={item.alt}
                  fill
                  unoptimized={item.src.startsWith("/api/")}
                  className="object-cover"
                />
              ) : (
                <div className="grid h-full place-items-center">
                  <ImageIcon className="size-8 text-text-disabled" aria-hidden="true" />
                </div>
              )}
              <span className="absolute bottom-2 left-2 rounded-[4px] bg-surface-panel/90 px-2 py-1 text-[10px] font-semibold text-text-secondary">
                演示素材 {String(index + 1).padStart(2, "0")}
              </span>
            </div>
            <div className="p-3">
              <p className="line-clamp-1 text-sm font-semibold text-text-primary">
                {item.title}
              </p>
              {item.meta ? (
                <p className="mt-1 text-[11px] text-text-secondary">{item.meta}</p>
              ) : null}
            </div>
          </>
        );

        return item.href ? (
          <a
            key={item.id}
            href={item.href}
            target="_blank"
            rel="noreferrer"
            className="overflow-hidden rounded-[var(--radius-card)] border border-border-default bg-surface-panel transition-colors hover:border-action-primary/40"
          >
            {content}
          </a>
        ) : (
          <div
            key={item.id}
            className="overflow-hidden rounded-[var(--radius-card)] border border-border-default bg-surface-panel"
          >
            {content}
          </div>
        );
      })}
    </div>
  );
}
