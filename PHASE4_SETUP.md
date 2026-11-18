# CREATUNITY — Phase 4: Private Messaging & Notifications

## Upgrade

1. **Back up / commit your working Phase 3 folder.** The Phase 4 ZIP is a complete cumulative project.
2. Copy your existing `.env.local` to the extracted project root. Keep `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` as-is. Never upload `.env.local` to Git.
3. In Supabase → SQL Editor, run **only** `supabase/migrations/202610280003_messages_notifications.sql` against the database that already has Phase 2 and Phase 3. Do not rerun earlier migrations.
4. Run `npm install`, `npm run dev`.
5. With account A, publish a project. Account B applies; A accepts the application. In A's `/account/projects/[id]` open **MESSAGE COLLABORATOR**. B can use `/account/collaborations` → **MESSAGE PROJECT OWNER**. Both see the thread under `/messages`.
6. Send messages from either session; the conversation uses Supabase Realtime `postgres_changes` to refresh the latest 100 messages. Notifications at `/notifications` are generated for applications, decisions, and messages.
7. For live refresh, Supabase Realtime must be enabled for these tables (migration adds `messages` and `notifications` to `supabase_realtime`). If subscription is unavailable, messages can still be read by reloading the thread.

## Security properties

- Conversation creation is via `phase4_start_conversation`, a `SECURITY DEFINER` RPC with `auth.uid()` checks. Only the project owner and an **accepted** project member can open a thread. It cannot target an arbitrary user. Direct client insert/update/delete grants on conversations are revoked.
- RLS on conversations and messages limits reads to the two participants. Message inserts require `sender_id = auth.uid()` and participation. Messages are immutable.
- Notifications are inserted only through database triggers; users only read their own inbox and can change `read_at`, not the notification content or recipient.
- No service-role key is used in client or server app code.
- New message notifications are created once by a DB trigger, even if clients reconnect or retry reads. Multiple deliberately repeated sends create multiple messages and notifications.

## Manual QA — use **two real test accounts**

- [ ] A and B with no shared accepted collaboration **cannot** create a thread.
- [ ] After A accepts B, A and B can each open the same thread; reload preserves messages.
- [ ] A third account C cannot read any conversation or message, or insert into that conversation (test via authenticated Supabase client).
- [ ] B cannot impersonate A using a different `sender_id`.
- [ ] B application creates a notification for A; A's acceptance creates a notification for B.
- [ ] A new message creates a notification **only** for the recipient.
- [ ] Marking notifications read changes only the current user's rows.
- [ ] Live updates reach both signed-in clients (subject to Realtime being enabled and connected).
- [ ] Check tablet/mobile composer layout, keyboard focus, and line wrapping.

## Scope notes

- Messaging is deliberately **project-scoped and limited to accepted collaborators**. Direct unsolicited DMs, attachments, typing indicators, read receipts, and push notifications are future features.
- The notification inbox holds the newest 100 records. Conversation view holds the latest 100 messages, without older-message pagination yet.
- Server operations use Phase 2 auth; public demonstration profiles are not messageable.
- The actual SQL migration must be tested in your Supabase project; it has **not** been executed remotely by this deliverable.
