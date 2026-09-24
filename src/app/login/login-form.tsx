"use client";

import { useState, type FormEvent } from "react";
import { signIn } from "next-auth/react";
import { AlertCircle, LoaderCircle, LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function LoginForm() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");

    const formData = new FormData(event.currentTarget);
    const result = await signIn("credentials", {
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
      redirect: false,
      callbackUrl: "/dashboard",
    });

    if (result?.error) {
      setError("邮箱或密码不正确");
      setPending(false);
      return;
    }

    window.location.href = result?.url ?? "/dashboard";
  }

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-lg border border-border bg-white p-6 shadow-[0_18px_60px_rgb(31_42_38/10%)]"
    >
      <div className="mb-6 flex items-center gap-3">
        <span className="grid size-11 place-items-center rounded-md bg-primary text-white">
          <LockKeyhole className="size-5" aria-hidden="true" />
        </span>
        <div>
          <h1 className="text-xl font-bold">登录文巡智护</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            使用演示账号进入对应角色工作台
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <label className="block">
          <span className="mb-2 block text-sm font-semibold">邮箱</span>
          <Input
            name="email"
            type="email"
            autoComplete="username"
            required
            defaultValue="inspector@example.com"
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-semibold">密码</span>
          <Input
            name="password"
            type="password"
            autoComplete="current-password"
            required
            defaultValue="DemoPass123!"
          />
        </label>
      </div>

      {error ? (
        <p
          role="alert"
          className="mt-4 flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
        >
          <AlertCircle className="size-4" aria-hidden="true" />
          {error}
        </p>
      ) : null}

      <Button type="submit" className="mt-6 w-full" disabled={pending}>
        {pending ? (
          <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
        ) : null}
        {pending ? "正在登录" : "进入系统"}
      </Button>

      <div className="mt-5 rounded-md border border-border bg-muted/55 p-3 text-xs leading-5 text-muted-foreground">
        演示密码统一为 <code className="font-mono">DemoPass123!</code>
        。巡查、整改、复核和管理员邮箱见 README。
      </div>
    </form>
  );
}
