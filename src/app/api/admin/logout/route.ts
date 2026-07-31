import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const runtime = 'nodejs';

const ADMIN_COOKIE = 'weeds_admin_token';

export async function POST(request: Request) {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_COOKIE);
  return NextResponse.redirect(new URL('/admin', request.url));
}
