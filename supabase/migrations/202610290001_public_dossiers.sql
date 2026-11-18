-- CREATUNITY / Published dossiers + profile photography
alter table public.profiles add column if not exists is_published boolean not null default false;
alter table public.profiles add column if not exists published_at timestamptz;
create index if not exists profiles_public_idx on public.profiles (published_at desc) where is_published = true;
-- Previously all profiles could be queried. Unpublished profiles are now private to their owners.
drop policy if exists "Profiles are readable publicly" on public.profiles;
create policy "Published profiles or own dossier" on public.profiles for select to anon,authenticated
 using (is_published = true or (select auth.uid()) = id);
-- Only owners may update their dossier; existing update policy stays in place.
grant update (is_published, published_at) on public.profiles to authenticated;
-- Database-enforced publication requirements, including storage-backed photo.
create or replace function public.validate_dossier_publication() returns trigger language plpgsql set search_path = '' as $$
begin
 if new.is_published then
  if length(trim(new.full_name)) < 2 or length(trim(new.role)) < 2 or length(trim(new.city)) < 2 or length(trim(new.bio)) < 30 or new.avatar_url is null or length(trim(new.avatar_url)) < 1 then
   raise exception 'Complete name, role, city, bio (30+ characters), and photo before publishing.';
  end if;
  if new.avatar_url !~ ('^' || new.id::text || '/[A-Za-z0-9._-]+$') then
   raise exception 'Profile photo must be an uploaded file in your own avatar folder.';
  end if;
  if old.is_published is distinct from true then new.published_at = now(); end if;
 else
  new.published_at = null;
 end if;
 return new;
end $$;
drop trigger if exists validate_dossier_publication on public.profiles;
create trigger validate_dossier_publication before update on public.profiles for each row execute function public.validate_dossier_publication();
-- Public image URLs only; directory listings and writes are restricted.
insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('creator-avatars','creator-avatars',true,5242880,array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public=true,file_size_limit=5242880,allowed_mime_types=array['image/jpeg','image/png','image/webp'];
drop policy if exists "Avatar owner upload" on storage.objects;
create policy "Avatar owner upload" on storage.objects for insert to authenticated
 with check(bucket_id='creator-avatars' and (storage.foldername(name))[1]=(select auth.uid())::text);
drop policy if exists "Avatar owner update" on storage.objects;
create policy "Avatar owner update" on storage.objects for update to authenticated
 using(bucket_id='creator-avatars' and (storage.foldername(name))[1]=(select auth.uid())::text)
 with check(bucket_id='creator-avatars' and (storage.foldername(name))[1]=(select auth.uid())::text);
drop policy if exists "Avatar owner delete" on storage.objects;
create policy "Avatar owner delete" on storage.objects for delete to authenticated
 using(bucket_id='creator-avatars' and (storage.foldername(name))[1]=(select auth.uid())::text);
-- Individual public avatar URLs work because the bucket is public; object listings are not granted here.
