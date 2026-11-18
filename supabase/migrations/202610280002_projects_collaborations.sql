-- Phase 3: project collaboration / apply after Phase 2 migration.
create table public.projects (
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null references public.profiles(id) on delete cascade,
 title text not null check (char_length(title) between 3 and 140),
 category text not null default 'EDITORIAL' check (category in ('EDITORIAL','CAMPAIGN','RUNWAY','OTHER')),
 city text not null default '' check (char_length(city)<=100),
 project_date date,
 description text not null default '' check (char_length(description)<=4000),
 compensation text not null default 'DISCUSS' check (compensation in ('PAID','UNPAID','DISCUSS')),
 status text not null default 'DRAFT' check (status in ('DRAFT','OPEN','COMPLETED','CANCELLED')),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index projects_public_idx on public.projects(status,created_at desc);
create index projects_owner_idx on public.projects(owner_id,updated_at desc);
create table public.project_roles (
 id uuid primary key default gen_random_uuid(),
 project_id uuid not null references public.projects(id) on delete cascade,
 title text not null check (char_length(title) between 2 and 80),
 slots integer not null default 1 check (slots between 1 and 50),
 created_at timestamptz not null default now(), unique(project_id,title), unique(id,project_id)
);
create table public.project_applications (
 id uuid primary key default gen_random_uuid(),
 project_id uuid not null references public.projects(id) on delete cascade,
 role_id uuid not null,
 applicant_id uuid not null references public.profiles(id) on delete cascade,
 message text not null check (char_length(message) between 10 and 2000),
 status text not null default 'PENDING' check (status in ('PENDING','ACCEPTED','DECLINED','WITHDRAWN')),
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 foreign key(role_id,project_id) references public.project_roles(id,project_id) on delete cascade,
 unique(project_id,role_id,applicant_id)
);
create index application_owner_idx on public.project_applications(project_id,status);
create index application_applicant_idx on public.project_applications(applicant_id,created_at desc);
create table public.project_members (
 project_id uuid not null references public.projects(id) on delete cascade,
 user_id uuid not null references public.profiles(id) on delete cascade,
 role_id uuid not null,
 joined_at timestamptz not null default now(),
 primary key(project_id,user_id,role_id),
 foreign key(role_id,project_id) references public.project_roles(id,project_id) on delete cascade
);
create index project_members_user_idx on public.project_members(user_id);
-- All mutations are checked by RLS and triggers; no service-role key needed.
alter table public.projects enable row level security;
alter table public.project_roles enable row level security;
alter table public.project_applications enable row level security;
alter table public.project_members enable row level security;
create policy projects_read on public.projects for select to anon,authenticated using (status in ('OPEN','COMPLETED') or owner_id=(select auth.uid()));
create policy projects_insert on public.projects for insert to authenticated with check(owner_id=(select auth.uid()));
create policy projects_update on public.projects for update to authenticated using(owner_id=(select auth.uid())) with check(owner_id=(select auth.uid()));
create policy projects_delete on public.projects for delete to authenticated using(owner_id=(select auth.uid()));
create policy roles_read on public.project_roles for select to anon,authenticated using(exists(select 1 from public.projects p where p.id=project_id));
create policy roles_insert on public.project_roles for insert to authenticated with check(exists(select 1 from public.projects p where p.id=project_id and p.owner_id=(select auth.uid())));
create policy roles_update on public.project_roles for update to authenticated using(exists(select 1 from public.projects p where p.id=project_id and p.owner_id=(select auth.uid()))) with check(exists(select 1 from public.projects p where p.id=project_id and p.owner_id=(select auth.uid())));
create policy roles_delete on public.project_roles for delete to authenticated using(exists(select 1 from public.projects p where p.id=project_id and p.owner_id=(select auth.uid())));
create policy applications_read on public.project_applications for select to authenticated using(applicant_id=(select auth.uid()) or exists(select 1 from public.projects p where p.id=project_id and p.owner_id=(select auth.uid())));
create policy applications_insert on public.project_applications for insert to authenticated with check(applicant_id=(select auth.uid()) and status='PENDING' and exists(select 1 from public.projects p where p.id=project_id and p.status='OPEN' and p.owner_id<>(select auth.uid())));
create policy applications_withdraw on public.project_applications for delete to authenticated using(applicant_id=(select auth.uid()) and status='PENDING');
create policy members_read on public.project_members for select to authenticated using(user_id=(select auth.uid()) or exists(select 1 from public.projects p where p.id=project_id and p.owner_id=(select auth.uid())) or exists(select 1 from public.projects p where p.id=project_id and p.status in ('OPEN','COMPLETED')));
-- Deny direct client writes to project_members. A secured trigger inserts them after acceptance.
create or replace function public.phase3_guard_application() returns trigger language plpgsql security definer set search_path = '' as $$
declare owner uuid; st text; taken integer; capacity integer;
begin
 select p.owner_id,p.status into owner,st from public.projects p where p.id=new.project_id;
 if tg_op='UPDATE' then
  if new.project_id<>old.project_id or new.role_id<>old.role_id or new.applicant_id<>old.applicant_id or new.message<>old.message then raise exception 'Application fields are immutable'; end if;
  if (select auth.uid()) is distinct from owner then raise exception 'Only project owner may review'; end if;
  if old.status<>'PENDING' or new.status not in ('ACCEPTED','DECLINED') or st<>'OPEN' then raise exception 'Invalid transition'; end if;
  if new.status='ACCEPTED' then
   select r.slots into capacity from public.project_roles r where r.id=new.role_id and r.project_id=new.project_id for update;
   select count(*) into taken from public.project_members m where m.project_id=new.project_id and m.role_id=new.role_id;
   if taken>=capacity then raise exception 'Role is full'; end if;
  end if;
 else
  if new.status<>'PENDING' or new.applicant_id is distinct from (select auth.uid()) or st<>'OPEN' or owner=(select auth.uid()) then raise exception 'Not eligible to apply'; end if;
 end if;
 return new;
end $$;
create trigger phase3_application_guard before insert or update on public.project_applications for each row execute function public.phase3_guard_application();
create or replace function public.phase3_accept_member() returns trigger language plpgsql security definer set search_path = '' as $$
begin
 if old.status<>'ACCEPTED' and new.status='ACCEPTED' then
  insert into public.project_members(project_id,user_id,role_id) values(new.project_id,new.applicant_id,new.role_id) on conflict do nothing;
 end if;
 return new;
end $$;
create trigger phase3_member_after_accept after update on public.project_applications for each row execute function public.phase3_accept_member();
create policy applications_owner_review on public.project_applications for update to authenticated using(exists(select 1 from public.projects p where p.id=project_id and p.owner_id=(select auth.uid()))) with check(exists(select 1 from public.projects p where p.id=project_id and p.owner_id=(select auth.uid())));
-- Restrict update to status alone and prevent forging ownership, status or identity fields.
revoke all on public.projects,public.project_roles,public.project_applications,public.project_members from public,anon,authenticated;
grant select on public.projects,public.project_roles to anon,authenticated;
grant insert,update,delete on public.projects,public.project_roles to authenticated;
grant select on public.project_applications,public.project_members to authenticated;
grant insert,delete on public.project_applications to authenticated;
grant update(status) on public.project_applications to authenticated;
create or replace function public.phase3_touch_updated_at() returns trigger language plpgsql set search_path = '' as $$ begin new.updated_at=now();return new;end $$;
create trigger phase3_projects_touch before update on public.projects for each row execute function public.phase3_touch_updated_at();
create trigger phase3_applications_touch before update on public.project_applications for each row execute function public.phase3_touch_updated_at();
