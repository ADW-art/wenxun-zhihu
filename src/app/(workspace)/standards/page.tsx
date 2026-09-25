import { ExternalLink, ShieldAlert } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";

export default async function StandardsPage() {
  const documents = await prisma.standardDocument.findMany({
    orderBy: [{ sourceType: "asc" }, { code: "asc" }],
    include: {
      clauses: {
        orderBy: { clauseCode: "asc" },
      },
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Evidence library"
        title="规范知识库"
        description="正式标准与项目演示规则分开标记，智能体只能引用已登记内容。"
      />

      <div className="space-y-5">
        {documents.map((document) => (
          <Card key={document.id}>
            <CardContent>
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="font-mono text-sm font-bold text-primary">
                      {document.code}
                    </span>
                    <span
                      className={
                        document.sourceType === "PUBLIC_STANDARD"
                          ? "rounded-full border border-status-success-border bg-status-success-surface px-2.5 py-1 text-xs font-semibold text-status-success-foreground"
                          : "rounded-full border border-status-warning-border bg-status-warning-surface px-2.5 py-1 text-xs font-semibold text-status-warning-foreground"
                      }
                    >
                      {document.sourceType === "PUBLIC_STANDARD"
                        ? "公开标准"
                        : "项目演示规则"}
                    </span>
                  </div>
                  <h2 className="mt-3 text-xl font-bold">{document.title}</h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {document.publisher} · 版本 {document.version}
                  </p>
                </div>
                {document.sourceUrl ? (
                  <a
                    href={document.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
                  >
                    查看原始来源
                    <ExternalLink className="size-4" aria-hidden="true" />
                  </a>
                ) : (
                  <span className="inline-flex items-center gap-2 text-xs text-status-warning-foreground">
                    <ShieldAlert className="size-4" aria-hidden="true" />
                    不作为正式规范
                  </span>
                )}
              </div>

              <div className="mt-5 divide-y divide-border rounded-md border border-border">
                {document.clauses.map((clause) => (
                  <div key={clause.id} className="p-4">
                    <p className="text-sm font-semibold">
                      {clause.clauseCode} · {clause.heading}
                    </p>
                    <p className="mt-2 text-sm leading-7 text-muted-foreground">
                      {clause.text}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {clause.riskTags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-muted px-2.5 py-1 text-xs"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
