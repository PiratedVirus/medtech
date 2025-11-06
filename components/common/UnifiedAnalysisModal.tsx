'use client'
import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  FileText, 
  Eye, 
  Loader2, 
  Search, 
  List, 
  AlertTriangle, 
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { useToast } from '@/hooks/use-toast';
import { toast } from "react-toastify";

interface LabReport {
  id: number;
  labPackageName: string;
  date: string;
  status: string;
  reportLink?: string[] | null;
  labResult?: string[] | null;
}

interface StandaloneReport {
  id: number;
  reportType: string;
  fileName: string;
  createdAt: string;
  status: string;
  fileUrl: string;
  reportAnalyses: StandaloneReportAnalysis[];
  stage1Notified?: boolean;
  stage2Notified?: boolean;
  stage3Notified?: boolean;
}

interface StandaloneReportAnalysis {
  id: number;
  analysisType: string;
  extractedText?: string;
  llmSummary?: string;
  allValues?: any[];
  criticalValues?: any[];
  keyFindings?: any[];
  recommendations?: any[];
  urgency?: string;
  processingStatus: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  llmModel?: string;
  processedAt?: string;
  processingError?: string;
}

interface LabValue {
  parameter: string;
  value: string | number;
  unit: string;
  normalRange: string;
  isAbnormal: boolean;
  severity: 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';
  category?: string;
}

interface TrendData {
  parameter: string;
  trend: 'IMPROVING' | 'STABLE' | 'WORSENING';
  changePercent: number;
  previousValue: string;
  currentValue: string;
  dateRange: string;
}

interface LabReportAnalysis {
  id: number;
  llmSummary: string;
  criticalValues: LabValue[];
  allValues: LabValue[];
  trendAnalysis: TrendData[];
  processingStatus: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  llmModel: string;
  processedAt: string;
  processingError?: string;
  keyFindings?: string[];
  recommendations?: string[];
  urgency?: 'ROUTINE' | 'SOON' | 'URGENT';
}

interface UnifiedAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientId: string;
  labReports: LabReport[];
  standaloneReports?: StandaloneReport[];
  preSelectedStandaloneReportId?: number | null;
}

export default function UnifiedAnalysisModal({
  isOpen,
  onClose,
  patientId,
  labReports,
  standaloneReports = [],
  preSelectedStandaloneReportId = null
}: UnifiedAnalysisModalProps) {
  
  const [selectedReportId, setSelectedReportId] = useState<number | null>(null);
  const [selectedLabResultIndex, setSelectedLabResultIndex] = useState<number | null>(null);
  const [selectedStandaloneReportId, setSelectedStandaloneReportId] = useState<number | null>(null);
  const [analysis, setAnalysis] = useState<LabReportAnalysis | null>(null);
  const [standaloneAnalysis, setStandaloneAnalysis] = useState<StandaloneReportAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showAllValues, setShowAllValues] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'lab-reports' | 'standalone-reports'>('lab-reports');
  const [showFailedReports, setShowFailedReports] = useState(false);

  const selectedReport = labReports.find(r => r.id === selectedReportId);
  const selectedStandaloneReport = standaloneReports.find(r => r.id === selectedStandaloneReportId);

  // Fetch standalone reports if not provided
  const [fetchedStandaloneReports, setFetchedStandaloneReports] = useState<StandaloneReport[]>([]);
  
  useEffect(() => {
    if (isOpen && patientId && standaloneReports.length === 0) {
      fetchStandaloneReports();
    }
  }, [isOpen, patientId, standaloneReports.length]);

  const fetchStandaloneReports = async () => {
    try {
      const response = await fetch(`/api/reports/upload?patientId=${patientId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setFetchedStandaloneReports(data.reports);
        }
      }
    } catch (error) {
      console.error('Failed to fetch standalone reports:', error);
    }
  };

  // Use provided standalone reports or fetched ones
  const allStandaloneReports = standaloneReports.length > 0 ? standaloneReports : fetchedStandaloneReports;
  
  // Filter reports based on showFailedReports state
  const filteredLabReports = showFailedReports 
    ? labReports 
    : labReports.filter(report => report.status !== 'FAILED');
  
  const filteredStandaloneReports = showFailedReports
    ? allStandaloneReports
    : allStandaloneReports.filter(report => {
        const hasFailedAnalysis = report.reportAnalyses?.some(
          analysis => analysis.processingStatus === 'FAILED'
        );
        return !hasFailedAnalysis;
      });

  // Handle pre-selection when modal opens
  useEffect(() => {
    if (isOpen && preSelectedStandaloneReportId) {
      setActiveTab('standalone-reports');
      setSelectedStandaloneReportId(preSelectedStandaloneReportId);
      
      // Find and set the analysis for the pre-selected report
      const preSelectedReport = allStandaloneReports.find(r => r.id === preSelectedStandaloneReportId);
      if (preSelectedReport?.reportAnalyses?.length && preSelectedReport.reportAnalyses.length > 0) {
        const completedAnalysis = preSelectedReport.reportAnalyses.find(a => a.processingStatus === 'COMPLETED');
        const analysis = completedAnalysis || preSelectedReport.reportAnalyses[0];
        setStandaloneAnalysis(analysis);
      }
    }
  }, [isOpen, preSelectedStandaloneReportId, allStandaloneReports]);

  // Polling mechanism for standalone reports
  useEffect(() => {
    if (!selectedStandaloneReportId) return;

    const pollInterval = setInterval(async () => {
      try {
        await fetchStandaloneReports();
        const updatedReport = allStandaloneReports.find(r => r.id === selectedStandaloneReportId);
        if (updatedReport?.reportAnalyses[0]?.processingStatus === 'COMPLETED') {
          clearInterval(pollInterval);
          setStandaloneAnalysis(updatedReport.reportAnalyses[0]);
          setLoading(false);
          setIsProcessing(false);
          toast.success('Standalone analysis completed!');
        } else if (updatedReport?.reportAnalyses[0]?.processingStatus === 'FAILED') {
          clearInterval(pollInterval);
          setLoading(false);
          setIsProcessing(false);
          toast.error('Standalone analysis failed!');
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, 2000);

    return () => clearInterval(pollInterval);
  }, [selectedStandaloneReportId, allStandaloneReports]);

  const handleReportSelect = async (reportId: number, labResultIndex: number = 0) => {
    try {
      setSelectedReportId(reportId);
      setSelectedLabResultIndex(labResultIndex);
      setSelectedStandaloneReportId(null);
      setStandaloneAnalysis(null);
      await fetchAnalysis(reportId, labResultIndex);
    } finally {
      setIsProcessing(false);
    }
  };

  const fetchAnalysis = async (reportId: number, labResultIndex: number = 0) => {
    try {
      setLoading(true);
      console.log('[UI][FETCH] Fetching analysis for report:', reportId, 'lab result index:', labResultIndex);

      const response = await fetch(`/api/lab-analysis/check?reportId=${reportId}&labResultIndex=${labResultIndex}`);
      if (response.ok) {
        const data = await response.json();
        console.log('[UI][FETCH] Analysis response:', data);

        if (data.success && data.exists) {
          const fetchedAnalysis: LabReportAnalysis = {
            id: 0, // API doesn't return analysis ID, using 0 as placeholder
            llmSummary: data.summary || '',
            criticalValues: data.criticalValues || [],
            allValues: data.allValues || [],
            trendAnalysis: [],
            processingStatus: data.processingStatus || 'COMPLETED',
            llmModel: data.llmModel || 'cached-from-db',
            processedAt: data.processedAt || new Date().toISOString(),
            keyFindings: data.keyFindings || [],
            recommendations: data.recommendations || [],
            urgency: data.urgency || 'ROUTINE'
          };
          
          setAnalysis(fetchedAnalysis);
          toast.success('Loaded analysis from database');
        } else {
          console.log('[UI][FETCH] No analysis found in database');
          setAnalysis(null);
        }
      } else {
        console.log('[UI][FETCH] API response not ok:', response.status);
        setAnalysis(null);
      }
    } catch (error) {
      console.error('Error fetching analysis:', error);
      setAnalysis(null);
    } finally {
      setLoading(false);
    }
  };

  const processReport = async (reportId: number, labResultIndex: number = 0) => {
    if (isProcessing) {
      console.log('[UI][PROCESS] Already processing, ignoring process call');
      return;
    }

    try {
      setLoading(true);
      setIsProcessing(true);
      console.log('[UI][PROCESS] Starting process for report:', reportId, 'lab result index:', labResultIndex);

      const response = await fetch('/api/llm-process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportId,
          labResultIndex,
          patientId: Number(patientId)
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('[UI][PROCESS] Process response:', data);

      if (data.success) {
        // Fetch the updated analysis
        await fetchAnalysis(reportId, labResultIndex);
        toast.success('Analysis completed successfully!');
      } else {
        throw new Error(data.error || 'Process failed');
      }
    } catch (error) {
      console.error('Error processing report:', error);
      toast.error(`Process failed: ${(error as Error).message}`);
    } finally {
      setLoading(false);
      setIsProcessing(false);
    }
  };

  const processStandaloneReport = async (reportId: number) => {
    if (isProcessing) {
      console.log('[UI][PROCESS] Already processing, ignoring process call');
      return;
    }

    try {
      setLoading(true);
      setIsProcessing(true);
      console.log('[UI][PROCESS] Starting process for standalone report:', reportId);

      const response = await fetch('/api/reports/upload/regenerate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportId,
          analysisType: 'lab_analysis'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('[UI][PROCESS] Standalone process response:', data);

      if (data.success) {
        toast.success('Standalone analysis started!');
        // Polling will handle the updates
      } else {
        throw new Error(data.error || 'Process failed');
      }
    } catch (error) {
      console.error('Error processing standalone report:', error);
      toast.error(`Standalone process failed: ${(error as Error).message}`);
    } finally {
      // Don't set loading to false here - let polling handle it
    }
  };

  const retryAnalysis = async (reportId: number, labResultIndex: number = 0) => {
    if (isProcessing) {
      console.log('[UI][RETRY] Already processing, ignoring retry');
      return;
    }
    
    try {
      setLoading(true);
      setIsProcessing(true);
      await processReport(reportId, labResultIndex);
    } catch (error) {
      console.error('Error retrying analysis:', error);
      toast.error(`Retry failed: ${(error as Error).message}`);
      setLoading(false);
    } finally {
      setIsProcessing(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'bg-red-100 text-red-800 border-red-200';
      case 'HIGH': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'LOW': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-green-100 text-green-800 border-green-200';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'IMPROVING': return '📈';
      case 'WORSENING': return '📉';
      default: return '➡️';
    }
  };

  const getUrgencyBadge = (urgency?: string) => {
    switch (urgency) {
      case 'URGENT': return <Badge className="bg-red-600 text-white">URGENT</Badge>;
      case 'SOON': return <Badge className="bg-amber-500 text-white">SOON</Badge>;
      default: return <Badge variant="outline">ROUTINE</Badge>;
    }
  };

  // Normalize bullet arrays in case model returned single semicolon-joined string
  const toBullets = (arr?: string[]) => {
    if (!arr || arr.length === 0) return [] as string[];
    if (arr.length > 1) return arr.filter(Boolean);
    const [only] = arr;
    if (typeof only === 'string' && only.includes(';')) {
      return only.split(';').map(s => s.trim()).filter(Boolean);
    }
    return arr.filter(Boolean);
  };


  const getFilteredValues = () => {
    const values = showAllValues ? (analysis?.allValues || standaloneAnalysis?.allValues || []) : (analysis?.criticalValues || standaloneAnalysis?.criticalValues || []);
    if (!searchTerm) return values;

    return values.filter((value: any) =>
      value.parameter.toLowerCase().includes(searchTerm.toLowerCase()) ||
      value.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      value.value.toString().toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const groupValuesByCategory = (values: LabValue[]) => {
    const grouped = values.reduce((acc, value) => {
      const category = value.category || 'Other';
      if (!acc[category]) acc[category] = [];
      acc[category].push(value);
      return acc;
    }, {} as Record<string, LabValue[]>);

    return Object.entries(grouped).sort();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] h-[95vh] p-0 overflow-hidden flex flex-col mx-auto my-auto">
        {/* Header */}
        <DialogHeader className="p-4 flex flex-row items-center justify-between">
          <DialogTitle className="text-xl font-bold">Medical Reports Analysis</DialogTitle>
          
          {/* Centered Tabs */}
          <div className="flex-1 flex justify-center">
            <div className="flex border rounded-lg p-1 bg-gray-100">
              <button
                onClick={() => setActiveTab('lab-reports')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'lab-reports'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Lab Reports ({filteredLabReports.length})
              </button>
              <button
                onClick={() => setActiveTab('standalone-reports')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'standalone-reports'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Uploaded Reports ({filteredStandaloneReports.length})
              </button>
            </div>
          </div>

          {/* Right side: Refresh and Show/Hide Failed toggle */}
          <div className="flex items-center gap-2">
            {activeTab === 'standalone-reports' && (
              <Button
                variant="outline"
                size="sm"
                onClick={fetchStandaloneReports}
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Refresh
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFailedReports(!showFailedReports)}
              className="text-xs"
            >
              {showFailedReports ? 'Hide Failed' : 'Show Failed'}
            </Button>
          </div>
        </DialogHeader>

        {/* Report Selection Buttons - Carousel */}
        <div className="px-4 pb-4 flex-shrink-0 relative">
          <Carousel opts={{ align: "start", dragFree: true }} className="w-full">
            <CarouselContent className="-ml-2">
              {activeTab === 'lab-reports' ? (
              filteredLabReports.map((report) => {
              // Use labResult if available, otherwise fall back to reportLink
              const results = report.labResult || report.reportLink || [];
              
              if (results.length === 0) {
                // No results available
                return (
                  <CarouselItem key={report.id} className="pl-2 basis-auto">
                    <div className="relative">
                      <button
                        disabled
                        className="relative overflow-hidden rounded-xl border px-3 py-2 shadow-sm whitespace-nowrap transition-all border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed"
                      >
                        <span className="relative z-10 inline-flex items-center gap-2">
                          <FileText className="h-4 w-4 text-gray-400" />
                          <span className="font-semibold">{report.labPackageName}</span>
                          <span className="ml-2 text-xs rounded-full px-2 py-0.5 bg-gray-200 text-gray-500">
                            {new Date(report.date).toLocaleDateString('en-GB')}
                          </span>
                        </span>
                      </button>
                    </div>
                  </CarouselItem>
                );
              }

              if (results.length === 1) {
                // Single result - show normally
                const isActive = selectedReportId === report.id;
                return (
                  <CarouselItem key={report.id} className="pl-2 basis-auto">
                    <div className="relative">
                      {/* Blur edge effect - blue theme */}
                      {isActive && (
                        <div 
                          aria-hidden="true" 
                          className="absolute -inset-1 rounded-[16px] bg-[conic-gradient(at_70%_20%,#3b82f6_0deg,#1d4ed8_120deg,#1e40af_240deg,#3b82f6_360deg)] opacity-50 blur" 
                        />
                      )}
                      <button
                        onClick={() => {
                          console.log('[UI][BUTTON_CLICK] Report button clicked:', report.id, 'Current selected:', selectedReportId);
                          handleReportSelect(report.id);
                        }}
                        className={`relative overflow-hidden rounded-xl border px-3 py-2 shadow-sm whitespace-nowrap transition-all ${
                          isActive
                            ? 'border-sky-500 bg-blue-50 text-blue-800'
                            : 'border-gray-300 text-gray-700 hover:border-blue-300 hover:bg-blue-50/50'
                        }`}
                      >
                        <span className="relative z-10 inline-flex items-center gap-2">
                          <FileText className={`h-4 w-4 ${isActive ? 'text-sky-600' : 'text-sky-700'}`} />
                          <span className={`font-semibold ${isActive ? 'text-sky-600' : 'text-gray-700'}`}>{report.labPackageName}</span>
                          <span className={`ml-2 text-xs rounded-full px-2 py-0.5 ${isActive ? 'bg-blue-100 text-sky-700 border border-sky-200' : 'bg-blue-100 text-blue-700'}`}>
                            {new Date(report.date).toLocaleDateString('en-GB')}
                          </span>
                        </span>
                      </button>
                    </div>
                  </CarouselItem>
                );
              }

              // Multiple results - show each as separate button
              return results.map((result: string, index: number) => {
                const resultId = `${report.id}-${index}`;
                const isActive = selectedReportId === report.id && selectedLabResultIndex === index;
                return (
                  <CarouselItem key={resultId} className="pl-2 basis-auto">
                    <div className="relative">
                      {/* Blur edge effect - blue theme */}
                      {isActive && (
                        <div 
                          aria-hidden="true" 
                          className="absolute -inset-1 rounded-[16px] bg-[conic-gradient(at_70%_20%,#3b82f6_0deg,#1d4ed8_120deg,#1e40af_240deg,#3b82f6_360deg)] opacity-50 blur" 
                        />
                      )}
                      <button
                        onClick={() => {
                          console.log('[UI][BUTTON_CLICK] Lab result button clicked:', resultId, 'Current selected:', selectedReportId, 'Lab result index:', index);
                          handleReportSelect(report.id, index);
                        }}
                        className={`relative overflow-hidden rounded-xl border px-3 py-2 shadow-sm whitespace-nowrap transition-all ${
                          isActive
                            ? 'border-sky-500 bg-blue-50 text-blue-800'
                            : 'border-gray-300 text-gray-700 hover:border-blue-300 hover:bg-blue-50/50'
                        }`}
                      >
                        <span className="relative z-10 inline-flex items-center gap-2">
                          <FileText className={`h-4 w-4 ${isActive ? 'text-sky-600' : 'text-sky-700'}`} />
                          <span className={`font-semibold ${isActive ? 'text-sky-600' : 'text-gray-700'}`}>
                            {report.labPackageName}-{index + 1}
                          </span>
                          <span className={`ml-2 text-xs rounded-full px-2 py-0.5 ${isActive ? 'bg-blue-100 text-sky-700 border border-sky-200' : 'bg-blue-100 text-blue-700'}`}>
                            {new Date(report.date).toLocaleDateString('en-GB')}
                          </span>
                        </span>
                      </button>
                    </div>
                  </CarouselItem>
                );
              });
              })
            ) : (
              filteredStandaloneReports.map((report) => {
                const isActive = selectedStandaloneReportId === report.id;
                return (
                  <CarouselItem key={report.id} className="pl-2 basis-auto">
                    <div className="relative">
                      {/* Blur edge effect - blue theme */}
                      {isActive && (
                        <div 
                          aria-hidden="true" 
                          className="absolute -inset-1 rounded-[16px] bg-[conic-gradient(at_70%_20%,#3b82f6_0deg,#1d4ed8_120deg,#1e40af_240deg,#3b82f6_360deg)] opacity-50 blur" 
                        />
                      )}
                      <button
                        onClick={() => {
                          console.log('[UI][BUTTON_CLICK] Standalone report button clicked:', report.id, 'Current selected:', selectedStandaloneReportId);
                          setSelectedStandaloneReportId(report.id);
                          setSelectedReportId(null);
                          setAnalysis(null); // Clear previous analysis
                          setLoading(true);
                          setIsProcessing(true);
                          
                          // Check if analysis already exists
                          if (report.reportAnalyses && report.reportAnalyses.length > 0) {
                            const completedAnalysis = report.reportAnalyses.find(a => a.processingStatus === 'COMPLETED');
                            if (completedAnalysis) {
                              setStandaloneAnalysis(completedAnalysis);
                              setLoading(false);
                              setIsProcessing(false);
                              return;
                            }
                          }
                          
                          processStandaloneReport(report.id);
                        }}
                        className={`relative overflow-hidden rounded-xl border px-3 py-2 shadow-sm whitespace-nowrap transition-all ${
                          isActive
                            ? 'border-sky-500 bg-blue-50 text-blue-800'
                            : 'border-gray-300 text-gray-700 hover:border-blue-300 hover:bg-blue-50/50'
                        }`}
                      >
                        <span className="relative z-10 inline-flex items-center gap-2">
                          <FileText className={`h-4 w-4 ${isActive ? 'text-sky-600' : 'text-sky-700'}`} />
                          <span className={`font-semibold truncate max-w-[200px] ${isActive ? 'text-sky-600' : 'text-gray-700'}`} title={report.fileName}>
                            {report.fileName}
                          </span>
                          <span className={`ml-2 text-xs rounded-full px-2 py-0.5 flex-shrink-0 ${isActive ? 'bg-blue-100 text-sky-700 border border-sky-200' : 'bg-blue-100 text-blue-700'}`}>
                            {new Date(report.createdAt).toLocaleDateString('en-GB')}
                          </span>
                          {/* Status indicator */}
                          {report.reportAnalyses && report.reportAnalyses.length > 0 && (
                            <span className={`ml-2 text-xs rounded-full px-2 py-0.5 flex-shrink-0 ${
                              report.reportAnalyses[0].processingStatus === 'COMPLETED' 
                                ? 'bg-green-100 text-green-700 border border-green-200'
                                : report.reportAnalyses[0].processingStatus === 'PROCESSING'
                                ? 'bg-yellow-100 text-yellow-700 border border-yellow-200'
                                : report.reportAnalyses[0].processingStatus === 'FAILED'
                                ? 'bg-red-100 text-red-700 border border-red-200'
                                : 'bg-gray-100 text-gray-700 border border-gray-200'
                            }`}>
                              {report.reportAnalyses[0].processingStatus}
                            </span>
                          )}
                        </span>
                      </button>
                    </div>
                  </CarouselItem>
                );
              })
            )}
            </CarouselContent>
            <CarouselPrevious className="absolute left-2 top-1/2 -translate-y-1/2" />
            <CarouselNext className="absolute right-2 top-1/2 -translate-y-1/2" />
          </Carousel>
        </div>

        {/* Main Content - Scrollable */}
        <div key={`content-${selectedReportId || selectedStandaloneReportId || 'none'}`} className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
          {!selectedReportId && !selectedStandaloneReportId ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <FileText className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <p className="text-xl font-semibold text-gray-600 mb-2">Select a Report</p>
                <p className="text-sm text-gray-500">Choose a report from the tabs above to view AI analysis</p>
              </div>
            </div>
          ) : loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-secondary" />
                <p className="text-lg font-medium">Analyzing Report with AI...</p>
                <p className="text-sm text-gray-600 mt-2">This may take a few moments</p>
              </div>
            </div>
          ) : (analysis || standaloneAnalysis) ? (
            <div className="space-y-4">
              {/* Combined AI Analysis Card with modern gradient background */}
              <div className="relative rounded-xl overflow-hidden border border-blue-200/50 shadow-lg">
                {/* Clean Gradient Background - whitish to bluish */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/80 via-blue-50/70 to-blue-100/80" />
                
                {/* Content */}
                <div className="relative z-10 p-6">
                  {/* Header */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Sparkles className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-blue-800">AI Analysis</h3>
                        {standaloneAnalysis && (
                          <p className="text-sm text-blue-600">
                            {selectedStandaloneReport?.fileName} - {standaloneAnalysis.analysisType}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* AI Summary Section */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-md font-semibold text-blue-800">Summary</h4>
                      <div className="flex gap-2">
                        {/* Show individual lab result buttons if multiple exist */}
                        {selectedReport && (() => {
                          const results = selectedReport.labResult || selectedReport.reportLink || [];
                          if (results.length === 0) return null;
                          
                          if (results.length === 1) {
                            return (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => window.open(results[0], '_blank')}
                                className="text-blue-600 border-blue-300 hover:bg-blue-50"
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                View Report
                              </Button>
                            );
                          }
                          
                          // Multiple results - show each as separate button
                          return results.map((result: string, index: number) => (
                            <Button
                              key={index}
                              variant={selectedLabResultIndex === index ? "default" : "outline"}
                              size="sm"
                              onClick={() => window.open(result, '_blank')}
                              className={`${
                                selectedLabResultIndex === index 
                                  ? "bg-blue-600 text-white border-blue-600" 
                                  : "text-blue-600 border-blue-300 hover:bg-blue-50"
                              }`}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Result {index + 1}
                            </Button>
                          ));
                        })()}
                        
                        {/* Show standalone report info */}
                        {selectedStandaloneReport && (
                          <div className="flex items-center gap-2">
                            {/* <Badge variant="outline" className="text-xs">
                              {selectedStandaloneReport.reportType}
                            </Badge> */}
                            <span className="text-xs text-gray-600">
                              Uploaded: {new Date(selectedStandaloneReport.createdAt).toLocaleDateString()}
                            </span>
                            {selectedStandaloneReport.fileUrl && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => window.open(selectedStandaloneReport.fileUrl, '_blank')}
                                className="text-blue-600 border-blue-300 hover:bg-blue-50"
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                View File
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {analysis?.llmSummary ? (
                      <p className="text-gray-700 leading-relaxed text-justify whitespace-pre-wrap bg-white/60 rounded-lg p-4 border border-blue-100/50">
                        {analysis.llmSummary}
                      </p>
                    ) : standaloneAnalysis?.llmSummary ? (
                      <p className="text-gray-700 leading-relaxed text-justify whitespace-pre-wrap bg-white/60 rounded-lg p-4 border border-blue-100/50">
                        {standaloneAnalysis.llmSummary}
                      </p>
                    ) : (
                      <p className="text-gray-500 italic">No summary available</p>
                    )}
                  </div>

                  {/* Key Findings & Recommendations in single row */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Key Findings */}
                    <div className="bg-white/70 rounded-2xl p-4 border border-blue-100/50">
                      <h4 className="font-semibold text-blue-800 mb-3">Key Findings</h4>
                      {toBullets(analysis?.keyFindings || standaloneAnalysis?.keyFindings).length > 0 ? (
                        <ul className="space-y-2">
                          {toBullets(analysis?.keyFindings || standaloneAnalysis?.keyFindings).map((item, idx) => (
                            <li key={idx} className="text-gray-700 leading-relaxed pl-6 relative">
                              <span className="absolute left-0 top-2 w-1.5 h-1.5 bg-gray-400 rounded-full"></span>
                              {item}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-gray-500 text-sm italic">No key findings provided</p>
                      )}
                    </div>

                    {/* Recommendations */}
                    <div className="bg-white/70 rounded-2xl p-4 border border-blue-100/50">
                      <h4 className="font-semibold text-blue-800 mb-3">Recommendations</h4>
                      {toBullets(analysis?.recommendations || standaloneAnalysis?.recommendations).length > 0 ? (
                        <ul className="space-y-2">
                          {toBullets(analysis?.recommendations || standaloneAnalysis?.recommendations).map((item, idx) => (
                            <li key={idx} className="text-gray-700 leading-relaxed pl-6 relative">
                              <span className="absolute left-0 top-2 w-1.5 h-1.5 bg-gray-400 rounded-full"></span>
                              {item}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-gray-500 text-sm italic">No recommendations provided</p>
                      )}
                    </div>
                  </div>

                  {/* Urgency Level */}
                  {(analysis?.urgency || standaloneAnalysis?.urgency) && (
                    <div className="mt-6">
                      <div className="bg-white/70 rounded-2xl p-4 border border-blue-100/50">
                        <h4 className="font-semibold text-blue-800 mb-3">Urgency Level</h4>
                        <div className="flex items-center gap-2">
                          {getUrgencyBadge(analysis?.urgency || standaloneAnalysis?.urgency)}
                          <span className="text-sm text-gray-600">
                            {(analysis?.urgency || standaloneAnalysis?.urgency) === 'URGENT' && 'Requires immediate attention'}
                            {(analysis?.urgency || standaloneAnalysis?.urgency) === 'SOON' && 'Should be addressed soon'}
                            {(analysis?.urgency || standaloneAnalysis?.urgency) === 'ROUTINE' && 'Standard follow-up recommended'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              </div>

              {/* Lab Values Card */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold">Laboratory Values</h3>
                    <div className="flex items-center gap-4">
                      {/* Counts (left of search) */}
                      <div className="text-xs text-gray-600 whitespace-nowrap">
                        {showAllValues ? (
                          <span>All: {(analysis?.allValues || standaloneAnalysis?.allValues)?.length ?? 0}</span>
                        ) : (
                          <span>Abnormal: {(analysis?.criticalValues || standaloneAnalysis?.criticalValues)?.length ?? 0}</span>
                        )}
                      </div>
                      {/* Search Bar */}
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <Input
                          type="text"
                          placeholder="Search parameters..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10 w-64"
                        />
                      </div>
                      {/* Toggle Icons */}
                      <div className="flex items-center gap-2">
                        <Button
                          variant={showAllValues ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setShowAllValues(true)}
                          className={`${showAllValues ? 'bg-blue-600 text-white' : 'text-blue-700 border-blue-300'}`}
                        >
                          <List className="h-4 w-4 mr-1" /> All
                        </Button>
                        <Button
                          variant={!showAllValues ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setShowAllValues(false)}
                          className={`${!showAllValues ? 'bg-red-600 text-white' : 'text-red-700 border-red-300'}`}
                        >
                          <AlertTriangle className="h-4 w-4 mr-1" /> Critical
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {(() => {
                    const filteredValues = getFilteredValues();
                    const groupedValues = groupValuesByCategory(filteredValues);
                    if (filteredValues.length === 0) {
                      return (
                        <div className="text-center py-8">
                          <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                          <p className="text-gray-500">
                            {searchTerm ? 'No values match your search.' : showAllValues ? 'No values found in this report.' : 'No critical values detected.'}
                          </p>
                        </div>
                      );
                    }
                    return (
                      <div className="space-y-6">
                        {groupedValues.map(([category, values]) => (
                          <div key={category} className="rounded-lg border border-gray-200 bg-white p-3">
                            <h4 className="font-semibold text-md mb-3 text-gray-700">{category}</h4>
                            <div className="overflow-x-auto rounded-md border border-gray-100">
                              <table className="w-full border-collapse">
                                <thead>
                                  <tr className="border-b bg-blue-50">
                                    <th className="text-left p-3 font-medium text-blue-900">Parameter</th>
                                    <th className="text-left p-3 font-medium text-blue-900">Value</th>
                                    <th className="text-left p-3 font-medium text-blue-900">Normal Range</th>
                                    <th className="text-left p-3 font-medium text-blue-900">Status</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {values.map((value, index) => (
                                    <tr key={index} className={`border-b border-gray-100 ${
                                      value.isAbnormal 
                                        ? value.severity === 'CRITICAL' 
                                          ? 'bg-red-50' 
                                          : value.severity === 'HIGH' 
                                          ? 'bg-orange-50' 
                                          : 'bg-yellow-50'
                                        : 'bg-white hover:bg-gray-50'
                                    }`}>
                                      <td className="p-3 font-medium text-gray-900">{value.parameter}</td>
                                      <td className="p-3">
                                        <span className="font-semibold">{value.value}</span>
                                        {value.unit && <span className="text-gray-600 ml-1">{value.unit}</span>}
                                      </td>
                                      <td className="p-3 text-gray-600">{value.normalRange}</td>
                                      <td className="p-3">
                                        <Badge 
                                          className={`${getSeverityColor(value.severity)} text-xs font-medium`}
                                        >
                                          {value.isAbnormal ? value.severity : 'NORMAL'}
                                        </Badge>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <AlertTriangle className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                <p className="text-xl font-semibold text-gray-600 mb-2">No Analysis Available</p>
                <p className="text-sm text-gray-500 mb-4">
                  {selectedReport ? 'This report hasn\'t been analyzed yet.' : 'This standalone report hasn\'t been processed yet.'}
                </p>
                {selectedReport && (
                  <Button
                    onClick={() => processReport(selectedReport.id, selectedLabResultIndex || 0)}
                    disabled={isProcessing}
                    className="mt-2"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Analyze with AI
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}