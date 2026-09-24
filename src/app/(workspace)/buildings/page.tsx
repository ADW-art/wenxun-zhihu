import Link from "next/link";
import { ArrowRight, Building2, MapPin } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function BuildingsPage() {
  const buildings = await prisma.building.findMany({
    orderBy: { code: "asc" },
    include: {
      _count: {
        select: {
          inspections: true,
          riskHistory: true,
        },
      },
    },
  });

  return (
    <div className="space-y-7">
      <header>
        <p className="font-mono text-xs font-semibold text-primary">
          HERITAGE REGISTER
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-normal">文物建筑档案</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          演示档案已脱敏，不保存精确坐标和安防信息。
        </p>
      </header>

      <section className="grid gap-5 lg:grid-cols-2 2xl:grid-cols-3">
        {buildings.map((building) => (
          <Card key={building.id} className="overflow-hidden">
            <div className="relative h-28 overflow-hidden border-b border-border bg-[#e7efec]">
              <div className="absolute inset-0 bg-[linear-gradient(90deg,rgb(31_111_98/12%)_1px,transparent_1px),linear-gradient(rgb(31_111_98/12%)_1px,transparent_1px)] bg-[size:24px_24px]" />
              <Building2
                className="absolute right-5 bottom-5 size-14 text-primary/35"
                aria-hidden="true"
              />
            </div>
            <CardContent>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-mono text-xs font-semibold text-primary">
                    {building.code}
                  </p>
                  <h2 className="mt-2 text-xl font-bold">{building.name}</h2>
                </div>
                <span className="rounded-full border border-border bg-muted px-2.5 py-1 text-xs">
                  {building.era}
                </span>
              </div>
              <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="size-4" aria-hidden="true" />
                {building.addressLabel}
              </p>
              <p className="mt-4 line-clamp-3 text-sm leading-6 text-muted-foreground">
                {building.summary}
              </p>
              <div className="mt-5 grid grid-cols-2 gap-3 border-y border-border py-4">
                <div>
                  <p className="font-mono text-2xl font-bold">
                    {building._count.inspections}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">巡查记录</p>
                </div>
                <div>
                  <p className="font-mono text-2xl font-bold">
                    {building._count.riskHistory}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">历史风险</p>
                </div>
              </div>
              <Button asChild variant="secondary" className="mt-5 w-full">
                <Link href={`/buildings/${building.id}`}>
                  查看档案
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </section>
    </div>
  );
}
