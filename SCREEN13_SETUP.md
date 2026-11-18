# CREATUNITY — Screen 13: My Dossier

This update replaces `/account` with the editorial profile design provided in `13 — MY DOSSIER.png`.

## Install

1. Keep a backup of your current site.
2. Extract the ZIP and copy your existing `.env.local` into `creatunity-site/`.
3. Run `npm install`, `npx tsc --noEmit`, and `npm run build`.
4. Start with `npm run dev`, then sign in and visit `/account`.

No database migration is needed. The screen uses the existing Phase 7 profile fields, existing avatar storage bucket, projects and project_members tables.

## Data mapping

- Display name, role, city, portrait and publication state: authenticated profile.
- Dossier identifier: abbreviated deterministic UUID used as a display label, not a database-issued sequence.
- Completeness: five fields (portrait, name, role, city, 30+ character statement).
- Collaborations and credits: number of accepted project membership records. Credits mean accepted project-role credits here, not yet the complete portfolio credits system.
- Last project: latest project owned by the signed-in account.
- Visibility: existing server-side publish/unpublish action.
- Missing fields: prompts to `/account/edit` rather than showing Lisa Orlova's sample data.

Account destinations for saved items, settings and availability currently have honest placeholder pages; these backend workflows are not yet fully implemented. The My Work route links to the existing publishing feature.

## Verification note

The source has been packaged and file paths inspected. Full npm installation and production compilation have not been verified in this environment; run the commands above locally before deployment.
