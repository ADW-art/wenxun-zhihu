import Link from "next/link";
import Image from "next/image";
import { LogOut } from "lucide-react";
import type { Role } from "@prisma/client";
import { signOut } from "@/auth";
import { Button } from "@/components/ui/button";
import { WorkspaceNav } from "@/components/workspace-nav";

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
    <div className="min-h-screen bg-surface-page lg:grid lg:grid-cols-[192px_1fr]">
      <aside className="relative overflow-hidden bg-surface-navigation lg:sticky lg:top-0 lg:h-screen">
        <div className="relative z-10 px-4 py-5">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 rounded-[var(--radius-control)] px-2 py-2 focus-visible:ring-2 focus-visible:ring-surface-panel"
          >
            <span className="grid size-11 place-items-center rounded-[4px] border-2 border-surface-panel font-serif text-xl font-semibold text-surface-panel">
              文
            </span>
            <span>
              <span className="block font-serif text-lg font-semibold tracking-normal text-surface-panel">
                文巡智护
              </span>
              <span className="mt-0.5 block text-[11px] leading-4 text-surface-subtle">
                文物建筑智能巡查
              </span>
            </span>
          </Link>

          <WorkspaceNav />
        </div>

        <Image
          src="/assets/sidebar-landscape-motif-v2.png"
          alt=""
          width={640}
          height={1280}
          aria-hidden="true"
          className="pointer-events-none absolute bottom-14 left-0 w-full opacity-45 mix-blend-screen"
        />

        <div className="relative z-10 mt-5 border-t border-white/10 px-4 pt-4 pb-5 lg:absolute lg:right-0 lg:bottom-0 lg:left-0">
          <div className="px-2">
            <p className="truncate text-sm font-semibold text-text-inverse">
              {user.name ?? "未命名用户"}
            </p>
            <p className="mt-1 truncate text-xs text-surface-subtle">
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
                className="mt-3 w-full justify-start px-0 text-surface-subtle hover:bg-surface-panel/5 hover:text-text-inverse"
              >
                <LogOut className="size-4" aria-hidden="true" />
                退出登录
              </Button>
            </form>
          </div>
        </div>
      </aside>

      <main className="min-w-0 bg-surface-page px-4 py-6 sm:px-6 lg:px-6 lg:py-0">
        <div className="mx-auto min-h-screen w-full max-w-[1440px] py-6">
          {children}
        </div>
      </main>
    </div>
  );
}
