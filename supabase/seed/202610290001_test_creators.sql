-- TEST DATA ONLY. Run in a disposable Supabase project.
-- Create 4 test accounts via CREATUNITY /register, verify email, then replace these addresses.
-- This script does not create accounts directly with SQL.
-- These updates create PRIVATE dossiers for testing. Upload each photo in /account/edit,
-- then publish through /account. An unverified placeholder avatar must never be used.
update public.profiles p set full_name=s.full_name,role=s.role,city=s.city,bio=s.bio,website=s.website,is_published=false
from (values
 ('test-stylist@example.com','Alex Morgan','STYLIST / DESIGNER','MOSCOW','Editorial stylist working with independent fashion labels. Interested in sustainable materials, strong silhouettes, and collaborative campaigns.','https://example.com'),
 ('test-photographer@example.com','Jordan Lee','PHOTOGRAPHER','BERLIN','Portrait and fashion photographer exploring natural light, visual storytelling, and contemporary culture through editorial commissions.','https://example.com'),
 ('test-model@example.com','Sam Rivera','MODEL / ART DIRECTOR','SAINT PETERSBURG','Model and emerging art director collaborating with photographers, stylists, and designers to develop expressive visual stories.','https://example.com'),
 ('test-designer@example.com','Taylor Kim','FASHION DESIGNER','MOSCOW','Independent designer interested in experimental knitwear, reworked garments, and creative partnerships across visual disciplines.','https://example.com')
) as s(email,full_name,role,city,bio,website)
join public.app_users u on lower(u.email)=lower(s.email)
where p.id=u.id;
-- Confirm how many were matched. Expect four after updating the sample email addresses.
select u.email,p.full_name,p.role,p.city,p.is_published,p.avatar_url from public.profiles p join public.app_users u on u.id=p.id where u.email ilike 'test-%@example.com';
