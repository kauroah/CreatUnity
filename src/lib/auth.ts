import { createHash, createHmac, randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { cookies } from 'next/headers';
import { createClient as createSupabaseClient, type SupabaseClient } from '@supabase/supabase-js';
import { supabaseConfig } from '@/lib/supabase/config';

const scrypt = promisify(scryptCallback);
export const SESSION_COOKIE = 'creatunity_session';
const SESSION_DAYS = 30;
export const DB_TOKEN_SECONDS = 300;

export type AppUser = { id: string; email: string; email_verified_at: string | null };
type SessionRecord = {
  user_id: string;
  expires_at: string;
  revoked_at: string | null;
  app_users: AppUser | AppUser[] | null;
};

function requiredEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required for custom authentication.`);
  return value;
}

export function createAdminClient(): SupabaseClient {
  const { url } = supabaseConfig();
  return createSupabaseClient(url, requiredEnv('SUPABASE_SERVICE_ROLE_KEY'), {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export function hashOpaqueToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

export function createOpaqueToken() {
  return randomBytes(32).toString('base64url');
}

export async function hashPassword(password: string) {
  const salt = randomBytes(16);
  const derived = await scrypt(password, salt, 64) as Buffer;
  return `scrypt$${salt.toString('base64url')}$${derived.toString('base64url')}`;
}

export async function verifyPassword(password: string, encoded: string) {
  const [algorithm, saltText, hashText] = encoded.split('$');
  if (algorithm !== 'scrypt' || !saltText || !hashText) return false;
  const expected = Buffer.from(hashText, 'base64url');
  const actual = await scrypt(password, Buffer.from(saltText, 'base64url'), expected.length) as Buffer;
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export async function recordFailedLogin(email: string) {
  const { error } = await createAdminClient().rpc('record_app_login_failure', { p_email: email });
  if (error) throw new Error(`Could not record custom-auth login attempt: ${error.message}`);
}

export async function clearFailedLogins(email: string) {
  const { error } = await createAdminClient().from('app_login_attempts').delete().eq('email', email);
  if (error) throw new Error(`Could not clear custom-auth login attempts: ${error.message}`);
}

function signDatabaseToken(userId: string) {
  const now = Math.floor(Date.now() / 1000);
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({
    aud: 'authenticated',
    exp: now + DB_TOKEN_SECONDS,
    iat: now,
    iss: 'supabase',
    role: 'authenticated',
    sub: userId,
  })).toString('base64url');
  const input = `${header}.${payload}`;
  const signature = createHmac('sha256', requiredEnv('SUPABASE_JWT_SECRET')).update(input).digest('base64url');
  return `${input}.${signature}`;
}

async function readSession(): Promise<{ user: AppUser; sessionId: string } | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const admin = createAdminClient();
  const { data, error } = await admin.from('app_sessions')
    .select('id,user_id,expires_at,revoked_at,app_users(id,email,email_verified_at)')
    .eq('token_hash', hashOpaqueToken(token))
    .maybeSingle();
  if (error) throw new Error(`Could not validate custom-auth session: ${error.message}`);
  const record = data as (SessionRecord & { id: string }) | null;
  const relatedUser = Array.isArray(record?.app_users) ? record.app_users[0] : record?.app_users;
  if (!record || record.revoked_at || Date.parse(record.expires_at) <= Date.now() || !relatedUser?.email_verified_at) return null;
  return { user: relatedUser, sessionId: record.id };
}

export async function getCurrentUser(): Promise<AppUser | null> {
  return (await readSession())?.user ?? null;
}

export async function getDatabaseAccessToken() {
  const session = await readSession();
  return session ? signDatabaseToken(session.user.id) : null;
}

export async function createSession(userId: string) {
  const token = createOpaqueToken();
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  const { error } = await createAdminClient().from('app_sessions').insert({
    user_id: userId,
    token_hash: hashOpaqueToken(token),
    expires_at: expiresAt.toISOString(),
  });
  if (error) throw new Error(`Could not create custom-auth session: ${error.message}`);
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: expiresAt,
  });
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) {
    const { error } = await createAdminClient().from('app_sessions')
      .update({ revoked_at: new Date().toISOString() })
      .eq('token_hash', hashOpaqueToken(token))
      .is('revoked_at', null);
    if (error) throw new Error(`Could not end custom-auth session: ${error.message}`);
  }
  jar.delete(SESSION_COOKIE);
}

