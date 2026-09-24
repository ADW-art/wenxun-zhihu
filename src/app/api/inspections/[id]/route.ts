import { NextResponse } from "next/server";
import { apiError } from "@/lib/api";
import { requireSession } from "@/lib/auth/guard";
import { getInspectionDetail } from "@/lib/services/inspection-service";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireSession();
    const { id } = await params;
    const inspection = await getInspectionDetail(id);
    return NextResponse.json({ data: inspection });
  } catch (error) {
    return apiError(error);
  }
}
