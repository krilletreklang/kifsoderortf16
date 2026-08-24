"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth/session";
import { getPrimaryTeamMembership } from "@/lib/db/queries/teams";
import { createClient } from "@/lib/supabase/server";

const createPlanSchema = z.object({
  title: z.string().min(2),
  date: z.string().nullable(),
  totalMinutes: z.coerce.number().int().min(0).max(180),
  objective: z.string().nullable(),
});

const deletePlanSchema = z.object({
  planId: z.string().uuid(),
});

function nullableString(value: FormDataEntryValue | null): string | null {
  if (!value) return null;
  const normalized = String(value).trim();
  return normalized ? normalized : null;
}

export async function createTrainingPlanAction(formData: FormData) {
  const user = await requireUser();
  const membership = await getPrimaryTeamMembership(user.id);
  if (!membership) return;

  const parsed = createPlanSchema.safeParse({
    title: String(formData.get("title") ?? "").trim(),
    date: nullableString(formData.get("date")),
    totalMinutes: String(formData.get("totalMinutes") ?? "0"),
    objective: nullableString(formData.get("objective")),
  });

  if (!parsed.success) return;

  const supabase = await createClient();
  await supabase.from("training_plans").insert({
    team_id: membership.team_id,
    title: parsed.data.title,
    date: parsed.data.date,
    total_minutes: parsed.data.totalMinutes,
    objective: parsed.data.objective,
  });

  revalidatePath("/training-plans");
}

export async function deleteTrainingPlanAction(formData: FormData) {
  const user = await requireUser();
  const membership = await getPrimaryTeamMembership(user.id);
  if (!membership) return;

  const parsed = deletePlanSchema.safeParse({
    planId: String(formData.get("planId") ?? ""),
  });

  if (!parsed.success) return;

  const supabase = await createClient();
  await supabase
    .from("training_plans")
    .delete()
    .eq("id", parsed.data.planId)
    .eq("team_id", membership.team_id);

  revalidatePath("/training-plans");
}
