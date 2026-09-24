import { NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { z } from "zod";
import { apiError } from "@/lib/api";
import { requireRole } from "@/lib/auth/guard";
import { submitTaskEvidence } from "@/lib/services/inspection-service";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  description: z.string().trim().min(5).max(4000),
  kind: z.enum(["NOTE", "PHOTO", "DOCUMENT"]).default("NOTE"),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireRole([Role.RECTIFIER, Role.ADMIN]);
    const { id } = await params;
    const body = bodySchema.parse(await request.json());
    const evidence = await submitTaskEvidence({
      taskId: id,
      actorId: session.user.id,
      actorRole: session.user.role,
      description: body.description,
      kind: body.kind,
    });
    return NextResponse.json({ data: evidence }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
