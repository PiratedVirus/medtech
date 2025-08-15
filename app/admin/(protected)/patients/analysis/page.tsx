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
import { Eye, FileText, TrendingUp, AlertTriangle, Loader2, RefreshCw, Trash2, X, Copy, Search } from 'lucide-react';

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

export default function PatientsAnalysisPage() {
  useAdminAuth();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);
  const [labBookings, setLabBookings] = useState<LabBooking[]>([]);
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

  const handleProcessAll = async (patientId: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/prescription/process-all/${patientId}`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to process');
      await fetchData();
    } catch (e: any) {
      setError(e?.message || 'Failed to process');
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerateLabAnalysis = async (labBookingId: number, labResultIndex: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/lab-analysis/regenerate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ labBookingId, labResultIndex })
      });
      
      if (!res.ok) throw new Error('Failed to regenerate lab analysis');
      
      await fetchData(); // Refresh the data
    } catch (e: any) {
      setError(e?.message || 'Failed to regenerate');
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
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="prescriptions" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Prescriptions ({rows.length})
              </TabsTrigger>
              <TabsTrigger value="lab-analysis" className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Lab Analysis ({labBookings.length})
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
          </Tabs>
        </CardContent>
      </Card>

      {/* Lab Analysis Detail Modal */}
      <Dialog open={analysisModalOpen} onOpenChange={setAnalysisModalOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="flex flex-row items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Lab Analysis Details
            </DialogTitle>
            <Button
              size="icon"
              variant="outline"
              onClick={() => setAnalysisModalOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogHeader>

          {selectedAnalysis && selectedLabBooking && (
            <div className="space-y-6">
              {/* Header Info */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Lab Package</div>
                  <div className="font-medium">{selectedLabBooking.labPackageName}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Result Index</div>
                  <div className="font-medium">Result {selectedAnalysis.labResultIndex + 1}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Status</div>
                  <div>{labStatusBadge(selectedAnalysis.processingStatus)}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Model</div>
                  <div className="font-medium">{selectedAnalysis.llmModel || 'Unknown'}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Processed At</div>
                  <div className="font-medium">
                    {selectedAnalysis.processedAt ? new Date(selectedAnalysis.processedAt).toLocaleString() : 'Never'}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Created At</div>
                  <div className="font-medium">
                    {new Date(selectedAnalysis.createdAt).toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Modal Tabs */}
              <Tabs value={activeModalTab} onValueChange={setActiveModalTab} className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="analysis">Analysis Results</TabsTrigger>
                  <TabsTrigger value="raw-text">Raw Text</TabsTrigger>
                  <TabsTrigger value="json-data">JSON Data</TabsTrigger>
                </TabsList>

                <TabsContent value="analysis" className="space-y-6">
                  {/* Summary Section */}
                  {selectedAnalysis.llmSummary && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold">Clinical Summary</h3>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyText(selectedAnalysis.llmSummary || '')}
                        >
                          <Copy className="h-4 w-4 mr-2" />
                          Copy
                        </Button>
                      </div>
                      <div className="p-4 bg-blue-50 rounded-lg border">
                        <p className="text-sm text-blue-900 whitespace-pre-wrap">{selectedAnalysis.llmSummary}</p>
                      </div>
                    </div>
                  )}

                  {/* Key Findings */}
                  {selectedAnalysis.keyFindings && selectedAnalysis.keyFindings.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-lg font-semibold">Key Findings</h3>
                      <div className="space-y-2">
                        {selectedAnalysis.keyFindings.map((finding, index) => (
                          <div key={index} className="flex items-start gap-2 p-3 bg-yellow-50 rounded-lg border">
                            <span className="text-yellow-600 text-lg">•</span>
                            <span className="text-sm text-yellow-900">{finding}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recommendations */}
                  {selectedAnalysis.recommendations && selectedAnalysis.recommendations.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-lg font-semibold">Recommendations</h3>
                      <div className="space-y-2">
                        {selectedAnalysis.recommendations.map((rec, index) => (
                          <div key={index} className="flex items-start gap-2 p-3 bg-green-50 rounded-lg border">
                            <span className="text-green-600 text-lg">•</span>
                            <span className="text-sm text-green-900">{rec}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Urgency */}
                  {selectedAnalysis.urgency && (
                    <div className="space-y-3">
                      <h3 className="text-lg font-semibold">Urgency Level</h3>
                      <div className="flex items-center gap-3">
                        <span className={`inline-block px-3 py-2 rounded-lg text-sm font-medium ${
                          selectedAnalysis.urgency === 'URGENT' ? 'bg-red-100 text-red-800' :
                          selectedAnalysis.urgency === 'SOON' ? 'bg-orange-100 text-orange-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {selectedAnalysis.urgency}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Lab Values */}
                  {(selectedAnalysis.allValues && selectedAnalysis.allValues.length > 0) && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <h3 className="text-lg font-semibold">Lab Values</h3>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant={showAllValues ? "default" : "outline"}
                              onClick={() => setShowAllValues(true)}
                            >
                              All Values ({selectedAnalysis.allValues?.length || 0})
                            </Button>
                            <Button
                              size="sm"
                              variant={!showAllValues ? "default" : "outline"}
                              onClick={() => setShowAllValues(false)}
                            >
                              Critical ({selectedAnalysis.criticalValues?.length || 0})
                            </Button>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Search className="h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="Search values..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-48"
                          />
                        </div>
                      </div>

                      <div className="space-y-4">
                        {groupValuesByCategory(getFilteredValues()).map(([category, values]) => (
                          <div key={category} className="space-y-2">
                            <h4 className="font-medium text-muted-foreground border-b pb-1">{category}</h4>
                            <div className="grid gap-2">
                              {values.map((value, index) => (
                                <div
                                  key={index}
                                  className={`p-3 rounded-lg border ${
                                    value.isAbnormal
                                      ? value.severity === 'CRITICAL'
                                        ? 'bg-red-50 border-red-200'
                                        : value.severity === 'HIGH'
                                        ? 'bg-orange-50 border-orange-200'
                                        : 'bg-yellow-50 border-yellow-200'
                                      : 'bg-green-50 border-green-200'
                                  }`}
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                      <div className="font-medium text-sm">{value.parameter}</div>
                                      <div className="text-xs text-muted-foreground">
                                        {value.value} {value.unit} (Normal: {value.normalRange})
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      {value.isAbnormal && (
                                        <Badge
                                          variant={
                                            value.severity === 'CRITICAL' ? 'destructive' :
                                            value.severity === 'HIGH' ? 'default' :
                                            'secondary'
                                          }
                                          className="text-xs"
                                        >
                                          {value.severity}
                                        </Badge>
                                      )}
                                      {!value.isAbnormal && (
                                        <Badge variant="outline" className="text-xs">Normal</Badge>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="raw-text" className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">Extracted Text</h3>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyText(extractedText)}
                        disabled={!extractedText}
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Copy Text
                      </Button>
                    </div>
                    
                    {loadingText ? (
                      <div className="flex items-center justify-center p-8">
                        <Loader2 className="h-6 w-6 animate-spin mr-2" />
                        Loading extracted text...
                      </div>
                    ) : extractedText ? (
                      <div className="p-4 bg-muted/30 rounded-lg border">
                        <pre className="text-xs whitespace-pre-wrap overflow-auto max-h-96">
                          {extractedText}
                        </pre>
                        <div className="mt-2 text-xs text-muted-foreground">
                          Length: {extractedText.length} characters
                        </div>
                      </div>
                    ) : (
                      <div className="p-8 text-center text-muted-foreground">
                        <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No extracted text available</p>
                        <p className="text-sm">This analysis may not have extracted text or the text is not available.</p>
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="json-data" className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">Raw Analysis Data</h3>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyText(JSON.stringify(selectedAnalysis, null, 2))}
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Copy JSON
                      </Button>
                    </div>
                    <div className="p-4 bg-muted/30 rounded-lg border">
                      <pre className="text-xs overflow-auto max-h-96">
                        {JSON.stringify(selectedAnalysis, null, 2)}
                      </pre>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}


