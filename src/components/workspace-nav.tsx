"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Route } from "next";
import {
  BookOpenText,
  Building2,
  ClipboardList,
  FileBarChart,
  LayoutDashboard,
  Map,
  Route as RouteIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { href: "/risk-map", label: "风险地图", icon: Map },
  { href: "/dashboard", label: "巡查总览", icon: LayoutDashboard },
  { href: "/inspections", label: "巡查任务", icon: ClipboardList },
  { href: "/buildings", label: "文物档案", icon: Building2 },
  { href: "/tasks", label: "整改任务", icon: RouteIcon },
  { href: "/standards", label: "规范知识库", icon: BookOpenText },
  { href: "/reports", label: "报告归档", icon: FileBarChart },
] as const;

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function WorkspaceNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="主要导航"
      className="flex gap-1 overflow-x-auto pb-1 lg:mt-7 lg:grid lg:gap-0 lg:overflow-visible lg:pb-0"
    >
      {navigation.map((item) => {
        const Icon = item.icon;
        const active = isActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href as Route}
            aria-current={active ? "page" : undefined}
            className={cn(
              "relative flex min-h-11 shrink-0 items-center gap-3 px-3 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-surface-panel lg:min-h-14",
              active
                ? "bg-action-primary text-text-inverse"
                : "text-surface-subtle hover:bg-surface-panel/5 hover:text-text-inverse",
            )}
          >
            {active ? (
              <span
                aria-hidden="true"
                className="absolute top-0 bottom-0 left-0 w-[3px] bg-status-warning"
              />
            ) : null}
            <Icon className="size-[18px]" aria-hidden="true" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
