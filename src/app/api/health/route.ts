import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({
      status: "ok",
      database: "ok",
      agent: {
        configuredProvider: env.AGENT_PROVIDER,
        model: env.AGENT_MODEL,
        keyConfigured: Boolean(env.DEEPSEEK_API_KEY || env.AGENT_API_KEY),
        effectiveProvider:
          env.AGENT_PROVIDER === "deepseek" &&
          !(env.DEEPSEEK_API_KEY || env.AGENT_API_KEY)
            ? "mock"
            : env.AGENT_PROVIDER,
      },
      timestamp: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json(
      {
        status: "degraded",
        database: "unavailable",
        timestamp: new Date().toISOString(),
      },
      { status: 503 },
    );
  }
}
