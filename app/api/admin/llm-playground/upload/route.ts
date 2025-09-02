import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    if (!file) return NextResponse.json({ success: false, error: 'file is required' }, { status: 400 });
    const arrayBuffer = await file.arrayBuffer();
    const fileName = `llm-playground-${Date.now()}-${file.name}`;
    const { url } = await put(fileName, arrayBuffer, {
      access: 'public',
      token: process.env.NEXT_PUBLIC_BLOB_READ_WRITE_TOKEN,
    });
    return NextResponse.json({ success: true, url });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: String(e?.message || e) }, { status: 500 });
  }
}


