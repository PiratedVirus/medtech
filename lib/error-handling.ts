import 'server-only';

// Enhanced error logging utility for text extraction debugging
export class TextExtractionErrorHandler {
  private requestId: string;
  private context: string;

  constructor(requestId: string, context: string) {
    this.requestId = requestId;
    this.context = context;
  }

  // Log network-related errors
  logNetworkError(error: any, operation: string, url?: string) {
    console.error(`[ERROR-HANDLER][${this.requestId}] Network error in ${this.context}:`, {
      operation,
      url: url?.substring(0, 100) + '...',
      error: error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      type: 'NETWORK_ERROR'
    });

    // Check for specific network error patterns
    if (error instanceof Error) {
      if (error.message.includes('timeout')) {
        console.error(`[ERROR-HANDLER][${this.requestId}] TIMEOUT detected: ${operation}`);
      } else if (error.message.includes('ECONNREFUSED')) {
        console.error(`[ERROR-HANDLER][${this.requestId}] CONNECTION REFUSED: ${operation}`);
      } else if (error.message.includes('ENOTFOUND')) {
        console.error(`[ERROR-HANDLER][${this.requestId}] DNS RESOLUTION FAILED: ${operation}`);
      } else if (error.message.includes('ETIMEDOUT')) {
        console.error(`[ERROR-HANDLER][${this.requestId}] CONNECTION TIMEOUT: ${operation}`);
      }
    }
  }

  // Log GCP credential errors
  logGCPCredentialError(error: any) {
    console.error(`[ERROR-HANDLER][${this.requestId}] GCP credential error in ${this.context}:`, {
      error: error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      type: 'GCP_CREDENTIAL_ERROR',
      envVars: {
        hasProjectId: !!process.env.GCP_PROJECT_ID,
        hasClientEmail: !!process.env.GCP_CLIENT_EMAIL,
        hasPrivateKey: !!process.env.GCP_PRIVATE_KEY,
        hasBucketName: !!process.env.GCS_BUCKET
      }
    });
  }

  // Log file format errors
  logFileFormatError(error: any, fileUrl: string, expectedFormat: string) {
    console.error(`[ERROR-HANDLER][${this.requestId}] File format error in ${this.context}:`, {
      error: error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      type: 'FILE_FORMAT_ERROR',
      fileUrl: fileUrl.substring(0, 100) + '...',
      expectedFormat,
      actualContentType: 'unknown' // Would need to be passed from the actual error
    });
  }

  // Log API response errors
  logAPIResponseError(response: Response, operation: string, url?: string) {
    console.error(`[ERROR-HANDLER][${this.requestId}] API response error in ${this.context}:`, {
      operation,
      url: url?.substring(0, 100) + '...',
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      type: 'API_RESPONSE_ERROR'
    });
  }

  // Log OCR processing errors
  logOCRProcessingError(error: any, pdfUrl: string, stage: string) {
    console.error(`[ERROR-HANDLER][${this.requestId}] OCR processing error in ${this.context}:`, {
      error: error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      type: 'OCR_PROCESSING_ERROR',
      stage,
      pdfUrl: pdfUrl.substring(0, 100) + '...',
      timestamp: new Date().toISOString()
    });
  }

  // Log text extraction validation errors
  logTextExtractionValidationError(extractedText: string, minLength: number = 50) {
    console.error(`[ERROR-HANDLER][${this.requestId}] Text extraction validation error in ${this.context}:`, {
      type: 'TEXT_EXTRACTION_VALIDATION_ERROR',
      extractedLength: extractedText.length,
      minRequiredLength: minLength,
      textPreview: extractedText.substring(0, 200),
      isEmpty: extractedText.trim().length === 0,
      timestamp: new Date().toISOString()
    });
  }

  // Log LLM API errors
  logLLMAPIError(error: any, apiName: string, model?: string) {
    console.error(`[ERROR-HANDLER][${this.requestId}] LLM API error in ${this.context}:`, {
      error: error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      type: 'LLM_API_ERROR',
      apiName,
      model,
      timestamp: new Date().toISOString()
    });
  }

  // Log database operation errors
  logDatabaseError(error: any, operation: string, table?: string) {
    console.error(`[ERROR-HANDLER][${this.requestId}] Database error in ${this.context}:`, {
      error: error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      type: 'DATABASE_ERROR',
      operation,
      table,
      timestamp: new Date().toISOString()
    });
  }

  // Log environment configuration issues
  logEnvironmentError(missingVars: string[]) {
    console.error(`[ERROR-HANDLER][${this.requestId}] Environment configuration error in ${this.context}:`, {
      type: 'ENVIRONMENT_ERROR',
      missingVariables: missingVars,
      timestamp: new Date().toISOString()
    });
  }

  // Log timeout errors with context
  logTimeoutError(error: any, operation: string, timeoutMs: number) {
    console.error(`[ERROR-HANDLER][${this.requestId}] Timeout error in ${this.context}:`, {
      error: error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      type: 'TIMEOUT_ERROR',
      operation,
      timeoutMs,
      timestamp: new Date().toISOString()
    });
  }

  // Log memory/performance issues
  logPerformanceError(error: any, operation: string, memoryUsage?: NodeJS.MemoryUsage) {
    console.error(`[ERROR-HANDLER][${this.requestId}] Performance error in ${this.context}:`, {
      error: error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      type: 'PERFORMANCE_ERROR',
      operation,
      memoryUsage,
      timestamp: new Date().toISOString()
    });
  }
}

// Utility function to create error handler
export function createErrorHandler(requestId: string, context: string): TextExtractionErrorHandler {
  return new TextExtractionErrorHandler(requestId, context);
}

// Common error patterns to check for
export const ERROR_PATTERNS = {
  NETWORK_TIMEOUT: /timeout|ETIMEDOUT|ECONNABORTED/i,
  CONNECTION_REFUSED: /ECONNREFUSED|connection refused/i,
  DNS_ERROR: /ENOTFOUND|getaddrinfo ENOTFOUND/i,
  GCP_CREDENTIALS: /credentials|authentication|unauthorized/i,
  FILE_FORMAT: /invalid.*format|unsupported.*type|corrupted/i,
  OCR_FAILURE: /OCR.*failed|text.*extraction.*failed|vision.*api/i,
  LLM_API_ERROR: /api.*error|rate.*limit|quota.*exceeded/i,
  DATABASE_ERROR: /database|prisma|connection.*failed/i
};

// Function to categorize errors
export function categorizeError(error: any): string {
  if (!(error instanceof Error)) return 'UNKNOWN_ERROR';
  
  const message = error.message.toLowerCase();
  
  for (const [category, pattern] of Object.entries(ERROR_PATTERNS)) {
    if (pattern.test(message)) {
      return category;
    }
  }
  
  return 'UNKNOWN_ERROR';
}
