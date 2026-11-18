import Link from 'next/link';
import {redirect} from 'next/navigation';
import {getMyProfile} from '@/lib/supabase/profile';
import {AccountArchiveShell} from '@/components/account-archive-shell';
export const dynamic='force-dynamic';
export default async function Availability(){const {user,profile}=await getMyProfile();if(!user)redirect('/login');
 return <AccountArchiveShell eyebrow="ACCOUNT / OPEN FOR WORK" title="MAKE ROOM FOR WHAT’S NEXT." active="/account/availability">
 <section className="account-editorial-availability"><p className="tiny-label">CURRENT STATUS / {profile?.is_published?'PUBLISHED':'PRIVATE'}</p><h2>{profile?.is_published?'OPEN TO DISCOVERY':'YOUR DOSSIER IS PRIVATE'}</h2>
 <div className="account-editorial-setting"><span className="tiny-label">CITY</span><strong>{profile?.city||'NOT FILED'}</strong></div>
 <div className="account-editorial-setting"><span className="tiny-label">CREATIVE ROLE</span><strong>{profile?.role||'NOT FILED'}</strong></div>
 <div className="account-editorial-setting"><span className="tiny-label">COLLABORATION DATES & CONDITIONS</span><strong>NOT YET CONFIGURED</strong><p>Availability dates and conditions require a future database-backed workflow.</p></div>
 <Link href="/account/edit" className="account-editorial-black">UPDATE DOSSIER <span>↗</span></Link>
 </section></AccountArchiveShell>;
}
