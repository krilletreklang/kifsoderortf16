"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUser } from "@/lib/auth/session";
import { getPrimaryTeamMembership } from "@/lib/db/queries/teams";
import { createClient } from "@/lib/supabase/server";

const createPlayerSchema = z.object({
  firstName: z.string().min(2, "firstName"),
  lastName: z.string().min(2, "lastName"),
  jerseyNumber: z.coerce.number().int().min(1).max(99).nullable(),
  birthYear: z.coerce.number().int().min(1990).max(2035).nullable(),
  notes: z.string().max(500).nullable(),
});

function nullableNumber(value: FormDataEntryValue | null): number | null {
  if (!value) return null;
  const normalized = String(value).trim();
  if (!normalized) return null;
  const asNumber = Number(normalized);
  return Number.isFinite(asNumber) ? asNumber : null;
}

function nullableString(value: FormDataEntryValue | null): string | null {
  if (!value) return null;
  const normalized = String(value).trim();
  return normalized ? normalized : null;
}

export async function createPlayerAction(formData: FormData) {
  const user = await requireUser();
  const membership = await getPrimaryTeamMembership(user.id);
  if (!membership) return;

  const parsed = createPlayerSchema.safeParse({
    firstName: String(formData.get("firstName") ?? "").trim(),
    lastName: String(formData.get("lastName") ?? "").trim(),
    jerseyNumber: nullableNumber(formData.get("jerseyNumber")),
    birthYear: nullableNumber(formData.get("birthYear")),
    notes: nullableString(formData.get("notes")),
  });

  if (!parsed.success) {
    redirect("/players?error=invalid_player");
    return;
  }

  const supabase = await createClient();
  const { error } = await supabase.from("players").insert({
    team_id: membership.team_id,
    first_name: parsed.data.firstName,
    last_name: parsed.data.lastName,
    jersey_number: parsed.data.jerseyNumber,
    birth_year: parsed.data.birthYear,
    notes: parsed.data.notes,
    active: true,
  });

  if (error) {
    if (error.code === "23505") {
      redirect("/players?error=duplicate_jersey");
    }

    if (error.code === "23514") {
      redirect("/players?error=player_constraint");
    }

    redirect("/players?error=player_save_failed");
  }

  revalidatePath("/players");
  revalidatePath("/");
  redirect("/players?created=1");
}

const deletePlayerSchema = z.object({
  playerId: z.string().uuid(),
});

export async function deletePlayerAction(formData: FormData) {
  const user = await requireUser();
  const membership = await getPrimaryTeamMembership(user.id);
  if (!membership) return;

  const parsed = deletePlayerSchema.safeParse({
    playerId: String(formData.get("playerId") ?? ""),
  });

  if (!parsed.success) {
    return;
  }

  const supabase = await createClient();
  await supabase
    .from("players")
    .delete()
    .eq("id", parsed.data.playerId)
    .eq("team_id", membership.team_id);

  revalidatePath("/players");
  revalidatePath("/trainings");
  revalidatePath("/matches");
  revalidatePath("/");
}
