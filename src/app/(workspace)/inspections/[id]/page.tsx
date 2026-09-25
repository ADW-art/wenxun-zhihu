import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Bot,
  CheckCircle2,
  Clock3,
  ExternalLink,
  FileCheck2,
  ListChecks,
  Sparkles,
} from "lucide-react";
import { Role } from "@prisma/client";
import { auth } from "@/auth";
import { inspectionAgentOutputSchema } from "@/agent/schemas";
import { Button } from "@/components/ui/button";
import { EvidenceGallery } from "@/components/evidence-gallery";
import { PageHeader } from "@/components/page-header";
import { SubmitButton } from "@/components/submit-button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { RiskBadge } from "@/components/ui/risk-badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { riskTypeLabels } from "@/lib/domain/risk";
import { NotFoundError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";
import { getInspectionDetail } from "@/lib/services/inspection-service";
import { formatDate, formatDateTime } from "@/lib/utils";
import {
  confirmFindingAction,
  createTaskAction,
  submitInspectionAction,
} from "../actions";

function priorityOptions() {
  return [
    ["LOW", "低风险"],
    ["MEDIUM", "中风险"],
    ["HIGH", "高风险"],
    ["CRITICAL", "紧急风险"],
  ] as const;
}

function defaultDueDate(days = 3) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

export default async function InspectionDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    analyzed?: string;
    confirmed?: string;
    taskCreated?: string;
    error?: string;
  }>;
}) {
  const [{ id }, query, session] = await Promise.all([params, searchParams, auth()]);

  if (!session?.user) notFound();

  let inspection;
  try {
    inspection = await getInspectionDetail(id);
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    throw error;
  }

  const rectifiers = await prisma.user.findMany({
    where: { role: Role.RECTIFIER },
    select: { id: true, name: true, email: true },
    orderBy: { name: "asc" },
  });

  const latestRun = inspection.agentRuns[0];
  const parsedOutput = latestRun?.outputJson
    ? inspectionAgentOutputSchema.safeParse(latestRun.outputJson)
    : null;
  const agentOutput = parsedOutput?.success ? parsedOutput.data : null;
  const canReview =
    session.user.role === Role.REVIEWER || session.user.role === Role.ADMIN;
  const canAnalyze =
    session.user.role === Role.INSPECTOR ||
    session.user.role === Role.REVIEWER ||
    session.user.role === Role.ADMIN;

  return (
    <div className="space-y-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link href="/inspections">
            <ArrowLeft className="size-4" aria-hidden="true" />
            返回巡查列表
          </Link>
        </Button>
      </div>

      {query.error ? (
        <p
          role="alert"
          className="rounded-md border border-status-danger-border bg-status-danger-surface px-4 py-3 text-sm text-status-danger-foreground"
        >
          {decodeURIComponent(query.error)}
        </p>
      ) : null}
      {query.analyzed || query.confirmed || query.taskCreated ? (
        <p
          role="status"
          className="flex items-center gap-2 rounded-md border border-status-success-border bg-status-success-surface px-4 py-3 text-sm text-status-success-foreground"
        >
          <CheckCircle2 className="size-4" aria-hidden="true" />
          {query.taskCreated
            ? "整改任务已创建"
            : query.confirmed
              ? "风险已由人工确认"
              : "智能体分析已完成"}
        </p>
      ) : null}

      <PageHeader
        eyebrow={inspection.building.code}
        title="巡查详情 · 证据工作台"
        description={`${inspection.building.name} · ${inspection.season} · ${inspection.weather} · 执行人 ${inspection.inspector.name} · ${formatDateTime(inspection.createdAt)}`}
        status={<StatusBadge status={inspection.status} />}
        actions={
          canAnalyze &&
          (inspection.status === "DRAFT" ||
            inspection.status === "SUBMITTED" ||
            inspection.status === "ANALYZING") ? (
            <form action={submitInspectionAction}>
              <input type="hidden" name="inspectionId" value={inspection.id} />
              <SubmitButton pendingText="智能体分析中，请稍候">
                <Sparkles className="size-4" aria-hidden="true" />
                提交并运行智能分析
              </SubmitButton>
            </form>
          ) : null
        }
      />

      <section className="overflow-hidden rounded-[var(--radius-card)] border border-border-default bg-surface-panel">
        <div className="grid grid-cols-2 divide-x divide-y divide-border-default lg:grid-cols-4 lg:divide-y-0">
          {[
            ["01", "现场记录", "已完成", true],
            ["02", "AI 初判", latestRun ? "已完成" : "待开始", Boolean(latestRun)],
            [
              "03",
              "人工复核",
              inspection.status === "PENDING_REVIEW" ? "当前步骤" : "待处理",
              inspection.status !== "PENDING_REVIEW",
            ],
            [
              "04",
              "整改闭环",
              inspection.status === "CLOSED" ? "已完成" : "待开始",
              inspection.status === "CLOSED",
            ],
          ].map(([number, title, status, complete]) => (
            <div key={String(number)} className="flex items-center gap-3 p-4">
              <span
                className={`grid size-7 shrink-0 place-items-center rounded-full border font-mono text-[11px] font-semibold ${
                  complete
                    ? "border-action-primary bg-action-primary text-text-inverse"
                    : "border-border-strong text-text-secondary"
                }`}
              >
                {String(number)}
              </span>
              <div>
                <p className="text-sm font-semibold">{String(title)}</p>
                <p className="mt-0.5 text-[11px] text-text-secondary">
                  {String(status)}
                </p>
              </div>
            </div>
          ))}
        </div>
        <div className="border-t border-border-default bg-surface-page px-5 py-4">
          <p className="text-xs font-semibold text-text-secondary">现场观察</p>
          <p className="mt-2 text-sm leading-7">{inspection.summary}</p>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.45fr_0.55fr]">
        <div className="space-y-5">
          <section className="rounded-[var(--radius-card)] border border-border-default bg-surface-panel p-5">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="font-serif text-lg font-semibold">原始证据</h2>
                <p className="mt-1 text-xs text-text-secondary">
                  现场照片、观察记录和环境信息保持原始顺序。
                </p>
              </div>
              <span className="text-xs text-text-secondary">
                共 {inspection.evidence.length} 项
              </span>
            </div>
            <EvidenceGallery
              className="mt-4"
              items={inspection.evidence.map((evidence) => ({
                id: evidence.id,
                src: evidence.storageKey
                  ? `/api/files/${evidence.storageKey}`
                  : undefined,
                alt: evidence.altText ?? evidence.originalName,
                title: evidence.originalName,
                meta: `${evidence.kind} · ${evidence.sourceType} · ${Math.ceil(
                  evidence.sizeBytes / 1024,
                )} KB`,
                href: evidence.storageKey
                  ? `/api/files/${evidence.storageKey}`
                  : undefined,
              }))}
            />
          </section>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <h2 className="flex items-center gap-2 text-lg font-bold">
                  <Bot className="size-5 text-primary" aria-hidden="true" />
                  智能体分析结果
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  风险结论必须由复核人员确认后才进入整改。
                </p>
              </div>
              {latestRun ? (
                <span className="rounded-full border border-border bg-muted px-2.5 py-1 text-xs font-semibold">
                  {latestRun.degraded ? "降级模式" : "模型模式"}
                </span>
              ) : null}
            </CardHeader>
            <CardContent className="space-y-4">
              {inspection.findings.length === 0 ? (
                <div className="rounded-md border border-dashed border-border p-8 text-center">
                  <p className="font-semibold">尚未生成风险分析</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    提交巡查后，智能体将生成计划和风险草案。
                  </p>
                </div>
              ) : (
                inspection.findings.map((finding) => {
                  const activeTask = finding.tasks.find(
                    (task) => task.status !== "REJECTED",
                  );
                  return (
                    <article
                      key={finding.id}
                      className="rounded-lg border border-border p-5"
                    >
                      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <RiskBadge severity={finding.severity} />
                            <span className="rounded-full border border-border bg-muted px-2.5 py-1 text-xs font-semibold">
                              {riskTypeLabels[finding.riskType]}
                            </span>
                            <StatusBadge status={finding.status} />
                          </div>
                          <h3 className="mt-3 text-lg font-bold">{finding.title}</h3>
                          <p className="mt-2 text-sm leading-7">
                            {finding.description}
                          </p>
                        </div>
                        {finding.confidence !== null ? (
                          <div className="shrink-0 text-left sm:text-right">
                            <p className="font-mono text-lg font-bold">
                              {Math.round(finding.confidence * 100)}%
                            </p>
                            <p className="text-xs text-muted-foreground">
                              智能体置信度
                            </p>
                          </div>
                        ) : null}
                      </div>

                      <div className="mt-4 rounded-md border border-status-warning-border bg-status-warning-surface/60 p-4">
                        <p className="text-xs font-semibold text-status-warning-foreground">
                          建议处置
                        </p>
                        <p className="mt-2 text-sm leading-6 text-status-warning-foreground/80">
                          {finding.recommendedAction}
                        </p>
                        {finding.uncertainty ? (
                          <p className="mt-3 text-xs leading-5 text-status-warning-foreground">
                            不确定项：{finding.uncertainty}
                          </p>
                        ) : null}
                      </div>

                      <div className="mt-4 space-y-3">
                        <p className="text-xs font-semibold text-muted-foreground">
                          规范与规则依据
                        </p>
                        {finding.citations.map((citation) => (
                          <div
                            key={citation.id}
                            className="rounded-md border border-border bg-muted/25 p-4"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <p className="text-sm font-semibold">
                                {citation.clause.document.code} ·{" "}
                                {citation.clause.heading}
                              </p>
                              {citation.clause.document.sourceUrl ? (
                                <a
                                  href={citation.clause.document.sourceUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                                >
                                  查看来源
                                  <ExternalLink
                                    className="size-3.5"
                                    aria-hidden="true"
                                  />
                                </a>
                              ) : null}
                            </div>
                            <p className="mt-2 text-xs leading-5 text-muted-foreground">
                              {citation.clause.text}
                            </p>
                            <p className="mt-3 text-xs text-primary">
                              匹配原因：{citation.relevance}
                            </p>
                          </div>
                        ))}
                      </div>

                      {canReview && finding.status === "PROPOSED" ? (
                        <form
                          action={confirmFindingAction}
                          className="mt-5 flex flex-col gap-3 border-t border-border pt-5 sm:flex-row"
                        >
                          <input type="hidden" name="findingId" value={finding.id} />
                          <input
                            type="hidden"
                            name="inspectionId"
                            value={inspection.id}
                          />
                          <Input
                            name="comment"
                            placeholder="确认说明，例如：现场照片与记录一致"
                            aria-label="风险确认说明"
                          />
                          <Button type="submit" className="shrink-0">
                            <CheckCircle2 className="size-4" aria-hidden="true" />
                            确认风险
                          </Button>
                        </form>
                      ) : null}

                      {canReview && finding.status === "CONFIRMED" && !activeTask ? (
                        <form
                          action={createTaskAction}
                          className="mt-5 space-y-4 border-t border-border pt-5"
                        >
                          <input type="hidden" name="findingId" value={finding.id} />
                          <input
                            type="hidden"
                            name="inspectionId"
                            value={inspection.id}
                          />
                          <input type="hidden" name="title" value={finding.title} />
                          <input
                            type="hidden"
                            name="description"
                            value={finding.recommendedAction}
                          />
                          <input
                            type="hidden"
                            name="acceptanceCriteria"
                            value="提交整改说明和整改后证据，能够证明原风险已消除或受控。"
                          />
                          <div className="grid gap-4 sm:grid-cols-3">
                            <label className="block">
                              <span className="mb-2 block text-xs font-semibold">
                                责任人
                              </span>
                              <Select name="assigneeId" required>
                                {rectifiers.map((user) => (
                                  <option key={user.id} value={user.id}>
                                    {user.name}
                                  </option>
                                ))}
                              </Select>
                            </label>
                            <label className="block">
                              <span className="mb-2 block text-xs font-semibold">
                                优先级
                              </span>
                              <Select name="priority" defaultValue={finding.severity}>
                                {priorityOptions().map(([value, label]) => (
                                  <option key={value} value={value}>
                                    {label}
                                  </option>
                                ))}
                              </Select>
                            </label>
                            <label className="block">
                              <span className="mb-2 block text-xs font-semibold">
                                完成期限
                              </span>
                              <Input
                                name="dueAt"
                                type="date"
                                required
                                defaultValue={defaultDueDate(
                                  finding.severity === "HIGH" ? 3 : 7,
                                )}
                              />
                            </label>
                          </div>
                          <Button type="submit">
                            <ListChecks className="size-4" aria-hidden="true" />
                            创建整改任务
                          </Button>
                        </form>
                      ) : null}

                      {activeTask ? (
                        <Link
                          href={`/tasks/${activeTask.id}`}
                          className="mt-5 flex items-center justify-between gap-3 rounded-md border border-primary/20 bg-primary/5 p-4 transition-colors hover:bg-primary/10"
                        >
                          <div>
                            <p className="text-sm font-semibold">
                              整改任务 · {activeTask.assignee.name}
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              截止 {formatDate(activeTask.dueAt)} · {activeTask.status}
                            </p>
                          </div>
                          <ArrowLeft
                            className="size-4 rotate-180 text-primary"
                            aria-hidden="true"
                          />
                        </Link>
                      ) : null}
                    </article>
                  );
                })
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-5">
          <Card>
            <CardHeader>
              <h2 className="flex items-center gap-2 text-lg font-bold">
                <FileCheck2 className="size-5 text-primary" aria-hidden="true" />
                巡查计划
              </h2>
            </CardHeader>
            <CardContent className="space-y-3">
              {agentOutput ? (
                agentOutput.plan.map((item, index) => (
                  <div key={item.id} className="rounded-md border border-border p-4">
                    <p className="font-mono text-xs font-semibold text-primary">
                      {String(index + 1).padStart(2, "0")}
                    </p>
                    <p className="mt-2 font-semibold">{item.title}</p>
                    <p className="mt-2 text-xs leading-5 text-muted-foreground">
                      {item.rationale}
                    </p>
                    <p className="mt-3 text-xs">
                      需要证据：{item.requiredEvidence.join("、")}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  运行智能分析后生成检查计划。
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="flex items-center gap-2 text-lg font-bold">
                <Clock3 className="size-5 text-primary" aria-hidden="true" />
                Agent 运行记录
              </h2>
            </CardHeader>
            <CardContent>
              {latestRun ? (
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-muted-foreground">Provider</span>
                    <span className="font-mono text-xs">{latestRun.provider}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-muted-foreground">模型</span>
                    <span className="max-w-40 truncate font-mono text-xs">
                      {latestRun.model}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-muted-foreground">Prompt</span>
                    <span className="font-mono text-xs">{latestRun.promptVersion}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-muted-foreground">工具调用</span>
                    <span className="font-mono text-xs">
                      {latestRun.toolCalls.length} 次
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-muted-foreground">状态</span>
                    <span className="text-xs font-semibold">{latestRun.status}</span>
                  </div>
                  <p className="border-t border-border pt-3 text-xs text-muted-foreground">
                    开始于 {formatDateTime(latestRun.startedAt)}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">暂无运行记录。</p>
              )}
            </CardContent>
          </Card>

          {agentOutput?.uncertainties.length ? (
            <Card className="border-status-warning-border bg-status-warning-surface/60">
              <CardHeader>
                <h2 className="font-bold text-status-warning-foreground">
                  需要人工关注
                </h2>
              </CardHeader>
              <CardContent className="space-y-2">
                {agentOutput.uncertainties.map((uncertainty) => (
                  <p
                    key={uncertainty}
                    className="text-xs leading-5 text-status-warning-foreground/80"
                  >
                    {uncertainty}
                  </p>
                ))}
              </CardContent>
            </Card>
          ) : null}
        </div>
      </section>
    </div>
  );
}
