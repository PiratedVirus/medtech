import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { extractValues } from '@/lib/llm/unified-service';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, reportId, labResultIndex = 0, force = false } = body || {};
    if (!text || typeof text !== 'string' || text.trim().length < 20) {
      return NextResponse.json({ success: false, error: 'Missing or too-short text' }, { status: 400 });
    }
    const labBookingId = Number(reportId);
    if (!labBookingId || Number.isNaN(labBookingId)) {
      return NextResponse.json({ success: false, error: 'Missing or invalid reportId' }, { status: 400 });
    }

    // Verify that the lab booking exists
    const labBooking = await prisma.labBooking.findFirst({
      where: { 
        id: labBookingId,
        deletedAt: null
      }
    });
    
    if (!labBooking) {
      return NextResponse.json({ success: false, error: 'Lab booking not found' }, { status: 404 });
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

    // Serve from DB if present and not forced
    const existing = await prisma.labReportAnalysis.findFirst({ 
      where: { 
        labBookingId,
        labResultIndex,
        deletedAt: null
      } 
    });
    console.log('[EXTRACT-VALUES] Existing:', existing);
    if (existing) {
      console.log('[EXTRACT-VALUES] allValues type:', typeof existing.allValues, 'value:', existing.allValues);
      console.log('[EXTRACT-VALUES] criticalValues type:', typeof existing.criticalValues, 'value:', existing.criticalValues);
      console.log('[EXTRACT-VALUES] allValues length:', Array.isArray(existing.allValues) ? existing.allValues.length : 'not an array');
      console.log('[EXTRACT-VALUES] criticalValues length:', Array.isArray(existing.criticalValues) ? existing.criticalValues.length : 'not an array');
      
      if (!force && (Array.isArray(existing.allValues) && existing.allValues.length > 0) && (Array.isArray(existing.criticalValues) && existing.criticalValues.length > 0)) {
        console.log('[EXTRACT-VALUES] Returning cached data - values exist');
        return NextResponse.json({
          success: true,
          cached: true,
          allValues: existing.allValues || [],
          criticalValues: existing.criticalValues || []
        });
      }
    }
    
    console.log('[EXTRACT-VALUES] No cached data found, proceeding with LLM processing');

    // Call Groq
    try {
      console.log('[EXTRACT-VALUES] Calling Groq');
      const { allValues, criticalValues } = await extractValues(text, apiKey);
      
      // Upsert values in DB
      await prisma.labReportAnalysis.upsert({
        where: { 
          labBookingId_labResultIndex: {
            labBookingId,
            labResultIndex
          }
        },
        create: {
          labBookingId,
          labResultIndex,
          reportUrl: null,
          extractedText: text, // Save the parsed text
          llmSummary: existing?.llmSummary || null,
          criticalValues: criticalValues || [],
          allValues: allValues || [],
          trendAnalysis: existing?.trendAnalysis || {},
          llmModel: process.env.GROQ_VALUES_MODEL || 'llama-3.1-8b-instant',
          processingStatus: 'COMPLETED',
          processedAt: new Date(),
        },
        update: {
          extractedText: text, // Update with new parsed text
          criticalValues: criticalValues || [],
          allValues: allValues || [],
          llmModel: process.env.GROQ_VALUES_MODEL || 'llama-3.1-8b-instant',
          processingStatus: 'COMPLETED',
          processedAt: new Date(),
        }
      });

      return NextResponse.json({ success: true, allValues, criticalValues });
    } catch (error: any) {
      // Handle context length exceeded errors specifically
      if (error.message?.includes('CONTEXT_LENGTH_EXCEEDED')) {
        console.warn('[EXTRACT-VALUES] Context length exceeded, attempting to process in smaller chunks');
        
        // Try to process with a shorter text (first 20000 characters)
        const truncatedText = text.slice(0, 20000);
        try {
          const { allValues, criticalValues } = await extractValues(truncatedText, apiKey);
          
          // Save with truncated text and note the truncation
          await prisma.labReportAnalysis.upsert({
            where: { 
              labBookingId_labResultIndex: {
                labBookingId,
                labResultIndex
              }
            },
            create: {
              labBookingId,
              labResultIndex,
              reportUrl: null,
              extractedText: truncatedText,
              llmSummary: existing?.llmSummary || null,
              criticalValues: criticalValues || [],
              allValues: allValues || [],
              trendAnalysis: existing?.trendAnalysis || {},
              llmModel: process.env.GROQ_VALUES_MODEL || 'llama-3.1-8b-instant',
              processingStatus: 'COMPLETED',
              processingError: 'Text truncated due to length limits',
              processedAt: new Date(),
            },
            update: {
              extractedText: truncatedText,
              criticalValues: criticalValues || [],
              allValues: allValues || [],
              llmModel: process.env.GROQ_VALUES_MODEL || 'llama-3.1-8b-instant',
              processingStatus: 'COMPLETED',
              processingError: 'Text truncated due to length limits',
              processedAt: new Date(),
            }
          });

          return NextResponse.json({ 
            success: true, 
            allValues, 
            criticalValues,
            warning: 'Text was truncated due to length limits. Some data may be incomplete.'
          });
        } catch (truncatedError) {
          console.error('[EXTRACT-VALUES] Failed to process truncated text:', truncatedError);
          throw error; // Re-throw original error
        }
      }
      
      throw error;
    }
  } catch (error) {
    console.error('[EXTRACT-VALUES][ERROR]', error);
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}
