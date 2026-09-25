import Link from "next/link";
import {
  BookOpenText,
  Building2,
  ClipboardCheck,
  FileBarChart,
  Gauge,
  LogOut,
  Route,
  ShieldCheck,
} from "lucide-react";
import type { Role } from "@prisma/client";
import { signOut } from "@/auth";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navigation = [
  { href: "/dashboard", label: "工作台", icon: Gauge },
  { href: "/buildings", label: "建筑档案", icon: Building2 },
  { href: "/inspections", label: "巡查管理", icon: ClipboardCheck },
  { href: "/tasks", label: "整改任务", icon: Route },
  { href: "/standards", label: "规范知识库", icon: BookOpenText },
  { href: "/reports", label: "报告中心", icon: FileBarChart },
] as const;

const roleLabels: Record<Role, string> = {
  INSPECTOR: "巡查人员",
  RECTIFIER: "整改责任人",
  REVIEWER: "复核人员",
  ADMIN: "系统管理员",
};

export function AppShell({
  user,
  children,
}: {
  user: { name?: string | null; email?: string | null; role: Role };
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[248px_1fr]">
      <aside className="border-b border-border-default bg-surface-panel/95 px-4 py-5 backdrop-blur lg:sticky lg:top-0 lg:h-screen lg:border-r lg:border-b-0">
        <Link
          href="/dashboard"
          className="flex items-center gap-3 rounded-md px-2 py-2 focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span className="grid size-10 place-items-center rounded-md bg-primary text-text-inverse">
            <ShieldCheck className="size-5" aria-hidden="true" />
          </span>
          <span>
            <span className="block text-base font-bold tracking-normal">文巡智护</span>
            <span className="block text-xs text-muted-foreground">
              不可移动文物巡查智能体
            </span>
          </span>
        </Link>

        <nav
          aria-label="主要导航"
          className="mt-6 flex gap-2 overflow-x-auto pb-1 lg:grid lg:overflow-visible"
        >
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex min-h-11 shrink-0 items-center gap-3 rounded-md px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring",
                )}
              >
                <Icon className="size-4" aria-hidden="true" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-6 border-t border-border pt-5 lg:absolute lg:right-4 lg:bottom-5 lg:left-4">
          <div className="rounded-md border border-border bg-surface-panel p-3">
            <p className="truncate text-sm font-semibold">
              {user.name ?? "未命名用户"}
            </p>
            <p className="mt-1 truncate text-xs text-muted-foreground">
              {roleLabels[user.role]}
            </p>
            <form
              className="mt-3"
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/login" });
              }}
            >
              <Button
                type="submit"
                variant="ghost"
                size="sm"
                className="w-full justify-start px-2 text-muted-foreground"
              >
                <LogOut className="size-4" aria-hidden="true" />
                退出登录
              </Button>
            </form>
          </div>
        </div>
      </aside>

      <main className="min-w-0 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <div className="mx-auto w-full max-w-[1440px]">{children}</div>
      </main>
    </div>
  );
}
