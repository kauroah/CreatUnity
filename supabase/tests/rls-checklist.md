# Manual RLS verification
1. Anonymous client can select public.profiles; cannot update or insert rows.
2. Signed in user A can update only A's profile.
3. Signed in A cannot update B's row or change `id`.
4. Custom sign-up creates one `app_users` row and one profile; verification is required before sign-in.
5. New custom accounts receive `New Creator` before the submitted display name is saved.
6. No service_role key is exposed to browser or included in repository.
7. Sign out revokes the custom session; then visit `/account/edit` and confirm redirect to login.
8. Public `/people/u/<id>` only exposes fields in explicitly selected columns.
