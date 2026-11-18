# CREATUNITY — Action-linked dialogs update

This update builds on the Revision 02 dialog package without replacing its Supabase migrations or credentials.

## Wired to real actions
- Supabase authentication, password reset, registration and sign-out (existing integrated flows).
- Project role application → real `applyForRole` → success dialog on `?applied=1` (new).
- Project publish / completion / cancellation → confirmation → existing `changeProjectStatus` (new).
- Free event reservation → confirmation → existing `registerEvent` (new).
- Free workshop enrollment → confirmation → existing `enrollWorkshop` (new).
- Public work share → actual browser clipboard → link-copied state after success (new).
- Profile save → existing `saveProfile` → changes-filed dialog on `?updated=1` (new).
- Existing project-owner application review and messaging still operate through the previously implemented server actions.

## Not available yet
- Direct invitation and save-to-archive need dedicated database tables, RLS policies, and server actions. The `/dialogues` gallery remains previews, never fake transactions.
- Paid checkout requires a payment provider. No card data is collected or simulated.
- Publishing portfolio work is not a real persisted workflow in the current project; do not treat the example dialog as working publication.
- Cookie analytics preferences require a real analytics/cookie configuration before nonessential cookies can be enabled.

## Test checklist
1. Use two accounts: apply for an OPEN role and check application confirmation + the database record.
2. As owner, publish a draft project: cancel once, then confirm and verify `OPEN` in DB.
3. Reserve a free future event, verify `event_registrations` and that reloading displays YOUR PASS.
4. Enroll in a free future workshop and verify `workshop_enrollments`.
5. Edit dossier and save: verify the changes-filed modal and persisted profile.
6. Open any example `/work/[id]` and use SHARE THIS FILE; verify clipboard contains the public URL.
7. Verify Escape, backdrop click, and keyboard focus.
8. Run `npx tsc --noEmit` and `npm run build`.

No additional migration is required for the workflows wired in this release.
