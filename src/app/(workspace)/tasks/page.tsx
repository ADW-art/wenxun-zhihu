import Link from "next/link";
import { ArrowRight, CalendarClock, Route } from "lucide-react";
import { Role } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { RiskBadge } from "@/components/ui/risk-badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDate } from "@/lib/utils";

export default async function TasksPage() {
  const session = await auth();
  if (!session?.user) return null;

  const where =
    session.user.role === Role.RECTIFIER ? { assigneeId: session.user.id } : {};

  const tasks = await prisma.rectificationTask.findMany({
    where,
    orderBy: [{ status: "asc" }, { dueAt: "asc" }],
    include: {
      assignee: { select: { name: true } },
      finding: {
        include: {
          inspection: {
            include: {
              building: { select: { code: true, name: true } },
            },
          },
        },
      },
      _count: { select: { evidence: true } },
    },
  });

  return (
    <div className="space-y-7">
      <header>
        <p className="font-mono text-xs font-semibold text-primary">
          RECTIFICATION QUEUE
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-normal">整改任务</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          跟踪责任、期限、证据和复核结论。
        </p>
      </header>

      <div className="overflow-hidden rounded-lg border border-border bg-white">
        {tasks.length === 0 ? (
          <div className="grid min-h-72 place-items-center p-8 text-center">
            <div>
              <Route
                className="mx-auto size-10 text-muted-foreground"
                aria-hidden="true"
              />
              <p className="mt-4 font-semibold">暂无整改任务</p>
              <p className="mt-2 text-sm text-muted-foreground">
                复核人员确认风险并创建任务后，会显示在这里。
              </p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {tasks.map((task) => (
              <Link
                key={task.id}
                href={`/tasks/${task.id}`}
                className="grid gap-4 p-5 transition-colors hover:bg-muted/35 lg:grid-cols-[1fr_auto] lg:items-center"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="font-mono text-xs font-semibold text-primary">
                      {task.finding.inspection.building.code}
                    </span>
                    <StatusBadge status={task.status} />
                    <RiskBadge severity={task.priority} />
                  </div>
                  <h2 className="mt-2 text-lg font-bold">{task.title}</h2>
                  <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">
                    {task.description}
                  </p>
                </div>
                <div className="flex items-center gap-7">
                  <div>
                    <p className="text-xs text-muted-foreground">责任人</p>
                    <p className="mt-1 text-sm font-semibold">{task.assignee.name}</p>
                  </div>
                  <div>
                    <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <CalendarClock className="size-3.5" aria-hidden="true" />
                      完成期限
                    </p>
                    <p className="mt-1 text-sm font-semibold">
                      {formatDate(task.dueAt)}
                    </p>
                  </div>
                  <ArrowRight
                    className="size-4 text-muted-foreground"
                    aria-hidden="true"
                  />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
