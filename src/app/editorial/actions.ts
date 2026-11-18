"use server";
import {redirect} from 'next/navigation';
import {revalidatePath} from 'next/cache';
import {createClient} from '@/lib/supabase/server';
import {getCurrentUser} from '@/lib/auth';
const value=(f:FormData,k:string)=>String(f.get(k)||'').trim();
const allowed=['magazine_articles','fashion_events','workshops'] as const;
export async function publishEditorial(form:FormData){
 const user=await getCurrentUser();if(!user)redirect('/login');const sb=await createClient();
 const {data:permission}=await sb.from('content_editors').select('user_id').eq('user_id',user.id).maybeSingle();if(!permission)redirect('/');
 const table=value(form,'table');if(!allowed.includes(table as typeof allowed[number]))return;
 const slug=value(form,'slug').toLowerCase(),title=value(form,'title');
 if(!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)||title.length<3||title.length>180)redirect('/editorial/admin?error=Invalid+title+or+slug');
 const cover=value(form,'cover_url');
 const {url:baseUrl}=await import('@/lib/supabase/config').then(m=>m.supabaseConfig());
 const prefix=`${baseUrl.replace(/\/$/,'')}/storage/v1/object/public/editorial-media/`;
 if(cover && (!cover.startsWith(prefix) || cover.length>700))redirect('/editorial/admin?error=Invalid+cover+URL');
 let row:Record<string,unknown>={slug,title,is_published:value(form,'publish')==='yes'};
 if(cover)row.cover_url=cover;
 if(table==='magazine_articles'){
  const category=value(form,'category');if(!['CULTURE','INTERVIEW','BACKSTAGE','VISUAL ESSAY'].includes(category))return;
  row={...row,category,excerpt:value(form,'summary').slice(0,600),body:value(form,'description').slice(0,40000),published_at:row.is_published?new Date().toISOString():null};
 } else {
  const iso=value(form,'starts_at');const start=new Date(iso);if(Number.isNaN(start.getTime()))redirect('/editorial/admin?error=Invalid+date');
  const capacity=Number(value(form,'capacity'));const price=Number(value(form,'price_rub'));
  if(!Number.isInteger(capacity)||capacity<1||capacity>100000||!Number.isInteger(price)||price<0)redirect('/editorial/admin?error=Invalid+capacity+or+price');
  row={...row,summary:value(form,'summary').slice(0,600),description:value(form,'description').slice(0,12000),starts_at:start.toISOString(),capacity,price_rub:price,city:value(form,'city').slice(0,120)};
  if(table==='fashion_events'){
   const end=new Date(value(form,'ends_at'));if(Number.isNaN(end.getTime())||end<=start)redirect('/editorial/admin?error=End+must+be+after+start');
   row={...row,ends_at:end.toISOString(),venue:value(form,'venue').slice(0,240)};
  }else row={...row,instructor:value(form,'instructor').slice(0,120),delivery_mode:value(form,'delivery_mode')==='IN PERSON'?'IN PERSON':'ONLINE'};
 }
 const {error}=await sb.from(table).upsert(row,{onConflict:'slug'});
 if(error)redirect(`/editorial/admin?error=${encodeURIComponent(error.message)}`);
 revalidatePath('/magazine');revalidatePath('/events');revalidatePath('/education');
 redirect(`/editorial/admin?success=${encodeURIComponent(title+' saved')}`);
}
export async function registerEvent(form:FormData){
 const user=await getCurrentUser();if(!user)redirect('/login');const sb=await createClient();
 const id=value(form,'event_id'),slug=value(form,'slug');const {error}=await sb.rpc('reserve_free_event',{p_event_id:id});
 if(error)redirect(`/events/${encodeURIComponent(slug)}?error=${encodeURIComponent(error.message)}`);
 revalidatePath('/account/passes');redirect('/account/passes?success=1');
}
export async function enrollWorkshop(form:FormData){
 const user=await getCurrentUser();if(!user)redirect('/login');const sb=await createClient();
 const id=value(form,'workshop_id'),slug=value(form,'slug');const {error}=await sb.rpc('reserve_free_workshop',{p_workshop_id:id});
 if(error)redirect(`/education/${encodeURIComponent(slug)}?error=${encodeURIComponent(error.message)}`);
 revalidatePath('/account/workshops');redirect('/account/workshops?success=1');
}

export async function setEditorialPublication(form:FormData){
 const user=await getCurrentUser();if(!user)redirect('/login');const sb=await createClient();
 const {data:editor}=await sb.from('content_editors').select('user_id').eq('user_id',user.id).maybeSingle();if(!editor)redirect('/');
 const table=value(form,'table'),id=value(form,'id'),publish=value(form,'publish')==='yes';
 if(!allowed.includes(table as typeof allowed[number])||!/^[0-9a-f-]{36}$/i.test(id))redirect('/editorial/admin?error=Invalid+record');
 const patch:Record<string,unknown>={is_published:publish};
 if(table==='magazine_articles')patch.published_at=publish?new Date().toISOString():null;
 const {error}=await sb.from(table).update(patch).eq('id',id);
 if(error)redirect(`/editorial/admin?error=${encodeURIComponent(error.message)}`);
 for(const path of ['/magazine','/events','/education','/editorial/admin'])revalidatePath(path);
 redirect('/editorial/admin?success=Publication+updated');
}
