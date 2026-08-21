export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      teams: {
        Row: {
          id: string;
          name: string;
          club_name: string;
          season: string;
          created_at: string;
        };
      };
      profiles: {
        Row: {
          id: string;
          email: string;
          name: string | null;
          created_at: string;
        };
      };
      team_members: {
        Row: {
          id: string;
          team_id: string;
          profile_id: string;
          role: "admin" | "coach";
          created_at: string;
        };
      };
      trainings: {
        Row: {
          id: string;
          team_id: string;
          date: string;
          start_time: string;
          end_time: string;
          location: string | null;
          theme: string | null;
          notes: string | null;
          created_at: string;
        };
      };
      matches: {
        Row: {
          id: string;
          team_id: string;
          date: string;
          start_time: string;
          opponent: string;
          home_away: "home" | "away";
          location: string | null;
          goals_for: number | null;
          goals_against: number | null;
          status: "planned" | "completed" | "cancelled";
          created_at: string;
        };
      };
    };
  };
}
