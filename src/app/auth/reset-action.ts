'use server';
import {redirect} from 'next/navigation';
import {createAdminClient,createOpaqueToken,hashOpaqueToken,hashPassword} from '@/lib/auth';
import {sendAuthEmail} from '@/lib/auth-mail';
const emailPattern=/^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export async function requestPasswordReset(form:FormData){
 const email=String(form.get('email')||'').trim().toLowerCase();
 if(!emailPattern.test(email))redirect('/reset-access?error=Enter+a+valid+email');
 const admin=createAdminClient();
 const {data:user,error}=await admin.from('app_users').select('id,email').eq('email',email).maybeSingle();
 if(error)throw new Error(`Could not look up custom-auth account: ${error.message}`);
 if(user){
  const token=createOpaqueToken();
  const {error:tokenError}=await admin.from('app_email_tokens').insert({user_id:user.id,purpose:'password_reset',token_hash:hashOpaqueToken(token),expires_at:new Date(Date.now()+60*60*1000).toISOString()});
  if(tokenError)throw new Error(`Could not create password-reset token: ${tokenError.message}`);
  try {
   const origin=process.env.NEXT_PUBLIC_SITE_URL||'http://localhost:3000';
   await sendAuthEmail(email,'Reset your CREATUNITY password',`${origin}/auth/update-password?token=${encodeURIComponent(token)}`,'Use this link to choose a new password. It expires in one hour.');
  } catch(error) {
   await admin.from('app_email_tokens').update({consumed_at:new Date().toISOString()}).eq('token_hash',hashOpaqueToken(token));
   console.error('Could not send password-reset email:',error);
   redirect('/reset-access?error=We+could+not+send+the+email.+Please+try+again+later.');
  }
 }
 redirect('/reset-access?sent=1');
}
export async function updatePassword(form:FormData){
 const pwd=String(form.get('password')||'');const token=String(form.get('token')||'');
 if(pwd.length<8||pwd.length>1024)redirect('/auth/update-password?error=Password+must+be+between+8+and+1024+characters');
 if(!token)redirect('/auth/update-password?error=The+password+reset+link+is+invalid+or+expired');
 const admin=createAdminClient();
 const {error}=await admin.rpc('consume_app_password_reset',{p_token_hash:hashOpaqueToken(token),p_password_hash:await hashPassword(pwd)});
 if(error){if(error.code==='P0001')redirect('/auth/update-password?error=The+password+reset+link+is+invalid+or+expired');throw new Error(`Could not reset custom-auth password: ${error.message}`);}
 redirect('/login?notice=Password+updated.+Sign+in+with+your+new+password.');
}
