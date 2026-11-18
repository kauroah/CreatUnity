import Link from 'next/link';
import {redirect} from 'next/navigation';
import {getMyProfile} from '@/lib/supabase/profile';
import {AccountArchiveShell} from '@/components/account-archive-shell';
import {SignoutDialog} from '@/components/dialogues/signout-dialog';
export const dynamic='force-dynamic';
export default async function Settings(){const {user,profile}=await getMyProfile();if(!user)redirect('/login');
 return <AccountArchiveShell eyebrow="ACCOUNT / DOSSIER SETTINGS" title="KEEP YOUR FILE CURRENT." active="/account/settings">
 <section className="account-editorial-settings" aria-label="Account details">
 {([['DISPLAY NAME',profile?.full_name||'NOT PROVIDED'],['EMAIL',user.email||'NOT PROVIDED'],['LOCATION',profile?.city||'NOT PROVIDED'],['PORTFOLIO LINK',profile?.website||'NOT PROVIDED'],['LANGUAGE','ENGLISH']] as const).map(([label,value])=><div className="account-editorial-setting" key={label}><span className="tiny-label">{label}</span><strong>{value}</strong></div>)}
 <div className="account-editorial-setting account-editorial-preferences"><span className="tiny-label">NOTIFICATION PREFERENCES</span><p>Manage your incoming messages and project invitations in NOTIFICATIONS. Email preferences are not configured.</p></div>
 <div className="account-editorial-setting-actions"><SignoutDialog/><Link href="/account/edit" className="account-editorial-black">SAVE / EDIT DETAILS <span>↗</span></Link></div>
 </section></AccountArchiveShell>;
}
