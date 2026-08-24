import { createClient } from "@/lib/supabase/server";

export interface GreenCardStats {
  leaderboard: Array<{
    player_id: string;
    first_name: string;
    last_name: string;
    jersey_number: number | null;
    green_cards: number;
  }>;
  recent: Array<{
    match_id: string;
    date: string;
    opponent: string;
    player_name: string;
  }>;
}

export async function getGreenCardStats(teamId: string): Promise<GreenCardStats> {
  const supabase = await createClient();

  const { data: rows } = await supabase
    .from("match_green_cards")
    .select("match_id, player_id, players!inner(first_name, last_name, jersey_number), matches!inner(id, date, opponent, team_id)")
    .eq("matches.team_id", teamId)
    .order("matches(date)", { ascending: false });

  type Row = {
    match_id: string;
    player_id: string;
    players: { first_name: string; last_name: string; jersey_number: number | null } | Array<{ first_name: string; last_name: string; jersey_number: number | null }>;
    matches: { id: string; date: string; opponent: string } | Array<{ id: string; date: string; opponent: string }>;
  };

  const resultRows = (rows ?? []) as Row[];

  const byPlayer = new Map<string, { first_name: string; last_name: string; jersey_number: number | null; green_cards: number }>();
  for (const row of resultRows) {
    const player = Array.isArray(row.players) ? row.players[0] : row.players;
    if (!player) continue;

    const current = byPlayer.get(row.player_id) ?? {
      first_name: player.first_name,
      last_name: player.last_name,
      jersey_number: player.jersey_number ?? null,
      green_cards: 0,
    };

    current.green_cards += 1;
    byPlayer.set(row.player_id, current);
  }

  const leaderboard = Array.from(byPlayer.entries())
    .map(([player_id, value]) => ({
      player_id,
      first_name: value.first_name,
      last_name: value.last_name,
      jersey_number: value.jersey_number,
      green_cards: value.green_cards,
    }))
    .sort((a, b) => b.green_cards - a.green_cards)
    .slice(0, 10);

  const recent = resultRows
    .map((row) => {
      const player = Array.isArray(row.players) ? row.players[0] : row.players;
      const match = Array.isArray(row.matches) ? row.matches[0] : row.matches;

      return {
        match_id: match?.id ?? row.match_id,
        date: match?.date ?? "",
        opponent: match?.opponent ?? "",
        player_name: player ? `${player.first_name} ${player.last_name}` : "",
      };
    })
    .filter((item) => item.date)
    .slice(0, 8);

  return {
    leaderboard,
    recent,
  };
}
