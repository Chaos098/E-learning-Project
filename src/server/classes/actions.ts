"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { type ActionState, formToObject, toActionState } from "@/server/action-state";
import { requireActor } from "@/server/auth/session";
import { changeTeacher, openClass, updateClass } from "@/server/classes/service";

function classInput(values: Record<string, string>) {
  return {
    teacherId: values.teacherId ?? "",
    name: values.name ?? "",
    tuitionFee: values.tuitionFee ?? "",
    depositAmount: values.depositAmount ?? "",
    minStudents: values.minStudents ?? "",
    maxStudents: values.maxStudents ?? "",
    startDate: values.startDate ?? "",
    endDate: values.endDate ?? "",
  };
}

export async function openClassAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  const actor = await requireActor("ADMIN");
  const values = formToObject(formData);
  let classId: number;
  try {
    const created = await openClass(actor, { ...classInput(values), courseId: values.courseId ?? "" });
    classId = created.id;
  } catch (error) {
    return toActionState(error, values);
  }
  revalidatePath("/admin/classes");
  redirect(`/admin/classes/${classId}`);
}

export async function updateClassAction(
  classId: number,
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await requireActor("ADMIN");
  const values = formToObject(formData);
  try {
    await updateClass(actor, classId, classInput(values));
  } catch (error) {
    return toActionState(error, values);
  }
  revalidatePath(`/admin/classes/${classId}`);
  revalidatePath("/admin/classes");
  return { ok: true, message: "Đã lưu thông tin lớp.", values };
}

export async function changeTeacherAction(
  classId: number,
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await requireActor("ADMIN");
  try {
    await changeTeacher(actor, { classId, teacherId: String(formData.get("teacherId") ?? "") });
  } catch (error) {
    return toActionState(error);
  }
  revalidatePath(`/admin/classes/${classId}`);
  return { ok: true, message: "Đã đổi giảng viên." };
}
