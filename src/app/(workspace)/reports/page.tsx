import Link from "next/link";
import { FileBarChart, FileDown } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/utils";

export default async function ReportsPage() {
  const inspections = await prisma.inspection.findMany({
    where: {
      status: { in: ["RECTIFYING", "PENDING_CLOSURE", "CLOSED"] },
    },
    orderBy: { updatedAt: "desc" },
    include: {
      building: { select: { code: true, name: true } },
      _count: { select: { findings: true } },
    },
  });

  return (
    <div className="space-y-7">
      <header>
        <p className="font-mono text-xs font-semibold text-primary">
          CONSERVATION ARCHIVE
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-normal">报告中心</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          汇总巡查、风险、规范依据、整改证据和人工复核记录。
        </p>
      </header>

      {inspections.length === 0 ? (
        <div className="grid min-h-72 place-items-center rounded-lg border border-dashed border-border bg-surface-panel p-8 text-center">
          <div>
            <FileBarChart
              className="mx-auto size-10 text-muted-foreground"
              aria-hidden="true"
            />
            <p className="mt-4 font-semibold">暂无可生成报告的巡查</p>
            <p className="mt-2 text-sm text-muted-foreground">
              完成风险确认并创建整改任务后，报告会显示在这里。
            </p>
          </div>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border bg-surface-panel">
          <div className="divide-y divide-border">
            {inspections.map((inspection) => (
              <div
                key={inspection.id}
                className="flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="font-mono text-xs font-semibold text-primary">
                      {inspection.building.code}
                    </span>
                    <StatusBadge status={inspection.status} />
                  </div>
                  <p className="mt-2 font-semibold">{inspection.building.name}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {inspection._count.findings} 条风险 ·{" "}
                    {formatDateTime(inspection.updatedAt)}
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button asChild variant="secondary">
                    <Link href={`/inspections/${inspection.id}`}>查看报告数据</Link>
                  </Button>
                  <Button asChild>
                    <a href={`/api/reports/${inspection.id}/export`}>
                      <FileDown className="size-4" aria-hidden="true" />
                      下载报告
                    </a>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
