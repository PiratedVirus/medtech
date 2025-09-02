"use client";
import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAdminAuth } from '@/hooks/use-admin-auth';
import { Eye, FileText, TrendingUp, RefreshCw, Trash2, Upload, Calendar, User, File, ChevronDown, ChevronRight } from 'lucide-react';
import ProcessingProgressNotification from '@/components/common/ProcessingProgressNotification';
import UnifiedAnalysisModal from '@/components/common/UnifiedAnalysisModal';
import SearchHeader from '@/components/analysis/SearchHeader';
import { useAnalysisData } from '@/hooks/useAnalysisData';
import { useProcessingNotifications } from '@/hooks/useProcessingNotifications';
import { useAnalysisActions } from '@/hooks/useAnalysisActions';
import { useAnalysisModals } from '@/hooks/useAnalysisModals';
import PrescriptionAnalysisModal from '@/components/common/PrescriptionAnalysisModal';
import { statusBadge, urgencyBadge, labStatusBadge, standaloneStatusBadge, standaloneAnalysisStatusBadge } from '@/utils/analysisHelpers';
import { Row, LabValue, LabAnalysis, LabBooking, StandaloneReport, StandaloneReportAnalysis } from '@/types/analysis';

export default function PatientsAnalysisPage() {
  useAdminAuth();
  const [activeTab, setActiveTab] = useState('prescriptions');
  
  // Use custom hooks
  const { query, setQuery, loading, rows, labBookings, standaloneReports, error, fetchData } = useAnalysisData();
  const { processingNotifications, removeProcessingNotification, addProcessingNotification, updateNotificationStages, updateProcessingNotification } = useProcessingNotifications();
  const { loading: actionLoading, error: actionError, handleProcessAll, handleRegenerateLabAnalysis, handleDeleteLabAnalysis, handleRegenerateStandaloneAnalysis, handleDeleteStandaloneReport, handleRegeneratePrescriptionAnalysis, handleDeletePrescriptionAnalysis } = useAnalysisActions(fetchData, addProcessingNotification, updateNotificationStages, updateProcessingNotification);
  const { 
    analysisModalOpen, 
    standaloneModalOpen, 
    handleViewAnalysis, 
    handleViewStandaloneReport, 
    closeAnalysisModal, 
    closeStandaloneModal 
  } = useAnalysisModals();

  // Prescription modal state
  const [prescriptionModalOpen, setPrescriptionModalOpen] = useState(false);
  const [selectedPrescription, setSelectedPrescription] = useState<any>(null);

  // Prescription modal handlers
  const handleViewPrescription = (prescription: any) => {
    setSelectedPrescription(prescription);
    setPrescriptionModalOpen(true);
  };

  const closePrescriptionModal = () => {
    setPrescriptionModalOpen(false);
    setSelectedPrescription(null);
  };

  // Prescription row expansion state
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  const toggleRowExpansion = (rowId: number) => {
    const newExpandedRows = new Set(expandedRows);
    if (newExpandedRows.has(rowId)) {
      newExpandedRows.delete(rowId);
    } else {
      newExpandedRows.add(rowId);
    }
    setExpandedRows(newExpandedRows);
  };



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

  // Helper function to format date
  const formatDate = (dateString: string | Date) => {
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return 'Invalid Date';
    }
  };

  // Helper function to get document type display name
  const getDocumentTypeDisplay = (type: string) => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
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
            {/* Center-aligned tabs that don't stretch full width */}
            <div className="flex justify-center mb-6">
              <TabsList className="inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground">
                <TabsTrigger value="prescriptions" className="flex items-center gap-2 px-6">
                <FileText className="h-4 w-4" />
                Prescriptions ({rows.length})
              </TabsTrigger>
                <TabsTrigger value="lab-analysis" className="flex items-center gap-2 px-6">
                <TrendingUp className="h-4 w-4" />
                Lab Analysis ({labBookings.length})
              </TabsTrigger>
                <TabsTrigger value="standalone-reports" className="flex items-center gap-2 px-6">
                  <Upload className="h-4 w-4" />
                  Standalone Reports ({standaloneReports.length})
                </TabsTrigger>
            </TabsList>
            </div>

            {/* Unified Table Structure for All Tabs */}
            <TabsContent value="prescriptions" className="space-y-4">
              <div className="overflow-auto border rounded-md">
                <table className="min-w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left px-3 py-2 font-medium w-8"></th>
                      <th className="text-left px-3 py-2 font-medium">Date</th>
                      <th className="text-left px-3 py-2 font-medium">Patient</th>
                      <th className="text-left px-3 py-2 font-medium">File Name</th>
                      <th className="text-left px-3 py-2 font-medium">Uploaded By</th>
                      <th className="text-left px-3 py-2 font-medium">Document Type</th>
                      <th className="text-left px-3 py-2 font-medium">Status</th>
                      <th className="text-left px-3 py-2 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.length === 0 && (
                      <tr>
                        <td colSpan={8} className="px-3 py-6 text-center text-muted-foreground">
                          {loading ? 'Loading...' : 'No prescriptions found'}
                        </td>
                      </tr>
                    )}
                    {rows.map(row => (
                      <>
                        <tr key={row.id} className="border-t hover:bg-muted/30">
                          <td className="px-3 py-2">
                            {row.prescriptionDetails && row.prescriptionDetails.length > 0 && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => toggleRowExpansion(row.id)}
                                className="h-6 w-6 p-0"
                              >
                                {expandedRows.has(row.id) ? (
                                  <ChevronDown className="h-4 w-4" />
                                ) : (
                                  <ChevronRight className="h-4 w-4" />
                                )}
                              </Button>
                            )}
                          </td>
                          <td className="px-3 py-2">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3 text-muted-foreground" />
                              <span className="text-xs">{row.lastUpdated ? formatDate(row.lastUpdated) : 'N/A'}</span>
                            </div>
                          </td>
                        <td className="px-3 py-2">
                          <div className="font-medium">{row.name}</div>
                          <div className="text-xs text-muted-foreground">ID: {row.id}</div>
                        </td>
                          <td className="px-3 py-2">
                            <div className="flex items-center gap-1">
                              <File className="h-3 w-3 text-muted-foreground" />
                              <span className="text-xs">Prescription Summary</span>
                            </div>
                          </td>
                        <td className="px-3 py-2">
                            <div className="flex items-center gap-1">
                              <User className="h-3 w-3 text-muted-foreground" />
                              <span className="text-xs">System</span>
                            </div>
                          </td>
                          <td className="px-3 py-2">
                            <Badge variant="outline" className="text-xs">
                              Prescription Summary
                            </Badge>
                          </td>
                          <td className="px-3 py-2">
                            {row.overallStatus === 'COMPLETED' ? (
                              <Badge variant="secondary" className="text-xs">Completed</Badge>
                            ) : row.overallStatus === 'PARTIAL' ? (
                              <Badge variant="default" className="text-xs">Partial</Badge>
                            ) : row.overallStatus === 'NO_PRESCRIPTIONS' ? (
                              <Badge variant="outline" className="text-xs">No Prescriptions</Badge>
                            ) : (
                              <Badge variant="outline" className="text-xs">Pending</Badge>
                          )}
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex gap-2">
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={() => handleViewPrescription(row)} 
                                className="text-xs h-7"
                              >
                                <Eye className="h-3 w-3 mr-1" />
                                View
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={() => handleRegeneratePrescriptionAnalysis(row.id)} 
                                disabled={actionLoading}
                                className="text-xs h-7"
                              >
                                <RefreshCw className="h-3 w-3 mr-1" />
                                Regen
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={() => handleDeletePrescriptionAnalysis(row.id)} 
                                disabled={actionLoading}
                                className="text-xs h-7 text-red-600 border-red-300 hover:bg-red-50"
                              >
                                <Trash2 className="h-3 w-3 mr-1" />
                                Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                        {/* Expandable row showing prescription details */}
                        {expandedRows.has(row.id) && row.prescriptionDetails && row.prescriptionDetails.length > 0 && (
                          <>
                            {row.prescriptionDetails.map((prescription) => (
                              <tr key={`${row.id}-${prescription.id}`} className="bg-muted/10 border-t">
                                <td className="px-3 py-2"></td>
                                <td className="px-3 py-2">
                                  <span className="text-xs text-muted-foreground">-</span>
                                </td>
                                <td className="px-3 py-2">
                                  <span className="text-xs text-muted-foreground">-</span>
                                </td>
                                <td className="px-3 py-2">
                                  <div className="flex items-center gap-1">
                                    <File className="h-3 w-3 text-muted-foreground" />
                                    <span className="text-xs">{prescription.fileName}</span>
                                  </div>
                                </td>
                                <td className="px-3 py-2">
                                  <div className="flex items-center gap-1">
                                    <User className="h-3 w-3 text-muted-foreground" />
                                    <span className="text-xs">Dr. {prescription.uploadedBy.name}</span>
                                  </div>
                                </td>
                                <td className="px-3 py-2">
                                  <Badge variant="outline" className="text-xs">
                                    Prescription
                                  </Badge>
                                </td>
                                <td className="px-3 py-2">
                                  <Badge 
                                    variant={prescription.status === 'COMPLETED' ? 'secondary' : prescription.status === 'FAILED' ? 'destructive' : 'outline'}
                                    className="text-xs"
                                  >
                                    {prescription.status}
                                  </Badge>
                                </td>
                                <td className="px-3 py-2">
                                  <span className="text-xs text-muted-foreground">-</span>
                                </td>
                              </tr>
                            ))}
                          </>
                        )}
                      </>
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
                      <th className="text-left px-3 py-2 font-medium">Date</th>
                      <th className="text-left px-3 py-2 font-medium">Patient</th>
                      <th className="text-left px-3 py-2 font-medium">File Name</th>
                      <th className="text-left px-3 py-2 font-medium">Uploaded By</th>
                      <th className="text-left px-3 py-2 font-medium">Document Type</th>
                      <th className="text-left px-3 py-2 font-medium">Status</th>
                      <th className="text-left px-3 py-2 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {labBookings.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-3 py-6 text-center text-muted-foreground">
                          {loading ? 'Loading...' : 'No lab bookings found'}
                        </td>
                      </tr>
                    )}
                    {labBookings.map(booking => (
                      <tr key={booking.id} className="border-t hover:bg-muted/30">
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs">{formatDate(booking.createdAt || new Date())}</span>
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <div className="font-medium">{booking.patient?.name || 'Unknown Patient'}</div>
                          <div className="text-xs text-muted-foreground">ID: {booking.patient?.id || 'N/A'}</div>
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-1">
                            <File className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs">{booking.labPackageName || 'Lab Report'}</span>
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs">Lab System</span>
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <Badge variant="outline" className="text-xs">
                            Lab Report
                          </Badge>
                        </td>

                        <td className="px-3 py-2">
                          <div className="flex gap-2">
                            {booking.labResult.map((result, index) => {
                              const analysis = booking.analyses.find(a => a.labResultIndex === index);
                              return (
                                <div key={index} className="flex gap-1">
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
                      <th className="text-left px-3 py-2 font-medium">Date</th>
                      <th className="text-left px-3 py-2 font-medium">Patient</th>
                      <th className="text-left px-3 py-2 font-medium">File Name</th>
                      <th className="text-left px-3 py-2 font-medium">Uploaded By</th>
                      <th className="text-left px-3 py-2 font-medium">Document Type</th>
                      <th className="text-left px-3 py-2 font-medium">Status</th>
                      <th className="text-left px-3 py-2 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {standaloneReports.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-3 py-6 text-center text-muted-foreground">
                          {loading ? 'Loading...' : 'No standalone reports found'}
                        </td>
                      </tr>
                    )}
                    {standaloneReports.map(report => (
                      <tr key={report.id} className="border-t hover:bg-muted/30">
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs">{formatDate(report.createdAt)}</span>
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <div className="font-medium">{report.patient.name}</div>
                          <div className="text-xs text-muted-foreground">{report.patient.phone || 'No phone'}</div>
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-1">
                            <File className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs">{report.fileName}</span>
                            <div className="text-xs text-muted-foreground">
                              ({(report.fileSize / 1024 / 1024).toFixed(2)} MB)
                    </div>
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3 text-muted-foreground" />
                            <div className="text-xs">
                              <div className="font-medium">{report.uploadedBy.name}</div>
                              <div className="text-muted-foreground capitalize">{report.uploadedBy.role.toLowerCase()}</div>
                      </div>
                    </div>
                        </td>
                        <td className="px-3 py-2">
                          <Badge variant="outline" className="text-xs capitalize">
                            {getDocumentTypeDisplay(report.reportType)}
                          </Badge>
                        </td>

                        <td className="px-3 py-2">
                          <div className="space-y-1">
                            {report.analyses.map((analysis, index) => (
                              <div key={index} className="flex items-center gap-2">
                                {standaloneAnalysisStatusBadge(analysis)}
                                <span className="text-xs text-muted-foreground">
                                  {getDocumentTypeDisplay(analysis.analysisType)}
                        </span>
                      </div>
                            ))}
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

      {/* Prescription Analysis Modal */}
      <PrescriptionAnalysisModal
        isOpen={prescriptionModalOpen}
        onClose={closePrescriptionModal}
        prescription={selectedPrescription}
        onRegenerate={handleRegeneratePrescriptionAnalysis}
        onDelete={handleDeletePrescriptionAnalysis}
        loading={actionLoading}
      />
    </div>
  );
}


