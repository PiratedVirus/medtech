import { NextRequest, NextResponse } from 'next/server';
import { createProfile, listProfiles } from '@/lib/llm/profile-service';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search') || undefined;
  const profiles = await listProfiles({ search });
  return NextResponse.json({ success: true, data: profiles });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const profile = await createProfile(body);
    return NextResponse.json({ success: true, data: profile });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: String(e?.message || e) }, { status: 400 });
  }
}


