import { subDays } from "@/lib/utils/date";
import { createClient } from "@/lib/supabase/server";

export interface MatchListItem {
  id: string;
  date: string;
  start_time: string;
  opponent: string;
  home_away: "home" | "away";
  location: string | null;
  match_type: string;
  status: "planned" | "completed" | "cancelled";
  goals_for: number | null;
  goals_against: number | null;
  called_count: number;
  participated_count: number;
}

export interface MatchPlayerMetric {
  player_id: string;
  first_name: string;
  last_name: string;
  jersey_number: number | null;
  called_up: boolean;
  participated: boolean;
  starter: boolean;
  minutes_played: number;
  recent_matches_played: number;
  total_matches_played: number;
  last_played_date: string | null;
  minutes_total: number;
  attendance_percent: number;
  score: number;
  reason: string;
  recommended: boolean;
}

export interface MatchDetailData {
  match: MatchListItem & {
    notes: string | null;
    green_card_player_id: string | null;
  };
  players: MatchPlayerMetric[];
  summary: {
    called_up_count: number;
    participated_count: number;
    suggested_count: number;
  };
}

function round(value: number) {
  return Math.round(value * 10) / 10;
}

export async function getMatchesOverview(teamId: string): Promise<MatchListItem[]> {
  const supabase = await createClient();

  const { data: matches } = await supabase
    .from("matches")
    .select("id, date, start_time, opponent, home_away, location, match_type, status, goals_for, goals_against")
    .eq("team_id", teamId)
    .order("date", { ascending: false })
    .limit(30);

  const matchIds = (matches ?? []).map((match) => match.id);

  let matchPlayers: Array<{ match_id: string; called_up: boolean; participated: boolean }> = [];
  if (matchIds.length > 0) {
    const { data } = await supabase
      .from("match_players")
      .select("match_id, called_up, participated")
      .in("match_id", matchIds);

    matchPlayers = (data ?? []) as Array<{ match_id: string; called_up: boolean; participated: boolean }>;
  }

  const aggregate = new Map<string, { called: number; participated: number }>();
  for (const row of matchPlayers) {
    const current = aggregate.get(row.match_id) ?? { called: 0, participated: 0 };
    current.called += row.called_up ? 1 : 0;
    current.participated += row.participated ? 1 : 0;
    aggregate.set(row.match_id, current);
  }

  return (matches ?? []).map((match) => {
    const item = aggregate.get(match.id) ?? { called: 0, participated: 0 };
    return {
      ...match,
      called_count: item.called,
      participated_count: item.participated,
    };
  }) as MatchListItem[];
}

export async function getMatchDetail(teamId: string, matchId: string, suggestedCount: number): Promise<MatchDetailData | null> {
  const supabase = await createClient();

  const [{ data: match }, { data: roster }, { data: selectionRows }, { data: allMatchRows }, { data: completedMatches }, { data: attendanceRows }, { data: greenCardRow }] =
    await Promise.all([
      supabase
        .from("matches")
        .select("id, date, start_time, opponent, home_away, location, match_type, status, goals_for, goals_against, notes")
        .eq("team_id", teamId)
        .eq("id", matchId)
        .maybeSingle(),
      supabase
        .from("players")
        .select("id, first_name, last_name, jersey_number")
        .eq("team_id", teamId)
        .eq("active", true)
        .order("jersey_number", { ascending: true, nullsFirst: false })
        .order("first_name", { ascending: true }),
      supabase
        .from("match_players")
        .select("player_id, called_up, participated, starter, minutes_played")
        .eq("match_id", matchId),
      supabase
        .from("match_players")
        .select("match_id, player_id, participated, minutes_played, matches!inner(id, date, status, team_id)")
        .eq("matches.team_id", teamId),
      supabase
        .from("matches")
        .select("id, date")
        .eq("team_id", teamId)
        .eq("status", "completed")
        .order("date", { ascending: false })
        .limit(10),
      supabase
        .from("training_attendance")
        .select("player_id, status, trainings!inner(team_id, date)")
        .eq("trainings.team_id", teamId)
        .gte("trainings.date", subDays(60)),
      supabase
        .from("match_green_cards")
        .select("player_id, matches!inner(team_id)")
        .eq("match_id", matchId)
        .eq("matches.team_id", teamId)
        .maybeSingle(),
    ]);

  if (!match) {
    return null;
  }

  type MatchRow = {
    match_id: string;
    player_id: string;
    participated: boolean;
    minutes_played: number;
    matches: { id: string; date: string; status: string } | Array<{ id: string; date: string; status: string }>;
  };

  type AttendanceRow = {
    player_id: string;
    status: "present" | "absent" | "late" | "unknown";
  };

  const allRows = (allMatchRows ?? []) as MatchRow[];
  const attendance = (attendanceRows ?? []) as AttendanceRow[];

  const recentIds = (completedMatches ?? [])
    .map((item) => item.id)
    .filter((id) => id !== matchId)
    .slice(0, 5);

  const lastCompletedMatchId = (completedMatches ?? []).find((item) => item.id !== matchId)?.id ?? null;

  const attendanceByPlayer = new Map<string, { present: number; total: number }>();
  for (const row of attendance) {
    const current = attendanceByPlayer.get(row.player_id) ?? { present: 0, total: 0 };
    current.total += 1;
    current.present += row.status === "present" ? 1 : 0;
    attendanceByPlayer.set(row.player_id, current);
  }

  const selectionMap = new Map<string, { called_up: boolean; participated: boolean; starter: boolean; minutes_played: number }>();
  for (const row of selectionRows ?? []) {
    selectionMap.set(row.player_id, {
      called_up: row.called_up,
      participated: row.participated,
      starter: row.starter,
      minutes_played: row.minutes_played ?? 0,
    });
  }

  const minutesTotals = new Map<string, number>();
  for (const row of allRows) {
    if (!row.participated) continue;
    minutesTotals.set(row.player_id, (minutesTotals.get(row.player_id) ?? 0) + (row.minutes_played ?? 0));
  }

  const averageMinutes =
    minutesTotals.size > 0
      ? Array.from(minutesTotals.values()).reduce((sum, value) => sum + value, 0) / minutesTotals.size
      : 0;

  const players: MatchPlayerMetric[] = (roster ?? []).map((player) => {
    const rows = allRows.filter((row) => row.player_id === player.id);

    const recentMatchesPlayed = rows.filter((row) => row.participated && recentIds.includes(row.match_id)).length;
    const totalMatchesPlayed = rows.filter((row) => row.participated).length;

    const lastPlayedDate = rows
      .filter((row) => row.participated)
      .map((row) => {
        const matchMeta = Array.isArray(row.matches) ? row.matches[0] : row.matches;
        return matchMeta?.date ?? "";
      })
      .filter(Boolean)
      .sort((a, b) => b.localeCompare(a))[0] ?? null;

    const minutesTotal = minutesTotals.get(player.id) ?? 0;
    const attendanceStats = attendanceByPlayer.get(player.id) ?? { present: 0, total: 0 };
    const attendancePercent = attendanceStats.total > 0 ? round((attendanceStats.present / attendanceStats.total) * 100) : 0;
    const playedLastMatch = !!(lastCompletedMatchId && rows.some((row) => row.match_id === lastCompletedMatchId && row.participated));

    const recentNeed = Math.max(0, 5 - recentMatchesPlayed);
    const minuteNeed = Math.max(0, averageMinutes - minutesTotal);
    const score = round(recentNeed * 4 + minuteNeed * 0.08 + (playedLastMatch ? -2 : 2) + attendancePercent * 0.02);

    let reason = `Spelat ${recentMatchesPlayed} av senaste ${Math.max(1, recentIds.length)} matcher`;
    if (minuteNeed > 25) {
      reason = `Har ${Math.round(minuteNeed)} färre spelminuter än lagets snitt`;
    } else if (!playedLastMatch) {
      reason = "Spelade inte senaste matchen";
    }

    const current = selectionMap.get(player.id) ?? {
      called_up: false,
      participated: false,
      starter: false,
      minutes_played: 0,
    };

    return {
      player_id: player.id,
      first_name: player.first_name,
      last_name: player.last_name,
      jersey_number: player.jersey_number,
      called_up: current.called_up,
      participated: current.participated,
      starter: current.starter,
      minutes_played: current.minutes_played,
      recent_matches_played: recentMatchesPlayed,
      total_matches_played: totalMatchesPlayed,
      last_played_date: lastPlayedDate,
      minutes_total: minutesTotal,
      attendance_percent: attendancePercent,
      score,
      reason,
      recommended: false,
    };
  });

  const sortedIds = [...players].sort((a, b) => b.score - a.score).map((item) => item.player_id);
  const recommendedSet = new Set(sortedIds.slice(0, Math.max(1, suggestedCount)));

  for (const player of players) {
    player.recommended = recommendedSet.has(player.player_id);
  }

  players.sort((a, b) => b.score - a.score);

  return {
    match: {
      ...match,
      called_count: players.filter((player) => player.called_up).length,
      participated_count: players.filter((player) => player.participated).length,
      green_card_player_id: greenCardRow?.player_id ?? null,
    },
    players,
    summary: {
      called_up_count: players.filter((player) => player.called_up).length,
      participated_count: players.filter((player) => player.participated).length,
      suggested_count: Math.max(1, suggestedCount),
    },
  };
}
