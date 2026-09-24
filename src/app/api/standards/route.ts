import { NextResponse } from "next/server";
import { apiError } from "@/lib/api";
import { requireSession } from "@/lib/auth/guard";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireSession();
    const documents = await prisma.standardDocument.findMany({
      orderBy: [{ sourceType: "asc" }, { code: "asc" }],
      include: { clauses: { orderBy: { clauseCode: "asc" } } },
    });
    return NextResponse.json({ data: documents });
  } catch (error) {
    return apiError(error);
  }
}
