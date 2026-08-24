"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/session";
import { getPrimaryTeamMembership } from "@/lib/db/queries/teams";
import { createClient } from "@/lib/supabase/server";

export async function clearTeamDataAction() {
  const user = await requireUser();
  const membership = await getPrimaryTeamMembership(user.id);
  if (!membership) return;

  const supabase = await createClient();
  const teamId = membership.team_id;

  await supabase.from("training_plans").delete().eq("team_id", teamId);
  await supabase.from("drills").delete().eq("team_id", teamId);
  await supabase.from("tactical_boards").delete().eq("team_id", teamId);
  await supabase.from("matches").delete().eq("team_id", teamId);
  await supabase.from("trainings").delete().eq("team_id", teamId);
  await supabase.from("players").delete().eq("team_id", teamId);

  revalidatePath("/");
  revalidatePath("/players");
  revalidatePath("/trainings");
  revalidatePath("/matches");
  revalidatePath("/tactics");
  revalidatePath("/drills");
  revalidatePath("/training-plans");
  revalidatePath("/statistics");
  revalidatePath("/settings");
}
