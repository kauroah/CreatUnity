import Link from 'next/link';
import {redirect} from 'next/navigation';
import {createClient} from '@/lib/supabase/server';
import {AccountArchiveShell,ArchiveEmpty} from '@/components/account-archive-shell';
import {getCurrentUser} from '@/lib/auth';
export const dynamic='force-dynamic';
export default async function Messages(){
 const user=await getCurrentUser();if(!user)redirect('/login');const sb=await createClient();
 const {data:threads,error}=await sb.from('conversations').select('id,project_id,creator_id,collaborator_id,created_at').order('created_at',{ascending:false});
 const ids=[...new Set((threads||[]).flatMap(t=>[t.creator_id,t.collaborator_id]))];
 const projectIds=[...new Set((threads||[]).map(t=>t.project_id))];
 const [{data:people},{data:projects}]=await Promise.all([
  ids.length?sb.from('profiles').select('id,full_name,avatar_url').in('id',ids):Promise.resolve({data:[]}),
  projectIds.length?sb.from('projects').select('id,title').in('id',projectIds):Promise.resolve({data:[]})
 ]);
 const names=new Map((people||[]).map(p=>[p.id,p.full_name]));const titles=new Map((projects||[]).map(p=>[p.id,p.title]));
 return <AccountArchiveShell eyebrow={threads?.length?'COMMUNICATION / ACTIVE FILES':'EMPTY STATE / MESSAGES'} title={threads?.length?'LET’S TALK.':'A CONVERSATION STARTS HERE.'} active="/messages">
 {error?<p role="alert" className="phase-error">Unable to load conversations.</p>:!threads?.length ?
 <ArchiveEmpty text="Найди человека и начни с хорошей идеи." actionLabel="START A CONVERSATION" href="/people"/>:
 <div className="archive-conversation-directory"><div className="tiny-label">CONVERSATIONS / {String(threads.length).padStart(2,'0')} ACTIVE FILES</div>
 {threads.map(t=><Link className="archive-conversation-row" key={t.id} href={'/messages/'+t.id}>
 <span className="archive-conversation-avatar" aria-hidden="true">{(names.get(t.creator_id===user.id?t.collaborator_id:t.creator_id)||'?').slice(0,1)}</span>
 <span><strong>{names.get(t.creator_id===user.id?t.collaborator_id:t.creator_id)||'CREATOR'}</strong><small>{titles.get(t.project_id)||'PROJECT CONVERSATION'}</small></span><span aria-hidden="true">↗</span></Link>)}
 </div>}
 </AccountArchiveShell>;
}
