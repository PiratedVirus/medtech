import { format } from "date-fns";
import { FileText, Eye, Bot, AlertCircle, CheckCircle, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface StandaloneReport {
  id: number;
  fileName: string;
  reportType: string;
  createdAt: string;
  fileUrl: string;
  uploadedBy: {
    name: string;
    role: string;
  };
  reportAnalyses: {
    id: number;
    analysisType: string;
    processingStatus: string;
    llmSummary?: string;
    allValues?: any[];
    criticalValues?: any[];
    keyFindings?: any[];
    recommendations?: any[];
    urgency?: string;
    processedAt?: string;
    trendAnalysis?: any;
  }[];
}

const getReportTypeIcon = (type: string) => {
  switch (type) {
    case 'lab_report':
      return <FileText className="w-5 h-5 text-blue-600" />;
    case 'prescription':
      return <FileText className="w-5 h-5 text-green-600" />;
    case 'medical_document':
      return <FileText className="w-5 h-5 text-purple-600" />;
    default:
      return <FileText className="w-5 h-5 text-gray-600" />;
  }
};

const getReportTypeLabel = (type: string) => {
  switch (type) {
    case 'lab_report':
      return 'Lab Report';
    case 'prescription':
      return 'Prescription';
    case 'medical_document':
      return 'Medical Document';
    default:
      return 'Report';
  }
};

const getProcessingStatusIcon = (status: string) => {
  switch (status) {
    case 'COMPLETED':
      return <CheckCircle className="w-4 h-4 text-green-600" />;
    case 'PROCESSING':
      return <Clock className="w-4 h-4 text-blue-600 animate-spin" />;
    case 'FAILED':
      return <AlertCircle className="w-4 h-4 text-red-600" />;
    default:
      return <Clock className="w-4 h-4 text-gray-600" />;
  }
};

const getProcessingStatusText = (status: string) => {
  switch (status) {
    case 'COMPLETED':
      return 'Analysis Complete';
    case 'PROCESSING':
      return 'Analyzing...';
    case 'FAILED':
      return 'Analysis Failed';
    case 'PENDING':
      return 'Pending Analysis';
    default:
      return 'Unknown';
  }
};


interface StandaloneReportCardProps {
  report: StandaloneReport;
  onViewAnalysis?: (report: StandaloneReport) => void;
}

export default function StandaloneReportCard({ report, onViewAnalysis }: StandaloneReportCardProps) {
  const latestAnalysis = report.reportAnalyses[0];
  const hasAnalysis = latestAnalysis && latestAnalysis.processingStatus === 'COMPLETED';
  const hasCriticalValues = latestAnalysis?.criticalValues && latestAnalysis.criticalValues.length > 0;

  // Use extracted report date from trendAnalysis if available, fallback to createdAt (upload date)
  const trendAnalysis = latestAnalysis?.trendAnalysis as any;
  const reportDate = trendAnalysis?.reportDate || report.createdAt;

  return (
    <div className="bg-white shadow-md rounded-3xl p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-3">
          {getReportTypeIcon(report.reportType)}
          <div>
            <p className="text-lg font-bold text-primary">{report.fileName}</p>
            <p className="text-sm text-gray-500">{getReportTypeLabel(report.reportType)}</p>
            <p className="text-sm text-gray-400">
              Report Date: {format(new Date(reportDate), "dd/MM/yyyy")}
            </p>
            <p className="text-sm text-gray-400">
              By: {report.uploadedBy.name} ({report.uploadedBy.role})
            </p>
          </div>
        </div>
        
        <div className="flex flex-col items-end gap-2">
          {latestAnalysis && (
            <div className="flex items-center gap-2">
              {getProcessingStatusIcon(latestAnalysis.processingStatus)}
              <span className="text-xs text-gray-600">
                {getProcessingStatusText(latestAnalysis.processingStatus)}
              </span>
            </div>
          )}
          
          {hasCriticalValues && (
            <Badge className="text-xs bg-red-100 text-red-800 border-red-200">
              <AlertCircle className="w-3 h-3 mr-1" />
              Critical Values
            </Badge>
          )}
        </div>
      </div>


      {/* Key Findings */}
      {hasAnalysis && latestAnalysis.keyFindings && latestAnalysis.keyFindings.length > 0 && (
        <div className="mb-4">
          <p className="text-sm font-medium text-gray-700 mb-2">Key Findings:</p>
          <div className="flex flex-wrap gap-1">
            {latestAnalysis.keyFindings.slice(0, 3).map((finding: string, index: number) => (
              <Badge key={index} className="text-xs bg-blue-50 text-blue-400 border-blue-200 hover:bg-blue-100">
                {finding}
              </Badge>
            ))}
            {latestAnalysis.keyFindings.length > 3 && (
              <Badge className="text-xs bg-gray-50 text-gray-600 border-gray-200">
                +{latestAnalysis.keyFindings.length - 3} more
              </Badge>
            )}
          </div>
        </div>
      )}


      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.open(report.fileUrl, '_blank')}
          className="flex-1"
        >
          <Eye className="w-4 h-4 mr-2" />
          View Report
        </Button>
        
        {hasAnalysis && (
          <Button
            variant="default"
            size="sm"
            onClick={() => onViewAnalysis?.(report)}
            className="flex-1"
          >
            <Bot className="w-4 h-4 mr-2" />
            View Analysis
          </Button>
        )}
      </div>
    </div>
  );
}
