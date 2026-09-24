"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { requireRole } from "@/lib/auth/guard";
import { getFileStorage } from "@/lib/storage";
import { reviewTask, submitTaskEvidence } from "@/lib/services/inspection-service";

function text(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

export async function submitEvidenceAction(formData: FormData) {
  const session = await requireRole([Role.RECTIFIER, Role.ADMIN]);
  const taskId = text(formData, "taskId");

  try {
    const uploadedFile = formData.get("file");
    const savedFile =
      uploadedFile instanceof File && uploadedFile.size > 0
        ? await getFileStorage().saveEvidence(uploadedFile)
        : null;
    await submitTaskEvidence({
      taskId,
      actorId: session.user.id,
      actorRole: session.user.role,
      description: text(formData, "description"),
      kind: savedFile
        ? savedFile.mimeType.startsWith("image/")
          ? "PHOTO"
          : "DOCUMENT"
        : "NOTE",
      file: savedFile
        ? {
            originalName: savedFile.originalName,
            mimeType: savedFile.mimeType,
            sizeBytes: savedFile.sizeBytes,
            storageKey: savedFile.storageKey,
            sourceType: savedFile.sourceType,
          }
        : undefined,
    });
  } catch (error) {
    const message =
      error instanceof Error ? encodeURIComponent(error.message) : "提交失败";
    redirect(`/tasks/${taskId}?error=${message}`);
  }

  revalidatePath(`/tasks/${taskId}`);
  redirect(`/tasks/${taskId}?submitted=1`);
}

export async function reviewTaskAction(formData: FormData) {
  const session = await requireRole([Role.REVIEWER, Role.ADMIN]);
  const taskId = text(formData, "taskId");
  const decision = text(formData, "decision") === "APPROVE" ? "APPROVE" : "REJECT";

  try {
    await reviewTask({
      taskId,
      actorId: session.user.id,
      actorRole: session.user.role,
      decision,
      comment:
        text(formData, "comment") ||
        (decision === "APPROVE" ? "整改证据通过复核" : "整改证据不足，请补充"),
    });
  } catch (error) {
    const message =
      error instanceof Error ? encodeURIComponent(error.message) : "复核失败";
    redirect(`/tasks/${taskId}?error=${message}`);
  }

  revalidatePath(`/tasks/${taskId}`);
  redirect(`/tasks/${taskId}?reviewed=1`);
}
