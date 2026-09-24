import { NextResponse } from "next/server";
import { apiError } from "@/lib/api";
import { getFileStorage } from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ key: string[] }> },
) {
  try {
    const { key } = await params;
    const storageKey = key.join("/");
    const file = await getFileStorage().read(storageKey);
    return new NextResponse(new Uint8Array(file.bytes), {
      headers: {
        "Content-Type": file.mimeType,
        "Content-Length": String(file.sizeBytes),
        "Cache-Control": "private, max-age=86400",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    return apiError(error);
  }
}
