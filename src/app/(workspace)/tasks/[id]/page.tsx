import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  CircleX,
  Clock3,
  FileText,
  ListChecks,
} from "lucide-react";
import { Role } from "@prisma/client";
import { auth } from "@/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { RiskBadge } from "@/components/ui/risk-badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { Textarea } from "@/components/ui/textarea";
import { prisma } from "@/lib/prisma";
import { formatDate, formatDateTime } from "@/lib/utils";
import { reviewTaskAction, submitEvidenceAction } from "../actions";

export default async function TaskDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    error?: string;
    submitted?: string;
    reviewed?: string;
  }>;
}) {
  const [{ id }, query, session] = await Promise.all([params, searchParams, auth()]);
  if (!session?.user) notFound();

  const task = await prisma.rectificationTask.findUnique({
    where: { id },
    include: {
      assignee: true,
      createdBy: { select: { name: true } },
      finding: {
        include: {
          citations: {
            include: {
              clause: { include: { document: true } },
            },
          },
          inspection: {
            include: {
              building: true,
              inspector: { select: { name: true } },
            },
          },
        },
      },
      evidence: {
        include: {
          submittedBy: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
      },
      reviews: {
        include: {
          actor: { select: { name: true, role: true } },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!task) notFound();

  const isAssignee = task.assigneeId === session.user.id;
  const canSubmit =
    (isAssignee || session.user.role === Role.ADMIN) &&
    task.status !== "PENDING_REVIEW" &&
    task.status !== "CLOSED";
  const canReview =
    (session.user.role === Role.REVIEWER || session.user.role === Role.ADMIN) &&
    task.status === "PENDING_REVIEW";

  return (
    <div className="space-y-7">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link href="/tasks">
            <ArrowLeft className="size-4" aria-hidden="true" />
            返回整改任务
          </Link>
        </Button>
      </div>

      {query.error ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {decodeURIComponent(query.error)}
        </p>
      ) : null}
      {query.submitted || query.reviewed ? (
        <p className="flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          <CheckCircle2 className="size-4" aria-hidden="true" />
          {query.reviewed ? "复核结果已保存" : "整改证据已提交"}
        </p>
      ) : null}

      <header className="rounded-lg border border-border bg-white p-6">
        <div className="flex flex-wrap items-center gap-3">
          <StatusBadge status={task.status} />
          <RiskBadge severity={task.priority} />
          <span className="font-mono text-xs text-muted-foreground">{task.id}</span>
        </div>
        <h1 className="mt-4 text-3xl font-bold">{task.title}</h1>
        <p className="mt-4 max-w-4xl text-sm leading-7">{task.description}</p>
        <div className="mt-5 grid gap-4 border-t border-border pt-5 sm:grid-cols-3">
          <div>
            <p className="text-xs text-muted-foreground">关联建筑</p>
            <p className="mt-1 font-semibold">
              {task.finding.inspection.building.name}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">责任人</p>
            <p className="mt-1 font-semibold">{task.assignee.name}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">完成期限</p>
            <p className="mt-1 font-semibold">{formatDate(task.dueAt)}</p>
          </div>
        </div>
      </header>

      <section className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-5">
          <Card>
            <CardHeader className="flex flex-row items-center gap-3">
              <ListChecks className="size-5 text-primary" aria-hidden="true" />
              <h2 className="text-lg font-bold">验收标准</h2>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-7">{task.acceptanceCriteria}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-lg font-bold">整改证据</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                每项证据记录提交人、时间和来源。
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {task.evidence.length === 0 ? (
                <p className="rounded-md border border-dashed border-border p-5 text-sm text-muted-foreground">
                  暂未提交整改证据
                </p>
              ) : (
                task.evidence.map((evidence) => (
                  <div
                    key={evidence.id}
                    className="rounded-md border border-border p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="text-sm font-semibold">
                        {evidence.submittedBy.name}
                      </p>
                      <span className="text-xs text-muted-foreground">
                        {formatDateTime(evidence.createdAt)}
                      </span>
                    </div>
                    <p className="mt-3 text-sm leading-6">{evidence.description}</p>
                    <p className="mt-3 text-xs text-muted-foreground">
                      类型：{evidence.kind} · 来源：{evidence.sourceType}
                    </p>
                  </div>
                ))
              )}

              {canSubmit ? (
                <form
                  action={submitEvidenceAction}
                  className="space-y-4 border-t border-border pt-5"
                >
                  <input type="hidden" name="taskId" value={task.id} />
                  <Textarea
                    name="description"
                    required
                    minLength={5}
                    placeholder="说明处理措施、完成时间、证据位置和风险是否已消除。"
                  />
                  <Button type="submit">
                    <FileText className="size-4" aria-hidden="true" />
                    提交整改证据
                  </Button>
                </form>
              ) : null}
            </CardContent>
          </Card>

          {canReview ? (
            <Card className="border-amber-200 bg-amber-50/50">
              <CardHeader>
                <h2 className="text-lg font-bold text-amber-950">人工复核</h2>
                <p className="mt-1 text-sm text-amber-900/75">
                  通过后任务关闭；驳回后责任人需要重新提交。
                </p>
              </CardHeader>
              <CardContent>
                <form action={reviewTaskAction} className="space-y-4">
                  <input type="hidden" name="taskId" value={task.id} />
                  <Textarea name="comment" required placeholder="填写复核结论和理由" />
                  <div className="flex flex-wrap gap-3">
                    <Button type="submit" name="decision" value="APPROVE">
                      <CheckCircle2 className="size-4" aria-hidden="true" />
                      通过并关闭
                    </Button>
                    <Button
                      type="submit"
                      name="decision"
                      value="REJECT"
                      variant="danger"
                    >
                      <CircleX className="size-4" aria-hidden="true" />
                      驳回并要求补充
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          ) : null}
        </div>

        <div className="space-y-5">
          <Card>
            <CardHeader>
              <h2 className="text-lg font-bold">风险依据</h2>
            </CardHeader>
            <CardContent className="space-y-3">
              {task.finding.citations.map((citation) => (
                <div key={citation.id} className="rounded-md border border-border p-4">
                  <p className="text-sm font-semibold">
                    {citation.clause.document.code} · {citation.clause.heading}
                  </p>
                  <p className="mt-2 text-xs leading-5 text-muted-foreground">
                    {citation.clause.text}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="flex items-center gap-2 text-lg font-bold">
                <Clock3 className="size-5 text-primary" aria-hidden="true" />
                处理记录
              </h2>
            </CardHeader>
            <CardContent className="space-y-4">
              {task.reviews.length === 0 ? (
                <p className="text-sm text-muted-foreground">暂无复核记录</p>
              ) : (
                task.reviews.map((review) => (
                  <div key={review.id} className="border-l-2 border-primary/35 pl-4">
                    <p className="text-sm font-semibold">
                      {review.actor.name} · {review.action}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      {review.comment}
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {formatDateTime(review.createdAt)}
                    </p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
