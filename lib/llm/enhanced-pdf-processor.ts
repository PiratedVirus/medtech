// Dynamic import of pdf-parse to avoid server-side issues
// import pdfParse from 'pdf-parse';

// Enhanced PDF processing with multiple strategies and error handling
export class EnhancedPDFProcessor {
  private static readonly MAX_PDF_SIZE_MB = 50;
  private static readonly MAX_DIRECT_UPLOAD_MB = 5;
  private static readonly MAX_TEXT_LENGTH = 8000;
  private static readonly RETRY_ATTEMPTS = 3;
  private static readonly RETRY_DELAY_MS = 1000;

  /**
   * Main entry point for PDF processing
   * Uses cascading fallback strategies for maximum reliability
   */
  static async processPDF(pdfUrl: string, apiKey: string, siteUrl: string): Promise<string> {
    // Check if API key is configured
    if (!apiKey || apiKey.trim() === '') {
      console.warn('No OpenRouter API key configured, returning informative fallback');
      return this.createNoApiKeyResponse();
    }

    const strategies = [
      this.processWithTextExtraction,
      this.processWithDirectUpload,
      this.processWithUrlReference
    ];

    let lastError: Error | null = null;

    for (const strategy of strategies) {
      try {
        console.log(`Trying strategy: ${strategy.name}`);
        const result = await this.withRetry(() => strategy(pdfUrl, apiKey, siteUrl));
        console.log(`Strategy ${strategy.name} succeeded`);
        return result;
      } catch (error) {
        console.warn(`Strategy ${strategy.name} failed:`, error);
        lastError = error as Error;
        continue;
      }
    }

    throw new Error(`All PDF processing strategies failed. Last error: ${lastError?.message}`);
  }

  /**
   * Create informative response when no API key is configured
   */
  private static createNoApiKeyResponse(): string {
    return `**SUMMARY**
🔑 **API Key Required**: To enable AI-powered analysis of your lab reports, please configure your OpenRouter API key.

**Setup Instructions:**
1. Sign up at https://openrouter.ai (free)
2. Get your API key from the dashboard
3. Add to your .env.local file: OPENROUTER_API_KEY="your_key_here"
4. Restart your development server

**CRITICAL VALUES**
[
  {"parameter": "Setup Required", "value": "Missing API Key", "unit": "config", "normalRange": "API key configured", "isAbnormal": true, "severity": "HIGH"}
]

**TRENDS**
Please configure your API key to enable real-time AI analysis of lab reports with medical insights and trend tracking.`;
  }

  /**
   * Strategy 1: Extract text from PDF and send to LLM
   * Most reliable approach, works with all models
   */
  private static async processWithTextExtraction(pdfUrl: string, apiKey: string, siteUrl: string): Promise<string> {
    console.log('Starting text extraction strategy');
    
    // Download and validate PDF
    const pdfBuffer = await this.downloadPDF(pdfUrl);
    const extractedText = await this.extractTextFromPDF(pdfBuffer);
    
    // Send extracted text to LLM
    return await this.sendTextToLLM(extractedText, apiKey, siteUrl);
  }

  /**
   * Strategy 2: Direct PDF upload as base64
   * Works for smaller files, preserves visual elements
   */
  private static async processWithDirectUpload(pdfUrl: string, apiKey: string, siteUrl: string): Promise<string> {
    console.log('Starting direct upload strategy');
    
    const pdfBuffer = await this.downloadPDF(pdfUrl);
    
    // Check size limit for direct upload
    const sizeMB = pdfBuffer.length / (1024 * 1024);
    if (sizeMB > this.MAX_DIRECT_UPLOAD_MB) {
      throw new Error(`PDF too large for direct upload: ${sizeMB.toFixed(2)}MB (max: ${this.MAX_DIRECT_UPLOAD_MB}MB)`);
    }

    const base64Data = pdfBuffer.toString('base64');
    return await this.sendPDFToLLM(base64Data, apiKey, siteUrl);
  }

  /**
   * Strategy 3: Send PDF URL to LLM
   * Last resort, model-dependent
   */
  private static async processWithUrlReference(pdfUrl: string, apiKey: string, siteUrl: string): Promise<string> {
    console.log('Starting URL reference strategy');
    return await this.sendUrlToLLM(pdfUrl, apiKey, siteUrl);
  }

  /**
   * Download PDF with validation and error handling
   */
  static async downloadPDF(pdfUrl: string): Promise<Buffer> {
    try {
      const response = await fetch(pdfUrl, {
        headers: {
          'User-Agent': 'CareDB-PDF-Processor/1.0'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to download PDF: ${response.status} ${response.statusText}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Validate file size
      const sizeMB = buffer.length / (1024 * 1024);
      console.log(`Downloaded PDF: ${sizeMB.toFixed(2)}MB`);

      if (sizeMB > this.MAX_PDF_SIZE_MB) {
        throw new Error(`PDF too large: ${sizeMB.toFixed(2)}MB (max: ${this.MAX_PDF_SIZE_MB}MB)`);
      }

      return buffer;
    } catch (error) {
      throw new Error(`PDF download failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Extract text from PDF buffer with validation
   */
  static async extractTextFromPDF(buffer: Buffer): Promise<string> {
    try {
      // Dynamic import to avoid server-side issues
      const pdfParse = (await import('pdf-parse')).default;
      const pdfData = await pdfParse(buffer);
      let text = pdfData.text;

      if (!text || text.trim().length < 50) {
        throw new Error('PDF text extraction failed or insufficient content');
      }

      // Clean and normalize text
      text = this.cleanExtractedText(text);
      
      // Limit text length to avoid token limits
      if (text.length > this.MAX_TEXT_LENGTH) {
        console.log(`Truncating text from ${text.length} to ${this.MAX_TEXT_LENGTH} characters`);
        text = text.substring(0, this.MAX_TEXT_LENGTH) + '...';
      }

      console.log(`Successfully extracted ${text.length} characters`);
      return text;
    } catch (error) {
      throw new Error(`PDF text extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Clean and normalize extracted text
   */
  static cleanExtractedText(text: string): string {
    return text
      .replace(/\s+/g, ' ')           // Multiple spaces to single space
      .replace(/\n+/g, '\n')          // Multiple newlines to single newline
      .replace(/[^\x20-\x7E\n]/g, '') // Remove non-printable characters except newlines
      .trim();
  }

  /**
   * Send extracted text to LLM for analysis
   */
  private static async sendTextToLLM(text: string, apiKey: string, siteUrl: string): Promise<string> {
    const models = [
      'meta-llama/llama-3.2-3b-instruct:free',
      'microsoft/phi-3-mini-128k-instruct:free',
      'openai/gpt-oss-20b:free'
    ];

    let lastError: Error | null = null;

    for (const model of models) {
      try {
        console.log(`Trying model: ${model}`);
        const result = await this.makeOpenRouterRequest({
          model,
          messages: [{
            role: 'user',
            content: this.createAnalysisPrompt(text)
          }],
          max_tokens: 1800,
          temperature: 0.2
        }, apiKey, siteUrl);

        return result;
      } catch (error) {
        console.warn(`Model ${model} failed:`, error);
        lastError = error as Error;
        continue;
      }
    }

    throw new Error(`All models failed. Last error: ${lastError?.message}`);
  }

  /**
   * Send PDF as base64 to LLM
   */
  private static async sendPDFToLLM(base64Data: string, apiKey: string, siteUrl: string): Promise<string> {
    return await this.makeOpenRouterRequest({
      model: 'meta-llama/llama-3.2-3b-instruct:free',
      messages: [{
        role: 'user',
        content: [
          {
            type: 'text',
            text: this.createAnalysisPrompt()
          },
          {
            type: 'image_url',
            image_url: {
              url: `data:application/pdf;base64,${base64Data}`,
              detail: 'high'
            }
          }
        ]
      }],
      max_tokens: 1800,
      temperature: 0.2
    }, apiKey, siteUrl);
  }

  /**
   * Send PDF URL to LLM for processing
   */
  private static async sendUrlToLLM(pdfUrl: string, apiKey: string, siteUrl: string): Promise<string> {
    return await this.makeOpenRouterRequest({
      model: 'meta-llama/llama-3.2-3b-instruct:free',
      messages: [{
        role: 'user',
        content: `${this.createAnalysisPrompt()}\n\nPDF URL: ${pdfUrl}`
      }],
      max_tokens: 1800,
      temperature: 0.2
    }, apiKey, siteUrl);
  }

  /**
   * Create analysis prompt for medical reports
   */
  private static createAnalysisPrompt(labText?: string): string {
    const basePrompt = `Analyze this medical lab report and return:

**SUMMARY** (max 250 words)

**CRITICAL VALUES** as a JSON array. Use this exact JSON shape:
[
  {"parameter": string, "value": string|number, "unit": string, "normalRange": string, "isAbnormal": boolean, "severity": "LOW"|"NORMAL"|"HIGH"}
]

**TRENDS** (plain text). Focus on diabetes markers, cardiovascular risk, metabolic, kidney and liver function.`;

    if (labText) {
      return `${basePrompt}\n\nLab Report Text:\n${labText}`;
    }

    return basePrompt;
  }

  /**
   * Make OpenRouter API request with error handling
   */
  private static async makeOpenRouterRequest(payload: any, apiKey: string, siteUrl: string): Promise<string> {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': siteUrl,
        'X-Title': 'CareDB Lab Analysis',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenRouter API error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No content received from LLM');
    }

    return content;
  }

  /**
   * Retry wrapper with exponential backoff
   */
  private static async withRetry<T>(operation: () => Promise<T>): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.RETRY_ATTEMPTS; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === this.RETRY_ATTEMPTS) {
          break;
        }

        // Exponential backoff
        const delay = this.RETRY_DELAY_MS * Math.pow(2, attempt - 1);
        console.log(`Attempt ${attempt} failed, retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError;
  }

  /**
   * Validate PDF URL format
   */
  static validatePdfUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);
      const extension = urlObj.pathname.toLowerCase().split('.').pop();
      return extension === 'pdf' || urlObj.pathname.includes('pdf');
    } catch {
      return false;
    }
  }

  /**
   * Get estimated processing time based on file size
   */
  static getEstimatedProcessingTime(fileSizeMB: number): string {
    if (fileSizeMB < 1) return '10-20 seconds';
    if (fileSizeMB < 5) return '20-40 seconds';
    if (fileSizeMB < 10) return '40-60 seconds';
    return '60-90 seconds';
  }
}

// Export utility functions for backward compatibility
export async function extractTextFromPDF(pdfUrl: string): Promise<string> {
  const buffer = await EnhancedPDFProcessor.downloadPDF(pdfUrl);
  return await EnhancedPDFProcessor.extractTextFromPDF(buffer);
}

export function cleanExtractedText(text: string): string {
  return EnhancedPDFProcessor.cleanExtractedText(text);
}
