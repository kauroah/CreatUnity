# CREATUNITY — Dialogue system (Revision 02)

This package extends Phase 6 Official Logo Edition. It preserves existing profiles, projects, messaging, publishing and the official branding. Authentication is managed by CREATUNITY; Supabase Auth is not used by the application.

## Applied to real workflows
- `/login` — modal sign-in, using existing `signIn` server action.
- `/register` — modal dossier registration, using existing `signUp` server action.
- `/reset-access` — custom password-reset email request.
- `/auth/update-password` — password update using a single-use custom reset token.
- `/projects/[id]` — Apply to Project modal, submitting to existing `applyForRole` server action.
- `/account` — sign-out confirmation modal, using existing `signOut` server action.

## Design QA
- `/dialogues` — visual reference gallery for all 32 English transaction record designs in the uploaded PDF. The gallery is *preview-only*: its CTA closes the preview, never completes an actual transaction. Do not use it as evidence of backend features.
- Shared components: `src/components/dialogues/dialog-shell.tsx`, `dialog-gallery.tsx` and dedicated flow components.
- Styles are appended to `src/app/globals.css` under `CREATUNITY / REVISION 02 — DIALOGUE SYSTEM`.

## Test
1. Copy your existing `.env.local` (never publish its contents) and set the server-only keys and SMTP settings described in `PHASE2_SETUP.md`.
2. Apply `supabase/migrations/202611180001_custom_auth.sql` after migrations 001–006.
3. `npm install && npm run dev`.
4. Visit `/dialogues` to review each design.
5. Visit `/register`, verify the address using the delivered email, then sign in at `/login`.
6. Request password reset from `/reset-access` and follow the custom reset link.
7. As a second account, open an OPEN project and submit a role application; confirm it appears in the owner's project management page.
8. On `/account`, verify that `LOG OUT` asks for confirmation and `STAY HERE` cancels.
9. Run `npx tsc --noEmit` and `npm run build` locally.

## Not yet wired (do not mistake previews for features)
The 32-gallery includes payment, invitations, saves, workshop and editorial publication states. These gallery examples are visual only; real integrations should be connected to each existing workflow one by one. In particular, payment confirmation is never simulated as a successful charge.

## Notes
The English right-hand sheet is the basis for this implementation, while the Russian left-hand sheet is a localization reference. The native `dialog` element supports Escape and focus trapping. Mobile layouts and reduced-motion styling are included. No third-party dialog library required.
