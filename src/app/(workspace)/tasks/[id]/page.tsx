import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CheckCircle2, CircleX, Clock3, FileText } from "lucide-react";
import { Role } from "@prisma/client";
import { auth } from "@/auth";
import { Button } from "@/components/ui/button";
import { EvidenceGallery } from "@/components/evidence-gallery";
import { PageHeader } from "@/components/page-header";
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
    <div className="space-y-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link href="/tasks">
            <ArrowLeft className="size-4" aria-hidden="true" />
            返回整改任务
          </Link>
        </Button>
      </div>

      {query.error ? (
        <p className="rounded-md border border-status-danger-border bg-status-danger-surface px-4 py-3 text-sm text-status-danger-foreground">
          {decodeURIComponent(query.error)}
        </p>
      ) : null}
      {query.submitted || query.reviewed ? (
        <p className="flex items-center gap-2 rounded-md border border-status-success-border bg-status-success-surface px-4 py-3 text-sm text-status-success-foreground">
          <CheckCircle2 className="size-4" aria-hidden="true" />
          {query.reviewed ? "复核结果已保存" : "整改证据已提交"}
        </p>
      ) : null}

      <PageHeader
        eyebrow={`任务 ${task.id}`}
        title={task.title}
        description={task.description}
        status={
          <div className="flex flex-wrap gap-2">
            <StatusBadge status={task.status} />
            <RiskBadge severity={task.priority} />
          </div>
        }
      />

      <section className="rounded-[var(--radius-card)] border border-border-default bg-surface-panel">
        <div className="grid gap-4 p-5 sm:grid-cols-3">
          <div>
            <p className="text-xs text-text-secondary">关联建筑</p>
            <p className="mt-1 font-semibold">
              {task.finding.inspection.building.name}
            </p>
          </div>
          <div>
            <p className="text-xs text-text-secondary">责任人</p>
            <p className="mt-1 font-semibold">{task.assignee.name}</p>
          </div>
          <div>
            <p className="text-xs text-text-secondary">完成期限</p>
            <p className="mt-1 font-semibold">{formatDate(task.dueAt)}</p>
          </div>
        </div>
        <div className="border-t border-border-default bg-surface-page px-5 py-4 text-sm leading-7">
          {task.acceptanceCriteria}
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-5">
          <Card>
            <CardHeader>
              <h2 className="text-lg font-bold">整改证据</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                每项证据记录提交人、时间和来源。
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <EvidenceGallery
                items={task.evidence.map((evidence) => ({
                  id: evidence.id,
                  src: evidence.storageKey
                    ? `/api/files/${evidence.storageKey}`
                    : undefined,
                  alt: evidence.description,
                  title: evidence.description,
                  meta: `${evidence.submittedBy.name} · ${formatDateTime(
                    evidence.createdAt,
                  )} · ${evidence.kind}`,
                  href: evidence.storageKey
                    ? `/api/files/${evidence.storageKey}`
                    : undefined,
                }))}
              />

              {canSubmit ? (
                <form
                  action={submitEvidenceAction}
                  className="space-y-4 border-t border-border pt-5"
                >
                  <input type="hidden" name="taskId" value={task.id} />
                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold">
                      整改照片或文件
                    </span>
                    <input
                      name="file"
                      type="file"
                      accept="image/jpeg,image/png,image/webp,application/pdf,text/plain"
                      className="block min-h-11 w-full cursor-pointer rounded-md border border-border bg-surface-panel px-3 py-2 text-sm file:mr-3 file:rounded file:border-0 file:bg-muted file:px-3 file:py-1.5 file:text-sm file:font-semibold"
                    />
                    <span className="mt-2 block text-xs text-muted-foreground">
                      最大 8 MB。图片会自动转为 WebP 并移除 EXIF。
                    </span>
                  </label>
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
            <Card className="border-status-warning-border bg-status-warning-surface/50">
              <CardHeader>
                <h2 className="text-lg font-bold text-status-warning-foreground">
                  人工复核
                </h2>
                <p className="mt-1 text-sm text-status-warning-foreground/75">
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
