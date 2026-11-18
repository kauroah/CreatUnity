# CREATUNITY — Phase 7: Real creator dossiers

## Installation
1. Backup your current working project and database. Extract this cumulative release.
2. Copy your existing `.env.local` into `creatunity-site`. Never commit it.
3. Apply **only** `supabase/migrations/202610290001_public_dossiers.sql` in Supabase SQL Editor.
4. Run `npm install`, `npx tsc --noEmit`, `npm run build`, `npm run dev`.
5. Log in to `/account/edit`, upload a JPG/PNG/WEBP portrait (max 5 MB), fill name/role/city and a biography of 30+ characters, and click **Save Changes**. Then publish via `/account`.
6. Visit `/people` and `/` to see your published dossier; `/people/<uuid>` is the canonical public profile.

## Seed test data without bypassing authentication
1. Use a separate development Supabase project. Sign up four distinct test accounts using your own controlled email addresses.
2. Edit `supabase/seed/202610290001_test_creators.sql` to replace the example email addresses.
3. Run it via SQL Editor. It fills creator data but keeps them unpublished.
4. For each test account, upload its own correctly licensed photo while logged in, save, and publish.
5. Test filtering by city/role, public profile links, homepage featured creators, unpublishing, and RLS: an anonymous user must not read a private dossier; an unrelated account must not edit another dossier.

## Notes
- The `/people` and homepage creator sections now use actual published Supabase dossiers. Original Phase 1 demo creator records are no longer rendered there.
- Sample images are not bundled as portraits; use images you have permission to upload.
- Publication needs a real Storage image belonging to the signed-in account; it cannot succeed with just a sample SQL URL.
- Public Storage images are publicly retrievable by URL even after the dossier is unpublished. Do not upload private images; you may need to delete old objects from Storage separately.
- Existing public profile policy is replaced. Audit other profile-dependent routes after migration.
- Only the *creator* sections of homepage were made dynamic; other featured work remains Phase 1 editorial demo content.
- This release was not tested against your live Supabase project.
