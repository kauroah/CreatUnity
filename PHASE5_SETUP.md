# CREATUNITY Phase 5 — Magazine, Events, Education, Custom 404

## Install
1. Keep a backup of your working Phase 4 application.
2. Unzip this cumulative project into a new folder. Copy your **own** `.env.local`; it is not included.
3. Apply only `supabase/migrations/202610280004_editorial_events_education.sql` in Supabase SQL Editor. Requires Phase 2–4 migrations already applied.
4. Run `npm install && npm run dev`.
5. Test `/magazine`, `/events`, `/education`, `/editorial/admin`, `/account/passes`, `/account/workshops`, and `/a-nonexistent-route`.

## Assign editor access
Only a trusted operator with access to the Supabase SQL Editor should run:

```sql
insert into public.content_editors(user_id)
values ('REPLACE_WITH_EXISTING_AUTH_USER_UUID')
on conflict (user_id) do nothing;
```

Look up the UUID in Supabase → Authentication → Users. Never allow regular users to grant themselves this role. The editor can use `/editorial/admin`. The form uses different fields based on selected content type, ignores irrelevant fields on submit, and updates an existing record when the slug matches.

## Publication/booking behavior
- The migration seeds **three example magazine articles**, using the supplied design's editorial themes; seed prose is demo content, not verified reportage.
- Create events and workshops with **future dates** in the editor. Figma's sample November 2026 dates are not automatically treated as bookable inventory.
- **Free** events/workshops can be reserved by authenticated users. Server-side Postgres RPC locks the item to avoid exceeding capacity.
- **Paid** events/workshops show an explicit payment-integration notice; no booking or fake payment is allowed.
- Existing registrations appear under `/account/passes` and workshop enrollments under `/account/workshops`.
- All new routes use existing CREATUNITY editorial design and dynamic slug-based detail pages.
- `src/app/not-found.tsx` provides a branded archival 404 layout. Unknown magazine, event and workshop slugs also use it.

## QA checklist
- User without editor role cannot create or edit publication records. Test through REST API, not only UI.
- Anonymous users see only published content; unpublished slugs return 404.
- Anonymous users cannot reserve; authenticated users cannot reserve paid/past/full events.
- Repeated reservations remain idempotent.
- One user cannot view another's bookings.
- Check mobile layout and build (`npx tsc --noEmit`, `npm run build`) locally before deployment.

## Deliberately not included
No external payment provider, refunds, cancellation interface, automated email tickets, QR validation, media upload, or drag-and-drop rich-text editor. Those require additional workflows and security reviews.
