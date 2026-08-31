import { createClient } from "@/lib/supabase/server";
import type { TacticsBoardRecord, TacticsBoardData, TacticsRosterPlayer } from "@/types/tactics";

function normalizeBoardData(value: unknown): TacticsBoardData {
  const fallback: TacticsBoardData = {
    version: 1,
    formation: "2-3-1",
    pieces: [],
    arrows: [],
    zones: [],
  };

  if (!value || typeof value !== "object") {
    return fallback;
  }

  const candidate = value as Partial<TacticsBoardData>;
  return {
    version: 1,
    formation: typeof candidate.formation === "string" ? candidate.formation : fallback.formation,
    pieces: Array.isArray(candidate.pieces) ? candidate.pieces : [],
    arrows: Array.isArray(candidate.arrows) ? candidate.arrows : [],
    zones: Array.isArray(candidate.zones) ? candidate.zones : [],
  };
}

export async function getTacticsPageData(teamId: string): Promise<{
  boards: TacticsBoardRecord[];
  roster: TacticsRosterPlayer[];
}> {
  const supabase = await createClient();

  const [{ data: boards }, { data: roster }] = await Promise.all([
    supabase
      .from("tactical_boards")
      .select("id, name, board_type, reference_image_url, data, created_at, updated_at")
      .eq("team_id", teamId)
      .order("updated_at", { ascending: false }),
    supabase
      .from("players")
      .select("id, first_name, last_name, jersey_number")
      .eq("team_id", teamId)
      .eq("active", true)
      .order("jersey_number", { ascending: true, nullsFirst: false })
      .order("first_name", { ascending: true }),
  ]);

  return {
    boards: (boards ?? []).map((board) => ({
      ...board,
      data: normalizeBoardData(board.data),
    })) as TacticsBoardRecord[],
    roster: (roster ?? []) as TacticsRosterPlayer[],
  };
}
