import Image from "next/image";
import Link from "next/link";
import { ArrowRight, MapPin, ShieldAlert } from "lucide-react";
import type { RiskSeverity } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { RiskBadge } from "@/components/ui/risk-badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { StatusTimeline } from "@/components/status-timeline";
import { formatDateTime } from "@/lib/utils";

const markerPositions = [
  { left: "31%", top: "21%" },
  { left: "48%", top: "17%" },
  { left: "63%", top: "27%" },
  { left: "37%", top: "38%" },
  { left: "58%", top: "44%" },
  { left: "39%", top: "63%" },
  { left: "61%", top: "70%" },
];

function markerTone(severity?: RiskSeverity | null) {
  if (severity === "CRITICAL" || severity === "HIGH") return "bg-risk-high";
  if (severity === "MEDIUM") return "bg-risk-medium";
  return "bg-risk-low";
}

export default async function RiskMapPage({
  searchParams,
}: {
  searchParams: Promise<{ selected?: string }>;
}) {
  const [{ selected }, buildings] = await Promise.all([
    searchParams,
    prisma.building.findMany({
      where: { status: "ACTIVE" },
      orderBy: { code: "asc" },
      include: {
        inspections: {
          take: 1,
          orderBy: { createdAt: "desc" },
          include: {
            findings: {
              select: {
                id: true,
                title: true,
                severity: true,
                confidence: true,
              },
              orderBy: { severity: "desc" },
            },
          },
        },
        riskHistory: {
          take: 1,
          orderBy: { happenedAt: "desc" },
        },
      },
    }),
  ]);

  const current =
    buildings.find((building) => building.id === selected) ?? buildings[0];
  const latestInspection = current?.inspections[0];
  const latestFinding = latestInspection?.findings[0];
  const currentSeverity = latestFinding?.severity ?? current?.riskHistory[0]?.severity;

  const timelineItems = latestInspection
    ? [
        {
          title: "巡查记录",
          description: latestInspection.summary,
          time: formatDateTime(latestInspection.createdAt),
          status: "已提交",
          tone: "success" as const,
        },
        {
          title: "人工复核",
          description:
            latestInspection.status === "PENDING_REVIEW"
              ? "等待复核人员确认证据与风险来源。"
              : "复核状态已记录。",
          time: formatDateTime(latestInspection.updatedAt),
          status: latestInspection.status === "PENDING_REVIEW" ? "进行中" : "已处理",
          tone:
            latestInspection.status === "PENDING_REVIEW"
              ? ("warning" as const)
              : ("success" as const),
        },
        {
          title: "整改闭环",
          description: "风险确认后创建整改任务并跟踪证据。",
          status: "待处理",
          tone: "neutral" as const,
        },
      ]
    : [];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Risk overview"
        title="不可移动文物风险地图"
        description="使用脱敏示意底图展示业务分布，不提供精确坐标。"
        actions={
          <Button asChild>
            <Link href="/inspections/new">
              发起巡查
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </Button>
        }
      />

      <section className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="relative min-h-[620px] overflow-hidden rounded-[var(--radius-card)] border border-border-default bg-surface-panel">
          <Image
            src="/assets/heritage-risk-map-v1.png"
            alt="脱敏文物风险示意地图"
            fill
            priority
            className="object-cover opacity-90"
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgb(35_48_43/3%)_1px,transparent_1px),linear-gradient(rgb(35_48_43/3%)_1px,transparent_1px)] bg-[size:28px_28px]" />

          {buildings.slice(0, markerPositions.length).map((building, index) => {
            const severity =
              building.inspections[0]?.findings[0]?.severity ??
              building.riskHistory[0]?.severity;
            const position = markerPositions[index];
            const active = building.id === current?.id;
            return (
              <Link
                key={building.id}
                href={{ pathname: "/risk-map", query: { selected: building.id } }}
                aria-label={`${building.name}，${severity ?? "低风险"}`}
                className="absolute -translate-x-1/2 -translate-y-1/2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-4"
                style={position}
              >
                <span
                  className={`block rounded-full border-[3px] border-surface-panel shadow-sm ${markerTone(
                    severity,
                  )} ${active ? "size-5 ring-4 ring-risk-high/20" : "size-3.5"}`}
                />
                {active ? (
                  <span className="absolute top-1/2 left-6 -translate-y-1/2 rounded-[4px] bg-risk-high px-3 py-2 text-xs font-semibold whitespace-nowrap text-text-inverse">
                    {building.name}
                  </span>
                ) : null}
              </Link>
            );
          })}

          <div className="absolute bottom-5 left-5 rounded-[var(--radius-card)] border border-border-default bg-surface-panel/95 p-4">
            <p className="text-xs font-semibold text-text-primary">风险图例</p>
            <div className="mt-3 space-y-2 text-xs text-text-secondary">
              {[
                ["高风险", "bg-risk-high"],
                ["中风险", "bg-risk-medium"],
                ["正常", "bg-risk-low"],
              ].map(([label, tone]) => (
                <p key={label} className="flex items-center gap-2">
                  <span className={`size-2.5 rounded-full ${tone}`} />
                  {label}
                </p>
              ))}
            </div>
          </div>

          <div className="absolute right-5 bottom-5 left-52 rounded-[var(--radius-card)] border border-border-default bg-surface-panel/95 px-4 py-3 text-sm text-text-secondary">
            在管点位 {buildings.length} · 风险点位{" "}
            {
              buildings.filter(
                (building) =>
                  building.inspections[0]?.findings.length ||
                  building.riskHistory.length,
              ).length
            }{" "}
            · 示意地图不提供定位信息
          </div>
        </div>

        <aside className="rounded-[var(--radius-card)] border border-border-default bg-surface-panel">
          {current ? (
            <>
              <div className="border-b border-border-default p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs font-semibold text-action-primary">
                    {current.code}
                  </span>
                  {currentSeverity ? <RiskBadge severity={currentSeverity} /> : null}
                </div>
                <h2 className="mt-3 font-serif text-2xl font-semibold">
                  {current.name}
                </h2>
                <p className="mt-2 flex items-center gap-2 text-xs text-text-secondary">
                  <MapPin className="size-3.5" aria-hidden="true" />
                  {current.addressLabel} · {current.era}
                </p>
              </div>

              <div className="space-y-5 p-5">
                {latestFinding ? (
                  <div className="rounded-[var(--radius-card)] border border-risk-high-border bg-risk-high-surface p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs font-semibold text-risk-high-foreground">
                        智能初判
                      </p>
                      <p className="font-mono text-xs text-risk-high-foreground">
                        置信度{" "}
                        {latestFinding.confidence
                          ? `${Math.round(latestFinding.confidence * 100)}%`
                          : "未提供"}
                      </p>
                    </div>
                    <p className="mt-2 font-serif text-lg font-semibold text-risk-high-foreground">
                      {latestFinding.title}
                    </p>
                    <p className="mt-2 text-xs leading-5 text-risk-high-foreground/80">
                      模型输出只作为风险草案，必须由复核人员结合证据确认。
                    </p>
                  </div>
                ) : (
                  <div className="rounded-[var(--radius-card)] border border-border-default bg-surface-page p-4">
                    <p className="flex items-center gap-2 text-sm font-semibold">
                      <ShieldAlert className="size-4 text-text-secondary" />
                      暂无风险草案
                    </p>
                    <p className="mt-2 text-xs leading-5 text-text-secondary">
                      当前建筑没有待确认风险，可发起新的巡查。
                    </p>
                  </div>
                )}

                {latestInspection ? (
                  <div>
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold">处置进度</p>
                      <StatusBadge status={latestInspection.status} />
                    </div>
                    <StatusTimeline items={timelineItems} />
                  </div>
                ) : null}

                <div className="flex flex-wrap gap-3 border-t border-border-default pt-5">
                  <Button asChild>
                    <Link
                      href={
                        latestInspection
                          ? `/inspections/${latestInspection.id}`
                          : `/inspections/new?buildingId=${current.id}`
                      }
                    >
                      {latestInspection ? "进入巡查记录" : "发起巡查"}
                      <ArrowRight className="size-4" aria-hidden="true" />
                    </Link>
                  </Button>
                  <Button asChild variant="secondary">
                    <Link href={`/buildings/${current.id}`}>查看建筑档案</Link>
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="p-6 text-sm text-text-secondary">暂无建筑点位。</div>
          )}
        </aside>
      </section>
    </div>
  );
}
