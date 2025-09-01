export interface Row {
  id: number;
  name: string;
  phone: string | null;
  totalPrescriptions: number;
  processed: number;
  failed: number;
  pending: number;
  urgency: string | null;
  lastUpdated: string | null;
  prescriptionCountInSummary: number;
  llmModel: string | null;
  hasSummary: boolean;
  overallStatus?: string;
  prescriptionDetails?: Array<{
    id: number;
    fileName: string;
    uploadedBy: {
      name: string;
      role: string;
    };
    status: string;
    processedAt?: string | Date;
    hasAnalysis: boolean;
  }>;
}

export interface LabValue {
  parameter: string;
  value: string | number;
  unit: string;
  normalRange: string;
  isAbnormal: boolean;
  severity: 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';
  category?: string;
}

export interface LabAnalysis {
  id: number;
  labResultIndex: number;
  processingStatus: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  llmSummary: string | null;
  processedAt: string | null;
  createdAt: string;
  labBookingId: number;
  allValues?: LabValue[];
  criticalValues?: LabValue[];
  keyFindings?: string[];
  recommendations?: string[];
  urgency?: 'ROUTINE' | 'SOON' | 'URGENT';
  llmModel?: string;
}

export interface LabBooking {
  id: number;
  labPackageName: string;
  labResult: string[];
  analyses: LabAnalysis[];
  createdAt?: string;
  patient?: {
    id: number;
    name: string;
  };
  labPackage?: {
    id: number;
    name: string;
  };
  status?: string;
}

export interface StandaloneReport {
  id: number;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  reportType: string;
  status: string;
  processingError?: string | null;
  createdAt: string;
  updatedAt: string;
  patient: {
    id: number;
    name: string;
    phone: string | null;
  };
  uploadedBy: {
    id: number;
    name: string;
    role: string;
  };
  analyses: StandaloneReportAnalysis[];
}

export interface StandaloneReportAnalysis {
  id: number;
  analysisType: string;
  processingStatus: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  processingError?: string;
  extractedText?: string;
  llmSummary?: string;
  allValues?: any;
  criticalValues?: any;
  keyFindings?: any;
  recommendations?: any;
  urgency?: 'ROUTINE' | 'SOON' | 'URGENT';
  llmModel?: string;
  processedAt?: string;
  createdAt: string;
}

export interface ProcessingStage {
  stage: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  message: string;
  timestamp: Date;
}

export interface ProcessingNotification {
  id: string;
  title: string;
  type: 'lab-analysis' | 'standalone-report' | 'prescription';
  stages: ProcessingStage[];
  overallStatus: 'processing' | 'completed' | 'failed';
  reportId?: number;
  analysisType?: string;
  labResultIndex?: number;
}
