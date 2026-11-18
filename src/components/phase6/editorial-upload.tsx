'use client';
import {useState, type ChangeEvent} from 'react';
import {createClient} from '@/lib/supabase/browser';
const bucket='editorial-media';
const mimes=new Set(['image/jpeg','image/png','image/webp','image/avif']);
export function EditorialUpload(){
 const [url,setUrl]=useState('');const [busy,setBusy]=useState(false);const [status,setStatus]=useState('');
 async function upload(e:ChangeEvent<HTMLInputElement>){
  const file=e.target.files?.[0];if(!file)return;
  if(!mimes.has(file.type)||file.size>5*1024*1024){setStatus('Use JPG, PNG, WEBP or AVIF under 5 MB.');return;}
  setBusy(true);setStatus('Uploading…');
  try{
   const response=await fetch('/api/auth/me',{cache:'no-store'});if(!response.ok)throw new Error('Could not verify the current account.');
   const {user}=await response.json() as {user:{id:string}|null};if(!user)throw new Error('Sign in as an editor first.');
   const sb=createClient();
   const ext=({ 'image/jpeg':'jpg','image/png':'png','image/webp':'webp','image/avif':'avif'} as Record<string,string>)[file.type];
   const path=`${user.id}/${crypto.randomUUID()}.${ext}`;
   const {error}=await sb.storage.from(bucket).upload(path,file,{contentType:file.type,upsert:false,cacheControl:'3600'});
   if(error)throw error;
   const {data}=sb.storage.from(bucket).getPublicUrl(path);setUrl(data.publicUrl);setStatus('Image uploaded. Its URL will be saved with this record.');
  }catch(err){setStatus(err instanceof Error?err.message:'Upload failed.');}finally{setBusy(false);}
 }
 return <section className="editorial-uploader"><label>EDITORIAL COVER / JPG, PNG, WEBP, AVIF / MAX 5 MB<input aria-label="Upload editorial cover image" type="file" accept="image/jpeg,image/png,image/webp,image/avif" onChange={upload} disabled={busy}/></label><input type="hidden" name="cover_url" value={url}/>{url&&<div className="editorial-cover-preview"><img src={url} alt="Uploaded editorial cover preview"/><button type="button" onClick={()=>{setUrl('');setStatus('Cover removed from this form.');}}>REMOVE COVER ×</button></div>}<p role="status" aria-live="polite">{status||'Choose an image to add an editorial cover. Uploads require editor access.'}</p></section>;
}
