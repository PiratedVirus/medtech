import { NextRequest, NextResponse } from 'next/server';
import { promoteProfileToProduction } from '@/lib/llm/profile-service';

export const runtime = 'nodejs';

export async function POST(_request: NextRequest, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  try {
    const profile = await promoteProfileToProduction(id);
    return NextResponse.json({ success: true, data: profile });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: String(e?.message || e) }, { status: 400 });
  }
}


