import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { getDatabaseAccessToken } from '@/lib/auth';
import { supabaseConfig } from './config';
export function createPublicClient() {
 const {url,key}=supabaseConfig();
 return createSupabaseClient(url,key,{auth:{autoRefreshToken:false,persistSession:false},accessToken:async()=>key});
}
export async function createClient() {
 const {url,key}=supabaseConfig();
 return createSupabaseClient(url,key,{auth:{autoRefreshToken:false,persistSession:false},accessToken:async()=>await getDatabaseAccessToken()||key});
}
