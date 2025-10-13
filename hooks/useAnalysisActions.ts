import { useState } from 'react';

export function useAnalysisActions(
  fetchData: () => void,
  addProcessingNotification: (notification: any) => string,
  updateNotificationStages: (notificationId: string, stages: any[]) => void,
  updateProcessingNotification: (notificationId: string, updates: any) => void
) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const handleRegeneratePrescriptionAnalysis = async (patientId: number) => {
    setLoading(true);
    setError(null);
    
    // Add progress notification
    const notificationId = addProcessingNotification({
      title: `Prescription Analysis - Patient ${patientId}`,
      type: 'prescription',
      stages: [],
      overallStatus: 'processing',
      reportId: patientId
    });

    try {
      // Update notification to show processing started
      updateNotificationStages(notificationId, [
        { stage: 'Initializing', status: 'completed', message: 'Regeneration started', timestamp: new Date() },
        { stage: 'Processing', status: 'processing', message: 'Starting prescription processing...', timestamp: new Date() }
      ]);

      const res = await fetch('/api/prescription/regenerate-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId, force: true })
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to regenerate prescription analysis');
      }

      const result = await res.json();
      
      // The notification will be updated automatically by the polling mechanism
      // which checks individual prescription statuses
      
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

  const handleDeletePrescriptionAnalysis = async (prescriptionId: number) => {
    if (!confirm('Are you sure you want to delete this prescription analysis?')) return;
    
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/prescription/delete?prescriptionId=${prescriptionId}`, {
        method: 'DELETE'
      });
      
      if (!res.ok) throw new Error('Failed to delete prescription analysis');
      
      await fetchData(); // Refresh the data
    } catch (e: any) {
      setError(e?.message || 'Failed to delete');
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    handleProcessAll,
    handleRegenerateLabAnalysis,
    handleDeleteLabAnalysis,
    handleRegenerateStandaloneAnalysis,
    handleDeleteStandaloneReport,
    handleRegeneratePrescriptionAnalysis,
    handleDeletePrescriptionAnalysis
  };
}
