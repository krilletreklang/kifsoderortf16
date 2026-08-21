create table if not exists public.teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  club_name text not null,
  season text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  name text,
  created_at timestamptz not null default now()
);

create table if not exists public.team_members (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  role public.team_member_role not null default 'coach',
  created_at timestamptz not null default now()
);

create table if not exists public.players (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  first_name text not null,
  last_name text not null,
  jersey_number integer,
  birth_year integer,
  active boolean not null default true,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.trainings (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  date date not null,
  start_time time not null,
  end_time time not null,
  location text,
  theme text,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.training_attendance (
  id uuid primary key default gen_random_uuid(),
  training_id uuid not null references public.trainings(id) on delete cascade,
  player_id uuid not null references public.players(id) on delete cascade,
  status public.attendance_status not null default 'unknown',
  notes text
);

create table if not exists public.matches (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  date date not null,
  start_time time not null,
  opponent text not null,
  home_away public.match_home_away not null,
  location text,
  match_type public.match_type not null default 'friendly',
  notes text,
  goals_for integer,
  goals_against integer,
  status public.match_status not null default 'planned',
  created_at timestamptz not null default now()
);

create table if not exists public.match_players (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches(id) on delete cascade,
  player_id uuid not null references public.players(id) on delete cascade,
  called_up boolean not null default false,
  participated boolean not null default false,
  minutes_played integer not null default 0,
  starter boolean not null default false,
  notes text
);

create table if not exists public.match_player_positions (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches(id) on delete cascade,
  player_id uuid not null references public.players(id) on delete cascade,
  position text not null,
  minutes integer not null default 0
);

create table if not exists public.training_plans (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  title text not null,
  date date,
  total_minutes integer not null default 0,
  objective text,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.training_plan_sections (
  id uuid primary key default gen_random_uuid(),
  training_plan_id uuid not null references public.training_plans(id) on delete cascade,
  title text not null,
  minutes integer not null default 0,
  description text,
  coaching_points text,
  players_count integer,
  equipment text,
  order_index integer not null default 0
);

create table if not exists public.drills (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  title text not null,
  category text not null,
  description text,
  duration integer,
  players_min integer,
  players_max integer,
  equipment text,
  coaching_points text,
  created_at timestamptz not null default now()
);

create table if not exists public.tactical_boards (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  name text not null,
  board_type public.board_type not null default '7v7',
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, name)
  values (
    new.id,
    coalesce(new.email, concat(new.id::text, '@unknown.local')),
    coalesce(new.raw_user_meta_data ->> 'name', split_part(coalesce(new.email, 'Coach'), '@', 1))
  )
  on conflict (id) do update
  set email = excluded.email;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists tactical_boards_set_updated_at on public.tactical_boards;
create trigger tactical_boards_set_updated_at
  before update on public.tactical_boards
  for each row execute procedure public.set_updated_at();
