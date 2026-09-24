import Link from "next/link";
import { ArrowLeft, Bot, ShieldAlert } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createInspectionAction } from "../actions";

export default async function NewInspectionPage({
  searchParams,
}: {
  searchParams: Promise<{
    buildingId?: string;
    error?: string;
  }>;
}) {
  const query = await searchParams;
  const buildings = await prisma.building.findMany({
    where: { status: "ACTIVE" },
    orderBy: { code: "asc" },
  });

  return (
    <div className="space-y-7">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link href="/inspections">
            <ArrowLeft className="size-4" aria-hidden="true" />
            返回巡查列表
          </Link>
        </Button>
      </div>

      <header>
        <p className="font-mono text-xs font-semibold text-primary">NEW INSPECTION</p>
        <h1 className="mt-2 text-3xl font-bold tracking-normal">新建巡查</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          描述现场观察。系统随后生成检查计划、风险草案和规范引用。
        </p>
      </header>

      <section className="grid gap-5 xl:grid-cols-[1.25fr_0.75fr]">
        <Card>
          <CardContent>
            <form action={createInspectionAction} className="space-y-5">
              <label className="block">
                <span className="mb-2 block text-sm font-semibold">文物建筑</span>
                <Select
                  name="buildingId"
                  required
                  defaultValue={query.buildingId ?? buildings[0]?.id}
                >
                  {buildings.map((building) => (
                    <option key={building.id} value={building.id}>
                      {building.code} · {building.name}
                    </option>
                  ))}
                </Select>
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold">季节</span>
                  <Select name="season" defaultValue="秋季">
                    <option value="春季">春季</option>
                    <option value="夏季">夏季</option>
                    <option value="秋季">秋季</option>
                    <option value="冬季">冬季</option>
                  </Select>
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold">天气或环境</span>
                  <Input
                    name="weather"
                    required
                    defaultValue="暴雨后"
                    placeholder="例如：暴雨后、连续高温、大风"
                  />
                </label>
              </div>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold">现场观察</span>
                <Textarea
                  name="summary"
                  required
                  minLength={5}
                  maxLength={4000}
                  defaultValue="正殿东侧排水沟积水，墙脚出现新湿痕，周边有杂草根系侵入。"
                  placeholder="记录风险位置、范围、持续时间、已采取的措施和不确定信息。"
                  className="min-h-44"
                />
                <span className="mt-2 block text-xs leading-5 text-muted-foreground">
                  此区域不要填写精确坐标、安防部署或未公开的遗址信息。
                </span>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold">现场照片或文件</span>
                <Input
                  name="photo"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,application/pdf,text/plain"
                />
                <span className="mt-2 block text-xs leading-5 text-muted-foreground">
                  支持 JPG、PNG、WebP、PDF 和 TXT，最大 8 MB。图片会自动移除 EXIF。
                </span>
              </label>

              {query.error ? (
                <p
                  role="alert"
                  className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
                >
                  {decodeURIComponent(query.error)}
                </p>
              ) : null}

              <div className="flex flex-wrap gap-3">
                <Button type="submit">保存并进入巡查</Button>
                <Button asChild variant="secondary">
                  <Link href="/inspections">取消</Link>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-5">
          <Card>
            <CardContent>
              <Bot className="size-8 text-primary" aria-hidden="true" />
              <h2 className="mt-4 text-lg font-bold">智能体将处理</h2>
              <ul className="mt-4 space-y-3 text-sm leading-6 text-muted-foreground">
                <li>结合建筑历史生成巡查重点。</li>
                <li>识别水患、消防、电气、结构和人为活动线索。</li>
                <li>检索规范条款并绑定可追溯引用。</li>
                <li>生成整改任务草案，不自动通过审批。</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-amber-200 bg-amber-50/60">
            <CardContent>
              <ShieldAlert className="size-7 text-amber-700" aria-hidden="true" />
              <h2 className="mt-4 font-bold text-amber-900">人工边界</h2>
              <p className="mt-2 text-sm leading-6 text-amber-900/80">
                系统不会作出结构安全鉴定，也不会自动批准修复方案。所有风险、整改和归档均需专业人员确认。
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
