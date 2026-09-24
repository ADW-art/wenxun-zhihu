import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/guard";
import { apiError } from "@/lib/api";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireSession();
    const buildings = await prisma.building.findMany({
      where: { status: "ACTIVE" },
      orderBy: { code: "asc" },
    });
    return NextResponse.json({ data: buildings });
  } catch (error) {
    return apiError(error);
  }
}
