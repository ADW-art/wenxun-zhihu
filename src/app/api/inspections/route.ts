import { NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { apiError } from "@/lib/api";
import { requireRole } from "@/lib/auth/guard";
import { prisma } from "@/lib/prisma";
import {
  createInspection,
  createInspectionSchema,
} from "@/lib/services/inspection-service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireRole([Role.INSPECTOR, Role.RECTIFIER, Role.REVIEWER, Role.ADMIN]);
    const inspections = await prisma.inspection.findMany({
      orderBy: { updatedAt: "desc" },
      include: {
        building: { select: { id: true, code: true, name: true } },
        inspector: { select: { id: true, name: true } },
        _count: { select: { findings: true, evidence: true } },
      },
    });
    return NextResponse.json({ data: inspections });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireRole([Role.INSPECTOR, Role.REVIEWER, Role.ADMIN]);
    const body = createInspectionSchema.parse(await request.json());
    const inspection = await createInspection({
      actorId: session.user.id,
      ...body,
    });
    return NextResponse.json({ data: inspection }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
