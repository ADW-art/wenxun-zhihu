import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarClock, MapPin } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { RiskBadge } from "@/components/ui/risk-badge";
import { Button } from "@/components/ui/button";
import { formatDate, formatDateTime } from "@/lib/utils";
import { riskTypeLabels } from "@/lib/domain/risk";

export default async function BuildingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const building = await prisma.building.findUnique({
    where: { id },
    include: {
      riskHistory: { orderBy: { happenedAt: "desc" } },
      inspections: {
        orderBy: { createdAt: "desc" },
        include: {
          inspector: { select: { name: true } },
          _count: { select: { findings: true, evidence: true } },
        },
      },
    },
  });

  if (!building) notFound();

  return (
    <div className="space-y-7">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link href="/buildings">
            <ArrowLeft className="size-4" aria-hidden="true" />
            返回建筑档案
          </Link>
        </Button>
      </div>

      <header className="rounded-lg border border-border bg-white p-6">
        <p className="font-mono text-xs font-semibold text-primary">{building.code}</p>
        <div className="mt-3 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <h1 className="text-3xl font-bold">{building.name}</h1>
            <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="size-4" aria-hidden="true" />
              {building.addressLabel}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {building.riskTags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
        <p className="mt-5 max-w-4xl text-sm leading-7 text-muted-foreground">
          {building.summary}
        </p>
      </header>

      <section className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
        <Card>
          <CardHeader>
            <h2 className="text-lg font-bold">历史风险</h2>
          </CardHeader>
          <CardContent className="space-y-3">
            {building.riskHistory.length === 0 ? (
              <p className="rounded-md border border-dashed border-border p-5 text-sm text-muted-foreground">
                暂无历史风险记录
              </p>
            ) : (
              building.riskHistory.map((risk) => (
                <article key={risk.id} className="rounded-md border border-border p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="font-semibold">{riskTypeLabels[risk.riskType]}</p>
                    <RiskBadge severity={risk.severity} />
                  </div>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    {risk.summary}
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {formatDate(risk.happenedAt)}
                  </p>
                </article>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <h2 className="text-lg font-bold">巡查记录</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                最近创建的巡查优先显示
              </p>
            </div>
            <Button asChild size="sm">
              <Link href={`/inspections/new?buildingId=${building.id}`}>创建巡查</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {building.inspections.length === 0 ? (
              <p className="rounded-md border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                暂未创建巡查
              </p>
            ) : (
              building.inspections.map((inspection) => (
                <Link
                  key={inspection.id}
                  href={`/inspections/${inspection.id}`}
                  className="block rounded-md border border-border p-4 transition-colors hover:border-primary/40 hover:bg-muted/35"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <StatusBadge status={inspection.status} />
                    <span className="text-xs text-muted-foreground">
                      {formatDateTime(inspection.createdAt)}
                    </span>
                  </div>
                  <p className="mt-3 line-clamp-2 text-sm leading-6">
                    {inspection.summary}
                  </p>
                  <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <CalendarClock className="size-3.5" aria-hidden="true" />
                      {inspection.season} · {inspection.weather}
                    </span>
                    <span>{inspection._count.findings} 条风险</span>
                    <span>{inspection.inspector.name}</span>
                  </div>
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
