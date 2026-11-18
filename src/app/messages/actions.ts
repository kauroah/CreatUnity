'use server';
import {redirect} from 'next/navigation';
import {revalidatePath} from 'next/cache';
import {createClient} from '@/lib/supabase/server';
import {getCurrentUser} from '@/lib/auth';
export async function openThread(form:FormData){
 const user=await getCurrentUser();if(!user)redirect('/login');const sb=await createClient();
 const project_id=String(form.get('project_id')||'');const collaborator_id=String(form.get('collaborator_id')||'');
 const {data,error}=await sb.rpc('phase4_start_conversation',{p_project_id:project_id,p_collaborator_id:collaborator_id});
 if(error||!data)redirect('/account/collaborations?error='+encodeURIComponent(error?.message||'Unable to open conversation'));
 redirect('/messages/'+data);
}
export async function markAllNotificationsRead(){
 const user=await getCurrentUser();if(!user)redirect('/login');const sb=await createClient();
 const {error}=await sb.from('notifications').update({read_at:new Date().toISOString()}).eq('recipient_user_id',user.id).is('read_at',null);
 if(error)throw new Error('Could not mark notifications as read');
 revalidatePath('/notifications');
}
