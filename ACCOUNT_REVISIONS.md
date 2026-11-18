# Account revision — Figma screens 15–21

The following pages were adapted to the latest user-provided screenshots:
- `/notifications`: live database notifications in archive rows with unread metadata and mark-all action.
- `/account/projects`: real owner projects with editorial list rows; the empty state remains unchanged.
- `/account/work`: editorial archive shell and publish CTA. **Portfolio work persistence is not implemented** in the existing backend, so this remains a clearly labeled empty view rather than inventing data.
- `/account/saved`: previously implemented design-matched empty state preserved. **Saved-item persistence is not implemented.**
- `/account/settings`: real account fields and link to existing working dossier form; notification preference toggles not presented as operational because database preferences are not implemented.
- `/account/availability`: design-matched blue panel showing actual published status, city and role; date/condition controls remain unimplemented rather than claiming to save changes.
- `/messages`: existing functional conversations and design-matched empty states preserved.

No SQL migrations are required for these visual updates. Existing Supabase RLS remains authoritative. Run `npm install`, `npx tsc --noEmit` and `npm run build` locally. Do not overwrite `.env.local`.
