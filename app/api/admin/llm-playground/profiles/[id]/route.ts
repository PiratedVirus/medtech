import { NextRequest, NextResponse } from 'next/server';
import { getProfileById, updateProfile } from '@/lib/llm/profile-service';

export const runtime = 'nodejs';

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  const profile = await getProfileById(id);
  if (!profile) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
  return NextResponse.json({ success: true, data: profile });
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number(params.id);
    const body = await request.json();
    const updated = await updateProfile(id, body);
    return NextResponse.json({ success: true, data: updated });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: String(e?.message || e) }, { status: 400 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  return NextResponse.json({ success: false, error: 'Delete not implemented yet' }, { status: 405 });
}


