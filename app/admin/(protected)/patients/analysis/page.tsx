"use client";
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAdminAuth } from '@/hooks/use-admin-auth';
import { Eye, FileText, TrendingUp, AlertTriangle, Loader2, RefreshCw, Trash2, X, Copy, Search, Upload } from 'lucide-react';
import ProcessingProgressNotification from '@/components/common/ProcessingProgressNotification';
import UnifiedAnalysisModal from '@/components/common/UnifiedAnalysisModal';


interface Row {
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

interface LabAnalysis {
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

interface LabBooking {
  id: number;
  labPackageName: string;
  labResult: string[];
  analyses: LabAnalysis[];
}

interface StandaloneReport {
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

interface StandaloneReportAnalysis {
  id: number;
  analysisType: string;
  processingStatus: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  processingError?: string; // Changed from 'string | null' to match unified modal
  extractedText?: string; // Changed from 'string | null' to match unified modal
  llmSummary?: string; // Changed from 'string | null' to match unified modal
  allValues?: any; // Json type from Prisma
  criticalValues?: any; // Json type from Prisma
  keyFindings?: any; // Json type from Prisma
  recommendations?: any; // Json type from Prisma
  urgency?: 'ROUTINE' | 'SOON' | 'URGENT';
  llmModel?: string;
  processedAt?: string; // Changed from 'string | null' to match unified modal
  createdAt: string;
}

interface ProcessingStage {
  stage: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  message: string;
  timestamp: Date;
}

interface ProcessingNotification {
  id: string;
  title: string;
  type: 'lab-analysis' | 'standalone-report' | 'prescription';
  stages: ProcessingStage[];
  overallStatus: 'processing' | 'completed' | 'failed';
  reportId?: number;
  analysisType?: string;
  labResultIndex?: number;
}

export default function PatientsAnalysisPage() {
  useAdminAuth();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);
  const [labBookings, setLabBookings] = useState<LabBooking[]>([]);
  const [standaloneReports, setStandaloneReports] = useState<StandaloneReport[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('prescriptions');
  
  // Lab analysis modal state
  const [selectedAnalysis, setSelectedAnalysis] = useState<LabAnalysis | null>(null);
  const [selectedLabBooking, setSelectedLabBooking] = useState<LabBooking | null>(null);
  const [analysisModalOpen, setAnalysisModalOpen] = useState(false);
  const [showAllValues, setShowAllValues] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [extractedText, setExtractedText] = useState<string>('');
  const [loadingText, setLoadingText] = useState(false);
  const [activeModalTab, setActiveModalTab] = useState('analysis');
  
  // Standalone report modal state
  const [selectedStandaloneReport, setSelectedStandaloneReport] = useState<StandaloneReport | null>(null);
  const [selectedStandaloneAnalysis, setSelectedStandaloneAnalysis] = useState<StandaloneReportAnalysis | null>(null);
  const [standaloneModalOpen, setStandaloneModalOpen] = useState(false);
  const [standaloneSearchTerm, setStandaloneSearchTerm] = useState('');
  
  // Progress notification state
  const [processingNotifications, setProcessingNotifications] = useState<ProcessingNotification[]>([]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch prescription data
      const res = await fetch(`/api/prescription/analysis-status?q=${encodeURIComponent(query)}&take=50`);
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to load prescriptions');
      setRows(data.rows as Row[]);

      // Fetch lab analysis data
      const labRes = await fetch('/api/admin/dashboard/lab-bookings?pageSize=100');
      const labData = await labRes.json();
      
      if (labData.data) {
        // Fetch analyses for each lab booking
        const bookingsWithAnalyses = await Promise.all(
          labData.data.map(async (booking: any) => {
            try {
              const analysesResponse = await fetch(`/api/admin/lab-analysis?labBookingId=${booking.id}`);
              const analysesData = await analysesResponse.json();
              
              return {
                id: booking.id,
                labPackageName: booking.labPackage?.name || 'Unknown Package',
                labResult: booking.labResult || [],
                analyses: analysesData.analyses || []
              };
            } catch (error) {
              return {
                id: booking.id,
                labPackageName: booking.labPackage?.name || 'Unknown Package',
                labResult: booking.labResult || [],
                analyses: []
              };
            }
          })
        );
        
        setLabBookings(bookingsWithAnalyses);
      }

      // Fetch standalone reports data
      const standaloneRes = await fetch('/api/admin/standalone-reports?pageSize=100');
      const standaloneData = await standaloneRes.json();
      
      if (standaloneData.success) {
        setStandaloneReports(standaloneData.data);
      }
    } catch (e: any) {
      setError(e?.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Poll for processing updates
  useEffect(() => {
    if (processingNotifications.length === 0) return;

    const interval = setInterval(async () => {
      const activeNotifications = processingNotifications.filter(n => n.overallStatus === 'processing');
      
      for (const notification of activeNotifications) {
        try {
          if (notification.type === 'lab-analysis' && notification.reportId && notification.labResultIndex !== undefined) {
            // Check lab analysis status
            const response = await fetch(`/api/lab-analysis/check?reportId=${notification.reportId}&labResultIndex=${notification.labResultIndex}`);
            if (response.ok) {
              const data = await response.json();
              if (data.exists) {
                updateLabAnalysisNotification(notification.id, data);
              }
            }
          } else if (notification.type === 'standalone-report' && notification.reportId) {
            // Check standalone report status
            const response = await fetch(`/api/admin/standalone-reports?pageSize=100`);
            if (response.ok) {
              const data = await response.json();
              if (data.success) {
                const report = data.data.find((r: any) => r.id === notification.reportId);
                if (report) {
                  const analysis = report.analyses.find((a: any) => a.analysisType === notification.analysisType);
                  if (analysis) {
                    updateStandaloneReportNotification(notification.id, analysis);
                  }
                }
              }
            }
          }
        } catch (error) {
          console.error('Failed to fetch processing status:', error);
        }
      }
    }, 2000); // Poll every 2 seconds

    return () => clearInterval(interval);
  }, [processingNotifications]);

  const handleProcessAll = async (patientId: number) => {
    setLoading(true);
    setError(null);
    
    // Add progress notification
    const notificationId = addProcessingNotification({
      title: `Prescription Processing - Patient ${patientId}`,
      type: 'prescription',
      stages: [],
      overallStatus: 'processing',
      reportId: patientId
    });

    try {
      const res = await fetch(`/api/prescription/process-all/${patientId}`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to process');
      
      // Update notification to show processing started
      updateNotificationStages(notificationId, [
        { stage: 'Initializing', status: 'completed', message: 'Processing started', timestamp: new Date() },
        { stage: 'Processing', status: 'processing', message: 'Processing prescriptions...', timestamp: new Date() }
      ]);
      
      await fetchData();
      
      // Update notification to show completion
      updateProcessingNotification(notificationId, {
        overallStatus: 'completed',
        stages: [
          { stage: 'Initializing', status: 'completed', message: 'Processing started', timestamp: new Date() },
          { stage: 'Processing', status: 'completed', message: 'Prescriptions processed successfully', timestamp: new Date() }
        ]
      });
    } catch (e: any) {
      setError(e?.message || 'Failed to process');
      // Update notification to show failure
      updateProcessingNotification(notificationId, {
        overallStatus: 'failed',
        stages: [
          { stage: 'Initializing', status: 'completed', message: 'Processing started', timestamp: new Date() },
          { stage: 'Processing', status: 'failed', message: e?.message || 'Failed to process', timestamp: new Date() }
        ]
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerateLabAnalysis = async (labBookingId: number, labResultIndex: number) => {
    setLoading(true);
    setError(null);
    
    // Add progress notification
    const notificationId = addProcessingNotification({
      title: `Lab Analysis - Result ${labResultIndex + 1}`,
      type: 'lab-analysis',
      stages: [],
      overallStatus: 'processing',
      reportId: labBookingId,
      labResultIndex
    });

    try {
      const res = await fetch('/api/admin/lab-analysis/regenerate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ labBookingId, labResultIndex })
      });
      
      if (!res.ok) throw new Error('Failed to regenerate lab analysis');
      
      // Update notification to show processing started
      updateNotificationStages(notificationId, [
        { stage: 'Initializing', status: 'completed', message: 'Regeneration started', timestamp: new Date() },
        { stage: 'Processing', status: 'processing', message: 'Analysis in progress...', timestamp: new Date() }
      ]);
      
      await fetchData(); // Refresh the data
    } catch (e: any) {
      setError(e?.message || 'Failed to regenerate');
      // Update notification to show failure
      updateProcessingNotification(notificationId, {
        overallStatus: 'failed',
        stages: [
          { stage: 'Initializing', status: 'completed', message: 'Regeneration started', timestamp: new Date() },
          { stage: 'Processing', status: 'failed', message: e?.message || 'Failed to regenerate', timestamp: new Date() }
        ]
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteLabAnalysis = async (labBookingId: number, labResultIndex: number) => {
    if (!confirm('Are you sure you want to delete this analysis?')) return;
    
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/lab-analysis/delete?labBookingId=${labBookingId}&labResultIndex=${labResultIndex}`, {
        method: 'DELETE'
      });
      
      if (!res.ok) throw new Error('Failed to delete lab analysis');
      
      await fetchData(); // Refresh the data
    } catch (e: any) {
      setError(e?.message || 'Failed to delete');
    } finally {
      setLoading(false);
    }
  };

  const handleViewAnalysis = async (labBooking: LabBooking, labResultIndex: number) => {
    const analysis = labBooking.analyses.find(a => a.labResultIndex === labResultIndex);
    if (!analysis) return;

    setSelectedLabBooking(labBooking);
    setSelectedAnalysis(analysis);
    setAnalysisModalOpen(true);
    setActiveModalTab('analysis');
    setSearchTerm(''); // Reset search term
    setShowAllValues(false); // Reset to show critical values by default
    
    // Fetch extracted text if available
    if (analysis.processingStatus === 'COMPLETED') {
      setLoadingText(true);
      try {
        const textRes = await fetch(`/api/lab-analysis/check?reportId=${labBooking.id}&labResultIndex=${labResultIndex}`);
        if (textRes.ok) {
          const textData = await textRes.json();
          if (textData.extractedText) {
            setExtractedText(textData.extractedText);
          }
        }
      } catch (error) {
        console.error('Failed to fetch extracted text:', error);
      } finally {
        setLoadingText(false);
      }
    }
  };

  const handleViewStandaloneReport = async (report: StandaloneReport) => {
    setSelectedStandaloneReport(report);
    // Get the most recent completed analysis, or the first one if none completed
    const completedAnalysis = report.analyses.find(a => a.processingStatus === 'COMPLETED');
    const analysis = completedAnalysis || report.analyses[0] || null;
    console.log('Viewing standalone report analysis:', analysis);
    console.log('Report analyses:', report.analyses);
    console.log('Selected analysis allValues:', analysis?.allValues);
    console.log('Selected analysis criticalValues:', analysis?.criticalValues);
    setSelectedStandaloneAnalysis(analysis);
    setStandaloneModalOpen(true);
    setStandaloneSearchTerm(''); // Reset search term
    setShowAllValues(false); // Reset to show critical values by default
  };

  const handleRegenerateStandaloneAnalysis = async (reportId: number, analysisType: string) => {
    setLoading(true);
    setError(null);
    
    // Add progress notification
    const notificationId = addProcessingNotification({
      title: `Standalone Report - ${analysisType.replace('_', ' ')}`,
      type: 'standalone-report',
      stages: [],
      overallStatus: 'processing',
      reportId,
      analysisType
    });

    try {
      const res = await fetch('/api/reports/upload/regenerate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportId, analysisType })
      });
      
      if (!res.ok) throw new Error('Failed to regenerate analysis');
      
      // Update notification to show processing started
      updateNotificationStages(notificationId, [
        { stage: 'Initializing', status: 'completed', message: 'Regeneration started', timestamp: new Date() },
        { stage: 'Processing', status: 'processing', message: 'Analysis in progress...', timestamp: new Date() }
      ]);
      
      await fetchData(); // Refresh the data
    } catch (e: any) {
      setError(e?.message || 'Failed to regenerate');
      // Update notification to show failure
      updateProcessingNotification(notificationId, {
        overallStatus: 'failed',
        stages: [
          { stage: 'Initializing', status: 'completed', message: 'Regeneration started', timestamp: new Date() },
          { stage: 'Processing', status: 'failed', message: e?.message || 'Failed to regenerate', timestamp: new Date() }
        ]
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStandaloneReport = async (reportId: number) => {
    if (!confirm('Are you sure you want to delete this report?')) return;
    
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/standalone-reports/${reportId}`, {
        method: 'DELETE'
      });
      
      if (!res.ok) throw new Error('Failed to delete report');
      
      await fetchData(); // Refresh the data
    } catch (e: any) {
      setError(e?.message || 'Failed to delete');
    } finally {
      setLoading(false);
    }
  };

  const copyText = async (text: string) => {
    try { 
      await navigator.clipboard.writeText(text); 
    } catch {}
  };

  // Filter values based on search term and toggle
  const getFilteredValues = () => {
    if (!selectedAnalysis) return [];
    const values = showAllValues ? (selectedAnalysis.allValues || []) : (selectedAnalysis.criticalValues || []);
    if (!searchTerm) return values;

    return values.filter(value =>
      value.parameter.toLowerCase().includes(searchTerm.toLowerCase()) ||
      value.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      value.value.toString().toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  // Filter standalone report values based on search term and toggle
  const getFilteredStandaloneValues = () => {
    if (!selectedStandaloneAnalysis) return [];
    const values = showAllValues ? (selectedStandaloneAnalysis.allValues || []) : (selectedStandaloneAnalysis.criticalValues || []);
    if (!standaloneSearchTerm) return values;

    return values.filter((value: any) =>
      value.parameter.toLowerCase().includes(standaloneSearchTerm.toLowerCase()) ||
      value.category?.toLowerCase().includes(standaloneSearchTerm.toLowerCase()) ||
      value.value.toString().toLowerCase().includes(standaloneSearchTerm.toLowerCase())
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

  const statusBadge = (row: Row) => {
    const done = row.processed;
    const total = row.totalPrescriptions;
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;
    if (done === total && total > 0) return <Badge variant="secondary">Complete ({pct}%)</Badge>;
    if (row.failed > 0) return <Badge variant="destructive">Failed {row.failed}/{total}</Badge>;
    if (row.pending > 0) return <Badge>Pending {row.pending}/{total}</Badge>;
    return <Badge variant="outline">No Data</Badge>;
  };

  const urgencyBadge = (u: string | null) => {
    if (!u) return null;
    const v = u.toUpperCase();
    if (v === 'URGENT') return <Badge variant="destructive">URGENT</Badge>;
    if (v === 'SOON') return <Badge>SOON</Badge>;
    return <Badge variant="secondary">ROUTINE</Badge>;
  };

  const labStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <Badge variant="secondary">Completed</Badge>;
      case 'PROCESSING':
        return <Badge variant="default">Processing</Badge>;
      case 'PENDING':
        return <Badge variant="outline">Pending</Badge>;
      case 'FAILED':
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const standaloneStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <Badge variant="default" className="bg-green-100 text-green-800">Completed</Badge>;
      case 'PROCESSING':
        return <Badge variant="outline" className="text-blue-600">Processing</Badge>;
      case 'FAILED':
        return <Badge variant="destructive">Failed</Badge>;
      case 'PENDING':
      default:
        return <Badge variant="outline" className="text-gray-600">Pending</Badge>;
    }
  };

  const standaloneAnalysisStatusBadge = (analysis: StandaloneReportAnalysis) => {
    switch (analysis.processingStatus) {
      case 'COMPLETED':
        return <Badge variant="default" className="bg-green-100 text-green-800">Completed</Badge>;
      case 'PROCESSING':
        return <Badge variant="outline" className="text-blue-600">Processing</Badge>;
      case 'FAILED':
        return <Badge variant="destructive">Failed</Badge>;
      case 'PENDING':
      default:
        return <Badge variant="outline" className="text-gray-600">Pending</Badge>;
    }
  };

  // Progress notification helpers
  const addProcessingNotification = (notification: Omit<ProcessingNotification, 'id'>) => {
    const id = `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newNotification: ProcessingNotification = {
      ...notification,
      id,
      stages: [
        {
          stage: 'Initializing',
          status: 'processing',
          message: 'Starting regeneration process...',
          timestamp: new Date()
        }
      ]
    };
    setProcessingNotifications(prev => [...prev, newNotification]);
    return id;
  };

  const updateProcessingNotification = (notificationId: string, updates: Partial<ProcessingNotification>) => {
    setProcessingNotifications(prev => prev.map(notification => 
      notification.id === notificationId 
        ? { ...notification, ...updates }
        : notification
    ));
  };

  const removeProcessingNotification = (notificationId: string) => {
    setProcessingNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  const updateNotificationStages = (notificationId: string, stages: ProcessingStage[]) => {
    setProcessingNotifications(prev => prev.map(notification => 
      notification.id === notificationId 
        ? { ...notification, stages }
        : notification
    ));
  };

  const updateLabAnalysisNotification = (notificationId: string, analysisData: any) => {
    const stages: ProcessingStage[] = [];
    let overallStatus: 'processing' | 'completed' | 'failed' = 'processing';

    if (analysisData.processingStatus === 'COMPLETED') {
      stages.push(
        { stage: 'Text Extraction', status: 'completed', message: 'Text extracted successfully', timestamp: new Date() },
        { stage: 'LLM Processing', status: 'completed', message: 'Analysis completed successfully', timestamp: new Date() }
      );
      overallStatus = 'completed';
      
      // Auto-remove completed notification after 5 seconds
      setTimeout(() => {
        removeProcessingNotification(notificationId);
      }, 5000);
    } else if (analysisData.processingStatus === 'FAILED') {
      stages.push(
        { stage: 'Processing', status: 'failed', message: analysisData.processingError || 'Failed', timestamp: new Date() }
      );
      overallStatus = 'failed';
      
      // Auto-remove failed notification after 10 seconds
      setTimeout(() => {
        removeProcessingNotification(notificationId);
      }, 10000);
    } else if (analysisData.processingStatus === 'PROCESSING') {
      stages.push(
        { stage: 'Text Extraction', status: 'completed', message: 'Text extracted successfully', timestamp: new Date() },
        { stage: 'LLM Processing', status: 'processing', message: 'Generating analysis...', timestamp: new Date() }
      );
    } else {
      stages.push(
        { stage: 'Initializing', status: 'processing', message: 'Starting analysis...', timestamp: new Date() }
      );
    }

    updateProcessingNotification(notificationId, { stages, overallStatus });
  };

  const updateStandaloneReportNotification = (notificationId: string, analysis: any) => {
    const stages: ProcessingStage[] = [];
    let overallStatus: 'processing' | 'completed' | 'failed' = 'processing';

    if (analysis.processingStatus === 'COMPLETED') {
      stages.push(
        { stage: 'Text Extraction', status: 'completed', message: 'Text extracted successfully', timestamp: new Date() },
        { stage: 'Summary Generation', status: 'completed', message: 'Summary generated successfully', timestamp: new Date() },
        { stage: 'Value Extraction', status: 'completed', message: 'Lab values extracted successfully', timestamp: new Date() }
      );
      overallStatus = 'completed';
      
      // Auto-remove completed notification after 5 seconds
      setTimeout(() => {
        removeProcessingNotification(notificationId);
      }, 5000);
    } else if (analysis.processingStatus === 'FAILED') {
      // Only show actual errors, not progress tracking messages
      const errorMsg = analysis.processingError || '';
      if (errorMsg.includes('Stage') || errorMsg.includes('failed')) {
        // This is a progress tracking message, not a real error
        stages.push(
          { stage: 'Processing', status: 'processing', message: 'Processing in progress...', timestamp: new Date() }
        );
      } else {
        // This is a real error
        stages.push(
          { stage: 'Processing', status: 'failed', message: errorMsg || 'Failed', timestamp: new Date() }
        );
        overallStatus = 'failed';
      }
    } else if (analysis.processingStatus === 'PROCESSING') {
      // Parse processing error to determine current stage
      const errorMsg = analysis.processingError || '';
      if (errorMsg.includes('Stage 1')) {
        stages.push(
          { stage: 'Text Extraction', status: 'processing', message: 'Extracting text from file...', timestamp: new Date() }
        );
      } else if (errorMsg.includes('Stage 2')) {
        stages.push(
          { stage: 'Text Extraction', status: 'completed', message: 'Text extracted successfully', timestamp: new Date() },
          { stage: 'Summary Generation', status: 'processing', message: 'Generating summary...', timestamp: new Date() }
        );
      } else if (errorMsg.includes('Stage 3')) {
        stages.push(
          { stage: 'Text Extraction', status: 'completed', message: 'Text extracted successfully', timestamp: new Date() },
          { stage: 'Summary Generation', status: 'completed', message: 'Summary generated successfully', timestamp: new Date() },
          { stage: 'Value Extraction', status: 'processing', message: 'Extracting lab values...', timestamp: new Date() }
        );
      } else {
        stages.push(
          { stage: 'Processing', status: 'processing', message: 'Processing in progress...', timestamp: new Date() }
        );
      }
    } else {
      stages.push(
        { stage: 'Initializing', status: 'processing', message: 'Starting analysis...', timestamp: new Date() }
      );
    }

    updateProcessingNotification(notificationId, { stages, overallStatus });
  };

  return (
    <div className="p-4 space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Patient AI Analysis Dashboard</CardTitle>
          <div className="flex gap-2">
            <Input
              placeholder="Search patient name..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') fetchData(); }}
              className="w-64"
            />
            <Button onClick={fetchData} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Search
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-3 text-sm text-red-600">{error}</div>
          )}
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="prescriptions" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Prescriptions ({rows.length})
              </TabsTrigger>
              <TabsTrigger value="lab-analysis" className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Lab Analysis ({labBookings.length})
              </TabsTrigger>
              <TabsTrigger value="standalone-reports" className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Standalone Reports ({standaloneReports.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="prescriptions" className="space-y-4">
              <div className="overflow-auto border rounded-md">
                <table className="min-w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left px-3 py-2">Patient</th>
                      <th className="text-left px-3 py-2">Phone</th>
                      <th className="text-left px-3 py-2">Prescriptions</th>
                      <th className="text-left px-3 py-2">Processed</th>
                      <th className="text-left px-3 py-2">Failed</th>
                      <th className="text-left px-3 py-2">Status</th>
                      <th className="text-left px-3 py-2">Urgency</th>
                      <th className="text-left px-3 py-2">Summary</th>
                      <th className="text-left px-3 py-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.length === 0 && (
                      <tr>
                        <td colSpan={9} className="px-3 py-6 text-center text-muted-foreground">
                          {loading ? 'Loading...' : 'No patients found'}
                        </td>
                      </tr>
                    )}
                    {rows.map(row => (
                      <tr key={row.id} className="border-t">
                        <td className="px-3 py-2">
                          <div className="font-medium">{row.name}</div>
                          <div className="text-xs text-muted-foreground">ID: {row.id}</div>
                        </td>
                        <td className="px-3 py-2">{row.phone || '-'}</td>
                        <td className="px-3 py-2">{row.totalPrescriptions}</td>
                        <td className="px-3 py-2">{row.processed}</td>
                        <td className="px-3 py-2">{row.failed}</td>
                        <td className="px-3 py-2">{statusBadge(row)}</td>
                        <td className="px-3 py-2">{urgencyBadge(row.urgency)}</td>
                        <td className="px-3 py-2">
                          {row.hasSummary ? (
                            <div className="text-xs text-muted-foreground">
                              Updated: {row.lastUpdated ? new Date(row.lastUpdated).toLocaleString() : '-'}
                              <br />
                              Count: {row.prescriptionCountInSummary}
                              <br />
                              Model: {row.llmModel || '-'}
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">No summary</span>
                          )}
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex gap-2">
                            <Button size="sm" variant="default" onClick={() => handleProcessAll(row.id)} disabled={loading}>
                              Process All
                            </Button>
                            <Link href={`/dashboard/patient-profile?patientId=${row.id}`}>
                              <Button size="sm" variant="outline">View Profile</Button>
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TabsContent>

            <TabsContent value="lab-analysis" className="space-y-4">
              <div className="overflow-auto border rounded-md">
                <table className="min-w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left px-3 py-2">Lab Package</th>
                      <th className="text-left px-3 py-2">Results</th>
                      <th className="text-left px-3 py-2">Analyses</th>
                      <th className="text-left px-3 py-2">Status</th>
                      <th className="text-left px-3 py-2">Last Updated</th>
                      <th className="text-left px-3 py-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {labBookings.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-3 py-6 text-center text-muted-foreground">
                          {loading ? 'Loading...' : 'No lab bookings found'}
                        </td>
                      </tr>
                    )}
                    {labBookings.map(booking => (
                      <tr key={booking.id} className="border-t">
                        <td className="px-3 py-2">
                          <div className="font-medium">{booking.labPackageName}</div>
                          <div className="text-xs text-muted-foreground">ID: {booking.id}</div>
                        </td>
                        <td className="px-3 py-2">
                          <div className="text-xs">
                            {booking.labResult.length} result(s)
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <div className="space-y-1">
                            {booking.labResult.map((result, index) => {
                              const analysis = booking.analyses.find(a => a.labResultIndex === index);
                              return (
                                <div key={index} className="flex items-center gap-2 text-xs">
                                  <span className="text-muted-foreground">Result {index + 1}:</span>
                                  {analysis ? (
                                    <Badge variant="outline" className="text-xs">
                                      {analysis.processingStatus}
                                    </Badge>
                                  ) : (
                                    <Badge variant="outline" className="text-xs">
                                      No Analysis
                                    </Badge>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <div className="space-y-1">
                            {booking.analyses.map((analysis, index) => (
                              <div key={index} className="flex items-center gap-2">
                                {labStatusBadge(analysis.processingStatus)}
                                {analysis.llmSummary && (
                                  <Eye className="h-3 w-3 text-muted-foreground" />
                                )}
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <div className="text-xs text-muted-foreground">
                            {booking.analyses.length > 0 ? (
                              new Date(Math.max(...booking.analyses.map(a => new Date(a.processedAt || a.createdAt).getTime()))).toLocaleString()
                            ) : (
                              'Never'
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex gap-2">
                            {booking.labResult.map((result, index) => {
                              const analysis = booking.analyses.find(a => a.labResultIndex === index);
                              return (
                                <div key={index} className="flex flex-col gap-1">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleRegenerateLabAnalysis(booking.id, index)}
                                    disabled={loading}
                                    className="text-xs h-7"
                                  >
                                    <RefreshCw className="h-3 w-3 mr-1" />
                                    {analysis ? 'Regen' : 'Generate'}
                                  </Button>
                                  {analysis && (
                                    <>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleViewAnalysis(booking, index)}
                                        className="text-xs h-7"
                                      >
                                        <Eye className="h-3 w-3 mr-1" />
                                        View
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleDeleteLabAnalysis(booking.id, index)}
                                        disabled={loading}
                                        className="text-xs h-7 text-red-600 border-red-300 hover:bg-red-50"
                                      >
                                        <Trash2 className="h-3 w-3 mr-1" />
                                        Delete
                                      </Button>
                                    </>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TabsContent>

            <TabsContent value="standalone-reports" className="space-y-4">
              <div className="overflow-auto border rounded-md">
                <table className="min-w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left px-3 py-2">File</th>
                      <th className="text-left px-3 py-2">Patient</th>
                      <th className="text-left px-3 py-2">Type</th>
                      <th className="text-left px-3 py-2">Status</th>
                      <th className="text-left px-3 py-2">Analyses</th>
                      <th className="text-left px-3 py-2">Uploaded By</th>
                      <th className="text-left px-3 py-2">Created</th>
                      <th className="text-left px-3 py-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {standaloneReports.length === 0 && (
                      <tr>
                        <td colSpan={8} className="px-3 py-6 text-center text-muted-foreground">
                          {loading ? 'Loading...' : 'No standalone reports found'}
                        </td>
                      </tr>
                    )}
                    {standaloneReports.map(report => (
                      <tr key={report.id} className="border-t">
                        <td className="px-3 py-2">
                          <div className="font-medium">{report.fileName}</div>
                          <div className="text-xs text-muted-foreground">
                            {(report.fileSize / 1024 / 1024).toFixed(2)} MB
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <div className="font-medium">{report.patient.name}</div>
                          <div className="text-xs text-muted-foreground">{report.patient.phone || 'No phone'}</div>
                        </td>
                        <td className="px-3 py-2">
                          <Badge variant="outline" className="text-xs capitalize">
                            {report.reportType.replace('_', ' ')}
                          </Badge>
                        </td>
                        <td className="px-3 py-2">
                          {standaloneStatusBadge(report.status)}
                        </td>
                        <td className="px-3 py-2">
                          <div className="space-y-1">
                            {report.analyses.map((analysis, index) => (
                              <div key={index} className="flex items-center gap-2">
                                {standaloneAnalysisStatusBadge(analysis)}
                                <span className="text-xs text-muted-foreground">
                                  {analysis.analysisType.replace('_', ' ')}
                                </span>
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <div className="text-xs">
                            <div className="font-medium">{report.uploadedBy.name}</div>
                            <div className="text-muted-foreground capitalize">{report.uploadedBy.role.toLowerCase()}</div>
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <div className="text-xs text-muted-foreground">
                            {new Date(report.createdAt).toLocaleString()}
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewStandaloneReport(report)}
                              className="text-xs h-7"
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              View
                            </Button>
                            {report.analyses.map((analysis, index) => (
                              <Button
                                key={index}
                                size="sm"
                                variant="outline"
                                onClick={() => handleRegenerateStandaloneAnalysis(report.id, analysis.analysisType)}
                                disabled={loading}
                                className="text-xs h-7"
                              >
                                <RefreshCw className="h-3 w-3 mr-1" />
                                Regen
                              </Button>
                            ))}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteStandaloneReport(report.id)}
                              disabled={loading}
                              className="text-xs h-7 text-red-600 border-red-300 hover:bg-red-50"
                            >
                              <Trash2 className="h-3 w-3 mr-1" />
                              Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Lab Analysis Detail Modal - Now using Unified Modal */}
      <UnifiedAnalysisModal
        isOpen={analysisModalOpen}
        onClose={() => setAnalysisModalOpen(false)}
        patientId="admin" // Admin view doesn't have specific patient ID
        labReports={labBookings.map(booking => ({
          id: booking.id,
          labPackageName: booking.labPackageName,
          date: new Date().toISOString(), // Use current date as fallback
          status: "COMPLETED", // Default status
          labResult: booking.labResult
        }))}
        standaloneReports={[]}
      />

      {/* Standalone Report Detail Modal - Now using Unified Modal */}
      <UnifiedAnalysisModal
        isOpen={standaloneModalOpen}
        onClose={() => setStandaloneModalOpen(false)}
        patientId="admin" // Admin view doesn't have specific patient ID
        labReports={[]}
        standaloneReports={standaloneReports.map(report => ({
          ...report,
          reportAnalyses: report.analyses || []
        }))}
      />

      {/* Progress Notifications */}
      <ProcessingProgressNotification
        notifications={processingNotifications}
        onRemove={removeProcessingNotification}
      />
    </div>
  );
}


