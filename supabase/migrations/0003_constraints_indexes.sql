alter table public.team_members
  add constraint team_members_team_profile_unique unique (team_id, profile_id);

alter table public.players
  add constraint players_jersey_unique unique nulls not distinct (team_id, jersey_number);

alter table public.training_attendance
  add constraint training_attendance_training_player_unique unique (training_id, player_id);

alter table public.match_players
  add constraint match_players_match_player_unique unique (match_id, player_id);

alter table public.match_player_positions
  add constraint match_positions_match_player_position_unique unique (match_id, player_id, position);

alter table public.players
  add constraint players_birth_year_check check (birth_year is null or birth_year between 1990 and 2035),
  add constraint players_jersey_number_check check (jersey_number is null or jersey_number between 1 and 99);

alter table public.trainings
  add constraint trainings_time_check check (end_time > start_time);

alter table public.matches
  add constraint matches_goals_for_check check (goals_for is null or goals_for >= 0),
  add constraint matches_goals_against_check check (goals_against is null or goals_against >= 0);

alter table public.match_players
  add constraint match_players_minutes_check check (minutes_played >= 0);

alter table public.match_player_positions
  add constraint match_positions_minutes_check check (minutes >= 0);

alter table public.training_plans
  add constraint training_plans_total_minutes_check check (total_minutes >= 0);

alter table public.training_plan_sections
  add constraint training_plan_sections_minutes_check check (minutes >= 0),
  add constraint training_plan_sections_order_index_check check (order_index >= 0);

alter table public.drills
  add constraint drills_duration_check check (duration is null or duration >= 0),
  add constraint drills_players_min_check check (players_min is null or players_min >= 0),
  add constraint drills_players_max_check check (players_max is null or players_max >= 0),
  add constraint drills_players_range_check check (
    players_min is null
    or players_max is null
    or players_max >= players_min
  );

create index if not exists idx_team_members_profile_id on public.team_members(profile_id);
create index if not exists idx_team_members_team_id on public.team_members(team_id);
create index if not exists idx_players_team_id on public.players(team_id);
create index if not exists idx_trainings_team_date on public.trainings(team_id, date);
create index if not exists idx_training_attendance_training_id on public.training_attendance(training_id);
create index if not exists idx_training_attendance_player_id on public.training_attendance(player_id);
create index if not exists idx_matches_team_date on public.matches(team_id, date);
create index if not exists idx_match_players_match_id on public.match_players(match_id);
create index if not exists idx_match_players_player_id on public.match_players(player_id);
create index if not exists idx_match_positions_match_id on public.match_player_positions(match_id);
create index if not exists idx_training_plans_team_date on public.training_plans(team_id, date);
create index if not exists idx_training_plan_sections_plan_order on public.training_plan_sections(training_plan_id, order_index);
create index if not exists idx_drills_team_id on public.drills(team_id);
create index if not exists idx_tactical_boards_team_id on public.tactical_boards(team_id);
