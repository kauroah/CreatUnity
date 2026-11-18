import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getMyProfile } from '@/lib/supabase/profile';
import { avatarPublicUrl } from '@/lib/supabase/profile-shared';
import { setDossierVisibility } from '@/app/account/publish/actions';
import { ProfileSavedNotice } from '@/components/dialogues/profile-saved-notice';
import { SignoutDialog } from '@/components/dialogues/signout-dialog';

export const dynamic = 'force-dynamic';

const menu = [
  ['MY DOSSIER', '/account'],
  ['MY WORK', '/account/work'],
  ['MY PROJECTS', '/account/projects'],
  ['COLLABORATIONS', '/account/collaborations'],
  ['SAVED', '/account/saved'],
  ['MESSAGES', '/messages'],
  ['NOTIFICATIONS', '/notifications'],
  ['AVAILABILITY', '/account/availability'],
  ['SETTINGS', '/account/settings'],
] as const;

export default async function Account({searchParams}: {searchParams: Promise<{updated?:string;visibility?:string;publish_error?:string}>}) {
  const query = await searchParams;
  const {user, profile} = await getMyProfile();
  if (!user) redirect('/login?notice=Sign+in+to+access+your+dossier');

  const supabase = await createClient();
  const [{count:memberCount}, {count:creditCount}, {data:recentProjects}] = await Promise.all([
    supabase.from('project_members').select('project_id', {count:'exact',head:true}).eq('user_id',user.id),
    supabase.from('project_members').select('project_id', {count:'exact',head:true}).eq('user_id',user.id),
    supabase.from('projects').select('id,title,status,created_at').eq('owner_id',user.id).order('created_at',{ascending:false}).limit(1),
  ]);
  const lastProject = recentProjects?.[0] ?? null;
  const name = profile?.full_name || 'YOUR NAME';
  const required = [Boolean(profile?.avatar_url),Boolean(profile?.full_name?.trim()),Boolean(profile?.role?.trim()),Boolean(profile?.city?.trim()),(profile?.bio?.trim().length ?? 0)>=30];
  const completeness = Math.round(required.filter(Boolean).length / required.length * 100);
  const missing = [!required[0]?'portrait':null,!required[2]?'role':null,!required[3]?'city':null,!required[4]?'personal statement':null].filter(Boolean).join(', ');
  const dossierNumber = user.id.replace(/\D/g,'').slice(0,6) || user.id.replace(/-/g,'').slice(0,6).toUpperCase();
  const portrait = avatarPublicUrl(process.env.NEXT_PUBLIC_SUPABASE_URL || '', profile?.avatar_url ?? null);

  return <main className="dossier-page wrap">
    <div className="tiny-label dossier-route">ACCOUNT / DOSSIER NO. {dossierNumber}</div>
    <h1 className="dossier-page-heading">YOUR PERSONAL FILE.</h1>
    {query.updated && <ProfileSavedNotice/>}
    {query.visibility && <p className="auth-notice" role="status">Dossier visibility updated: {query.visibility}.</p>}
    {query.publish_error && <p className="auth-alert" role="alert">{query.publish_error}</p>}
    <div className="dossier-layout">
      <aside className="dossier-sidebar" aria-label="My account">
        <nav>{menu.map(([label,href])=><Link key={href} href={href} aria-current={href==='/account'?'page':undefined} className={href==='/account'?'active':''}>{label}</Link>)}</nav>
        <span className="tiny-label dossier-side-number">DOSSIER NO. {dossierNumber}</span>
        <SignoutDialog/>
      </aside>
      <div className="dossier-content">
        <section className="dossier-pink" aria-labelledby="dossier-name">
          <div className="dossier-primary">
            <div className="dossier-photo">
              {portrait ? <img src={portrait} alt={`Portrait of ${name}`} /> : <Link href="/account/edit" className="dossier-photo-empty"><span>PORTRAIT / NOT FILED</span><strong>ADD YOUR PORTRAIT ↗</strong></Link>}
            </div>
            <div className="dossier-identity">
              <div className="tiny-label">DOSSIER NO. {dossierNumber}</div>
              <h2 id="dossier-name">{name}</h2>
              <p className="dossier-role">{profile?.role || 'ROLE NOT SET'}<br/>{profile?.city || 'LOCATION NOT SET'}</p>
              <div className="dossier-facts">
                <p>STATUS / {profile?.is_published?'PUBLIC DOSSIER':'PRIVATE DRAFT'}</p>
                <p>COLLABORATIONS / {String(memberCount ?? 0).padStart(2,'0')}</p>
                <p>CREDITS / {String(creditCount ?? 0).padStart(2,'0')}</p>
              </div>
              <Link className="dossier-edit-link" href="/account/edit">EDIT DOSSIER <span aria-hidden="true">↗</span></Link>
            </div>
            <div className="dossier-stamp" aria-label={`Dossier number ${dossierNumber}`}><span>CREAT</span><strong>{dossierNumber.slice(-4)}</strong><span>FILED</span></div>
          </div>
          <div className="dossier-completeness">
            <span className="tiny-label">COMPLETENESS / {completeness}%</span>
            <p>{completeness<100?`Complete your dossier${missing?': '+missing+'.':'.'}`:'Your dossier is ready for the next collaboration.'}</p>
            <div className="dossier-bottom-actions">
              <span className="tiny-label">{profile?.is_published?'PUBLIC / DISCOVERABLE':'PRIVATE / NOT LISTED'}</span>
              {completeness<100 ? <Link href="/account/edit" className="dossier-black-button">COMPLETE DOSSIER <span>↗</span></Link> : <form action={setDossierVisibility}><input type="hidden" name="publish" value={profile?.is_published?'false':'true'}/><button className="dossier-black-button" type="submit">{profile?.is_published?'UNPUBLISH DOSSIER':'PUBLISH DOSSIER'} <span>↗</span></button></form>}
            </div>
          </div>
        </section>
        <section className="dossier-last-project" aria-label="Most recent project">
          <div><div className="tiny-label">YOUR LAST PROJECT / {lastProject?'01':'00'}</div><h2>{lastProject?.title || 'NO PROJECTS YET.'}</h2></div>
          <Link href={lastProject?`/account/projects/${lastProject.id}`:'/projects/create'}>{lastProject?'VIEW PROJECT':'CREATE PROJECT'} ↗</Link>
        </section>
      </div>
    </div>
  </main>;
}
