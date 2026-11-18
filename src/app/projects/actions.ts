"use server";
import {revalidatePath} from 'next/cache';
import {redirect} from 'next/navigation';
import {createClient} from '@/lib/supabase/server';
import {getCurrentUser} from '@/lib/auth';
const str=(f:FormData,k:string)=>String(f.get(k)||'').trim();
const errorUrl=(path:string,msg:string)=>`${path}?error=${encodeURIComponent(msg)}`;
async function current(){const user=await getCurrentUser();if(!user)redirect('/login');const sb=await createClient();return {sb,user};}
export async function createProject(form:FormData){
 const {sb,user}=await current();const title=str(form,'title');const description=str(form,'description');const city=str(form,'city');const category=str(form,'category');const compensation=str(form,'compensation');const date=str(form,'project_date');const publish=str(form,'intent')==='publish';
 const roles=[...new Set(str(form,'roles').split(',').map(x=>x.trim().toUpperCase()).filter(Boolean))];
 if(title.length<3||title.length>140||description.length>4000||city.length>100||!['EDITORIAL','CAMPAIGN','RUNWAY','OTHER'].includes(category)||!['PAID','UNPAID','DISCUSS'].includes(compensation)||roles.some(r=>r.length<2||r.length>80)||roles.length>12||(publish&&roles.length===0))redirect(errorUrl('/projects/create','Check your project details and add at least one role before publishing.'));
 const {data,error}=await sb.from('projects').insert({owner_id:user.id,title,description,city,category,compensation,project_date:date||null,status:'DRAFT'}).select('id').single();
 if(error||!data)redirect(errorUrl('/projects/create',error?.message||'Unable to save project'));
 if(roles.length){const {error:re}=await sb.from('project_roles').insert(roles.map(title=>({project_id:data.id,title,slots:1})));if(re)redirect(errorUrl(`/account/projects/${data.id}`,`Project saved as draft, but roles failed: ${re.message}`));}
 if(publish){const {error:pe}=await sb.from('projects').update({status:'OPEN'}).eq('id',data.id).eq('owner_id',user.id);if(pe)redirect(errorUrl(`/account/projects/${data.id}`,pe.message));}
 revalidatePath('/projects');revalidatePath('/account/projects');redirect(`/account/projects/${data.id}?created=1`);
}
export async function changeProjectStatus(form:FormData){
 const {sb,user}=await current();const id=str(form,'project_id');const status=str(form,'status');if(!['OPEN','COMPLETED','CANCELLED','DRAFT'].includes(status))return;
 const {data:p}=await sb.from('projects').select('status').eq('id',id).eq('owner_id',user.id).single();if(!p)return;
 if(!({DRAFT:['OPEN','CANCELLED'],OPEN:['COMPLETED','CANCELLED'],COMPLETED:[],CANCELLED:[]} as Record<string,string[]>)[p.status]?.includes(status))return;
 if(status==='OPEN'){const {count}=await sb.from('project_roles').select('id',{head:true,count:'exact'}).eq('project_id',id);if(!count)redirect(errorUrl(`/account/projects/${id}`,'Add at least one role before publishing.'));}
 const {error}=await sb.from('projects').update({status}).eq('id',id).eq('owner_id',user.id);if(error)redirect(errorUrl(`/account/projects/${id}`,error.message));revalidatePath('/account/projects');revalidatePath(`/account/projects/${id}`);revalidatePath('/projects');
}
export async function applyForRole(form:FormData){
 const {sb,user}=await current();const id=str(form,'project_id');const role=str(form,'role_id');const message=str(form,'message');
 if(message.length<10||message.length>2000)redirect(errorUrl(`/projects/${id}`,'Your introduction must be 10–2000 characters.'));
 const {error}=await sb.from('project_applications').insert({project_id:id,role_id:role,applicant_id:user.id,message});
 if(error)redirect(errorUrl(`/projects/${id}`,error.code==='23505'?'You already applied for this role.':error.message));
 revalidatePath(`/projects/${id}`);redirect(`/projects/${id}?applied=1`);
}
export async function reviewApplication(form:FormData){
 const {sb,user}=await current();const id=str(form,'project_id');const applicationId=str(form,'application_id');const status=str(form,'status');if(!['ACCEPTED','DECLINED'].includes(status))return;
 const {data:project}=await sb.from('projects').select('owner_id').eq('id',id).single();if(project?.owner_id!==user.id)return;
 const {error}=await sb.from('project_applications').update({status}).eq('id',applicationId).eq('project_id',id).eq('status','PENDING');
 if(error)redirect(errorUrl(`/account/projects/${id}`,error.message));revalidatePath(`/account/projects/${id}`);revalidatePath('/account/collaborations');
}
export async function withdrawApplication(form:FormData){
 const {sb,user}=await current();const id=str(form,'project_id');await sb.from('project_applications').delete().eq('id',str(form,'application_id')).eq('applicant_id',user.id).eq('status','PENDING');revalidatePath(`/projects/${id}`);revalidatePath('/account/collaborations');
}
