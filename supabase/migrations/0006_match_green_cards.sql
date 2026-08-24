create table if not exists public.match_green_cards (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches(id) on delete cascade,
  player_id uuid not null references public.players(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint match_green_cards_match_unique unique (match_id)
);

create index if not exists idx_match_green_cards_player_id on public.match_green_cards(player_id);

alter table public.match_green_cards enable row level security;

drop policy if exists "match_green_cards_all_team_members" on public.match_green_cards;
create policy "match_green_cards_all_team_members" on public.match_green_cards
  for all
  using (
    exists (
      select 1
      from public.matches m
      where m.id = match_green_cards.match_id
        and public.is_team_member(m.team_id)
    )
  )
  with check (
    exists (
      select 1
      from public.matches m
      where m.id = match_green_cards.match_id
        and public.is_team_member(m.team_id)
    )
  );
