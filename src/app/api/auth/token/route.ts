import { NextResponse } from 'next/server';
import { DB_TOKEN_SECONDS, getDatabaseAccessToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export async function GET() {
  const accessToken = await getDatabaseAccessToken();
  return NextResponse.json({ accessToken, expiresIn: accessToken ? DB_TOKEN_SECONDS : 0 }, {
    headers: { 'Cache-Control': 'no-store, private' },
  });
}
