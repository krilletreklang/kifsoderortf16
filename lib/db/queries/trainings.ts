import { createClient } from "@/lib/supabase/server";

export type AttendanceStatus = "present" | "absent" | "late" | "unknown";

export interface TrainingListItem {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  location: string | null;
  theme: string | null;
  notes: string | null;
  attendance_rate: number;
}

export interface TrainingPlayer {
  id: string;
  first_name: string;
  last_name: string;
  jersey_number: number | null;
}

export interface TrainingAttendanceModel {
  trainings: TrainingListItem[];
  selected_training: TrainingListItem | null;
  players: TrainingPlayer[];
  attendance_by_player: Record<string, AttendanceStatus>;
  status_counts: Record<AttendanceStatus, number>;
}

function round(value: number) {
  return Math.round(value * 10) / 10;
}

interface TrainingAttendanceOptions {
  selectedTrainingId?: string;
}

export async function getTrainingAttendanceModel(
  teamId: string,
  options?: TrainingAttendanceOptions,
): Promise<TrainingAttendanceModel> {
  const supabase = await createClient();

  const [{ data: trainings }, { data: players }, { data: attendanceRows }] = await Promise.all([
    supabase
      .from("trainings")
      .select("id, date, start_time, end_time, location, theme, notes")
      .eq("team_id", teamId)
      .order("date", { ascending: false })
      .limit(20),
    supabase
      .from("players")
      .select("id, first_name, last_name, jersey_number")
      .eq("team_id", teamId)
      .eq("active", true)
      .order("jersey_number", { ascending: true, nullsFirst: false })
      .order("first_name", { ascending: true }),
    supabase
      .from("training_attendance")
      .select("training_id, player_id, status, trainings!inner(team_id)")
      .eq("trainings.team_id", teamId),
  ]);

  type AttendanceRow = {
    training_id: string;
    player_id: string;
    status: AttendanceStatus;
  };

  const attendance = (attendanceRows ?? []) as AttendanceRow[];

  const attendanceByTraining = new Map<string, { total: number; present: number }>();
  for (const row of attendance) {
    const current = attendanceByTraining.get(row.training_id) ?? { total: 0, present: 0 };
    current.total += 1;
    current.present += row.status === "present" ? 1 : 0;
    attendanceByTraining.set(row.training_id, current);
  }

  const trainingsWithRates: TrainingListItem[] = (trainings ?? []).map((training) => {
    const stats = attendanceByTraining.get(training.id) ?? { total: 0, present: 0 };
    const rate = stats.total > 0 ? round((stats.present / stats.total) * 100) : 0;

    return {
      ...training,
      attendance_rate: rate,
    };
  });

  const selectedFromQuery = options?.selectedTrainingId
    ? trainingsWithRates.find((training) => training.id === options.selectedTrainingId)
    : null;

  const today = new Date().toISOString().slice(0, 10);
  const selectedTraining =
    selectedFromQuery ??
    trainingsWithRates
      .filter((training) => training.date >= today)
      .sort((a, b) => a.date.localeCompare(b.date))[0] ??
    trainingsWithRates[0] ??
    null;

  const selectedAttendance = attendance.filter((row) => row.training_id === selectedTraining?.id);
  const attendanceByPlayer: Record<string, AttendanceStatus> = {};
  const statusCounts: Record<AttendanceStatus, number> = {
    present: 0,
    late: 0,
    absent: 0,
    unknown: 0,
  };

  for (const row of selectedAttendance) {
    attendanceByPlayer[row.player_id] = row.status;
    statusCounts[row.status] += 1;
  }

  for (const player of players ?? []) {
    const status = attendanceByPlayer[player.id] ?? "unknown";
    if (!(player.id in attendanceByPlayer)) {
      statusCounts[status] += 1;
    }
  }

  return {
    trainings: trainingsWithRates,
    selected_training: selectedTraining,
    players: (players ?? []) as TrainingPlayer[],
    attendance_by_player: attendanceByPlayer,
    status_counts: statusCounts,
  };
}
