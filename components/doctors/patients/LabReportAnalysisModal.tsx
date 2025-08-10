'use client'
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { X, FileText, TrendingUp, AlertTriangle, Loader2, Search, List, Sparkles, Eye } from "lucide-react";
import { useMemo } from "react";
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
  const [isProcessing, setIsProcessing] = useState(false); // Prevent multiple simultaneous calls
  const [showAllValues, setShowAllValues] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const selectedReport = labReports.find(r => r.id === selectedReportId);

  // Subtle dot pattern (blue palette)
  const pattern = useMemo(() => ({
    backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(59,130,246,0.35) 1px, transparent 0)',
    backgroundSize: '18px 18px',
  } as React.CSSProperties), []);

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
      setLoading(false);
      setIsProcessing(false);
    } else {
      // Clean up when modal closes
      setAnalysis(null);
      setSelectedReportId(null);
      setLoading(false);
      setIsProcessing(false);
    }
  }, [isOpen]);

  const handleReportSelect = async (reportId: number) => {
    if (isProcessing) {
      console.log('[UI][SELECT] Already processing, ignoring selection');
      return;
    }
    
    // If selecting the same report that's already loaded, do nothing
    if (selectedReportId === reportId && analysis) {
      console.log('[UI][SELECT] Same report already loaded, ignoring selection');
      return;
    }
    
    setSelectedReportId(reportId);
    setAnalysis(null);
    setLoading(true);
    setIsProcessing(true);

    try {
      await processReport(reportId);
      return;
    } catch (error) {
      console.error('Error in report selection:', error);
      toast.error(`Error: ${(error as Error).message}`);
      setLoading(false);
    } finally {
      setIsProcessing(false);
    }
  };

  const processReport = async (reportId: number) => {
    try {
      const selected = labReports.find(r => r.id === reportId);
      const pdfUrl = selected?.reportLink?.[0];
      if (!pdfUrl) {
        throw new Error('No PDF URL found for this report');
      }

      // FIRST: Check if analysis already exists in database
      try {
        console.log('[UI][DB_CHECK] Checking for existing analysis for report:', reportId);
        const existingAnalysisRes = await fetch(`/api/llm-process/generate-summary`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: 'check-existing-analysis-in-database', reportId, force: false })
        });
        
        if (existingAnalysisRes.ok) {
          const existingData = await existingAnalysisRes.json();
          console.log('[UI][DB_CHECK] Response:', existingData);
          if (existingData.cached && existingData.success) {
            console.log('[UI][DB_CHECK] Found cached analysis, using from database');
            // Use existing analysis from database
            const existingAnalysis: LabReportAnalysis = {
              id: reportId,
              llmSummary: existingData.summary || '',
              criticalValues: [],
              allValues: [],
              trendAnalysis: [],
              processingStatus: 'COMPLETED',
              llmModel: 'cached-from-db',
              processedAt: new Date().toISOString(),
              keyFindings: existingData.keyFindings || [],
              recommendations: existingData.recommendations || [],
              urgency: existingData.urgency || 'ROUTINE'
            };
            
            // Get values if they exist
            try {
              console.log('[UI][DB_CHECK] Fetching cached values...');
              const valuesRes = await fetch(`/api/llm-process/extract-values`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: 'check-existing-values-in-database', reportId, force: false })
              });
              
              if (valuesRes.ok) {
                const valuesData = await valuesRes.json();
                console.log('[UI][DB_CHECK] Values response:', valuesData);
                if (valuesData.cached && valuesData.success) {
                  existingAnalysis.criticalValues = valuesData.criticalValues || [];
                  existingAnalysis.allValues = valuesData.allValues || [];
                }
              }
            } catch (valuesError) {
              console.warn('Could not fetch cached values:', valuesError);
            }
            
            setAnalysis(existingAnalysis);
            setLoading(false);
            toast.success('Loaded existing analysis from database');
            return;
          } else {
            console.log('[UI][DB_CHECK] No cached analysis found, proceeding with new processing');
          }
        } else {
          console.log('[UI][DB_CHECK] API response not ok:', existingAnalysisRes.status);
        }
      } catch (dbCheckError) {
        console.warn('Database check failed, proceeding with new analysis:', dbCheckError);
      }

      console.log('[UI][PROCESSING] Starting new analysis processing...');
      // ONLY if no existing analysis found, proceed with new processing
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
      setIsProcessing(false);
      toast.success('AI analysis updated');
    } catch (error) {
      console.error('Error processing report:', error);
      toast.error(`Error: ${(error as Error).message}`);
      setLoading(false);
      setIsProcessing(false);
    }
  };

  const retryAnalysis = async (reportId: number) => {
    if (isProcessing) {
      console.log('[UI][RETRY] Already processing, ignoring retry');
      return;
    }
    
    try {
      setLoading(true);
      setIsProcessing(true);
      await processReport(reportId);
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[90vw] max-h-[90vh] p-0 overflow-hidden mx-auto my-auto">
        {/* Header */}
        <DialogHeader className=" p-4 flex flex-row items-center justify-between">
          <div className="flex items-center gap-4">
            <DialogTitle className="text-xl font-bold">Lab Reports</DialogTitle>
          </div>
          {/* <Button variant="ghost" size="sm" onClick={onClose} className="text-white hover:bg-white/20">
            <X className="h-4 w-4" />
          </Button> */}
        </DialogHeader>

        {/* Report Selection Buttons */}
        <div className="px-4 pb-4">
          <div className="flex flex-wrap gap-2 mb-6">
            {labReports.map((report) => {
              const isActive = selectedReportId === report.id;
              return (
                <div key={report.id} className="relative">
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
              );
            })}
          </div>
        </div>

        {/* Main Content */}
        <div key={`content-${selectedReportId || 'none'}`} className="h-[70vh] overflow-y-auto p-4 space-y-4">
          {!selectedReportId ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <FileText className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <p className="text-xl font-semibold text-gray-600 mb-2">Select a Lab Report</p>
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
          ) : analysis ? (
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
                      </div>
                    </div>

                  </div>

                  {/* AI Summary Section */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-md font-semibold text-blue-800">Summary</h4>
                      {selectedReport?.reportLink?.[0] && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(selectedReport.reportLink![0], '_blank')}
                          className="text-blue-600 border-blue-300 hover:bg-blue-50"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View Report
                        </Button>
                      )}
                    </div>
                    {analysis.llmSummary ? (
                      <p className="text-gray-700 leading-relaxed text-justify whitespace-pre-wrap bg-white/60 rounded-lg p-4 border border-blue-100/50">
                        {analysis.llmSummary}
                      </p>
                    ) : (
                      <div className="text-center text-gray-500 py-6 bg-white/40 rounded-lg border border-blue-100/50">
                        <FileText className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                        <p>No analysis summary available</p>
                      </div>
                    )}
                  </div>

                  {/* Key Findings & Recommendations in single row */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Key Findings */}
                    <div className="bg-white/70 rounded-2xl p-4 border border-blue-100/50">
                      <h4 className="font-semibold text-blue-800 mb-3">Key Findings</h4>
                      {toBullets(analysis.keyFindings).length > 0 ? (
                        <ul className="space-y-2">
                          {toBullets(analysis.keyFindings).map((item, idx) => (
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
                      {toBullets(analysis.recommendations).length > 0 ? (
                        <ul className="space-y-2">
                          {toBullets(analysis.recommendations).map((item, idx) => (
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
                          <span>All: {analysis?.allValues?.length ?? 0}</span>
                        ) : (
                          <span>Critical: {analysis?.criticalValues?.length ?? 0}</span>
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
                                    <th className="text-left p-3 font-medium text-blue-800">Parameter</th>
                                    <th className="text-left p-3 font-medium text-blue-800">Value</th>
                                    <th className="text-left p-3 font-medium text-blue-800">Normal Range</th>
                                    <th className="text-left p-3 font-medium text-blue-800">Status</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {values.map((value, index) => (
                                    <tr key={index} className="border-b hover:bg-gray-50">
                                      <td className="p-3 font-medium">{value.parameter}</td>
                                      <td className="p-3"><span className="font-mono">{value.value}</span> <span className="text-gray-500 ml-1">{value.unit}</span></td>
                                      <td className="p-3 text-gray-600 text-sm font-mono">{value.normalRange}</td>
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