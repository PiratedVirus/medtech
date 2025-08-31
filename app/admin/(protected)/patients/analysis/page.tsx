"use client";
import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAdminAuth } from '@/hooks/use-admin-auth';
import { Eye, FileText, TrendingUp, RefreshCw, Trash2, Upload } from 'lucide-react';
import ProcessingProgressNotification from '@/components/common/ProcessingProgressNotification';
import UnifiedAnalysisModal from '@/components/common/UnifiedAnalysisModal';
import SearchHeader from '@/components/analysis/SearchHeader';
import { useAnalysisData } from '@/hooks/useAnalysisData';
import { useProcessingNotifications } from '@/hooks/useProcessingNotifications';
import { useAnalysisActions } from '@/hooks/useAnalysisActions';
import { useAnalysisModals } from '@/hooks/useAnalysisModals';
import { statusBadge, urgencyBadge, labStatusBadge, standaloneStatusBadge, standaloneAnalysisStatusBadge } from '@/utils/analysisHelpers';
import { Row, LabValue, LabAnalysis, LabBooking, StandaloneReport, StandaloneReportAnalysis } from '@/types/analysis';

export default function PatientsAnalysisPage() {
  useAdminAuth();
  const [activeTab, setActiveTab] = useState('prescriptions');
  
  // Use custom hooks
  const { query, setQuery, loading, rows, labBookings, standaloneReports, error, fetchData } = useAnalysisData();
  const { processingNotifications, removeProcessingNotification } = useProcessingNotifications();
  const { loading: actionLoading, error: actionError, handleProcessAll, handleRegenerateLabAnalysis, handleDeleteLabAnalysis, handleRegenerateStandaloneAnalysis, handleDeleteStandaloneReport } = useAnalysisActions(fetchData);
  const { 
    analysisModalOpen, 
    standaloneModalOpen, 
    handleViewAnalysis, 
    handleViewStandaloneReport, 
    closeAnalysisModal, 
    closeStandaloneModal 
  } = useAnalysisModals();

  // Filter values based on search term and toggle
  const getFilteredValues = () => {
    // This function is no longer needed as it was for the old modal
    return [];
  };

  // Filter standalone report values based on search term and toggle
  const getFilteredStandaloneValues = () => {
    // This function is no longer needed as it was for the old modal
    return [];
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

  const copyText = async (text: string) => {
    try { 
      await navigator.clipboard.writeText(text); 
    } catch {}
  };

  return (
    <div className="p-4 space-y-4">
      <Card>
        <SearchHeader 
          query={query} 
          setQuery={setQuery} 
          onSearch={fetchData} 
          loading={loading} 
        />
        <CardContent>
          {(error || actionError) && (
            <div className="mb-3 text-sm text-red-600">{error || actionError}</div>
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
                            <Button size="sm" variant="default" onClick={() => handleProcessAll(row.id)} disabled={actionLoading}>
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
                                    disabled={actionLoading}
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
                                        disabled={actionLoading}
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
                                disabled={actionLoading}
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
                              disabled={actionLoading}
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
        onClose={closeAnalysisModal}
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
        onClose={closeStandaloneModal}
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


