import { NextRequest, NextResponse } from 'next/server';
import { extractPdfText } from '@/lib/llm/unified-service';
import { ocrExtractPdfTextFromUrl } from '@/lib/ocr/google-vision';
import { createErrorHandler, categorizeError } from '@/lib/error-handling';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const requestId = Math.random().toString(36).substring(7);
  const errorHandler = createErrorHandler(requestId, 'PARSE_TEXT_API');
  
  console.log(`[PARSE-TEXT][${requestId}] Starting text extraction process`);
  
  try {
    const body = await request.json();
    const { pdfUrl } = body || {};
    
    console.log(`[PARSE-TEXT][${requestId}] Request received:`, {
      hasPdfUrl: !!pdfUrl,
      pdfUrlType: typeof pdfUrl,
      pdfUrlLength: pdfUrl?.length
    });
    
    if (!pdfUrl || typeof pdfUrl !== 'string') {
      console.log(`[PARSE-TEXT][${requestId}] Missing or invalid pdfUrl:`, { pdfUrl, type: typeof pdfUrl });
      return NextResponse.json({ success: false, error: 'Missing pdfUrl' }, { status: 400 });
    }
    
    try { 
      new URL(pdfUrl); 
      console.log(`[PARSE-TEXT][${requestId}] PDF URL validation passed: ${pdfUrl}`);
    } catch (urlError) {
      console.log(`[PARSE-TEXT][${requestId}] Invalid PDF URL format:`, { pdfUrl, error: urlError });
      return NextResponse.json({ success: false, error: 'Invalid pdfUrl' }, { status: 400 });
    }

    let text = '';
    let method: 'pdf-parse' | 'ocr' = 'ocr';
    
    try {
      console.log(`[PARSE-TEXT][${requestId}] Starting OCR text extraction using Google Vision API`);
      const startTime = Date.now();
      
      text = await ocrExtractPdfTextFromUrl(pdfUrl);
      
      const duration = Date.now() - startTime;
      console.log(`[PARSE-TEXT][${requestId}] OCR extraction completed in ${duration}ms, extracted ${text.length} characters`);
      
      if (text.length === 0) {
        console.log(`[PARSE-TEXT][${requestId}] No text extracted from PDF`);
        errorHandler.logTextExtractionValidationError(text, 1);
        return NextResponse.json({ success: true, text: '', warning: 'No extractable text found.', method });
      }
      
      // Log only a preview to avoid flooding logs
      try {
        const words = text.split(/\s+/);
        const preview = words.slice(0, 200).join(' ');
        console.log(`[PARSE-TEXT][${requestId}] Text preview (first 200 words):`, preview);
      } catch (previewError) {
        console.log(`[PARSE-TEXT][${requestId}] Could not generate text preview:`, previewError);
      }
      
      console.log(`[PARSE-TEXT][${requestId}] Text extraction successful: ${text.length} characters extracted`);
      return NextResponse.json({ success: true, text, method });
      
    } catch (ocrErr) {
      const errorCategory = categorizeError(ocrErr);
      console.error(`[PARSE-TEXT][${requestId}] OCR extraction failed (${errorCategory}):`, {
        error: ocrErr,
        message: ocrErr instanceof Error ? ocrErr.message : 'Unknown error',
        stack: ocrErr instanceof Error ? ocrErr.stack : undefined,
        category: errorCategory
      });

      // Use specific error handlers
      if (errorCategory === 'GCP_CREDENTIALS') {
        errorHandler.logGCPCredentialError(ocrErr);
      } else if (errorCategory === 'NETWORK_TIMEOUT' || errorCategory === 'CONNECTION_REFUSED' || errorCategory === 'DNS_ERROR') {
        errorHandler.logNetworkError(ocrErr, 'OCR_EXTRACTION', pdfUrl);
      } else if (errorCategory === 'OCR_FAILURE') {
        errorHandler.logOCRProcessingError(ocrErr, pdfUrl, 'VISION_API');
      } else {
        errorHandler.logOCRProcessingError(ocrErr, pdfUrl, 'GENERAL');
      }
      
      return NextResponse.json({ success: true, text: '', warning: 'No extractable text found (OCR failed).', method });
    }
  } catch (error) {
    const errorCategory = categorizeError(error);
    console.error(`[PARSE-TEXT][${requestId}] Parse-text API error (${errorCategory}):`, {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      category: errorCategory
    });

    // Use appropriate error handler
    if (errorCategory === 'NETWORK_TIMEOUT' || errorCategory === 'CONNECTION_REFUSED' || errorCategory === 'DNS_ERROR') {
      errorHandler.logNetworkError(error, 'PARSE_TEXT_API', 'unknown');
    } else if (errorCategory === 'DATABASE_ERROR') {
      errorHandler.logDatabaseError(error, 'PARSE_TEXT_API');
    } else {
      errorHandler.logOCRProcessingError(error, 'unknown', 'API_GENERAL');
    }
    
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}
