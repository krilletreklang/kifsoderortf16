export type TeamRole = "admin" | "coach";

export interface Team {
  id: string;
  name: string;
  club_name: string;
  season: string;
}

export interface TeamMembership {
  team_id: string;
  role: TeamRole;
  teams: Team;
}

export interface DashboardSummary {
  nextTraining: {
    date: string;
    start_time: string;
    location: string | null;
    theme: string | null;
  } | null;
  nextMatch: {
    date: string;
    start_time: string;
    opponent: string;
    location: string | null;
    home_away: "home" | "away";
  } | null;
  monthlyAttendance: number;
  playedMatches: number;
  upcomingMatches: number;
  latestResult: {
    opponent: string;
    goals_for: number;
    goals_against: number;
    date: string;
  } | null;
  attendanceByWeek: Array<{
    week: string;
    attendanceRate: number;
  }>;
}
