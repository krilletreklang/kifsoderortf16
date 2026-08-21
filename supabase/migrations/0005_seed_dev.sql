insert into public.teams (id, name, club_name, season)
values ('0d7fbf4b-a35a-4ac3-82a4-11e6d64f31d2', 'F16', 'KIF Soderort', '2026')
on conflict (id) do nothing;

insert into public.players (team_id, first_name, last_name, jersey_number, birth_year, active)
values
  ('0d7fbf4b-a35a-4ac3-82a4-11e6d64f31d2', 'Anna', 'Andersson', 2, 2010, true),
  ('0d7fbf4b-a35a-4ac3-82a4-11e6d64f31d2', 'Bea', 'Berg', 3, 2010, true),
  ('0d7fbf4b-a35a-4ac3-82a4-11e6d64f31d2', 'Cecilia', 'Claesson', 4, 2010, true),
  ('0d7fbf4b-a35a-4ac3-82a4-11e6d64f31d2', 'Diana', 'Dahl', 5, 2010, true),
  ('0d7fbf4b-a35a-4ac3-82a4-11e6d64f31d2', 'Elin', 'Ek', 6, 2010, true),
  ('0d7fbf4b-a35a-4ac3-82a4-11e6d64f31d2', 'Fatima', 'Farah', 7, 2010, true),
  ('0d7fbf4b-a35a-4ac3-82a4-11e6d64f31d2', 'Greta', 'Gustafsson', 8, 2010, true),
  ('0d7fbf4b-a35a-4ac3-82a4-11e6d64f31d2', 'Hanna', 'Holm', 9, 2010, true),
  ('0d7fbf4b-a35a-4ac3-82a4-11e6d64f31d2', 'Ida', 'Isaksson', 10, 2010, true),
  ('0d7fbf4b-a35a-4ac3-82a4-11e6d64f31d2', 'Julia', 'Jonsson', 11, 2010, true),
  ('0d7fbf4b-a35a-4ac3-82a4-11e6d64f31d2', 'Klara', 'Karlsson', 12, 2010, true),
  ('0d7fbf4b-a35a-4ac3-82a4-11e6d64f31d2', 'Lea', 'Lind', 13, 2010, true),
  ('0d7fbf4b-a35a-4ac3-82a4-11e6d64f31d2', 'Maja', 'Malm', 14, 2010, true),
  ('0d7fbf4b-a35a-4ac3-82a4-11e6d64f31d2', 'Nora', 'Nordin', 15, 2010, true)
on conflict do nothing;

insert into public.trainings (id, team_id, date, start_time, end_time, location, theme)
values
  ('c6eb683b-4130-4e64-b636-d512f6f5f9d1', '0d7fbf4b-a35a-4ac3-82a4-11e6d64f31d2', current_date - 12, '18:00', '19:30', 'Skarholmens IP', 'Passningsspel'),
  ('6807ad95-1fcf-43be-b8bd-5e68fe8b89fd', '0d7fbf4b-a35a-4ac3-82a4-11e6d64f31d2', current_date - 5, '18:00', '19:30', 'Skarholmens IP', 'Speluppbyggnad'),
  ('4f0f0d41-59a7-4fe6-a7ee-4b85364122dc', '0d7fbf4b-a35a-4ac3-82a4-11e6d64f31d2', current_date + 2, '18:00', '19:30', 'Skarholmens IP', 'Presspel'),
  ('ef13a2f8-d6b8-4de0-8750-3b3f3034f2a2', '0d7fbf4b-a35a-4ac3-82a4-11e6d64f31d2', current_date + 9, '18:00', '19:30', 'Skarholmens IP', 'Avslut')
on conflict (id) do nothing;

insert into public.training_attendance (training_id, player_id, status)
select
  t.id,
  p.id,
  case
    when p.jersey_number in (2, 3, 4, 5, 6, 8, 9, 10, 11, 12, 14) then 'present'::public.attendance_status
    when p.jersey_number in (7, 13) then 'late'::public.attendance_status
    else 'absent'::public.attendance_status
  end
from public.players p
join public.trainings t on t.id in ('c6eb683b-4130-4e64-b636-d512f6f5f9d1', '6807ad95-1fcf-43be-b8bd-5e68fe8b89fd')
where p.team_id = '0d7fbf4b-a35a-4ac3-82a4-11e6d64f31d2'
on conflict (training_id, player_id) do nothing;

insert into public.matches (id, team_id, date, start_time, opponent, home_away, location, match_type, goals_for, goals_against, status)
values
  ('5fe04ff4-fcd8-46dd-b315-b6f8f63b81fd', '0d7fbf4b-a35a-4ac3-82a4-11e6d64f31d2', current_date - 7, '13:00', 'Hammarby IF', 'away', 'Hammarby IP', 'friendly', 2, 1, 'completed'),
  ('f788ef17-74cb-46eb-a955-47e8afd51ad5', '0d7fbf4b-a35a-4ac3-82a4-11e6d64f31d2', current_date + 4, '11:00', 'Enskede IK', 'home', 'Skarholmens IP', 'league', null, null, 'planned')
on conflict (id) do nothing;

insert into public.match_players (match_id, player_id, called_up, participated, minutes_played, starter)
select
  '5fe04ff4-fcd8-46dd-b315-b6f8f63b81fd',
  p.id,
  true,
  true,
  case when p.jersey_number in (2, 3, 4, 5, 6, 8, 9) then 55 else 35 end,
  p.jersey_number in (2, 3, 4, 5, 6, 8, 9)
from public.players p
where p.team_id = '0d7fbf4b-a35a-4ac3-82a4-11e6d64f31d2'
  and p.jersey_number <= 12
on conflict (match_id, player_id) do nothing;

insert into public.drills (team_id, title, category, description, duration, players_min, players_max, equipment, coaching_points)
values
  ('0d7fbf4b-a35a-4ac3-82a4-11e6d64f31d2', 'Rondo 4v2', 'Passning', 'Kortpassning med press.', 15, 6, 12, 'Koner, vastar, bollar', 'Vinklar, tempo, spelbarhet'),
  ('0d7fbf4b-a35a-4ac3-82a4-11e6d64f31d2', '3v2 till avslut', '3v2', 'Omstallning till avslut mot mal.', 20, 8, 14, 'Mal, koner, bollar', 'Ratt beslut i overtal, avslut i fart')
on conflict do nothing;

insert into public.tactical_boards (id, team_id, name, board_type, data)
values (
  'ecf4143f-c5ec-45f3-a5f3-9ca09190df3e',
  '0d7fbf4b-a35a-4ac3-82a4-11e6d64f31d2',
  '7v7 Grundformation',
  '7v7',
  '{"formation":"2-3-1","players":[],"opponents":[],"objects":[]}'::jsonb
)
on conflict (id) do nothing;

-- Koppla coach-konton till teamet efter att auth users har skapats i Supabase Auth.
-- Byt e-postadresser nedan till era riktiga coach-konton.
insert into public.team_members (team_id, profile_id, role)
select
  '0d7fbf4b-a35a-4ac3-82a4-11e6d64f31d2',
  p.id,
  'coach'::public.team_member_role
from public.profiles p
where p.email in ('coach1@example.com', 'coach2@example.com', 'coach3@example.com')
on conflict (team_id, profile_id) do nothing;
