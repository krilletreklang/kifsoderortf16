create extension if not exists "pgcrypto";

create type public.team_member_role as enum ('admin', 'coach');
create type public.attendance_status as enum ('present', 'absent', 'late', 'unknown');
create type public.match_home_away as enum ('home', 'away');
create type public.match_status as enum ('planned', 'completed', 'cancelled');
create type public.match_type as enum ('league', 'friendly', 'cup', 'tournament', 'training_game');
create type public.board_type as enum ('7v7', '9v9', 'training', 'custom');
