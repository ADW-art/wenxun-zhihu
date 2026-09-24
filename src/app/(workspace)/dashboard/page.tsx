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
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/utils";

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
      take: 6,
      orderBy: { updatedAt: "desc" },
      include: {
        building: { select: { code: true, name: true } },
        _count: { select: { findings: true } },
      },
    }),
  ]);

  const metrics = [
    {
      label: "在册文物建筑",
      value: buildingCount,
      detail: "脱敏演示档案",
      icon: Building2,
      tone: "text-primary",
    },
    {
      label: "待处理巡查",
      value: openInspectionCount,
      detail: "含分析和复核",
      icon: ClipboardCheck,
      tone: "text-sky-700",
    },
    {
      label: "待确认风险",
      value: pendingReviewCount,
      detail: "需专业人员复核",
      icon: AlertTriangle,
      tone: "text-amber-700",
    },
    {
      label: "进行中整改",
      value: openTaskCount,
      detail: "含待复核任务",
      icon: Route,
      tone: "text-orange-700",
    },
  ];

  return (
    <div className="space-y-7">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="font-mono text-xs font-semibold text-primary">
            CONSERVATION OPERATIONS
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-normal">巡查工作台</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            聚焦待复核风险、整改期限和近期闭环情况。
          </p>
        </div>
        <Button asChild>
          <Link href="/inspections/new">
            新建巡查
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </Button>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <Card key={metric.label}>
              <CardContent>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{metric.label}</p>
                    <p className="mt-3 font-mono text-4xl font-bold">{metric.value}</p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {metric.detail}
                    </p>
                  </div>
                  <span className="grid size-10 place-items-center rounded-md bg-muted">
                    <Icon className={`size-5 ${metric.tone}`} aria-hidden="true" />
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.35fr_0.65fr]">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <h2 className="text-lg font-bold">最近巡查</h2>
              <p className="mt-1 text-sm text-muted-foreground">按最近更新时间排序</p>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link href="/inspections">查看全部</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentInspections.length === 0 ? (
              <p className="rounded-md border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                暂无巡查记录
              </p>
            ) : (
              recentInspections.map((inspection) => (
                <Link
                  key={inspection.id}
                  href={`/inspections/${inspection.id}`}
                  className="group flex flex-col gap-3 rounded-md border border-border bg-white p-4 transition-colors hover:border-primary/40 hover:bg-muted/35 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-semibold text-primary">
                        {inspection.building.code}
                      </span>
                      <StatusBadge status={inspection.status} />
                    </div>
                    <p className="mt-2 truncate font-semibold">
                      {inspection.building.name}
                    </p>
                    <p className="mt-1 line-clamp-2 text-sm leading-6 text-muted-foreground">
                      {inspection.summary}
                    </p>
                  </div>
                  <div className="shrink-0 text-left sm:text-right">
                    <p className="text-xs text-muted-foreground">
                      {formatDateTime(inspection.updatedAt)}
                    </p>
                    <p className="mt-2 text-xs font-semibold">
                      {inspection._count.findings} 条风险
                    </p>
                  </div>
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader>
            <h2 className="text-lg font-bold">本月闭环</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              已通过复核并关闭的整改任务
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid min-h-48 place-items-center rounded-md border border-border bg-[#edf5f2]">
              <div className="text-center">
                <CheckCircle2
                  className="mx-auto size-10 text-primary"
                  aria-hidden="true"
                />
                <p className="mt-4 font-mono text-5xl font-bold">{closedThisMonth}</p>
                <p className="mt-2 text-sm text-muted-foreground">项任务完成人工复核</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
