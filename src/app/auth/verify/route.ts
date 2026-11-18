import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, createSession, hashOpaqueToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token') || '';
  if (!token) return NextResponse.redirect(new URL('/login?error=Verification+link+is+invalid+or+expired', request.url));
  const admin = createAdminClient();
  const { data: row, error } = await admin.from('app_email_tokens')
    .select('id,user_id,expires_at')
    .eq('token_hash', hashOpaqueToken(token))
    .eq('purpose', 'verify_email')
    .is('consumed_at', null)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle();
  if (error) throw new Error(`Could not validate email verification token: ${error.message}`);
  if (!row) return NextResponse.redirect(new URL('/login?error=Verification+link+is+invalid+or+expired', request.url));
  const now = new Date().toISOString();
  const { data: consumed, error: consumeError } = await admin.from('app_email_tokens')
    .update({ consumed_at: now })
    .eq('id', row.id)
    .is('consumed_at', null)
    .gt('expires_at', now)
    .select('id')
    .maybeSingle();
  if (consumeError) throw new Error(`Could not consume email verification token: ${consumeError.message}`);
  if (!consumed) return NextResponse.redirect(new URL('/login?error=Verification+link+is+invalid+or+expired', request.url));
  const { error: verifyError } = await admin.from('app_users')
    .update({ email_verified_at: now })
    .eq('id', row.user_id)
    .is('email_verified_at', null);
  if (verifyError) throw new Error(`Could not verify custom-auth account: ${verifyError.message}`);
  await createSession(row.user_id);
  return NextResponse.redirect(new URL('/account?notice=Email+verified', request.url));
}
