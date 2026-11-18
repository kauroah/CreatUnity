import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { AccountArchiveShell, ArchiveEmpty } from '@/components/account-archive-shell';
import { getCurrentUser } from '@/lib/auth';
export const dynamic = 'force-dynamic';
export default async function MyProjects(){
 const sb=await createClient();const user=await getCurrentUser();if(!user)redirect('/login');
 const {data,error}=await sb.from('projects').select('id,title,category,city,status,created_at').eq('owner_id',user.id).order('created_at',{ascending:false});
 return <AccountArchiveShell eyebrow={data?.length?'ACCOUNT / DOSSIER PROJECT ARCHIVE':'EMPTY STATE / MY PROJECTS'} title={data?.length?'MY PROJECTS.':'NO PROJECTS YET.'} active="/account/projects">
 {error?<p role="alert" className="phase-error">Unable to load projects: {error.message}</p>:!data?.length?<ArchiveEmpty text="Начни с идеи. Команда появится следом." href="/projects/create" actionLabel="CREATE PROJECT"/>:<>
 <div className="account-editorial-toolbar"><span className="tiny-label">PROJECT ARCHIVE / {String(data.length).padStart(2,'0')} FILES</span><Link className="account-editorial-black" href="/projects/create">CREATE PROJECT <span>↗</span></Link></div>
 <div className="account-editorial-records">{data.map((item)=><article className="account-editorial-record" key={item.id}><div className="account-editorial-art" aria-hidden="true"><span>CREAT</span><strong>{item.title.slice(0,2).toUpperCase()}</strong><span>FILED</span></div><div className="account-editorial-record-info"><p className={'tiny-label '+(item.status==='draft'?'account-editorial-draft':'')}>{item.status.toUpperCase()} / PROJECT FILE</p><h2>{item.title}</h2><p className="tiny-label">{item.city||'EVERYWHERE'} / {item.category||'CREATIVE PROJECT'} / {new Date(item.created_at).getFullYear()}</p><Link href={'/account/projects/'+item.id}>OPEN FILE ↗</Link></div></article>)}</div>
 </>}
 </AccountArchiveShell>;
}
