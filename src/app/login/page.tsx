import { redirect } from "next/navigation";
import Image from "next/image";
import { auth } from "@/auth";
import { LoginForm } from "./login-form";

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  return (
    <main className="grid min-h-screen bg-surface-page lg:grid-cols-[1.05fr_0.95fr]">
      <section className="relative hidden overflow-hidden bg-surface-navigation p-12 lg:flex lg:flex-col lg:justify-between">
        <Image
          src="/assets/sidebar-landscape-motif-v2.png"
          alt=""
          fill
          priority
          aria-hidden="true"
          className="pointer-events-none object-cover object-bottom opacity-45 mix-blend-screen"
        />
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <span className="grid size-12 place-items-center rounded-[4px] border-2 border-surface-panel font-serif text-xl font-semibold text-surface-panel">
              文
            </span>
            <div>
              <p className="font-serif text-xl font-semibold text-text-inverse">
                文巡智护
              </p>
              <p className="text-sm text-surface-subtle">
                文物建筑智能巡查与保护整改智能体
              </p>
            </div>
          </div>

          <div className="mt-24 max-w-xl">
            <p className="font-mono text-xs font-semibold text-surface-subtle">
              INSPECTION · EVIDENCE · CLOSURE
            </p>
            <h1 className="mt-5 font-serif text-5xl leading-tight font-semibold tracking-normal text-text-inverse">
              让每一次巡查
              <br />
              都有依据、有责任、有闭环
            </h1>
            <p className="mt-6 max-w-lg text-base leading-8 text-surface-subtle">
              智能体负责制定检查计划、检索规范、归纳风险和初审整改证据。
              最终确认、审批和归档仍由专业人员完成。
            </p>
          </div>
        </div>

        <div className="relative z-10 grid grid-cols-3 gap-3">
          {[
            ["6", "白名单工具"],
            ["4", "协作角色"],
            ["100%", "引用校验"],
          ].map(([value, label]) => (
            <div
              key={label}
              className="rounded-[var(--radius-card)] border border-surface-panel/15 bg-surface-panel/5 p-4"
            >
              <p className="font-mono text-2xl font-bold text-text-inverse">{value}</p>
              <p className="mt-1 text-xs text-surface-subtle">{label}</p>
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
