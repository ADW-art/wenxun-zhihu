import { NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { apiError } from "@/lib/api";
import { requireRole } from "@/lib/auth/guard";
import { submitInspection } from "@/lib/services/inspection-service";

export const dynamic = "force-dynamic";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireRole([Role.INSPECTOR, Role.REVIEWER, Role.ADMIN]);
    const { id } = await params;
    const result = await submitInspection({
      inspectionId: id,
      actorId: session.user.id,
    });
    return NextResponse.json({ data: result });
  } catch (error) {
    return apiError(error);
  }
}
