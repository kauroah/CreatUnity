-- CREATUNITY / Phase 2 / Creator dossiers
-- Run via Supabase CLI or SQL editor.
create table if not exists public.profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 full_name text not null default 'New Creator' check (char_length(full_name) between 2 and 100),
 role text not null default '' check (char_length(role)<=100),
 city text not null default '' check (char_length(city)<=100),
 bio text not null default '' check (char_length(bio)<=2000),
 website text check (website is null or (char_length(website)<=350 and website ~* '^https?://')),
 avatar_url text,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create index if not exists profiles_created_at_idx on public.profiles(created_at desc);
alter table public.profiles enable row level security;
create policy "Profiles are readable publicly" on public.profiles for select to anon, authenticated using (true);
create policy "Users update only own profile" on public.profiles for update to authenticated using ((select auth.uid())=id) with check ((select auth.uid())=id);
-- No client insert or delete policy; auth signup trigger inserts a profile.
create or replace function public.create_profile_for_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
 insert into public.profiles(id,full_name) values (new.id, left(coalesce(nullif(trim(new.raw_user_meta_data ->> 'full_name'),''), 'New Creator'),100)) on conflict(id) do nothing;
 return new;
end; $$;
drop trigger if exists on_auth_user_created_creatunity on auth.users;
create trigger on_auth_user_created_creatunity after insert on auth.users
 for each row execute function public.create_profile_for_new_user();
-- Backfill accounts created before this migration.
insert into public.profiles(id,full_name)
select id,left(coalesce(nullif(trim(raw_user_meta_data ->> 'full_name'),''),'New Creator'),100) from auth.users
on conflict(id) do nothing;
create or replace function public.set_profile_updated_at() returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at = now();return new;end; $$;
drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at before update on public.profiles
for each row execute function public.set_profile_updated_at();
-- Limit access to intended roles.
revoke all on public.profiles from public;
grant select on public.profiles to anon, authenticated;
grant update (full_name,role,city,bio,website,avatar_url) on public.profiles to authenticated;
