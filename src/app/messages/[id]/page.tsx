import Link from 'next/link';
import {notFound,redirect} from 'next/navigation';
import {createClient} from '@/lib/supabase/server';
import {Thread} from '@/components/phase4/thread';
import {AccountArchiveShell} from '@/components/account-archive-shell';
import {getCurrentUser} from '@/lib/auth';
export const dynamic='force-dynamic';
export default async function Conversation({params}:{params:Promise<{id:string}>}){
 const {id}=await params;const user=await getCurrentUser();if(!user)redirect('/login');const sb=await createClient();
 const {data:thread}=await sb.from('conversations').select('id,project_id,creator_id,collaborator_id').eq('id',id).maybeSingle();if(!thread)notFound();
 const otherId=thread.creator_id===user.id?thread.collaborator_id:thread.creator_id;
 const {data:allThreads}=await sb.from('conversations').select('id,project_id,creator_id,collaborator_id,created_at').order('created_at',{ascending:false});
 const ids=[...new Set((allThreads||[]).flatMap(t=>[t.creator_id,t.collaborator_id]))];
 const projectIds=[...new Set((allThreads||[]).map(t=>t.project_id))];
 const [{data:people},{data:projects},{data:msgs}]=await Promise.all([
 ids.length?sb.from('profiles').select('id,full_name,avatar_url').in('id',ids):Promise.resolve({data:[]}),
 projectIds.length?sb.from('projects').select('id,title').in('id',projectIds):Promise.resolve({data:[]}),
 sb.from('messages').select('id,conversation_id,sender_id,body,created_at').eq('conversation_id',id).order('created_at',{ascending:false}).limit(100)
 ]);
 const names=new Map((people||[]).map(p=>[p.id,p.full_name])); const titles=new Map((projects||[]).map(p=>[p.id,p.title]));
 return <AccountArchiveShell eyebrow="COMMUNICATION / ACTIVE FILES" title="LET’S TALK." active="/messages">
 <section className="archive-chat-layout" aria-label="Messages">
 <aside className="archive-chat-list" aria-label="Conversations">{(allThreads||[]).map(t=>{
 const peer=t.creator_id===user.id?t.collaborator_id:t.creator_id;const selected=t.id===id;
 return <Link href={'/messages/'+t.id} key={t.id} aria-current={selected?'page':undefined} className={'archive-chat-person'+(selected?' selected':'')}>
 <span className="archive-chat-portrait" aria-hidden="true">{(names.get(peer)||'?').slice(0,1)}</span><span><strong>{names.get(peer)||'CREATOR'}</strong><small>{titles.get(t.project_id)||'PROJECT CONVERSATION'}</small></span></Link>
 })}<Link className="archive-chat-all" href="/messages">ALL CONVERSATIONS ↗</Link></aside>
 <div className="archive-chat-main"><header className="archive-chat-header"><div><span className="tiny-label">PROJECT FILE / {titles.get(thread.project_id)||'COLLABORATION'}</span><h2>{names.get(otherId)||'CREATOR'} / COLLABORATOR</h2></div><Link href={'/projects/'+thread.project_id}>VIEW PROJECT ↗</Link></header>
 <Thread conversationId={id} userId={user.id} initialMessages={(msgs||[]).reverse()}/></div>
 </section></AccountArchiveShell>
}
