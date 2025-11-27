import { NextRequest, NextResponse } from 'next/server';
import { draftMode } from 'next/headers';

// Enable draft preview mode if secret matches; redirect to provided path or home.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const secret = searchParams.get('secret');
  const redirectTo = searchParams.get('redirect') || '/';

  const expected = process.env.PREVIEW_SECRET;
  if (!expected) {
    return NextResponse.json({ error: 'Preview secret not configured' }, { status: 500 });
  }
  if (secret !== expected) {
    return NextResponse.json({ error: 'Invalid preview secret' }, { status: 401 });
  }

  // Enable draft mode
  draftMode().enable();
  return NextResponse.redirect(redirectTo);
}
