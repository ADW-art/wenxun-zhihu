import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { auth } from "@/auth";
import { LoginForm } from "./login-form";

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  return (
    <main className="grid min-h-screen lg:grid-cols-[1.1fr_0.9fr]">
      <section className="relative hidden overflow-hidden border-r border-border bg-[#e8efec] p-12 lg:flex lg:flex-col lg:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <span className="grid size-12 place-items-center rounded-md bg-primary text-white">
              <ShieldCheck className="size-6" aria-hidden="true" />
            </span>
            <div>
              <p className="text-xl font-bold">文巡智护</p>
              <p className="text-sm text-muted-foreground">
                文物建筑智能巡查与保护整改
              </p>
            </div>
          </div>

          <div className="mt-24 max-w-xl">
            <p className="font-mono text-xs font-semibold text-primary">
              INSPECTION · EVIDENCE · CLOSURE
            </p>
            <h1 className="mt-5 text-5xl leading-tight font-bold tracking-normal">
              让每一次巡查
              <br />
              都有依据、有责任、有闭环
            </h1>
            <p className="mt-6 max-w-lg text-base leading-8 text-muted-foreground">
              智能体负责制定检查计划、检索规范、归纳风险和初审整改证据。
              最终确认、审批和归档仍由专业人员完成。
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {[
            ["6", "白名单工具"],
            ["4", "协作角色"],
            ["100%", "引用校验"],
          ].map(([value, label]) => (
            <div
              key={label}
              className="rounded-lg border border-white/80 bg-white/70 p-4 backdrop-blur"
            >
              <p className="font-mono text-2xl font-bold text-primary">{value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid place-items-center px-5 py-12">
        <div className="w-full max-w-md">
          <LoginForm />
        </div>
      </section>
    </main>
  );
}
