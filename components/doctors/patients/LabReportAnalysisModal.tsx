'use client'
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { X, FileText, TrendingUp, AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "react-toastify";

interface LabReport {
  id: number;
  labPackageName: string;
  date: string;
  status: string;
  reportLink?: string[] | null;
}

interface CriticalValue {
  parameter: string;
  value: string;
  unit: string;
  normalRange: string;
  isAbnormal: boolean;
  severity: 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';
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
  criticalValues: CriticalValue[];
  trendAnalysis: TrendData[];
  processingStatus: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  llmModel: string;
  processedAt: string;
  processingError?: string;
}

interface LabReportAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientId: string;
  labReports: LabReport[];
}

export default function LabReportAnalysisModal({
  isOpen,
  onClose,
  patientId,
  labReports
}: LabReportAnalysisModalProps) {
  const [selectedReportId, setSelectedReportId] = useState<number | null>(null);
  const [analysis, setAnalysis] = useState<LabReportAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('summary');

  const selectedReport = labReports.find(r => r.id === selectedReportId);

  // Remove auto-selection of first report

  useEffect(() => {
    // Reset analysis when modal opens/closes or report changes
    if (isOpen) {
      setAnalysis(null);
      setSelectedReportId(null);
    }
  }, [isOpen]);

  // When user selects a report, check status and process if needed
  const handleReportSelect = async (reportId: number) => {
    setSelectedReportId(reportId);
    setAnalysis(null);
    setLoading(true);
    
    try {
      // Single endpoint call to check status and get existing analysis
      const response = await fetch(`/api/llm-process?reportId=${reportId}`);
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch report status');
      }
      
      if (data.status === 'exists') {
        // Analysis exists, display it
        setAnalysis(data.analysis);
        setLoading(false);
        toast.success("Analysis loaded successfully!");
        return;
      }
      
      if (data.status === 'not_found') {
        // No analysis exists, start processing
        if (!data.canProcess) {
          toast.warning("No PDF available for this report. Creating sample analysis.");
        }
        await processReport(reportId);
        return;
      }
      
    } catch (error) {
      console.error('Error in report selection:', error);
      toast.error(`Error: ${(error as Error).message}`);
      setLoading(false);
    }
  };

  // Removed fetchAnalysis and handleGenerateAnalysis - now handled in handleReportSelect

  const processReport = async (reportId: number) => {
    try {
      const response = await fetch(`/api/llm-process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reportId, patientId }),
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Processing failed');
      }

      // Handle different response statuses
      switch (result.status) {
        case 'already_exists':
          setAnalysis(result.analysis);
          setLoading(false);
          toast.success("Analysis already completed!");
          break;
          
        case 'processing':
          toast.info("Analysis is already being processed. Please wait...");
          pollForCompletion(reportId);
          break;
          
        case 'sample_created':
          setAnalysis(result.analysis);
          setLoading(false);
          toast.success("Sample analysis created for testing!");
          break;
          
        case 'processing_started':
          toast.success(`AI analysis started! Estimated time: ${result.estimatedTime}`);
          pollForCompletion(reportId);
          break;
          
        default:
          throw new Error(`Unknown status: ${result.status}`);
      }
    } catch (error) {
      console.error('Error processing report:', error);
      toast.error(`Error: ${(error as Error).message}`);
      setLoading(false);
    }
  };

  const pollForCompletion = async (reportId: number) => {
    let pollCount = 0;
    const maxPolls = 60; // 3 minutes max (3 seconds * 60 = 180 seconds)
    
    const pollInterval = setInterval(async () => {
      pollCount++;
      
      try {
        const response = await fetch(`/api/llm-process?reportId=${reportId}`);
        const data = await response.json();
        
        if (data.success && data.status === 'exists') {
          const analysis = data.analysis;
          
          if (analysis.processingStatus === 'COMPLETED') {
            clearInterval(pollInterval);
            setAnalysis(analysis);
            setLoading(false);
            toast.success("AI analysis completed successfully!");
          } else if (analysis.processingStatus === 'FAILED') {
            clearInterval(pollInterval);
            setLoading(false);
            toast.error(`Analysis failed: ${analysis.processingError || 'Unknown error'}`);
          }
          // If still processing, continue polling
        } else if (pollCount >= maxPolls) {
          clearInterval(pollInterval);
          setLoading(false);
          toast.warning("Analysis is taking longer than expected. Please refresh and try again.");
        }
      } catch (error) {
        console.error('Polling error:', error);
        if (pollCount >= maxPolls) {
          clearInterval(pollInterval);
          setLoading(false);
          toast.error("Connection error while checking analysis status.");
        }
      }
    }, 3000); // Poll every 3 seconds
  };

  const retryAnalysis = async (reportId: number) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/llm-process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          reportId,
          patientId, 
          forceReprocess: true 
        }),
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Retry failed');
      }

      toast.success("Retrying analysis...");
      pollForCompletion(reportId);
    } catch (error) {
      console.error('Error retrying analysis:', error);
      toast.error(`Retry failed: ${(error as Error).message}`);
      setLoading(false);
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 overflow-hidden">
        {/* Header - 10% of screen height */}
        <DialogHeader className="h-[10vh] bg-gradient-to-r from-secondary to-secondary/80 text-white p-4 flex flex-row items-center justify-between">
          <div className="flex items-center gap-4">
            {/* <Brain className="h-6 w-6" /> */}
            <DialogTitle className="text-xl font-bold">AI Lab Report Analysis</DialogTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-white hover:bg-white/20"
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        {/* Report Tabs - Top Row */}
        <div className="h-[8vh] border-b bg-gray-50 px-4 py-2 overflow-x-auto">
          <div className="flex gap-2 h-full items-center">
            {labReports.map((report) => (
              <Button
                key={report.id}
                variant={selectedReportId === report.id ? "default" : "outline"}
                size="sm"
                onClick={() => handleReportSelect(report.id)}
                className={`whitespace-nowrap ${
                  selectedReportId === report.id 
                    ? 'bg-secondary text-white' 
                    : 'text-gray-700 border-gray-300'
                }`}
              >
                <FileText className="h-4 w-4 mr-2" />
                {report.labPackageName}
                <Badge variant="secondary" className="ml-2 text-xs">
                  {new Date(report.date).toLocaleDateString()}
                </Badge>
              </Button>
            ))}
          </div>
        </div>

        {/* Main Content - 82% of screen height */}
        <div className="h-[82vh] overflow-y-auto">
          {!selectedReportId ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-lg font-medium text-gray-600">Select a Lab Report</p>
                <p className="text-sm text-gray-500 mt-2">
                  Click on a report tab above to automatically process with AI
                </p>
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
          ) : analysis ? (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="p-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="summary">AI Summary</TabsTrigger>
                <TabsTrigger value="critical">Critical Values</TabsTrigger>
                <TabsTrigger value="trends">Trend Analysis</TabsTrigger>
              </TabsList>

              <TabsContent value="summary" className="mt-4">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">AI Analysis Summary</h3>
                      <Badge variant="outline">
                        {analysis.llmModel || 'AI Model'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="prose max-w-none">
                      {analysis.llmSummary ? (
                        <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                          {analysis.llmSummary}
                        </p>
                      ) : (
                        <div className="text-center text-gray-500 py-8">
                          {analysis.processingStatus === 'FAILED' ? (
                            <div className="text-red-600">
                              <AlertTriangle className="h-8 w-8 mx-auto mb-4" />
                              <div className="font-medium text-lg">Analysis Failed</div>
                              <div className="text-sm mt-2 max-w-md mx-auto">
                                {analysis.processingError || 'Unknown error occurred during processing'}
                              </div>
                              <div className="mt-4">
                                <button 
                                  onClick={() => retryAnalysis(selectedReportId!)}
                                  className="px-4 py-2 bg-secondary text-white rounded hover:bg-secondary/90"
                                  disabled={loading}
                                >
                                  {loading ? 'Retrying...' : 'Retry Analysis'}
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div>
                              <FileText className="h-8 w-8 mx-auto mb-4 text-gray-400" />
                              <p>No analysis summary available</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    {analysis.processedAt && (
                      <div className="mt-4 text-sm text-gray-500">
                        Analysis completed: {new Date(analysis.processedAt).toLocaleString()}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="critical" className="mt-4">
                <Card>
                  <CardHeader>
                    <h3 className="text-lg font-semibold">Critical Values & Parameters</h3>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-2 font-medium">Parameter</th>
                            <th className="text-left p-2 font-medium">Value</th>
                            <th className="text-left p-2 font-medium">Normal Range</th>
                            <th className="text-left p-2 font-medium">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {analysis.criticalValues && Array.isArray(analysis.criticalValues) && analysis.criticalValues.length > 0 ? analysis.criticalValues.map((value, index) => (
                            <tr key={index} className="border-b hover:bg-gray-50">
                              <td className="p-2 font-medium">{value.parameter}</td>
                              <td className="p-2">
                                {value.value} {value.unit}
                              </td>
                              <td className="p-2 text-sm text-gray-600">
                                {value.normalRange}
                              </td>
                              <td className="p-2">
                                <Badge className={getSeverityColor(value.severity)}>
                                  {value.isAbnormal && value.severity !== 'NORMAL' && (
                                    <AlertTriangle className="h-3 w-3 mr-1" />
                                  )}
                                  {value.severity}
                                </Badge>
                              </td>
                            </tr>
                          )) : (
                            <tr>
                              <td colSpan={4} className="p-4 text-center text-gray-500">
                                {analysis.processingStatus === 'FAILED' 
                                  ? (
                                    <div className="text-red-600">
                                      <AlertTriangle className="h-5 w-5 mx-auto mb-2" />
                                      <div className="font-medium">Analysis Failed</div>
                                      <div className="text-sm mt-1">{analysis.processingError || 'Unknown error occurred'}</div>
                                    </div>
                                  )
                                  : 'No critical values found in this analysis.'
                                }
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="trends" className="mt-4">
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      <h3 className="text-lg font-semibold">Trend Comparison</h3>
                    </div>
                  </CardHeader>
{/* 
                  <CardContent>
                    <div className="space-y-4">
                      {analysis.trendAnalysis.map((trend, index) => (
                        <div key={index} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium">{trend.parameter}</h4>
                            <div className="flex items-center gap-2">
                              <span className="text-2xl">{getTrendIcon(trend.trend)}</span>
                              <Badge variant={trend.trend === 'IMPROVING' ? 'default' : 
                                           trend.trend === 'WORSENING' ? 'destructive' : 'secondary'}>
                                {trend.trend}
                              </Badge>
                            </div>
                          </div>
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="text-gray-600">Previous:</span>
                              <div className="font-medium">{trend.previousValue}</div>
                            </div>
                            <div>
                              <span className="text-gray-600">Current:</span>
                              <div className="font-medium">{trend.currentValue}</div>
                            </div>
                            <div>
                              <span className="text-gray-600">Change:</span>
                              <div className={`font-medium ${
                                trend.changePercent > 0 ? 'text-green-600' : 
                                trend.changePercent < 0 ? 'text-red-600' : 'text-gray-600'
                              }`}>
                                {trend.changePercent > 0 ? '+' : ''}{trend.changePercent}%
                              </div>
                            </div>
                          </div>
                          <div className="text-xs text-gray-500 mt-2">
                            Period: {trend.dateRange}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                 */}
                </Card>
              </TabsContent>
            </Tabs>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-lg font-medium text-gray-600">Processing Lab Report</p>
                <p className="text-sm text-gray-500 mt-2">
                  AI analysis will appear here shortly...
                </p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}