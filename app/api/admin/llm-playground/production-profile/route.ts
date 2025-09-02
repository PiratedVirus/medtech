import { NextRequest, NextResponse } from 'next/server';
import { getActiveProductionProfile } from '@/lib/llm/profile-service';

export const runtime = 'nodejs';

export async function GET(_request: NextRequest) {
  try {
    const profile = await getActiveProductionProfile();
    return NextResponse.json({ success: true, data: profile });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: String(e?.message || e) }, { status: 400 });
  }
}
