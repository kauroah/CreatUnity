'use client';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { supabaseConfig } from './config';
let cachedToken: string | null = null;
let tokenExpiresAt = 0;
export function clearDatabaseToken() { cachedToken=null;tokenExpiresAt=0; }
export function createClient() {
 const {url,key}=supabaseConfig();
 return createSupabaseClient(url,key,{auth:{autoRefreshToken:false,persistSession:false},accessToken:async()=>{
  if(cachedToken&&Date.now()<tokenExpiresAt)return cachedToken;
  const response=await fetch('/api/auth/token',{cache:'no-store',credentials:'same-origin'});
  if(!response.ok)throw new Error('Could not refresh the database session.');
  const data=await response.json() as {accessToken:string|null;expiresIn:number};
  cachedToken=data.accessToken;tokenExpiresAt=Date.now()+Math.max(0,data.expiresIn-60)*1000;
  return cachedToken||key;
 }});
}
