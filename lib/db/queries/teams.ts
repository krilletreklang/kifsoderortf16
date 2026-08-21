import type { TeamMembership } from "@/types/domain";
import { createClient } from "@/lib/supabase/server";

export async function getPrimaryTeamMembership(userId: string): Promise<TeamMembership | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("team_members")
    .select("team_id, role, teams(id, name, club_name, season)")
    .eq("profile_id", userId)
    .limit(1)
    .maybeSingle();

  if (error || !data || !data.teams) {
    return null;
  }

  const team = Array.isArray(data.teams) ? data.teams[0] : data.teams;
  if (!team) {
    return null;
  }

  return {
    team_id: data.team_id,
    role: data.role,
    teams: {
      id: team.id,
      name: team.name,
      club_name: team.club_name,
      season: team.season,
    },
  };
}
