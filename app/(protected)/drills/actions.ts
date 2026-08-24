"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth/session";
import { getPrimaryTeamMembership } from "@/lib/db/queries/teams";
import { createClient } from "@/lib/supabase/server";

const createDrillSchema = z.object({
  title: z.string().min(2),
  category: z.string().min(2),
  duration: z.coerce.number().int().min(1).max(120).nullable(),
  playersMin: z.coerce.number().int().min(1).max(30).nullable(),
  playersMax: z.coerce.number().int().min(1).max(30).nullable(),
  equipment: z.string().nullable(),
});

const deleteDrillSchema = z.object({
  drillId: z.string().uuid(),
});

function nullableNumber(value: FormDataEntryValue | null): number | null {
  if (!value) return null;
  const normalized = String(value).trim();
  if (!normalized) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function nullableString(value: FormDataEntryValue | null): string | null {
  if (!value) return null;
  const normalized = String(value).trim();
  return normalized ? normalized : null;
}

export async function createDrillAction(formData: FormData) {
  const user = await requireUser();
  const membership = await getPrimaryTeamMembership(user.id);
  if (!membership) return;

  const parsed = createDrillSchema.safeParse({
    title: String(formData.get("title") ?? "").trim(),
    category: String(formData.get("category") ?? "").trim(),
    duration: nullableNumber(formData.get("duration")),
    playersMin: nullableNumber(formData.get("playersMin")),
    playersMax: nullableNumber(formData.get("playersMax")),
    equipment: nullableString(formData.get("equipment")),
  });

  if (!parsed.success) return;

  const supabase = await createClient();
  await supabase.from("drills").insert({
    team_id: membership.team_id,
    title: parsed.data.title,
    category: parsed.data.category,
    duration: parsed.data.duration,
    players_min: parsed.data.playersMin,
    players_max: parsed.data.playersMax,
    equipment: parsed.data.equipment,
  });

  revalidatePath("/drills");
}

export async function deleteDrillAction(formData: FormData) {
  const user = await requireUser();
  const membership = await getPrimaryTeamMembership(user.id);
  if (!membership) return;

  const parsed = deleteDrillSchema.safeParse({
    drillId: String(formData.get("drillId") ?? ""),
  });

  if (!parsed.success) return;

  const supabase = await createClient();
  await supabase
    .from("drills")
    .delete()
    .eq("id", parsed.data.drillId)
    .eq("team_id", membership.team_id);

  revalidatePath("/drills");
}
