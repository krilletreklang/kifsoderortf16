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

const addDrillToPlanSchema = z.object({
  planId: z.string().uuid(),
  drillId: z.string().uuid(),
  minutesOverride: z.coerce.number().int().min(0).max(180).nullable(),
});

const deleteSectionSchema = z.object({
  sectionId: z.string().uuid(),
});

function nullableString(value: FormDataEntryValue | null): string | null {
  if (!value) return null;
  const normalized = String(value).trim();
  return normalized ? normalized : null;
}

function nullableNumber(value: FormDataEntryValue | null): number | null {
  if (!value) return null;
  const normalized = String(value).trim();
  if (!normalized) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
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

export async function addDrillToTrainingPlanAction(formData: FormData) {
  const user = await requireUser();
  const membership = await getPrimaryTeamMembership(user.id);
  if (!membership) return;

  const parsed = addDrillToPlanSchema.safeParse({
    planId: String(formData.get("planId") ?? ""),
    drillId: String(formData.get("drillId") ?? ""),
    minutesOverride: nullableNumber(formData.get("minutesOverride")),
  });

  if (!parsed.success) return;

  const supabase = await createClient();

  const [{ data: plan }, { data: drill }, { data: lastSection }] = await Promise.all([
    supabase
      .from("training_plans")
      .select("id")
      .eq("id", parsed.data.planId)
      .eq("team_id", membership.team_id)
      .maybeSingle(),
    supabase
      .from("drills")
      .select("id, title, category, duration, description, coaching_points, equipment")
      .eq("id", parsed.data.drillId)
      .eq("team_id", membership.team_id)
      .maybeSingle(),
    supabase
      .from("training_plan_sections")
      .select("order_index")
      .eq("training_plan_id", parsed.data.planId)
      .order("order_index", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  if (!plan || !drill) return;

  const nextOrderIndex = (lastSection?.order_index ?? -1) + 1;

  await supabase.from("training_plan_sections").insert({
    training_plan_id: parsed.data.planId,
    title: drill.title,
    minutes: parsed.data.minutesOverride ?? drill.duration ?? 0,
    description: drill.description ?? `${drill.category}`,
    coaching_points: drill.coaching_points ?? null,
    players_count: null,
    equipment: drill.equipment ?? null,
    order_index: nextOrderIndex,
  });

  revalidatePath("/training-plans");
}

export async function deleteTrainingPlanSectionAction(formData: FormData) {
  const user = await requireUser();
  const membership = await getPrimaryTeamMembership(user.id);
  if (!membership) return;

  const parsed = deleteSectionSchema.safeParse({
    sectionId: String(formData.get("sectionId") ?? ""),
  });

  if (!parsed.success) return;

  const supabase = await createClient();

  const { data: section } = await supabase
    .from("training_plan_sections")
    .select("id, training_plan_id")
    .eq("id", parsed.data.sectionId)
    .maybeSingle();

  if (!section) return;

  const { data: plan } = await supabase
    .from("training_plans")
    .select("id")
    .eq("id", section.training_plan_id)
    .eq("team_id", membership.team_id)
    .maybeSingle();

  if (!plan) return;

  await supabase.from("training_plan_sections").delete().eq("id", parsed.data.sectionId);

  revalidatePath("/training-plans");
}
