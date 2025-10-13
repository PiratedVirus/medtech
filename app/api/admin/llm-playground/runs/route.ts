import { NextRequest, NextResponse } from 'next/server';
import { createRun, getRunById } from '@/lib/llm/profile-service';
import { executePlaygroundRun } from '@/lib/llm/playground-runner';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const idParam = searchParams.get('id');
  if (!idParam) return NextResponse.json({ success: false, error: 'Missing id' }, { status: 400 });
  const run = await getRunById(Number(idParam));
  if (!run) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
  return NextResponse.json({ success: true, data: run });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { profileId, inputType, rawInput, sourceFileUrl, sourceFileUrls, documentType } = body || {};
    if (!profileId || !inputType) {
      return NextResponse.json({ success: false, error: 'profileId and inputType required' }, { status: 400 });
    }
    
    // Handle multiple PDFs for prescriptions
    const finalSourceFileUrl = sourceFileUrls && sourceFileUrls.length > 0 
      ? sourceFileUrls.join(',') // Join multiple URLs with comma
      : sourceFileUrl;
    
    const run = await createRun({ 
      profileId: Number(profileId), 
      inputType, 
      rawInput: rawInput ?? null, 
      sourceFileUrl: finalSourceFileUrl ?? null 
    });

    // Fire-and-forget run execution
    executePlaygroundRun({ 
      runId: run.id, 
      profileId: Number(profileId), 
      inputType, 
      rawInput: rawInput ?? null, 
      sourceFileUrl: finalSourceFileUrl ?? null,
      documentType: documentType ?? 'lab_report',
      sourceFileUrls: sourceFileUrls ?? null
    }).catch(console.error);

    return NextResponse.json({ success: true, data: { runId: run.id } });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: String(e?.message || e) }, { status: 400 });
  }
}


