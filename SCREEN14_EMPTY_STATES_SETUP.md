# CREATUNITY — Messages & Account Empty States

This update starts from the Screen 13 My Dossier release and implements the supplied Screen 14 / Screen 26–28 layouts.

Routes:
- `/account/projects`: real owner-owned projects or Figma-style empty state.
- `/account/saved`: empty-state only, because saved-items persistence is not implemented yet.
- `/messages`: real private conversation directory or Figma-style empty state.
- `/messages/[id]`: real Supabase conversation and composer in the new split editorial layout.

No SQL migration is needed. Keep the current `.env.local` and previously applied migrations.

## Verification

Run `npm install`, `npx tsc --noEmit`, then `npm run build` and `npm run dev`.
Test both with and without projects/conversations using existing authenticated accounts.
For real messaging verify send, receive, RLS, and refresh across two browser sessions.
No dummy messages are inserted; screenshots are design references only.
