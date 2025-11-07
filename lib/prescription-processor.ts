import 'server-only';
import { extractPdfText, generateSummary } from './llm/unified-service';

export interface PrescriptionProcessingResult {
  success: boolean;
  extractedText?: string;
  summary?: string;
  keyFindings?: string[];
  recommendations?: string[];
  urgency?: 'ROUTINE' | 'SOON' | 'URGENT';
  error?: string;
}

export interface StructuredPrescriptionData {
  id: number;
  prescriptionNumber: string;
  advice?: string;
  testsRequested?: string;
  nextVisitDate?: Date;
  historyOfCurrentIllness?: string;
  complaints?: Array<{
    complaintText: string;
    severity: string;
    daysSince?: number;
    isFlagged: boolean;
  }>;
  vitals?: {
    bloodPressure?: string;
    pulse?: number;
    height?: number;
    weight?: number;
  };
  history?: {
    allergies?: string;
    personalHistory?: string;
    pastMedicalHistory?: string;
    familyHistory?: string;
  };
  systemicExamination?: {
    general?: string;
    cvs?: string;
    rs?: string;
    cns?: string;
  };
  medicines?: Array<{
    medicineName: string;
    frequency: string;
    medicineTime: string;
    duration: string;
    quantity?: number;
    instructions?: string;
  }>;
  patient?: {
    name: string;
    phone?: string;
  };
  doctor?: {
    name: string;
  };
  createdAt: Date;
}

export class PrescriptionProcessor {
  /**
   * Convert structured prescription data to text format
   */
  static convertStructuredPrescriptionToText(prescription: StructuredPrescriptionData): string {
    const lines: string[] = [];
    
    // Header
    lines.push(`PRESCRIPTION #${prescription.prescriptionNumber}`);
    lines.push(`Date: ${prescription.createdAt.toLocaleDateString()}`);
    lines.push(`Patient: ${prescription.patient?.name || 'Unknown'}`);
    lines.push(`Doctor: ${prescription.doctor?.name || 'Unknown'}`);
    lines.push('');
    
    // Vitals
    if (prescription.vitals) {
      lines.push('VITAL SIGNS:');
      if (prescription.vitals.bloodPressure) lines.push(`Blood Pressure: ${prescription.vitals.bloodPressure} mmHg`);
      if (prescription.vitals.pulse) lines.push(`Pulse: ${prescription.vitals.pulse} bpm`);
      if (prescription.vitals.height) lines.push(`Height: ${prescription.vitals.height} cm`);
      if (prescription.vitals.weight) lines.push(`Weight: ${prescription.vitals.weight} kg`);
      lines.push('');
    }
    
    // Complaints
    if (prescription.complaints && prescription.complaints.length > 0) {
      lines.push('COMPLAINTS:');
      prescription.complaints.forEach((complaint, index) => {
        lines.push(`${index + 1}. ${complaint.complaintText}`);
        if (complaint.severity) lines.push(`   Severity: ${complaint.severity}`);
        if (complaint.daysSince) lines.push(`   Duration: ${complaint.daysSince} days`);
        if (complaint.isFlagged) lines.push(`   Flagged: Yes`);
      });
      lines.push('');
    }
    
    // History of Current Illness
    if (prescription.historyOfCurrentIllness) {
      lines.push('HISTORY OF CURRENT ILLNESS:');
      lines.push(prescription.historyOfCurrentIllness);
      lines.push('');
    }
    
    // Systemic Examination
    if (prescription.systemicExamination) {
      lines.push('SYSTEMIC EXAMINATION:');
      if (prescription.systemicExamination.general) lines.push(`General: ${prescription.systemicExamination.general}`);
      if (prescription.systemicExamination.cvs) lines.push(`CVS: ${prescription.systemicExamination.cvs}`);
      if (prescription.systemicExamination.rs) lines.push(`RS: ${prescription.systemicExamination.rs}`);
      if (prescription.systemicExamination.cns) lines.push(`CNS: ${prescription.systemicExamination.cns}`);
      lines.push('');
    }
    
    // Medicines
    if (prescription.medicines && prescription.medicines.length > 0) {
      lines.push('MEDICINES:');
      prescription.medicines.forEach((medicine, index) => {
        lines.push(`${index + 1}. ${medicine.medicineName}`);
        lines.push(`   Frequency: ${medicine.frequency}`);
        lines.push(`   Time: ${medicine.medicineTime}`);
        lines.push(`   Duration: ${medicine.duration}`);
        if (medicine.quantity) lines.push(`   Quantity: ${medicine.quantity}`);
        if (medicine.instructions) lines.push(`   Instructions: ${medicine.instructions}`);
        lines.push('');
      });
    }
    
    // Advice
    if (prescription.advice) {
      lines.push('ADVICE:');
      lines.push(prescription.advice);
      lines.push('');
    }
    
    // Tests Requested
    if (prescription.testsRequested) {
      lines.push('TESTS REQUESTED:');
      lines.push(prescription.testsRequested);
      lines.push('');
    }
    
    // Next Visit
    if (prescription.nextVisitDate) {
      lines.push('NEXT VISIT:');
      lines.push(`Date: ${prescription.nextVisitDate.toLocaleDateString()}`);
      lines.push('');
    }
    
    return lines.join('\n');
  }

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
      const summaryResult = await generateSummary(extractedText, apiKey);
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
   * Process structured prescription data: convert to text and generate AI summary
   */
  static async processStructuredPrescription(
    prescription: StructuredPrescriptionData,
    apiKey: string
  ): Promise<PrescriptionProcessingResult> {
    try {
      console.log('[PRESCRIPTION-PROC] Starting structured prescription processing for:', prescription.prescriptionNumber);
      
      // Convert structured data to text
      const extractedText = this.convertStructuredPrescriptionToText(prescription);
      console.log('[PRESCRIPTION-PROC] Structured data converted to text, length:', extractedText.length);
      
      // Generate AI summary from converted text
      const summaryResult = await generateSummary(extractedText, apiKey);
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
      console.error('[PRESCRIPTION-PROC] Structured processing failed:', error);
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
      const summaryResult = await generateSummary(combinedText, apiKey);
      
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
