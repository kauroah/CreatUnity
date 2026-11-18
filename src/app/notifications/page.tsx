import {redirect} from 'next/navigation';
import {createClient} from '@/lib/supabase/server';
import {markAllNotificationsRead} from '@/app/messages/actions';
import {NotificationFeed} from '@/components/phase4/notification-feed';
import {AccountArchiveShell} from '@/components/account-archive-shell';
import {getCurrentUser} from '@/lib/auth';
export const dynamic='force-dynamic';
export default async function Notifications(){const user=await getCurrentUser();if(!user)redirect('/login');const sb=await createClient();
 const {data,error}=await sb.from('notifications').select('id,recipient_user_id,type,title,body,entity_type,entity_id,created_at,read_at').order('created_at',{ascending:false}).limit(100);
 const count=(data||[]).filter(n=>!n.read_at).length;
 return <AccountArchiveShell eyebrow="ACCOUNT / ACTIVITY RECORD" title="NOTIFICATIONS." active="/notifications">
 <p className="account-editorial-intro">Your community, in real time.</p>
 <div className="account-editorial-notice-bar"><span className="tiny-label">TODAY / {String(count).padStart(2,'0')} NEW</span><form action={markAllNotificationsRead}><button type="submit" className="account-editorial-quiet-button" disabled={!count}>MARK ALL AS READ</button></form></div>
 {error?<p role="alert" className="phase-error">Unable to load notifications: {error.message}</p>:<NotificationFeed initialItems={data||[]} userId={user.id}/>}
 </AccountArchiveShell>;
}
