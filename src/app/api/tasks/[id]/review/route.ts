import { NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { z } from "zod";
import { apiError } from "@/lib/api";
import { requireRole } from "@/lib/auth/guard";
import { reviewTask } from "@/lib/services/inspection-service";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  decision: z.enum(["APPROVE", "REJECT"]),
  comment: z.string().trim().min(2).max(2000),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireRole([Role.REVIEWER, Role.ADMIN]);
    const { id } = await params;
    const body = bodySchema.parse(await request.json());
    await reviewTask({
      taskId: id,
      actorId: session.user.id,
      actorRole: session.user.role,
      decision: body.decision,
      comment: body.comment,
    });
    return NextResponse.json({ data: { taskId: id, ...body } });
  } catch (error) {
    return apiError(error);
  }
}
