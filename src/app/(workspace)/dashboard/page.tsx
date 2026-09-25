import Image from "next/image";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  CheckCircle2,
  ClipboardCheck,
  Route,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { MetricCard } from "@/components/ui/metric-card";
import { RiskBadge } from "@/components/ui/risk-badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { StatusTimeline } from "@/components/status-timeline";
import { formatDate, formatDateTime } from "@/lib/utils";

export default async function DashboardPage() {
  const [
    buildingCount,
    openInspectionCount,
    pendingReviewCount,
    openTaskCount,
    closedThisMonth,
    recentInspections,
  ] = await Promise.all([
    prisma.building.count({ where: { status: "ACTIVE" } }),
    prisma.inspection.count({
      where: { status: { in: ["SUBMITTED", "ANALYZING", "PENDING_REVIEW"] } },
    }),
    prisma.finding.count({ where: { status: "PROPOSED" } }),
    prisma.rectificationTask.count({
      where: { status: { in: ["OPEN", "IN_PROGRESS", "PENDING_REVIEW"] } },
    }),
    prisma.rectificationTask.count({
      where: {
        status: "CLOSED",
        completedAt: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        },
      },
    }),
    prisma.inspection.findMany({
      take: 5,
      orderBy: { updatedAt: "desc" },
      include: {
        building: { select: { id: true, code: true, name: true } },
        findings: {
          orderBy: { severity: "desc" },
          select: {
            id: true,
            title: true,
            severity: true,
            confidence: true,
            status: true,
          },
        },
        _count: { select: { findings: true, evidence: true } },
      },
    }),
  ]);

  const featured = recentInspections[0];
  const featuredFinding = featured?.findings[0];
  const metrics = [
    {
      label: "在册文物建筑",
      value: buildingCount,
      detail: "当前有效档案",
      icon: Building2,
      tone: "primary" as const,
    },
    {
      label: "待处理巡查",
      value: openInspectionCount,
      detail: "含分析和复核",
      icon: ClipboardCheck,
      tone: "info" as const,
    },
    {
      label: "待确认风险",
      value: pendingReviewCount,
      detail: "需专业人员复核",
      icon: AlertTriangle,
      tone: "warning" as const,
    },
    {
      label: "进行中整改",
      value: openTaskCount,
      detail: "含待复核任务",
      icon: Route,
      tone: "danger" as const,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Inspection overview"
        title="巡查总览"
        description="聚焦当前巡查、待确认风险和整改闭环。"
        actions={
          <Button asChild>
            <Link href="/inspections/new">
              发起巡查
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </Button>
        }
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <MetricCard key={metric.label} {...metric} />
        ))}
      </section>

      <section className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1.3fr)_minmax(280px,0.7fr)]">
        <article className="overflow-hidden rounded-[var(--radius-card)] border border-border-default bg-surface-panel">
          {featured ? (
            <div className="grid min-h-[360px] lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
              <div className="relative min-h-[260px] overflow-hidden bg-surface-subtle">
                <Image
                  src="/assets/heritage-risk-map-v1.png"
                  alt="巡查点位示意背景"
                  fill
                  className="object-cover opacity-90"
                />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_45%,rgb(32_37_34/22%))]" />
                <span className="absolute bottom-4 left-4 rounded-[4px] bg-surface-panel/95 px-3 py-2 text-xs font-semibold text-text-secondary">
                  点位示意，不代表精确位置
                </span>
              </div>

              <div className="p-5 lg:p-6">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs font-semibold text-action-primary">
                    {featured.building.code}
                  </span>
                  <StatusBadge status={featured.status} />
                  {featuredFinding ? (
                    <RiskBadge severity={featuredFinding.severity} />
                  ) : null}
                </div>
                <h2 className="mt-3 font-serif text-2xl font-semibold">
                  {featured.building.name}
                </h2>
                <p className="mt-3 text-sm leading-6 text-text-secondary">
                  {featured.summary}
                </p>

                {featuredFinding ? (
                  <div className="mt-5 rounded-[var(--radius-card)] border border-risk-high-border bg-risk-high-surface p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs font-semibold text-risk-high-foreground">
                        智能初判
                      </p>
                      <p className="font-mono text-xs text-risk-high-foreground">
                        置信度{" "}
                        {featuredFinding.confidence
                          ? `${Math.round(featuredFinding.confidence * 100)}%`
                          : "未提供"}
                      </p>
                    </div>
                    <p className="mt-2 font-semibold text-risk-high-foreground">
                      {featuredFinding.title}
                    </p>
                  </div>
                ) : null}

                <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-border-default pt-4">
                  <div className="text-xs text-text-secondary">
                    <p>
                      {formatDateTime(featured.updatedAt)} · {featured._count.evidence}{" "}
                      项证据
                    </p>
                    <p className="mt-1">{featured._count.findings} 条风险记录</p>
                  </div>
                  <Button asChild>
                    <Link href={`/inspections/${featured.id}`}>
                      打开巡查工作台
                      <ArrowRight className="size-4" aria-hidden="true" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid min-h-[360px] place-items-center p-8 text-center">
              <div>
                <ClipboardCheck
                  className="mx-auto size-10 text-text-disabled"
                  aria-hidden="true"
                />
                <p className="mt-4 font-serif text-lg font-semibold">暂无巡查记录</p>
                <Button asChild className="mt-5">
                  <Link href="/inspections/new">创建第一条巡查</Link>
                </Button>
              </div>
            </div>
          )}
        </article>

        <aside className="space-y-5">
          <div className="rounded-[var(--radius-card)] border border-border-default bg-surface-panel p-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-serif text-lg font-semibold">本月闭环</h2>
                <p className="mt-1 text-xs text-text-secondary">
                  已通过复核并关闭的整改任务
                </p>
              </div>
              <CheckCircle2 className="size-6 text-status-success" aria-hidden="true" />
            </div>
            <p className="mt-5 font-mono text-4xl font-bold">{closedThisMonth}</p>
          </div>

          <div className="rounded-[var(--radius-card)] border border-border-default bg-surface-panel p-5">
            <h2 className="font-serif text-lg font-semibold">当前关注</h2>
            <div className="mt-4">
              {featured ? (
                <StatusTimeline
                  items={[
                    {
                      title: "现场巡查",
                      description: featured.summary,
                      time: formatDateTime(featured.createdAt),
                      status: "已提交",
                      tone: "success",
                    },
                    {
                      title: "智能初判",
                      description: featuredFinding?.title ?? "等待生成风险草案",
                      status: featuredFinding ? "已完成" : "待分析",
                      tone: featuredFinding ? "success" : "neutral",
                    },
                    {
                      title: "人工复核",
                      description: "复核人员确认后进入整改任务。",
                      status:
                        featured.status === "PENDING_REVIEW" ? "进行中" : "待处理",
                      tone:
                        featured.status === "PENDING_REVIEW" ? "warning" : "neutral",
                    },
                  ]}
                />
              ) : (
                <p className="text-sm text-text-secondary">暂无关注事项。</p>
              )}
            </div>
          </div>
        </aside>
      </section>

      <section className="overflow-hidden rounded-[var(--radius-card)] border border-border-default bg-surface-panel">
        <div className="flex items-center justify-between border-b border-border-default px-5 py-4">
          <div>
            <h2 className="font-serif text-lg font-semibold">最近巡查</h2>
            <p className="mt-1 text-xs text-text-secondary">按最近更新时间排序</p>
          </div>
          <Button asChild variant="ghost" size="sm">
            <Link href="/inspections">查看全部</Link>
          </Button>
        </div>

        {recentInspections.length === 0 ? (
          <p className="p-8 text-center text-sm text-text-secondary">暂无巡查记录</p>
        ) : (
          <div className="divide-y divide-border-default">
            {recentInspections.map((inspection) => (
              <Link
                key={inspection.id}
                href={`/inspections/${inspection.id}`}
                className="grid gap-3 px-5 py-4 transition-colors hover:bg-surface-subtle/50 lg:grid-cols-[minmax(0,1fr)_140px_140px_110px] lg:items-center"
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
                  <p className="mt-1 line-clamp-1 text-xs text-text-secondary">
                    {inspection.summary}
                  </p>
                </div>
                <p className="text-xs text-text-secondary">
                  {inspection.season} · {inspection.weather}
                </p>
                <p className="text-xs text-text-secondary">
                  {inspection._count.findings} 条风险 · {inspection._count.evidence}{" "}
                  项证据
                </p>
                <p className="font-mono text-xs text-text-secondary">
                  {formatDate(inspection.updatedAt)}
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
