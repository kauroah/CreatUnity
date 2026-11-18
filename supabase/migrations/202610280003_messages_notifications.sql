-- Phase 4: private, project-scoped conversations and activity inbox.
-- Apply after 202610280002_projects_collaborations.sql.
create table public.conversations (
 id uuid primary key default gen_random_uuid(),
 project_id uuid not null references public.projects(id) on delete cascade,
 creator_id uuid not null references public.profiles(id) on delete cascade,
 collaborator_id uuid not null references public.profiles(id) on delete cascade,
 created_at timestamptz not null default now(),
 unique(project_id,creator_id,collaborator_id),
 check(creator_id<>collaborator_id)
);
create table public.messages (
 id uuid primary key default gen_random_uuid(),
 conversation_id uuid not null references public.conversations(id) on delete cascade,
 sender_id uuid not null references public.profiles(id) on delete cascade,
 body text not null check (char_length(trim(body)) between 1 and 2000),
 created_at timestamptz not null default now()
);
create index messages_thread_idx on public.messages(conversation_id,created_at desc);
create table public.notifications (
 id uuid primary key default gen_random_uuid(),
 recipient_user_id uuid not null references public.profiles(id) on delete cascade,
 actor_user_id uuid references public.profiles(id) on delete set null,
 type text not null check(type in ('application_received','application_accepted','application_declined','message_received')),
 title text not null check (char_length(title) between 1 and 140),
 body text not null default '' check(char_length(body)<=300),
 entity_type text not null check (entity_type in ('project','conversation')),
 entity_id uuid not null,
 created_at timestamptz not null default now(),
 read_at timestamptz
);
create index notifications_recipient_idx on public.notifications(recipient_user_id,created_at desc);
create index notifications_unread_idx on public.notifications(recipient_user_id,created_at desc) where read_at is null;

-- SECURITY DEFINER helper avoids recursive conversation RLS and never accepts an arbitrary user argument.
create function public.phase4_is_participant(cid uuid) returns boolean
language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.conversations c where c.id=cid and (c.creator_id=(select auth.uid()) or c.collaborator_id=(select auth.uid())))
$$;
revoke all on function public.phase4_is_participant(uuid) from public;
grant execute on function public.phase4_is_participant(uuid) to authenticated;

-- Create a thread ONLY when a project owner and an accepted team member are connected.
-- RPC is idempotent and checks all inputs; clients cannot directly insert conversations.
create function public.phase4_start_conversation(p_project_id uuid,p_collaborator_id uuid) returns uuid
language plpgsql security definer set search_path='' as $$
declare owner uuid; thread_id uuid; caller uuid := auth.uid();
begin
 if caller is null then raise exception 'Sign in required'; end if;
 select p.owner_id into owner from public.projects p where p.id=p_project_id;
 if owner is null then raise exception 'Project does not exist'; end if;
 if p_collaborator_id=owner or not (caller=owner or caller=p_collaborator_id) then raise exception 'Not authorized'; end if;
 if not exists(select 1 from public.project_members pm where pm.project_id=p_project_id and pm.user_id=p_collaborator_id) then raise exception 'Not a confirmed collaborator'; end if;
 insert into public.conversations(project_id,creator_id,collaborator_id)
 values(p_project_id,owner,p_collaborator_id)
 on conflict(project_id,creator_id,collaborator_id) do update set project_id=excluded.project_id
 returning id into thread_id;
 return thread_id;
end $$;
revoke all on function public.phase4_start_conversation(uuid,uuid) from public;
grant execute on function public.phase4_start_conversation(uuid,uuid) to authenticated;

alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.notifications enable row level security;
create policy conversations_participants_read on public.conversations for select to authenticated
 using(creator_id=(select auth.uid()) or collaborator_id=(select auth.uid()));
create policy messages_participants_read on public.messages for select to authenticated
 using(public.phase4_is_participant(conversation_id));
create policy messages_participants_send on public.messages for insert to authenticated
 with check(sender_id=(select auth.uid()) and public.phase4_is_participant(conversation_id));
create policy notifications_private_read on public.notifications for select to authenticated
 using(recipient_user_id=(select auth.uid()));
create policy notifications_private_update on public.notifications for update to authenticated
 using(recipient_user_id=(select auth.uid())) with check(recipient_user_id=(select auth.uid()));

-- Only allow changing read_at. Neither recipient nor notification content is writable by clients.
revoke all on public.conversations,public.messages,public.notifications from public,anon,authenticated;
grant select on public.conversations,public.messages,public.notifications to authenticated;
grant insert on public.messages to authenticated;
grant update(read_at) on public.notifications to authenticated;

create function public.phase4_notify_message() returns trigger language plpgsql security definer set search_path='' as $$
declare c public.conversations%rowtype; recipient uuid;
begin
 select * into c from public.conversations where id=new.conversation_id;
 recipient:=case when new.sender_id=c.creator_id then c.collaborator_id else c.creator_id end;
 insert into public.notifications(recipient_user_id,actor_user_id,type,title,body,entity_type,entity_id)
 values(recipient,new.sender_id,'message_received','NEW MESSAGE','A collaborator sent you a message.','conversation',new.conversation_id);
 return new;
end $$;
create trigger phase4_message_notification after insert on public.messages for each row execute function public.phase4_notify_message();

create function public.phase4_notify_application() returns trigger language plpgsql security definer set search_path='' as $$
declare owner uuid;
begin
 select owner_id into owner from public.projects where id=new.project_id;
 if tg_op='INSERT' then
  insert into public.notifications(recipient_user_id,actor_user_id,type,title,body,entity_type,entity_id)
  values(owner,new.applicant_id,'application_received','NEW APPLICATION','A creator applied to your open call.','project',new.project_id);
 elsif old.status='PENDING' and new.status in ('ACCEPTED','DECLINED') then
  insert into public.notifications(recipient_user_id,actor_user_id,type,title,body,entity_type,entity_id)
  values(new.applicant_id,owner,case when new.status='ACCEPTED' then 'application_accepted' else 'application_declined' end,
   case when new.status='ACCEPTED' then 'APPLICATION ACCEPTED' else 'APPLICATION UPDATE' end,
   case when new.status='ACCEPTED' then 'You have joined the creative team.' else 'Your application was not selected.' end,
   'project',new.project_id);
 end if;
 return new;
end $$;
create trigger phase4_application_notification after insert or update of status on public.project_applications
 for each row execute function public.phase4_notify_application();

-- Supabase Realtime: RLS remains the authorization boundary for postgres_changes.
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.notifications;
