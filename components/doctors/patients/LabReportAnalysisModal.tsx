'use client'
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { X, FileText, TrendingUp, AlertTriangle, Loader2, Search, ToggleLeft, ToggleRight } from "lucide-react";
import { toast } from "react-toastify";

interface LabReport {
  id: number;
  labPackageName: string;
  date: string;
  status: string;
  reportLink?: string[] | null;
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
  const [showAllValues, setShowAllValues] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const selectedReport = labReports.find(r => r.id === selectedReportId);

  // Filter values based on search term and toggle
  const getFilteredValues = () => {
    const values = showAllValues ? (analysis?.allValues || []) : (analysis?.criticalValues || []);
    if (!searchTerm) return values;
    
    return values.filter(value => 
      value.parameter.toLowerCase().includes(searchTerm.toLowerCase()) ||
      value.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      value.value.toString().toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  // Group values by category
  const groupValuesByCategory = (values: LabValue[]) => {
    const grouped = values.reduce((acc, value) => {
      const category = value.category || 'Other';
      if (!acc[category]) acc[category] = [];
      acc[category].push(value);
      return acc;
    }, {} as Record<string, LabValue[]>);
    
    return Object.entries(grouped).sort();
  };

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
      await processReport(reportId);
      return;
    } catch (error) {
      console.error('Error in report selection:', error);
      toast.error(`Error: ${(error as Error).message}`);
      setLoading(false);
    }
  };

  // Removed fetchAnalysis and handleGenerateAnalysis - now handled in handleReportSelect

  const processReport = async (reportId: number) => {
    try {
      const selected = labReports.find(r => r.id === reportId);
      const pdfUrl = selected?.reportLink?.[0];
      if (!pdfUrl) {
        throw new Error('No PDF URL found for this report');
      }

      // 1) Parse text once
      const parseRes = await fetch(`/api/llm-process/parse-text`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pdfUrl })
      });
      const parseJson = await parseRes.json();
      if (!parseRes.ok || !parseJson.success) {
        throw new Error(parseJson.error || 'Failed to parse PDF');
      }
      const text: string = parseJson.text;
      console.log('[UI][PARSED_TEXT]', text);
      toast.info('Parsed report text successfully');

      // Prepare a base analysis object to update incrementally
      let partial: LabReportAnalysis = {
        id: 0,
        llmSummary: '',
        criticalValues: [],
        allValues: [],
        trendAnalysis: [],
        processingStatus: 'PROCESSING',
        llmModel: 'meta-llama/llama-3.2-3b-instruct:free + openai/gpt-oss-20b:free',
        processedAt: new Date().toISOString(),
      };
      setAnalysis(partial);

      // Run summary and values independently
      const runSummary = (async () => {
        try {
          const summaryRes = await fetch(`/api/llm-process/generate-summary`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text })
          });
          const summaryJson = await summaryRes.json();
          if (summaryRes.ok && summaryJson.success) {
            partial = {
              ...partial,
              llmSummary: summaryJson.summary,
              processingStatus: 'COMPLETED',
              processedAt: new Date().toISOString(),
            };
            setAnalysis(prev => ({ ...(prev || partial), ...partial }));
          } else {
            console.warn('[UI][SUMMARY] failed:', summaryJson.error);
          }
        } catch (e) {
          console.warn('[UI][SUMMARY] error:', e);
        }
      })();

      const runValues = (async () => {
        try {
          // Optional small delay to mitigate free-tier 429s
          await new Promise(r => setTimeout(r, 900));
          const valuesRes = await fetch(`/api/llm-process/extract-values`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text })
          });
          const valuesJson = await valuesRes.json();
          if (valuesRes.ok && valuesJson.success) {
            partial = {
              ...partial,
              criticalValues: Array.isArray(valuesJson.criticalValues) ? valuesJson.criticalValues : [],
              allValues: Array.isArray(valuesJson.allValues) ? valuesJson.allValues : [],
              processingStatus: 'COMPLETED',
              processedAt: new Date().toISOString(),
            };
            setAnalysis(prev => ({ ...(prev || partial), ...partial }));
          } else {
            console.warn('[UI][VALUES] failed:', valuesJson.error);
          }
        } catch (e) {
          console.warn('[UI][VALUES] error:', e);
        }
      })();

      // Wait for both to finish but don't throw if one fails
      await Promise.allSettled([runSummary, runValues]);

      setLoading(false);
      toast.success('AI analysis updated');
    } catch (error) {
      console.error('Error processing report:', error);
      toast.error(`Error: ${(error as Error).message}`);
      setLoading(false);
    }
  };

  // Remove polling-based flow; not needed with direct LLM calls
  // const pollForCompletion = async (reportId: number) => { /* removed */ };

  const retryAnalysis = async (reportId: number) => {
    try {
      setLoading(true);
      await processReport(reportId);
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
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="summary">AI Summary</TabsTrigger>
                <TabsTrigger value="values">Lab Values</TabsTrigger>
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
                        <>
                          <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                            {analysis.llmSummary}
                          </p>
                          <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                            {analysis.llmSummary}
                          </p>
                        </>
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

              <TabsContent value="values" className="mt-4">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold">Laboratory Values</h3>
                      <div className="flex items-center gap-4">
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
                        
                        {/* Toggle Button */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowAllValues(!showAllValues)}
                          className="flex items-center gap-2"
                        >
                          {showAllValues ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
                          {showAllValues ? 'All Values' : 'Critical Only'}
                          {showAllValues && analysis?.allValues && (
                            <Badge variant="secondary" className="ml-1">
                              {analysis.allValues.length}
                            </Badge>
                          )}
                          {!showAllValues && analysis?.criticalValues && (
                            <Badge variant="destructive" className="ml-1">
                              {analysis.criticalValues.length}
                            </Badge>
                          )}
                        </Button>
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
                              {searchTerm ? 'No values match your search.' : 
                               showAllValues ? 'No values found in this report.' : 
                               'No critical values detected.'}
                            </p>
                          </div>
                        );
                      }
                      
                      return (
                        <div className="space-y-6">
                          {groupedValues.map(([category, values]) => (
                            <div key={category}>
                              <h4 className="font-semibold text-md mb-3 text-gray-700 border-b pb-1">
                                {category}
                              </h4>
                              <div className="overflow-x-auto">
                                <table className="w-full border-collapse">
                                  <thead>
                                    <tr className="border-b bg-gray-50">
                                      <th className="text-left p-3 font-medium">Parameter</th>
                                      <th className="text-left p-3 font-medium">Value</th>
                                      <th className="text-left p-3 font-medium">Normal Range</th>
                                      <th className="text-left p-3 font-medium">Status</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {values.map((value, index) => (
                                      <tr key={index} className="border-b hover:bg-gray-50">
                                        <td className="p-3 font-medium">{value.parameter}</td>
                                        <td className="p-3">
                                          <span className="font-mono">{value.value}</span> 
                                          <span className="text-gray-500 ml-1">{value.unit}</span>
                                        </td>
                                        <td className="p-3 text-gray-600 text-sm">{value.normalRange}</td>
                                        <td className="p-3">
                                          <Badge className={getSeverityColor(value.severity)}>
                                            {value.isAbnormal && value.severity !== 'NORMAL' && (
                                              <AlertTriangle className="h-3 w-3 mr-1" />
                                            )}
                                            {value.severity}
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