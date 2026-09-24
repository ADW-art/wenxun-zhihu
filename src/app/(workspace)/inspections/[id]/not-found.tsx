import Link from "next/link";
import { FileQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function InspectionNotFound() {
  return (
    <div className="grid min-h-[60vh] place-items-center">
      <div className="max-w-md text-center">
        <FileQuestion
          className="mx-auto size-12 text-muted-foreground"
          aria-hidden="true"
        />
        <h1 className="mt-5 text-2xl font-bold">巡查记录不存在</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          这条巡查可能已被删除，或者数据库已经重新初始化。
        </p>
        <Button asChild className="mt-6">
          <Link href="/inspections">返回巡查列表</Link>
        </Button>
      </div>
    </div>
  );
}
