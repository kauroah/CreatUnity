# CREATUNITY Phase 2: setup

Keep your existing `.env.local` containing `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, and `NEXT_PUBLIC_SITE_URL`. Do not publish this file. The custom authentication implementation also requires server-only `SUPABASE_SERVICE_ROLE_KEY` and `SUPABASE_JWT_SECRET` values, plus `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, and `SMTP_FROM`. Never add a `NEXT_PUBLIC_` prefix to secrets.

1. `npm install`
2. Run migrations 001–006 in order if they have not already been applied.
3. In Supabase Dashboard → SQL Editor, apply `supabase/migrations/202611180001_custom_auth.sql`.
4. Copy the project service-role key and legacy JWT secret from the Supabase project settings into the server-only variables above. The JWT secret is used only to sign short-lived database tokens; never expose or commit it.
5. Configure SMTP credentials for your mail provider. Registration verification and password reset emails cannot be sent without them.
6. `npm run dev`
7. Open `/register`, verify the address from the delivered email, then `/login` and `/account`. Edit at `/account/edit` and preview at `/people/u/<your-user-id>`.

## What changed
- CREATUNITY-owned password hashes, email-verification and reset tokens, revocable HttpOnly sessions, and short-lived Supabase database JWTs.
- Supabase RLS remains active for app data; the service-role key is used only by server-side authentication code.
- New `/account` route supersedes the original placeholder and requires authentication; `/people` continues to show original Figma demo creators, `/people/live` shows Supabase records.
- SQL migration creates public dossiers on signup and protects updates via RLS.

## Important notes
- These are public dossiers: names, role, city, bio, and website can be seen by anyone; avoid putting private data there.
- Existing Supabase Auth accounts are not migrated. Register fresh accounts after applying the custom-auth migration. Existing dossier rows are preserved, but they are not automatically attached to new accounts.
- Passwords are stored as scrypt hashes; raw passwords and email-token values are never stored in the database.
- Do not use real payment information or confidential data in demo routes.
- Real profiles currently use text fields only; photo upload and production image storage are a later task.
- Migration has not been executed against your hosted Supabase instance from this environment.
