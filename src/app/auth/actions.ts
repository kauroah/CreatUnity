'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { clearFailedLogins, createAdminClient, createOpaqueToken, createSession, destroySession, getCurrentUser, hashOpaqueToken, hashPassword, recordFailedLogin, verifyPassword } from '@/lib/auth';
import { sendAuthEmail } from '@/lib/auth-mail';
import { createClient } from '@/lib/supabase/server';
const enc=(s:string)=>encodeURIComponent(s);
function getString(data:FormData,key:string){return String(data.get(key)||'').trim()}
const emailPattern=/^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const siteOrigin=()=>process.env.NEXT_PUBLIC_SITE_URL||'http://localhost:3000';

export async function signIn(form:FormData){
 const email=getString(form,'email').toLowerCase();const password=String(form.get('password')||'');
 if(!emailPattern.test(email)||!password||password.length>1024)redirect('/login?error='+enc('Enter a valid email and password.'));
 const admin=createAdminClient();
 const {data:attempt,error:attemptError}=await admin.from('app_login_attempts').select('blocked_until').eq('email',email).maybeSingle();
 if(attemptError)throw new Error(`Could not check custom-auth login limit: ${attemptError.message}`);
 if(attempt?.blocked_until&&Date.parse(attempt.blocked_until)>Date.now())redirect('/login?error='+enc('Too many attempts. Try again in 15 minutes.'));
 const {data:user,error}=await admin.from('app_users').select('id,email,password_hash,email_verified_at').eq('email',email).maybeSingle();
 if(error)throw new Error(`Could not check custom-auth account: ${error.message}`);
 const passwordValid=await verifyPassword(password,user?.password_hash||'scrypt$AAAAAAAAAAAAAAAAAAAAAA$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA');
 if(!user||!passwordValid){await recordFailedLogin(email);redirect('/login?error='+enc('Email or password is incorrect.'));}
 if(!user.email_verified_at)redirect('/login?error='+enc('Verify your email address before signing in.'));
 await clearFailedLogins(email);
 await createSession(user.id);
 revalidatePath('/','layout');redirect('/account');
}
export async function signUp(form:FormData){
 const name=getString(form,'name');const email=getString(form,'email').toLowerCase();const password=String(form.get('password')||'');
 if(name.length<2||name.length>100||!emailPattern.test(email)||password.length<8||password.length>1024)redirect('/register?error='+enc('Enter a name, valid email, and a password between 8 and 1024 characters.'));
 const admin=createAdminClient();
 const {data:existing,error:lookupError}=await admin.from('app_users').select('id').eq('email',email).maybeSingle();
 if(lookupError)throw new Error(`Could not check custom-auth account: ${lookupError.message}`);
 if(existing)redirect('/register?error='+enc('An account with that email already exists.'));
 const {data:user,error}=await admin.from('app_users').insert({email,password_hash:await hashPassword(password)}).select('id').single();
 if(error)throw new Error(`Could not create custom-auth account: ${error.message}`);
 const {error:profileError}=await admin.from('profiles').update({full_name:name}).eq('id',user.id);
 if(profileError){await removeNewAccount(admin,user.id);throw new Error(`Could not create creator profile: ${profileError.message}`)}
 const token=createOpaqueToken();
 const {error:tokenError}=await admin.from('app_email_tokens').insert({user_id:user.id,purpose:'verify_email',token_hash:hashOpaqueToken(token),expires_at:new Date(Date.now()+24*60*60*1000).toISOString()});
 if(tokenError){await removeNewAccount(admin,user.id);throw new Error(`Could not create email verification token: ${tokenError.message}`)}
 try {
  await sendAuthEmail(email,'Verify your CREATUNITY account',`${siteOrigin()}/auth/verify?token=${encodeURIComponent(token)}`,'Verify your email address to activate your CREATUNITY account.');
 } catch(error) {
  await removeNewAccount(admin,user.id);
  console.error('Could not send account verification email:',error);
  redirect('/register?error='+enc('We could not send the verification email. Please try again later.'));
 }
 async function removeNewAccount(admin:ReturnType<typeof createAdminClient>,id:string){
  const {error:profileError}=await admin.from('profiles').delete().eq('id',id);
  if(profileError)throw new Error(`Could not roll back new creator profile: ${profileError.message}`);
  const {error:userError}=await admin.from('app_users').delete().eq('id',id);
  if(userError)throw new Error(`Could not roll back custom-auth account: ${userError.message}`);
 }
 redirect('/login?notice='+enc('Check your email to verify your account, then sign in.'));
}
export async function signOut(){await destroySession();revalidatePath('/','layout');redirect('/login');}
export async function saveProfile(form:FormData){
 const user=await getCurrentUser();if(!user)redirect('/login');const sb=await createClient();
 const name=getString(form,'full_name').slice(0,100);const role=getString(form,'role').slice(0,100);const city=getString(form,'city').slice(0,100);const bio=getString(form,'bio').slice(0,2000);const website=getString(form,'website').slice(0,350);const avatar=getString(form,'avatar_url');
 if(avatar && (!avatar.startsWith(user.id+'/') || !/^[a-zA-Z0-9._-]+$/.test(avatar.slice(user.id.length+1))))redirect('/account/edit?error='+enc('Invalid avatar path'));
 if(name.length<2)redirect('/account/edit?error='+enc('Display name is required.'));
 if(website && !/^https?:\/\//i.test(website)) redirect('/account/edit?error='+enc('Website must begin with https:// or http://'));
 const {error}=await sb.from('profiles').update({full_name:name,role,city,bio,website:website||null,avatar_url:avatar||null}).eq('id',user.id);
 if(error)redirect('/account/edit?error='+enc(error.message));
 revalidatePath('/account');revalidatePath('/people');revalidatePath('/people/u/'+user.id);redirect('/account?updated=1');
}
