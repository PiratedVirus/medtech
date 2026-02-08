import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { extractValues } from '@/lib/llm/unified-service';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, reportId, force = false } = body || {};
    
    if (!text || typeof text !== 'string' || text.trim().length < 20) {
      return NextResponse.json({ success: false, error: 'Missing or too-short text' }, { status: 400 });
    }
    // console.log('[EXTRACT-FULL-TEXT22] Text:', text);
    // reportId is optional - if not provided, skip caching/validation (used by lab booking regenerate)
    const standaloneReportId = reportId ? Number(reportId) : null;
    let standaloneReport = null;
    
    if (standaloneReportId && !Number.isNaN(standaloneReportId)) {
      // Verify that the standalone report exists (only if reportId is provided)
      standaloneReport = await prisma.standaloneReport.findFirst({
        where: { 
          id: standaloneReportId,
          deletedAt: null
        }
      });
      
      if (!standaloneReport) {
        return NextResponse.json({ success: false, error: 'Standalone report not found' }, { status: 404 });
      }
    }

    // Check text length to prevent context length exceeded errors
    const maxTextLength = 32000; // Conservative limit for Groq API
    if (text.length > maxTextLength) {
      return NextResponse.json({ 
        success: false, 
        error: `Text too long (${text.length} chars). Maximum allowed: ${maxTextLength} characters.` 
      }, { status: 400 });
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) return NextResponse.json({ success: false, error: 'GROQ_API_KEY not configured' }, { status: 500 });

    // Check if we already have extracted values for this report (only if reportId provided)
    let existing = null;
    if (standaloneReportId) {
      existing = await prisma.standaloneReportAnalysis.findFirst({ 
        where: { 
          reportId: standaloneReportId,
          analysisType: 'lab_analysis',
          deletedAt: null
        } 
      });
      
      console.log('[EXTRACT-STANDALONE-VALUES] Existing:', existing);
      if (existing) {
        console.log('[EXTRACT-STANDALONE-VALUES] allValues type:', typeof existing.allValues, 'value:', existing.allValues);
        console.log('[EXTRACT-STANDALONE-VALUES] criticalValues type:', typeof existing.criticalValues, 'value:', existing.criticalValues);
        console.log('[EXTRACT-STANDALONE-VALUES] allValues length:', Array.isArray(existing.allValues) ? existing.allValues.length : 'not an array');
        console.log('[EXTRACT-STANDALONE-VALUES] criticalValues length:', Array.isArray(existing.criticalValues) ? existing.criticalValues.length : 'not an array');
        
        if (!force && (Array.isArray(existing.allValues) && existing.allValues.length > 0) && (Array.isArray(existing.criticalValues) && existing.criticalValues.length > 0)) {
          console.log('[EXTRACT-STANDALONE-VALUES] Returning cached data - values exist');
          return NextResponse.json({
            success: true,
            cached: true,
            data: {
              allValues: existing.allValues || [],
              criticalValues: existing.criticalValues || []
            }
          });
        }
      }
    }
    
    console.log('[EXTRACT-STANDALONE-VALUES] No cached data found or no reportId provided, proceeding with LLM processing');

    // Call Groq to extract values
    try {
      console.log('[EXTRACT-STANDALONE-VALUES] Calling Groq');
      let { allValues, criticalValues } = await extractValues(text, apiKey);
      
      // Fallback: If criticalValues is empty but allValues has abnormal values, populate criticalValues
      if ((!criticalValues || criticalValues.length === 0) && allValues && allValues.length > 0) {
        const abnormal = allValues.filter((v: any) => 
          v && 
          (v.isAbnormal === true || 
           (v.severity && v.severity !== 'NORMAL' && v.severity !== 'normal'))
        );
        if (abnormal.length > 0) {
          criticalValues = abnormal;
          console.log('[EXTRACT-STANDALONE-VALUES] Fallback: Populated', criticalValues.length, 'critical values from allValues (AI did not populate criticalValues)');
        }
      }
      
      console.log('[EXTRACT-STANDALONE-VALUES] Successfully extracted values:', { 
        allValuesCount: allValues?.length || 0, 
        criticalValuesCount: criticalValues?.length || 0 
      });
      
      return NextResponse.json({
        success: true,
        cached: false,
        data: {
          allValues: allValues || [],
          criticalValues: criticalValues || []
        }
      });
      
    } catch (llmError) {
      console.error('[EXTRACT-STANDALONE-VALUES] LLM processing failed:', llmError);
      return NextResponse.json({ 
        success: false, 
        error: `LLM processing failed: ${llmError instanceof Error ? llmError.message : 'Unknown error'}` 
      }, { status: 500 });
    }
    
  } catch (error) {
    console.error('[EXTRACT-STANDALONE-VALUES] Unexpected error:', error);
    return NextResponse.json({ 
      success: false, 
      error: `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}` 
    }, { status: 500 });
  }
}
