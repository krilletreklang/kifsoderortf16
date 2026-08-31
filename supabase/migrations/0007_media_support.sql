alter table public.drills
  add column if not exists video_url text,
  add column if not exists image_url text;

alter table public.tactical_boards
  add column if not exists reference_image_url text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'team-media',
  'team-media',
  true,
  52428800,
  array['video/mp4', 'image/png', 'image/jpeg', 'image/webp']
)
on conflict (id) do nothing;

drop policy if exists "team_media_select_auth" on storage.objects;
create policy "team_media_select_auth" on storage.objects
  for select
  to authenticated
  using (bucket_id = 'team-media');

drop policy if exists "team_media_insert_auth" on storage.objects;
create policy "team_media_insert_auth" on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'team-media');

drop policy if exists "team_media_update_auth" on storage.objects;
create policy "team_media_update_auth" on storage.objects
  for update
  to authenticated
  using (bucket_id = 'team-media')
  with check (bucket_id = 'team-media');

drop policy if exists "team_media_delete_auth" on storage.objects;
create policy "team_media_delete_auth" on storage.objects
  for delete
  to authenticated
  using (bucket_id = 'team-media');
