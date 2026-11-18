-- CREATUNITY custom email/password authentication.
-- Apply after migrations 001-006. Supabase Auth is no longer the app identity store.
create table if not exists public.app_users (
 id uuid primary key default gen_random_uuid(),
 email text not null unique check (email = lower(trim(email))),
 password_hash text not null,
 email_verified_at timestamptz,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);

create table if not exists public.app_sessions (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references public.app_users(id) on delete cascade,
 token_hash text not null unique,
 expires_at timestamptz not null,
 revoked_at timestamptz,
 created_at timestamptz not null default now()
);
create index if not exists app_sessions_user_idx on public.app_sessions(user_id);

create table if not exists public.app_email_tokens (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references public.app_users(id) on delete cascade,
 purpose text not null check (purpose in ('verify_email','password_reset')),
 token_hash text not null unique,
 expires_at timestamptz not null,
 consumed_at timestamptz,
 created_at timestamptz not null default now()
);
create index if not exists app_email_tokens_user_idx on public.app_email_tokens(user_id,purpose);

create table if not exists public.app_login_attempts (
 email text primary key,
 failure_count integer not null default 0,
 blocked_until timestamptz,
 last_failure_at timestamptz not null default now()
);
alter table public.app_login_attempts enable row level security;

alter table public.app_users enable row level security;
alter table public.app_sessions enable row level security;
alter table public.app_email_tokens enable row level security;
revoke all on public.app_users,public.app_sessions,public.app_email_tokens,public.app_login_attempts from public,anon,authenticated;
grant all on public.app_users,public.app_sessions,public.app_email_tokens,public.app_login_attempts to service_role;
grant all on public.profiles to service_role;

create or replace function public.record_app_login_failure(p_email text) returns void
language plpgsql security definer set search_path = '' as $$
begin
 insert into public.app_login_attempts(email,failure_count,last_failure_at)
 values (p_email,1,now())
 on conflict(email) do update set
  failure_count=case when public.app_login_attempts.last_failure_at < now()-interval '15 minutes'
   then 1 else public.app_login_attempts.failure_count+1 end,
  blocked_until=case
   when public.app_login_attempts.last_failure_at < now()-interval '15 minutes' then null
   when public.app_login_attempts.failure_count>=9 then now()+interval '15 minutes'
   else public.app_login_attempts.blocked_until end,
  last_failure_at=now();
end; $$;
revoke all on function public.record_app_login_failure(text) from public,anon,authenticated;
grant execute on function public.record_app_login_failure(text) to service_role;

create or replace function public.consume_app_password_reset(p_token_hash text,p_password_hash text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare v_user_id uuid; v_now timestamptz := now();
begin
 update public.app_email_tokens set consumed_at=v_now
 where token_hash=p_token_hash and purpose='password_reset' and consumed_at is null and expires_at>v_now
 returning user_id into v_user_id;
 if v_user_id is null then raise exception 'Password reset token is invalid or expired'; end if;
 update public.app_users set password_hash=p_password_hash where id=v_user_id;
 update public.app_sessions set revoked_at=v_now where user_id=v_user_id and revoked_at is null;
 return v_user_id;
end; $$;
revoke all on function public.consume_app_password_reset(text,text) from public,anon,authenticated;
grant execute on function public.consume_app_password_reset(text,text) to service_role;

-- Custom app identities own profiles and user-facing records from this point forward.
alter table public.profiles drop constraint if exists profiles_id_fkey;
-- Preserve existing dossier rows; new users receive a profile through the trigger below.

alter table public.content_editors drop constraint if exists content_editors_user_id_fkey;
alter table public.content_editors add constraint content_editors_user_id_fkey
 foreign key (user_id) references public.profiles(id) on delete cascade;
alter table public.event_registrations drop constraint if exists event_registrations_user_id_fkey;
alter table public.event_registrations add constraint event_registrations_user_id_fkey
 foreign key (user_id) references public.profiles(id) on delete cascade;
alter table public.workshop_enrollments drop constraint if exists workshop_enrollments_user_id_fkey;
alter table public.workshop_enrollments add constraint workshop_enrollments_user_id_fkey
 foreign key (user_id) references public.profiles(id) on delete cascade;

drop trigger if exists on_auth_user_created_creatunity on auth.users;

create or replace function public.create_profile_for_new_app_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
 insert into public.profiles(id,full_name)
 values (new.id,'New Creator') on conflict(id) do nothing;
 return new;
end; $$;
drop trigger if exists on_app_user_created_creatunity on public.app_users;
create trigger on_app_user_created_creatunity after insert on public.app_users
 for each row execute function public.create_profile_for_new_app_user();

create or replace function public.set_app_user_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin new.updated_at=now();return new;end; $$;
drop trigger if exists set_app_users_updated_at on public.app_users;
create trigger set_app_users_updated_at before update on public.app_users
 for each row execute function public.set_app_user_updated_at();
