import Link from 'next/link';
import {redirect} from 'next/navigation';
import {createClient} from '@/lib/supabase/server';
import {AccountArchiveShell,ArchiveEmpty} from '@/components/account-archive-shell';
import {getCurrentUser} from '@/lib/auth';
export const dynamic='force-dynamic';
export default async function Work(){
 const user=await getCurrentUser();if(!user)redirect('/login');
 return <AccountArchiveShell eyebrow="ACCOUNT / DOSSIER WORK ARCHIVE" title="MY WORK." active="/account/work">
 <div className="account-editorial-toolbar"><span className="tiny-label">PERSONAL WORK ARCHIVE</span><Link href="/work/publish" className="account-editorial-black">PUBLISH WORK <span>↗</span></Link></div>
 <ArchiveEmpty text="Your published work will appear here when portfolio storage is connected." actionLabel="EXPLORE WORK" href="/work"/>
 </AccountArchiveShell>;
}
