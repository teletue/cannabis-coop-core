import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const runtime = 'nodejs';

const ADMIN_COOKIE = 'weeds_admin_token';
const COOKIE_MAX_AGE = 60 * 60 * 8; // 8 hours

export async function POST(request: Request) {
  const formData = await request.formData();
  const secret = formData.get('secret') as string;
  const expected = process.env.ADMIN_SECRET;

  if (!expected || secret !== expected) {
    return NextResponse.redirect(new URL('/admin?error=1', request.url));
  }

  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE, secret, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: COOKIE_MAX_AGE,
    path: '/',
  });

  return NextResponse.redirect(new URL('/admin', request.url));
}
