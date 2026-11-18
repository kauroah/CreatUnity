-- CREATUNITY / Phase 5. Apply after migrations 001–003.
-- Content editors are assigned manually in SQL Editor (never from the browser).
create table public.content_editors (
 user_id uuid primary key references auth.users(id) on delete cascade,
 created_at timestamptz not null default now()
);
alter table public.content_editors enable row level security;
create policy "Editors can see own permission" on public.content_editors for select to authenticated using (user_id = (select auth.uid()));
revoke all on public.content_editors from public, anon, authenticated;
grant select on public.content_editors to authenticated;

create or replace function public.is_content_editor() returns boolean
language sql stable security definer set search_path = '' as $$
 select exists(select 1 from public.content_editors where user_id = (select auth.uid()))
$$;
revoke all on function public.is_content_editor() from public;
grant execute on function public.is_content_editor() to anon, authenticated;

create table public.magazine_articles (
 id uuid primary key default gen_random_uuid(),
 slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
 title text not null check (char_length(title) between 3 and 180),
 excerpt text not null default '' check (char_length(excerpt) <= 600),
 body text not null default '' check (char_length(body) <= 40000),
 category text not null default 'CULTURE' check (category in ('CULTURE','INTERVIEW','BACKSTAGE','VISUAL ESSAY')),
 cover_url text check (cover_url is null or (char_length(cover_url)<=700 and cover_url ~ '^https://')),
 author_name text not null default 'CREATUNITY EDITORIAL' check (char_length(author_name)<=120),
 reading_minutes int not null default 5 check (reading_minutes between 1 and 120),
 is_published boolean not null default false,
 published_at timestamptz,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create index magazine_published_idx on public.magazine_articles(published_at desc) where is_published;

create table public.fashion_events (
 id uuid primary key default gen_random_uuid(),
 slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
 title text not null check (char_length(title) between 3 and 180),
 summary text not null default '' check (char_length(summary)<=600),
 description text not null default '' check (char_length(description)<=12000),
 city text not null default '' check (char_length(city)<=120),
 venue text not null default '' check (char_length(venue)<=240),
 starts_at timestamptz not null,
 ends_at timestamptz not null,
 capacity int not null default 50 check (capacity between 1 and 100000),
 price_rub integer not null default 0 check (price_rub>=0),
 cover_url text check (cover_url is null or (char_length(cover_url)<=700 and cover_url ~ '^https://')),
 is_published boolean not null default false,
 created_at timestamptz not null default now(),
 constraint valid_event_time check(ends_at>starts_at)
);
create index fashion_events_start_idx on public.fashion_events(starts_at) where is_published;

create table public.workshops (
 id uuid primary key default gen_random_uuid(),
 slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
 title text not null check(char_length(title) between 3 and 180),
 summary text not null default '' check(char_length(summary)<=600),
 description text not null default '' check(char_length(description)<=12000),
 instructor text not null default '' check(char_length(instructor)<=120),
 delivery_mode text not null default 'ONLINE' check(delivery_mode in ('ONLINE','IN PERSON')),
 city text not null default '' check(char_length(city)<=120),
 starts_at timestamptz not null,
 capacity int not null default 12 check(capacity between 1 and 100000),
 price_rub integer not null default 0 check(price_rub>=0),
 cover_url text check (cover_url is null or (char_length(cover_url)<=700 and cover_url ~ '^https://')),
 is_published boolean not null default false,
 created_at timestamptz not null default now()
);

create table public.event_registrations (
 id uuid primary key default gen_random_uuid(),
 event_id uuid not null references public.fashion_events(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 status text not null default 'CONFIRMED' check(status in ('CONFIRMED','CANCELLED')),
 created_at timestamptz not null default now(),
 unique(event_id,user_id)
);
create index event_registrations_user_idx on public.event_registrations(user_id,created_at desc);

create table public.workshop_enrollments (
 id uuid primary key default gen_random_uuid(),
 workshop_id uuid not null references public.workshops(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 status text not null default 'ENROLLED' check(status in ('ENROLLED','CANCELLED')),
 created_at timestamptz not null default now(),
 unique(workshop_id,user_id)
);
create index workshop_enrollments_user_idx on public.workshop_enrollments(user_id,created_at desc);

-- Critical: enrollment and capacity checks happen together under a row lock.
-- Only free items can be reserved. Paid items require a payment provider later.
create or replace function public.reserve_free_event(p_event_id uuid) returns uuid
language plpgsql security definer set search_path = '' as $$
declare item public.fashion_events%rowtype; reg_id uuid; current_count int;
begin
 if auth.uid() is null then raise exception 'Please sign in'; end if;
 select * into item from public.fashion_events where id=p_event_id for update;
 if not found or not item.is_published then raise exception 'Event unavailable'; end if;
 if item.price_rub<>0 then raise exception 'Paid event requires checkout integration'; end if;
 if item.starts_at<=now() then raise exception 'Registration has closed'; end if;
 select id into reg_id from public.event_registrations where event_id=p_event_id and user_id=auth.uid() and status='CONFIRMED';
 if reg_id is not null then return reg_id; end if;
 select count(*) into current_count from public.event_registrations where event_id=p_event_id and status='CONFIRMED';
 if current_count>=item.capacity then raise exception 'Event is full'; end if;
 insert into public.event_registrations(event_id,user_id,status) values (p_event_id,auth.uid(),'CONFIRMED')
 on conflict (event_id,user_id) do update set status='CONFIRMED' returning id into reg_id;
 return reg_id;
end $$;

create or replace function public.reserve_free_workshop(p_workshop_id uuid) returns uuid
language plpgsql security definer set search_path = '' as $$
declare item public.workshops%rowtype; reg_id uuid; current_count int;
begin
 if auth.uid() is null then raise exception 'Please sign in'; end if;
 select * into item from public.workshops where id=p_workshop_id for update;
 if not found or not item.is_published then raise exception 'Workshop unavailable'; end if;
 if item.price_rub<>0 then raise exception 'Paid workshop requires checkout integration'; end if;
 if item.starts_at<=now() then raise exception 'Enrollment has closed'; end if;
 select id into reg_id from public.workshop_enrollments where workshop_id=p_workshop_id and user_id=auth.uid() and status='ENROLLED';
 if reg_id is not null then return reg_id; end if;
 select count(*) into current_count from public.workshop_enrollments where workshop_id=p_workshop_id and status='ENROLLED';
 if current_count>=item.capacity then raise exception 'Workshop is full'; end if;
 insert into public.workshop_enrollments(workshop_id,user_id,status) values (p_workshop_id,auth.uid(),'ENROLLED')
 on conflict (workshop_id,user_id) do update set status='ENROLLED' returning id into reg_id;
 return reg_id;
end $$;

revoke all on function public.reserve_free_event(uuid),public.reserve_free_workshop(uuid) from public;
grant execute on function public.reserve_free_event(uuid),public.reserve_free_workshop(uuid) to authenticated;

-- No direct client insert/update to registrations: RPC performs capacity checks.
do $$ declare tbl text; begin
 foreach tbl in array array['magazine_articles','fashion_events','workshops','event_registrations','workshop_enrollments'] loop
  execute format('alter table public.%I enable row level security',tbl);
 end loop;
end $$;
create policy "Published articles or editors" on public.magazine_articles for select to anon,authenticated using(is_published or public.is_content_editor());
create policy "Editors insert articles" on public.magazine_articles for insert to authenticated with check(public.is_content_editor());
create policy "Editors update articles" on public.magazine_articles for update to authenticated using(public.is_content_editor()) with check(public.is_content_editor());
create policy "Editors delete articles" on public.magazine_articles for delete to authenticated using(public.is_content_editor());
create policy "Published events or editors" on public.fashion_events for select to anon,authenticated using(is_published or public.is_content_editor());
create policy "Editors insert events" on public.fashion_events for insert to authenticated with check(public.is_content_editor());
create policy "Editors update events" on public.fashion_events for update to authenticated using(public.is_content_editor()) with check(public.is_content_editor());
create policy "Editors delete events" on public.fashion_events for delete to authenticated using(public.is_content_editor());
create policy "Published workshops or editors" on public.workshops for select to anon,authenticated using(is_published or public.is_content_editor());
create policy "Editors insert workshops" on public.workshops for insert to authenticated with check(public.is_content_editor());
create policy "Editors update workshops" on public.workshops for update to authenticated using(public.is_content_editor()) with check(public.is_content_editor());
create policy "Editors delete workshops" on public.workshops for delete to authenticated using(public.is_content_editor());
create policy "Read own event bookings" on public.event_registrations for select to authenticated using(user_id=(select auth.uid()) or public.is_content_editor());
create policy "Read own workshop bookings" on public.workshop_enrollments for select to authenticated using(user_id=(select auth.uid()) or public.is_content_editor());
revoke all on public.magazine_articles,public.fashion_events,public.workshops,public.event_registrations,public.workshop_enrollments from public,anon,authenticated;
grant select on public.magazine_articles,public.fashion_events,public.workshops to anon,authenticated;
grant insert,update,delete on public.magazine_articles,public.fashion_events,public.workshops to authenticated;
grant select on public.event_registrations,public.workshop_enrollments to authenticated;

-- Sample publication records. Images intentionally remain blank unless provided by owner.
insert into public.magazine_articles(slug,title,excerpt,body,category,author_name,reading_minutes,is_published,published_at) values
('the-new-collective','THE PEOPLE CHANGING THE LOCAL FASHION SCENE','The city has a new cast.','Новая сцена начинается с людей, которые решают делать вместе.\n\nУ независимой моды нет единого адреса. Она живёт в маленьких студиях, на съёмочных площадках и в переписках после полуночи.\n\nПокажи работу. Назови команду. Оставь пространство для того, что вы придумаете вместе.','CULTURE','CREATUNITY EDITORIAL',8,true,now()),
('after-the-show','AFTER THE SHOW','Backstage conversations, authors and collaboration.','Every production begins with people. Here we document the process and everyone who made it possible.','BACKSTAGE','CREATUNITY EDITORIAL',5,true,now()),
('material-feelings','MATERIAL FEELINGS','An editorial study of fashion and form.','A visual note on material, silhouette and the collaborative process.','VISUAL ESSAY','CREATUNITY EDITORIAL',7,true,now())
on conflict (slug) do nothing;
-- Historical dates in reference are *not* seeded as future bookable events; create real dates in /editorial/admin.
