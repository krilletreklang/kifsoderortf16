alter table public.teams enable row level security;
alter table public.profiles enable row level security;
alter table public.team_members enable row level security;
alter table public.players enable row level security;
alter table public.trainings enable row level security;
alter table public.training_attendance enable row level security;
alter table public.matches enable row level security;
alter table public.match_players enable row level security;
alter table public.match_player_positions enable row level security;
alter table public.training_plans enable row level security;
alter table public.training_plan_sections enable row level security;
alter table public.drills enable row level security;
alter table public.tactical_boards enable row level security;

create or replace function public.is_team_member(team_uuid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.team_members tm
    where tm.team_id = team_uuid
      and tm.profile_id = auth.uid()
  );
$$;

create or replace function public.is_team_admin(team_uuid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.team_members tm
    where tm.team_id = team_uuid
      and tm.profile_id = auth.uid()
      and tm.role = 'admin'
  );
$$;

drop policy if exists "teams_select" on public.teams;
create policy "teams_select" on public.teams
  for select
  using (public.is_team_member(id));

drop policy if exists "teams_update" on public.teams;
create policy "teams_update" on public.teams
  for update
  using (public.is_team_member(id))
  with check (public.is_team_member(id));

drop policy if exists "profiles_select" on public.profiles;
create policy "profiles_select" on public.profiles
  for select
  using (
    id = auth.uid()
    or exists (
      select 1
      from public.team_members own_tm
      join public.team_members target_tm on target_tm.team_id = own_tm.team_id
      where own_tm.profile_id = auth.uid()
        and target_tm.profile_id = profiles.id
    )
  );

drop policy if exists "profiles_insert_self" on public.profiles;
create policy "profiles_insert_self" on public.profiles
  for insert
  with check (id = auth.uid());

drop policy if exists "profiles_update_self" on public.profiles;
create policy "profiles_update_self" on public.profiles
  for update
  using (id = auth.uid())
  with check (id = auth.uid());

drop policy if exists "team_members_select" on public.team_members;
create policy "team_members_select" on public.team_members
  for select
  using (public.is_team_member(team_id));

drop policy if exists "team_members_insert_admin" on public.team_members;
create policy "team_members_insert_admin" on public.team_members
  for insert
  with check (public.is_team_admin(team_id));

drop policy if exists "team_members_update_admin" on public.team_members;
create policy "team_members_update_admin" on public.team_members
  for update
  using (public.is_team_admin(team_id))
  with check (public.is_team_admin(team_id));

drop policy if exists "team_members_delete_admin" on public.team_members;
create policy "team_members_delete_admin" on public.team_members
  for delete
  using (public.is_team_admin(team_id));

drop policy if exists "players_all_team_members" on public.players;
create policy "players_all_team_members" on public.players
  for all
  using (public.is_team_member(team_id))
  with check (public.is_team_member(team_id));

drop policy if exists "trainings_all_team_members" on public.trainings;
create policy "trainings_all_team_members" on public.trainings
  for all
  using (public.is_team_member(team_id))
  with check (public.is_team_member(team_id));

drop policy if exists "training_attendance_all_team_members" on public.training_attendance;
create policy "training_attendance_all_team_members" on public.training_attendance
  for all
  using (
    exists (
      select 1
      from public.trainings t
      where t.id = training_attendance.training_id
        and public.is_team_member(t.team_id)
    )
  )
  with check (
    exists (
      select 1
      from public.trainings t
      where t.id = training_attendance.training_id
        and public.is_team_member(t.team_id)
    )
  );

drop policy if exists "matches_all_team_members" on public.matches;
create policy "matches_all_team_members" on public.matches
  for all
  using (public.is_team_member(team_id))
  with check (public.is_team_member(team_id));

drop policy if exists "match_players_all_team_members" on public.match_players;
create policy "match_players_all_team_members" on public.match_players
  for all
  using (
    exists (
      select 1
      from public.matches m
      where m.id = match_players.match_id
        and public.is_team_member(m.team_id)
    )
  )
  with check (
    exists (
      select 1
      from public.matches m
      where m.id = match_players.match_id
        and public.is_team_member(m.team_id)
    )
  );

drop policy if exists "match_positions_all_team_members" on public.match_player_positions;
create policy "match_positions_all_team_members" on public.match_player_positions
  for all
  using (
    exists (
      select 1
      from public.matches m
      where m.id = match_player_positions.match_id
        and public.is_team_member(m.team_id)
    )
  )
  with check (
    exists (
      select 1
      from public.matches m
      where m.id = match_player_positions.match_id
        and public.is_team_member(m.team_id)
    )
  );

drop policy if exists "training_plans_all_team_members" on public.training_plans;
create policy "training_plans_all_team_members" on public.training_plans
  for all
  using (public.is_team_member(team_id))
  with check (public.is_team_member(team_id));

drop policy if exists "training_plan_sections_all_team_members" on public.training_plan_sections;
create policy "training_plan_sections_all_team_members" on public.training_plan_sections
  for all
  using (
    exists (
      select 1
      from public.training_plans tp
      where tp.id = training_plan_sections.training_plan_id
        and public.is_team_member(tp.team_id)
    )
  )
  with check (
    exists (
      select 1
      from public.training_plans tp
      where tp.id = training_plan_sections.training_plan_id
        and public.is_team_member(tp.team_id)
    )
  );

drop policy if exists "drills_all_team_members" on public.drills;
create policy "drills_all_team_members" on public.drills
  for all
  using (public.is_team_member(team_id))
  with check (public.is_team_member(team_id));

drop policy if exists "tactical_boards_all_team_members" on public.tactical_boards;
create policy "tactical_boards_all_team_members" on public.tactical_boards
  for all
  using (public.is_team_member(team_id))
  with check (public.is_team_member(team_id));
