import 'server-only';
import { extractPdfText, llmGenerateSummaryFromText } from './llm/processing';

export interface PrescriptionProcessingResult {
  success: boolean;
  extractedText?: string;
  summary?: string;
  keyFindings?: string[];
  recommendations?: string[];
  urgency?: 'ROUTINE' | 'SOON' | 'URGENT';
  error?: string;
}

export class PrescriptionProcessor {
  /**
   * Process a prescription PDF: extract text and generate AI summary
   */
  static async processPrescription(
    pdfUrl: string,
    apiKey: string,
    siteUrl: string
  ): Promise<PrescriptionProcessingResult> {
    try {
      console.log('[PRESCRIPTION-PROC] Starting PDF processing for:', pdfUrl);
      
      // Extract text from PDF
      const extractedText = await extractPdfText(pdfUrl);
      console.log('[PRESCRIPTION-PROC] Text extracted successfully, length:', extractedText.length);
      
      // Generate AI summary from extracted text
      const summaryResult = await llmGenerateSummaryFromText(extractedText, apiKey, siteUrl);
      console.log('[PRESCRIPTION-PROC] AI summary generated successfully');
      
      return {
        success: true,
        extractedText,
        summary: summaryResult.summary,
        keyFindings: summaryResult.keyFindings,
        recommendations: summaryResult.recommendations,
        urgency: summaryResult.urgency
      };
    } catch (error) {
      console.error('[PRESCRIPTION-PROC] Processing failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Generate a comprehensive patient summary based on all prescriptions
   */
  static async generatePatientSummary(
    prescriptionTexts: string[],
    apiKey: string,
    siteUrl: string
  ): Promise<PrescriptionProcessingResult> {
    try {
      if (prescriptionTexts.length === 0) {
        return {
          success: false,
          error: 'No prescription texts available for summary generation'
        };
      }

      console.log('[PRESCRIPTION-PROC] Generating patient summary from', prescriptionTexts.length, 'prescriptions');
      
      // Combine all prescription texts with context
      const combinedText = prescriptionTexts
        .map((text, index) => `Prescription ${index + 1}:\n${text}`)
        .join('\n\n---\n\n');
      
      // Generate comprehensive summary
      const summaryResult = await llmGenerateSummaryFromText(combinedText, apiKey, siteUrl);
      
      return {
        success: true,
        summary: summaryResult.summary,
        keyFindings: summaryResult.keyFindings,
        recommendations: summaryResult.recommendations,
        urgency: summaryResult.urgency
      };
    } catch (error) {
      console.error('[PRESCRIPTION-PROC] Patient summary generation failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
}
