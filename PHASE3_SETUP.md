# CREATUNITY / PHASE 3

## Upgrade instructions

1. **Back up your running Phase 2 project and commit it to Git.** Phase 3 ZIP includes Phase 2 and Phase 3 files. Copy your **existing** `.env.local` into this upgraded folder; do not commit it.
2. In Supabase **SQL Editor**, run `supabase/migrations/202610280002_projects_collaborations.sql` once. If you use Supabase CLI, apply only unapplied migrations with your normal migration workflow.
3. Run `npm install` and `npm run dev`.
4. Sign in and visit `/projects/create`. Add a comma-separated list of required roles. Choose **Save Draft** or **Publish Project**.
5. Visit `/account/projects` to manage status and review applications. Public open calls are at `/projects`.
6. Sign in as a **second** account, open `/projects`, and apply for an open role. Sign back in as the owner to accept the application.
7. As the applicant, check `/account/collaborations` for your confirmed membership.

## Security model

- Auth is checked via Supabase `auth.getUser()` in Server Actions.
- Projects are public only when `OPEN` or `COMPLETED`; drafts are owner-only.
- Roles are public only when their project is readable.
- Applications are visible only to the applicant and project owner; only owner can accept/decline.
- `project_members` has **no client insert/update/delete grants or policies**. Trigger creates membership only after accepted application.
- Role acceptance obtains a row lock and checks slots before adding the member.
- Applicant identity/role/message cannot be altered after submission. Duplicate role applications are blocked.
- Secrets: only existing public Supabase URL and publishable key required. Never add a service-role key to browser code.

## Known scope limitations

- This release covers project publishing, open-call applications, owner review and accepted collaborators. **Direct personal invitations, image uploads, editable published projects, messaging, notifications and payment are not yet implemented.**
- Existing static Work Archive and creator-dossier examples remain alongside real projects; `/projects` is the live open-call listing.
- Reference is desktop-only; mobile behavior is an adaptation.
- Do not rely on mock assets as production imagery.

## Test checklist

- Anonymous viewer can read public projects but not drafts, applicants or private memberships.
- Creator A cannot edit creator B's project or accept B's applications.
- Creator cannot apply to their own project, duplicate an application, or apply to draft/completed project.
- Creator cannot insert a member directly or self-accept an application.
- Owner cannot accept more applicants than the role's `slots`.
- Declined/accepted applications cannot be transitioned again.
- Both applicant and owner can view accepted team results.
