# CREATUNITY / PHASE 6 — Publishing desk, media, launch hardening

This archive is cumulative: phases 1–6. It preserves the established design and existing auth/database setup.

## Upgrade

1. Back up the working Phase 5 folder and Supabase database.
2. Unzip this release and copy your existing `.env.local` over (never commit it).
3. In the **same** Supabase project, run **only** `supabase/migrations/202610280005_media_hardening.sql` in SQL Editor. Do not rerun migrations 001–004.
4. In Supabase Storage, confirm the `editorial-media` bucket exists and is public, with 5 MB size limit and JPG/PNG/WEBP/AVIF types.
5. Run `npm install`, `npx tsc --noEmit`, `npm run build`, and `npm run dev`.
6. Sign in with an editor account at `/editorial/admin`. Upload a cover and publish an article. Confirm the cover renders on `/magazine` and the article detail.
7. Use the management list below the form to unpublish and republish an article, event or workshop; test both an editor and a normal user.

**Important:** Publish management currently changes publication status, not full record editing. To update a record's content, save using the same slug in the editor form. Existing covers are preserved when no new cover is uploaded. Uploaded objects are not automatically deleted when records are removed. No payment integration has been added.

## Production configuration

- Set `NEXT_PUBLIC_SITE_URL=https://YOUR_DOMAIN` in your deployment environment. It determines sitemap entries and metadata origin. Use your verified domain, not the sample value.
- Set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, and `SUPABASE_JWT_SECRET`. **Never expose or commit either server-only secret.**
- Configure `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, and `SMTP_FROM` for custom verification and password-reset email delivery.
- Use HTTPS and test custom email verification, password reset, session refresh, and sign-out on your domain.
- Use a Vercel or comparable Next.js host, link a Git repository, and set environment variables in the hosting dashboard.
- Confirm `/robots.txt` and `/sitemap.xml`; account and admin routes are disallowed for indexing. Robots rules are not an authorization mechanism.
- Set up error monitoring, database backup policies, and a staging environment before taking payments or real event registrations.

## Security verification checklist

- Non-editor cannot access `/editorial/admin` or upload editorial media.
- Anonymous users can view published records but not drafts or editorial uploads.
- Users cannot publish content or toggle status through direct client API requests.
- Upload rejects unsupported MIME and files over 5 MB. Test oversized upload server-side as well as UI-side.
- Only intended `editorial-media` objects are publicly accessible; never upload private user data to this bucket.
- Messages, private profiles, and application decisions retain their earlier RLS restrictions.
- Visit an unknown URL to confirm the existing bespoke 404 still works.

## Deferred (not implemented)

- Payment processor, paid admissions, refunds and PCI-compliant checkout.
- True responsive rich-text editor; image crop/reorder and full asset library UI.
- Automated end-to-end test suite, observability integrations and legal/compliance review.
- Production deployment (requires your account/domain access).

## Verification status

The ZIP is generated here. Local dependency installation and a production build may need to be executed on your machine. No live Supabase migration or deployment was performed from this environment.
