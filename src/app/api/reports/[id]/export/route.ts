import { apiError } from "@/lib/api";
import { requireSession } from "@/lib/auth/guard";
import { buildInspectionMarkdown } from "@/lib/services/report-service";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireSession();
    const { id } = await params;
    const report = await buildInspectionMarkdown(id);

    return new Response(report.markdown, {
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(
          report.fileName,
        )}`,
      },
    });
  } catch (error) {
    return apiError(error);
  }
}
