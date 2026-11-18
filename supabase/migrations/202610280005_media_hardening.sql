-- CREATUNITY Phase 6. Run only after migration 004.
-- Publicly readable published editorial imagery. Only approved editors may modify objects.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('editorial-media','editorial-media',true,5242880,array['image/jpeg','image/png','image/webp','image/avif'])
on conflict (id) do update set public=excluded.public,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;

create policy "Editorial media: editor uploads" on storage.objects
for insert to authenticated with check (bucket_id='editorial-media' and public.is_content_editor());
create policy "Editorial media: editor updates" on storage.objects
for update to authenticated using (bucket_id='editorial-media' and public.is_content_editor())
with check (bucket_id='editorial-media' and public.is_content_editor());
create policy "Editorial media: editor deletes" on storage.objects
for delete to authenticated using (bucket_id='editorial-media' and public.is_content_editor());
-- Public bucket read uses Supabase Storage public delivery URLs; public SQL SELECT is permitted for these objects.
create policy "Editorial media: public read" on storage.objects
for select to anon,authenticated using (bucket_id='editorial-media');
