import Link from "next/link";
import { ArrowRight, ClipboardCheck } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/utils";

export default async function InspectionsPage() {
  const inspections = await prisma.inspection.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      building: { select: { code: true, name: true } },
      inspector: { select: { name: true } },
      _count: { select: { findings: true, evidence: true } },
    },
  });

  return (
    <div className="space-y-7">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="font-mono text-xs font-semibold text-primary">
            INSPECTION REGISTER
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-normal">巡查管理</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            查看巡查状态、智能体分析和人工复核进度。
          </p>
        </div>
        <Button asChild>
          <Link href="/inspections/new">
            新建巡查
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </Button>
      </header>

      <div className="overflow-hidden rounded-lg border border-border bg-surface-panel">
        {inspections.length === 0 ? (
          <div className="grid min-h-72 place-items-center p-8 text-center">
            <div>
              <ClipboardCheck
                className="mx-auto size-10 text-muted-foreground"
                aria-hidden="true"
              />
              <p className="mt-4 font-semibold">暂无巡查记录</p>
              <p className="mt-2 text-sm text-muted-foreground">
                创建第一条巡查后，智能体分析记录会显示在这里。
              </p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {inspections.map((inspection) => (
              <Link
                key={inspection.id}
                href={`/inspections/${inspection.id}`}
                className="grid gap-4 p-5 transition-colors hover:bg-muted/35 lg:grid-cols-[1fr_auto] lg:items-center"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="font-mono text-xs font-semibold text-primary">
                      {inspection.building.code}
                    </span>
                    <StatusBadge status={inspection.status} />
                    <span className="text-xs text-muted-foreground">
                      {inspection.season} · {inspection.weather}
                    </span>
                  </div>
                  <h2 className="mt-2 truncate text-lg font-bold">
                    {inspection.building.name}
                  </h2>
                  <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">
                    {inspection.summary}
                  </p>
                </div>
                <div className="flex items-center gap-8 text-sm">
                  <div>
                    <p className="font-mono text-xl font-bold">
                      {inspection._count.findings}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">风险</p>
                  </div>
                  <div>
                    <p className="font-mono text-xl font-bold">
                      {inspection._count.evidence}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">证据</p>
                  </div>
                  <div className="hidden text-right sm:block">
                    <p className="text-xs text-muted-foreground">
                      {inspection.inspector.name}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatDateTime(inspection.updatedAt)}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
