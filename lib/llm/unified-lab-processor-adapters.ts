/**
 * Adapter Functions for Unified Lab Processor
 * 
 * These functions provide backward compatibility with existing code
 * while using the new unified processor under the hood.
 */

import { 
  processLabReportWithLLM, 
  LabReportProcessingContext,
  ProcessingOptions 
} from './unified-lab-processor';
import prisma from '@/lib/prisma';

/**
 * Adapter for triggerLLMProcessing() - Standalone Reports
 * 
 * This replaces the old triggerLLMProcessing() function
 * Usage: await triggerLLMProcessingForStandaloneReport(reportId, analysisType)
 */
export async function triggerLLMProcessingForStandaloneReport(
  reportId: number,
  analysisType: 'lab_analysis' | 'prescription_analysis' | 'document_summary' = 'lab_analysis'
) {
  // Get the standalone report
  const report = await prisma.standaloneReport.findUnique({
    where: { id: reportId }
  });

  if (!report) {
    throw new Error('Standalone report not found');
  }

  // Get or create analysis record
  let analysis = await prisma.standaloneReportAnalysis.findFirst({
    where: { 
      reportId,
      analysisType
    }
  });

  if (!analysis) {
    analysis = await prisma.standaloneReportAnalysis.create({
      data: {
        reportId,
        analysisType,
        processingStatus: 'PENDING'
      }
    });
  }

  // Use extracted report date from trendAnalysis if available
  const existingReportDate = (analysis.trendAnalysis as any)?.reportDate;
  const reportDate = existingReportDate && !Number.isNaN(new Date(existingReportDate).getTime())
    ? new Date(existingReportDate)
    : undefined;

  // Create context for unified processor
  const context: LabReportProcessingContext = {
    reportType: 'standalone',
    standaloneReportId: reportId,
    standaloneAnalysisId: analysis.id,
    pdfUrl: report.fileUrl,
    patientId: report.patientId,
    reportDate
  };

  // Create progress updater
  const updateProgress = async (stage: string, message: string) => {
    await prisma.standaloneReportAnalysis.updateMany({
      where: { id: analysis.id },
      data: { processingError: message }
    });
  };

  // Process with unified processor
  const options: ProcessingOptions = {
    analysisType,
    updateProgress
  };

  const result = await processLabReportWithLLM(context, options);

  if (!result.success) {
    throw new Error(result.error || 'LLM processing failed');
  }

  return result;
}

/**
 * Adapter for processWithOpenRouter() - Lab Booking Reports
 * 
 * This replaces the old processWithOpenRouter() function
 * Usage: await processLabBookingReportWithLLM(analysisId, pdfUrl, patientId, labBookingId)
 */
export async function processLabBookingReportWithLLM(
  analysisId: number,
  pdfUrl: string,
  patientId: number,
  labBookingId: number
) {
  // Get the analysis record
  const analysis = await prisma.labReportAnalysis.findUnique({
    where: { id: analysisId },
    include: {
      labBooking: true
    }
  });

  if (!analysis) {
    throw new Error('Lab report analysis not found');
  }

  // Create context for unified processor
  const context: LabReportProcessingContext = {
    reportType: 'labBooking',
    labBookingId: labBookingId,
    labReportAnalysisId: analysisId,
    labResultIndex: analysis.labResultIndex,
    pdfUrl: pdfUrl,
    patientId: patientId,
    reportDate: (analysis.trendAnalysis as any)?.reportDate
      ? new Date((analysis.trendAnalysis as any).reportDate)
      : undefined
  };

  // Process with unified processor
  const options: ProcessingOptions = {
    analysisType: 'lab_analysis'
  };

  const result = await processLabReportWithLLM(context, options);

  if (!result.success) {
    throw new Error(result.error || 'LLM processing failed');
  }

  return result;
}

/**
 * Backward compatibility exports
 * 
 * These maintain the old function names for existing code
 */
export const triggerLLMProcessing = triggerLLMProcessingForStandaloneReport;
export const processWithOpenRouter = processLabBookingReportWithLLM;
