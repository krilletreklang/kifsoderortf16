import { createClient } from "@/lib/supabase/server";

export interface PlayerOverview {
  id: string;
  first_name: string;
  last_name: string;
  jersey_number: number | null;
  active: boolean;
  attendance_percent: number;
  matches_total: number;
  starts_total: number;
  minutes_total: number;
  common_position: string;
}

export interface PlayerDetails {
  id: string;
  first_name: string;
  last_name: string;
  jersey_number: number | null;
  active: boolean;
  birth_year: number | null;
  notes: string | null;
  attendance_percent: number;
  trainings_total: number;
  called_up_total: number;
  participated_total: number;
  starts_total: number;
  minutes_total: number;
  avg_minutes_per_match: number;
  position_breakdown: Array<{ position: string; count: number }>;
  recent_matches: Array<{
    match_id: string;
    date: string;
    opponent: string;
    called_up: boolean;
    participated: boolean;
    starter: boolean;
    minutes_played: number;
  }>;
  recent_attendance: Array<{
    training_id: string;
    date: string;
    status: "present" | "absent" | "late" | "unknown";
  }>;
}

function round(value: number) {
  return Math.round(value * 10) / 10;
}

export async function getPlayersOverview(teamId: string): Promise<PlayerOverview[]> {
  const supabase = await createClient();

  const [{ data: players }, { data: attendanceRows }, { data: matchRows }, { data: positionRows }] = await Promise.all([
    supabase
      .from("players")
      .select("id, first_name, last_name, jersey_number, active")
      .eq("team_id", teamId)
      .order("active", { ascending: false })
      .order("jersey_number", { ascending: true, nullsFirst: false })
      .order("first_name", { ascending: true }),
    supabase
      .from("training_attendance")
      .select("player_id, status, trainings!inner(team_id)")
      .eq("trainings.team_id", teamId),
    supabase
      .from("match_players")
      .select("player_id, starter, minutes_played, matches!inner(team_id)")
      .eq("matches.team_id", teamId),
    supabase
      .from("match_player_positions")
      .select("player_id, position, matches!inner(team_id)")
      .eq("matches.team_id", teamId),
  ]);

  type AttendanceRow = { player_id: string; status: "present" | "absent" | "late" | "unknown" };
  type MatchRow = { player_id: string; starter: boolean; minutes_played: number };
  type PositionRow = { player_id: string; position: string };

  const attendanceByPlayer = new Map<string, { total: number; present: number }>();
  for (const row of (attendanceRows ?? []) as AttendanceRow[]) {
    const current = attendanceByPlayer.get(row.player_id) ?? { total: 0, present: 0 };
    current.total += 1;
    if (row.status === "present") {
      current.present += 1;
    }
    attendanceByPlayer.set(row.player_id, current);
  }

  const matchByPlayer = new Map<string, { matches: number; starts: number; minutes: number }>();
  for (const row of (matchRows ?? []) as MatchRow[]) {
    const current = matchByPlayer.get(row.player_id) ?? { matches: 0, starts: 0, minutes: 0 };
    current.matches += 1;
    current.starts += row.starter ? 1 : 0;
    current.minutes += row.minutes_played ?? 0;
    matchByPlayer.set(row.player_id, current);
  }

  const positionsByPlayer = new Map<string, Map<string, number>>();
  for (const row of (positionRows ?? []) as PositionRow[]) {
    const positionMap = positionsByPlayer.get(row.player_id) ?? new Map<string, number>();
    positionMap.set(row.position, (positionMap.get(row.position) ?? 0) + 1);
    positionsByPlayer.set(row.player_id, positionMap);
  }

  return (players ?? []).map((player) => {
    const attendance = attendanceByPlayer.get(player.id) ?? { total: 0, present: 0 };
    const attendancePercent = attendance.total > 0 ? round((attendance.present / attendance.total) * 100) : 0;

    const match = matchByPlayer.get(player.id) ?? { matches: 0, starts: 0, minutes: 0 };

    const positionMap = positionsByPlayer.get(player.id) ?? new Map<string, number>();
    const commonPosition =
      Array.from(positionMap.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "-";

    return {
      ...player,
      attendance_percent: attendancePercent,
      matches_total: match.matches,
      starts_total: match.starts,
      minutes_total: match.minutes,
      common_position: commonPosition,
    };
  });
}

export async function getPlayerDetails(teamId: string, playerId: string): Promise<PlayerDetails | null> {
  const supabase = await createClient();

  const { data: player } = await supabase
    .from("players")
    .select("id, first_name, last_name, jersey_number, active, birth_year, notes")
    .eq("team_id", teamId)
    .eq("id", playerId)
    .maybeSingle();

  if (!player) {
    return null;
  }

  const [{ data: attendanceRows }, { data: matchRows }, { data: positionRows }] = await Promise.all([
    supabase
      .from("training_attendance")
      .select("training_id, status, trainings!inner(date, team_id)")
      .eq("player_id", playerId)
      .eq("trainings.team_id", teamId)
      .order("training_id", { ascending: false }),
    supabase
      .from("match_players")
      .select("match_id, called_up, participated, starter, minutes_played, matches!inner(date, opponent, team_id)")
      .eq("player_id", playerId)
      .eq("matches.team_id", teamId),
    supabase
      .from("match_player_positions")
      .select("position, matches!inner(team_id)")
      .eq("player_id", playerId)
      .eq("matches.team_id", teamId),
  ]);

  type AttendanceJoinRow = {
    training_id: string;
    status: "present" | "absent" | "late" | "unknown";
    trainings: { date: string } | Array<{ date: string }>;
  };
  type MatchJoinRow = {
    match_id: string;
    called_up: boolean;
    participated: boolean;
    starter: boolean;
    minutes_played: number;
    matches: { date: string; opponent: string } | Array<{ date: string; opponent: string }>;
  };
  type PositionJoinRow = {
    position: string;
  };

  const attendance = (attendanceRows ?? []) as AttendanceJoinRow[];
  const matches = (matchRows ?? []) as MatchJoinRow[];
  const positions = (positionRows ?? []) as PositionJoinRow[];

  const trainingsTotal = attendance.length;
  const presentTotal = attendance.filter((row) => row.status === "present").length;
  const attendancePercent = trainingsTotal > 0 ? round((presentTotal / trainingsTotal) * 100) : 0;

  const calledUpTotal = matches.filter((row) => row.called_up).length;
  const participatedTotal = matches.filter((row) => row.participated).length;
  const startsTotal = matches.filter((row) => row.starter).length;
  const minutesTotal = matches.reduce((total, row) => total + (row.minutes_played ?? 0), 0);
  const avgMinutesPerMatch = participatedTotal > 0 ? round(minutesTotal / participatedTotal) : 0;

  const positionMap = new Map<string, number>();
  for (const row of positions) {
    positionMap.set(row.position, (positionMap.get(row.position) ?? 0) + 1);
  }

  const positionBreakdown = Array.from(positionMap.entries())
    .map(([position, count]) => ({ position, count }))
    .sort((a, b) => b.count - a.count);

  const recentMatches = matches
    .map((row) => {
      const match = Array.isArray(row.matches) ? row.matches[0] : row.matches;
      return {
        match_id: row.match_id,
        date: match?.date ?? "",
        opponent: match?.opponent ?? "",
        called_up: row.called_up,
        participated: row.participated,
        starter: row.starter,
        minutes_played: row.minutes_played ?? 0,
      };
    })
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 8);

  const recentAttendance = attendance
    .map((row) => {
      const training = Array.isArray(row.trainings) ? row.trainings[0] : row.trainings;
      return {
        training_id: row.training_id,
        date: training?.date ?? "",
        status: row.status,
      };
    })
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 8);

  return {
    ...player,
    attendance_percent: attendancePercent,
    trainings_total: trainingsTotal,
    called_up_total: calledUpTotal,
    participated_total: participatedTotal,
    starts_total: startsTotal,
    minutes_total: minutesTotal,
    avg_minutes_per_match: avgMinutesPerMatch,
    position_breakdown: positionBreakdown,
    recent_matches: recentMatches,
    recent_attendance: recentAttendance,
  };
}
