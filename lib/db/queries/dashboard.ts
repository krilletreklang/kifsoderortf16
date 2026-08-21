import { subDays } from "@/lib/utils/date";
import type { DashboardSummary } from "@/types/domain";
import { createClient } from "@/lib/supabase/server";

function round(value: number) {
  return Math.round(value * 10) / 10;
}

type AttendanceJoinRow = {
  status: "present" | "absent" | "late" | "unknown";
  trainings: { date: string } | Array<{ date: string }>;
};

export async function getDashboardSummary(teamId: string): Promise<DashboardSummary> {
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);

  const [{ data: nextTraining }, { data: nextMatch }, { count: playedMatchesCount }, { count: upcomingMatchesCount }, { data: latestResult }, { data: attendanceRows }] = await Promise.all([
    supabase
      .from("trainings")
      .select("date, start_time, location, theme")
      .eq("team_id", teamId)
      .gte("date", today)
      .order("date", { ascending: true })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("matches")
      .select("date, start_time, opponent, location, home_away")
      .eq("team_id", teamId)
      .gte("date", today)
      .order("date", { ascending: true })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("matches")
      .select("id", { count: "exact", head: true })
      .eq("team_id", teamId)
      .eq("status", "completed"),
    supabase
      .from("matches")
      .select("id", { count: "exact", head: true })
      .eq("team_id", teamId)
      .in("status", ["planned"]),
    supabase
      .from("matches")
      .select("date, opponent, goals_for, goals_against")
      .eq("team_id", teamId)
      .eq("status", "completed")
      .order("date", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("training_attendance")
      .select("training_id, status, trainings!inner(date, team_id)")
      .eq("trainings.team_id", teamId)
      .gte("trainings.date", subDays(30)),
  ]);

  const attendanceByWeekMap = new Map<string, { total: number; present: number }>();
  const rows = (attendanceRows ?? []) as AttendanceJoinRow[];

  for (const row of rows) {
    const dateValue = Array.isArray(row.trainings) ? row.trainings[0]?.date : row.trainings?.date;
    if (!dateValue) continue;

    const weekKey = dateValue;
    if (!attendanceByWeekMap.has(weekKey)) {
      attendanceByWeekMap.set(weekKey, { total: 0, present: 0 });
    }

    const weekData = attendanceByWeekMap.get(weekKey);
    if (!weekData) continue;

    weekData.total += 1;
    if (row.status === "present") {
      weekData.present += 1;
    }
  }

  const attendanceByWeek = Array.from(attendanceByWeekMap.entries())
    .map(([week, stats]) => ({
      week,
      attendanceRate: stats.total > 0 ? round((stats.present / stats.total) * 100) : 0,
    }))
    .slice(-8);

  const totalAttendanceRows = rows.length;
  const presentRows = rows.filter((row) => row.status === "present").length;

  const monthlyAttendance = totalAttendanceRows > 0 ? round((presentRows / totalAttendanceRows) * 100) : 0;

  return {
    nextTraining: nextTraining ?? null,
    nextMatch: nextMatch ?? null,
    monthlyAttendance,
    playedMatches: playedMatchesCount ?? 0,
    upcomingMatches: upcomingMatchesCount ?? 0,
    latestResult: latestResult ?? null,
    attendanceByWeek,
  };
}
