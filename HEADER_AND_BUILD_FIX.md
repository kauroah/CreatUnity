# CREATUNITY — Header and build fix

- Replaces MESSAGES and ACTIVITY in the header with only SEARCH and PROFILE (text-only).
- Keeps messages/notifications in the account sidebar.
- Adds a tiny red unread dot beside PROFILE, based on *actual* unread notification rows accessible to the logged-in user. The existing message trigger creates notifications. If Realtime is not enabled for notifications, the indicator refreshes on navigation and auth changes.
- Fixes `getMyProfile()` by using the imported `User` type rather than incorrectly indexing a `Promise<SupabaseClient>`. Also imports `profileFields` as a real local binding.
- Updates the header to match the original 190px / flexible / 190px grid on large screens.
- No new SQL migration or environment variables are needed.

## Installation
Extract the ZIP, copy your existing `.env.local`, then run:

```bash
npm install
npx tsc --noEmit
npm run build
npm run dev
```

Test `/account`, `/people`, and check SEARCH/PROFILE links on both desktop and mobile. Sign in and generate an actual notification to test the red dot. Do not run `npm audit fix --force` automatically; inspect `npm audit` before updating dependencies.
