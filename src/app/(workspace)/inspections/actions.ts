"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { RiskSeverity, Role } from "@prisma/client";
import { z } from "zod";
import { requireRole } from "@/lib/auth/guard";
import {
  confirmFinding,
  createInspection,
  createRectificationTask,
  submitInspection,
} from "@/lib/services/inspection-service";

function text(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

export async function createInspectionAction(formData: FormData) {
  const session = await requireRole([Role.INSPECTOR, Role.REVIEWER, Role.ADMIN]);

  let inspectionId: string;
  try {
    const inspection = await createInspection({
      actorId: session.user.id,
      buildingId: text(formData, "buildingId"),
      season: text(formData, "season"),
      weather: text(formData, "weather"),
      summary: text(formData, "summary"),
    });
    inspectionId = inspection.id;
  } catch (error) {
    const message =
      error instanceof Error ? encodeURIComponent(error.message) : "创建失败";
    redirect(`/inspections/new?error=${message}`);
  }

  redirect(`/inspections/${inspectionId}`);
}

export async function submitInspectionAction(formData: FormData) {
  const session = await requireRole([Role.INSPECTOR, Role.REVIEWER, Role.ADMIN]);
  const inspectionId = text(formData, "inspectionId");

  try {
    await submitInspection({
      inspectionId,
      actorId: session.user.id,
    });
  } catch (error) {
    const message =
      error instanceof Error ? encodeURIComponent(error.message) : "分析失败";
    redirect(`/inspections/${inspectionId}?error=${message}`);
  }

  revalidatePath(`/inspections/${inspectionId}`);
  redirect(`/inspections/${inspectionId}?analyzed=1`);
}

export async function confirmFindingAction(formData: FormData) {
  const session = await requireRole([Role.REVIEWER, Role.ADMIN]);
  const findingId = text(formData, "findingId");
  const inspectionId = text(formData, "inspectionId");

  try {
    await confirmFinding({
      findingId,
      actorId: session.user.id,
      actorRole: session.user.role,
      comment: text(formData, "comment") || "人工确认风险成立",
    });
  } catch (error) {
    const message =
      error instanceof Error ? encodeURIComponent(error.message) : "确认失败";
    redirect(`/inspections/${inspectionId}?error=${message}`);
  }

  revalidatePath(`/inspections/${inspectionId}`);
  redirect(`/inspections/${inspectionId}?confirmed=1`);
}

export async function createTaskAction(formData: FormData) {
  const session = await requireRole([Role.REVIEWER, Role.ADMIN]);
  const inspectionId = text(formData, "inspectionId");
  const dueValue = text(formData, "dueAt");
  const priority = z.nativeEnum(RiskSeverity).parse(text(formData, "priority"));

  try {
    await createRectificationTask({
      findingId: text(formData, "findingId"),
      actorId: session.user.id,
      actorRole: session.user.role,
      assigneeId: text(formData, "assigneeId"),
      dueAt: new Date(`${dueValue}T12:00:00.000Z`),
      title: text(formData, "title"),
      description: text(formData, "description"),
      acceptanceCriteria: text(formData, "acceptanceCriteria"),
      priority,
    });
  } catch (error) {
    const message =
      error instanceof Error ? encodeURIComponent(error.message) : "创建任务失败";
    redirect(`/inspections/${inspectionId}?error=${message}`);
  }

  revalidatePath(`/inspections/${inspectionId}`);
  redirect(`/inspections/${inspectionId}?taskCreated=1`);
}
