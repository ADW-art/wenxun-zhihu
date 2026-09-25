import Link from "next/link";
import { Archive, FileBarChart, FileDown, FolderCheck, Link2 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { FeedbackState } from "@/components/ui/feedback-state";
import { MetricCard } from "@/components/ui/metric-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDateTime } from "@/lib/utils";

export default async function ReportsPage() {
  const inspections = await prisma.inspection.findMany({
    where: {
      status: { in: ["RECTIFYING", "PENDING_CLOSURE", "CLOSED"] },
    },
    orderBy: { updatedAt: "desc" },
    include: {
      building: { select: { id: true, code: true, name: true } },
      findings: {
        select: { status: true },
      },
      _count: {
        select: { findings: true, evidence: true, reviews: true },
      },
    },
  });

  const closedCount = inspections.filter(
    (inspection) => inspection.status === "CLOSED",
  ).length;
  const evidenceCount = inspections.reduce(
    (total, inspection) => total + inspection._count.evidence,
    0,
  );
  const riskCount = inspections.reduce(
    (total, inspection) => total + inspection._count.findings,
    0,
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Archive & report"
        title="归档与报告中心"
        description="汇总已确认风险、整改任务、证据文件和人工复核记录。"
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="可归档巡查"
          value={inspections.length}
          detail="整改中、待关闭或已归档"
          icon={Archive}
        />
        <MetricCard
          label="已闭环"
          value={closedCount}
          detail="已完成人工复核"
          icon={FolderCheck}
          tone="success"
        />
        <MetricCard
          label="风险记录"
          value={riskCount}
          detail="含已确认和已消除"
          icon={FileBarChart}
          tone="warning"
        />
        <MetricCard
          label="证据文件"
          value={evidenceCount}
          detail="原始文件与来源可追溯"
          icon={Link2}
          tone="info"
        />
      </section>

      {inspections.length === 0 ? (
        <FeedbackState
          icon={FileBarChart}
          title="暂无可生成报告的巡查"
          description="完成风险确认并创建整改任务后，报告会显示在这里。"
          action={
            <Button asChild>
              <Link href="/inspections">查看巡查任务</Link>
            </Button>
          }
        />
      ) : (
        <section className="overflow-hidden rounded-[var(--radius-card)] border border-border-default bg-surface-panel">
          <div className="grid grid-cols-[minmax(0,1fr)_90px_90px_100px_190px] gap-4 border-b border-border-default bg-surface-subtle px-5 py-3 text-xs font-semibold text-text-secondary max-lg:hidden">
            <span>建筑与巡查</span>
            <span>风险</span>
            <span>证据</span>
            <span>状态</span>
            <span className="text-right">操作</span>
          </div>

          <div className="divide-y divide-border-default">
            {inspections.map((inspection) => (
              <article
                key={inspection.id}
                className="grid gap-4 px-5 py-4 lg:grid-cols-[minmax(0,1fr)_90px_90px_100px_190px] lg:items-center"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-semibold text-action-primary">
                      {inspection.building.code}
                    </span>
                    <StatusBadge status={inspection.status} />
                  </div>
                  <p className="mt-2 truncate font-semibold">
                    {inspection.building.name}
                  </p>
                  <p className="mt-1 text-xs text-text-secondary">
                    {formatDateTime(inspection.updatedAt)}
                  </p>
                </div>
                <p className="font-mono text-sm font-semibold">
                  {inspection._count.findings}
                </p>
                <p className="font-mono text-sm font-semibold">
                  {inspection._count.evidence}
                </p>
                <p className="text-xs text-text-secondary">
                  {
                    inspection.findings.filter(
                      (finding) => finding.status === "RESOLVED",
                    ).length
                  }
                  /{inspection.findings.length} 已消除
                </p>
                <div className="flex flex-wrap justify-start gap-2 lg:justify-end">
                  <Button asChild variant="secondary" size="sm">
                    <Link href={`/inspections/${inspection.id}`}>查看数据</Link>
                  </Button>
                  <Button asChild size="sm">
                    <a href={`/api/reports/${inspection.id}/export`}>
                      <FileDown className="size-4" aria-hidden="true" />
                      下载报告
                    </a>
                  </Button>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
