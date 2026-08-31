alter table public.tactical_boards
  add column if not exists reference_video_url text;
