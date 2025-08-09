'use client'
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  keyFindings?: string[];
  recommendations?: string[];
  urgency?: 'ROUTINE' | 'SOON' | 'URGENT';
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

  useEffect(() => {
    // Reset analysis when modal opens/closes or report changes
    if (isOpen) {
      setAnalysis(null);
      setSelectedReportId(null);
    }
  }, [isOpen]);

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
        keyFindings: [],
        recommendations: [],
        urgency: undefined
      };
      setAnalysis(partial);

      // Run summary and values independently
      const runSummary = (async () => {
        try {
          const summaryRes = await fetch(`/api/llm-process/generate-summary`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text, reportId })
          });
          const summaryJson = await summaryRes.json();
          if (summaryRes.ok && summaryJson.success) {
            partial = {
              ...partial,
              llmSummary: summaryJson.summary,
              keyFindings: Array.isArray(summaryJson.keyFindings) ? summaryJson.keyFindings : [],
              recommendations: Array.isArray(summaryJson.recommendations) ? summaryJson.recommendations : [],
              urgency: summaryJson.urgency,
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
            body: JSON.stringify({ text, reportId })
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

      await Promise.allSettled([runSummary, runValues]);

      setLoading(false);
      toast.success('AI analysis updated');
    } catch (error) {
      console.error('Error processing report:', error);
      toast.error(`Error: ${(error as Error).message}`);
      setLoading(false);
    }
  };

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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="bg-gradient-to-r from-secondary to-secondary/80 text-white p-4 flex flex-row items-center justify-between">
          <div className="flex items-center gap-4">
            <DialogTitle className="text-xl font-bold">AI Lab Report Analysis</DialogTitle>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="text-white hover:bg-white/20">
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        {/* Report Tabs Row */}
        <div className="border-b bg-gray-50 px-4 py-2 overflow-x-auto">
          <div className="flex gap-2 items-center">
            {labReports.map((report) => (
              <Button
                key={report.id}
                variant={selectedReportId === report.id ? "default" : "outline"}
                size="sm"
                onClick={() => handleReportSelect(report.id)}
                className={`whitespace-nowrap ${selectedReportId === report.id ? 'bg-secondary text-white' : 'text-gray-700 border-gray-300'}`}
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

        {/* Main Content */}
        <div className="h-[82vh] overflow-y-auto p-4 space-y-4">
          {!selectedReportId ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-lg font-medium text-gray-600">Select a Lab Report</p>
                <p className="text-sm text-gray-500 mt-2">Click on a report tab above to automatically process with AI</p>
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
            <div className="space-y-4">
              {/* Summary Card */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">AI Summary</h3>
                    <div className="flex items-center gap-2">
                      {getUrgencyBadge(analysis.urgency)}
                      <Badge variant="outline">{analysis.llmModel || 'AI Model'}</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="prose max-w-none">
                    {analysis.llmSummary ? (
                      <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{analysis.llmSummary}</p>
                    ) : (
                      <div className="text-center text-gray-500 py-8">
                        <FileText className="h-8 w-8 mx-auto mb-4 text-gray-400" />
                        <p>No analysis summary available</p>
                      </div>
                    )}
                  </div>

                  {/* Key Findings & Recommendations */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold mb-2">Key Findings</h4>
                      {toBullets(analysis.keyFindings).length > 0 ? (
                        <ul className="list-disc pl-5 space-y-1 text-gray-700">
                          {toBullets(analysis.keyFindings).map((item, idx) => (
                            <li key={idx}>{item}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-gray-500 text-sm">No key findings provided</p>
                      )}
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Recommendations</h4>
                      {toBullets(analysis.recommendations).length > 0 ? (
                        <ul className="list-disc pl-5 space-y-1 text-gray-700">
                          {toBullets(analysis.recommendations).map((item, idx) => (
                            <li key={idx}>{item}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-gray-500 text-sm">No recommendations provided</p>
                      )}
                    </div>
                  </div>

                  {analysis.processedAt && (
                    <div className="mt-2 text-sm text-gray-500">Analysis completed: {new Date(analysis.processedAt).toLocaleString()}</div>
                  )}
                </CardContent>
              </Card>

              {/* Lab Values Card */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
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
                        {/* {showAllValues ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />} */}
                        {showAllValues ? 'Show Critical Values' : 'Show All Values'}
                        {showAllValues && analysis?.allValues && (
                          <Badge variant="secondary" className="ml-1">{analysis.allValues.length}</Badge>
                        )}
                        {!showAllValues && analysis?.criticalValues && (
                          <Badge variant="destructive" className="ml-1">{analysis.criticalValues.length}</Badge>
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
                            {searchTerm ? 'No values match your search.' : showAllValues ? 'No values found in this report.' : 'No critical values detected.'}
                          </p>
                        </div>
                      );
                    }
                    return (
                      <div className="space-y-6">
                        {groupedValues.map(([category, values]) => (
                          <div key={category}>
                            <h4 className="font-semibold text-md mb-3 text-gray-700 border-b pb-1">{category}</h4>
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
                                      <td className="p-3"><span className="font-mono">{value.value}</span> <span className="text-gray-500 ml-1">{value.unit}</span></td>
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
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-lg font-medium text-gray-600">Processing Lab Report</p>
                <p className="text-sm text-gray-500 mt-2">AI analysis will appear here shortly...</p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}