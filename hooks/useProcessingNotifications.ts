import { useState, useEffect } from 'react';
import { ProcessingNotification, ProcessingStage } from '@/types/analysis';
import { buildLabProgressStages } from '@/lib/notifications/lab-progress-stages';

export function useProcessingNotifications() {
  const [processingNotifications, setProcessingNotifications] = useState<ProcessingNotification[]>([]);

  // Poll for processing updates
  useEffect(() => {
    if (processingNotifications.length === 0) return;

    // Set a maximum polling duration of 5 minutes
    const maxPollingTime = 5 * 60 * 1000; // 5 minutes
    const startTime = Date.now();

    const interval = setInterval(async () => {
      // Check if we've been polling for too long
      if (Date.now() - startTime > maxPollingTime) {
        console.warn('Polling timeout reached, stopping all notifications');
        clearInterval(interval);
        // Mark all processing notifications as failed due to timeout
        setProcessingNotifications(prev => 
          prev.map(n => n.overallStatus === 'processing' 
            ? { ...n, overallStatus: 'failed' as const }
            : n
          )
        );
        return;
      }
      const activeNotifications = processingNotifications.filter(n => n.overallStatus === 'processing');
      
      // If no active notifications, clear the interval
      if (activeNotifications.length === 0) {
        clearInterval(interval);
        return;
      }
      
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
          } else if (notification.type === 'prescription' && notification.reportId) {
            // Check prescription processing status
            const response = await fetch(`/api/prescription/check-status?patientId=${notification.reportId}`);
            if (response.ok) {
              const data = await response.json();
              if (data.success) {
                console.log(`[NOTIFICATION-POLL] Patient ${notification.reportId} status:`, data.data);
                updatePrescriptionNotification(notification.id, data.data);
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
    let overallStatus: 'processing' | 'completed' | 'failed' = 'processing';

    if (analysisData.processingStatus === 'COMPLETED') {
      overallStatus = 'completed';
      
      // Invalidate all lab-related caches when analysis completes
      if (typeof window !== 'undefined' && (window as any).__REACT_QUERY_CLIENT__) {
        const queryClient = (window as any).__REACT_QUERY_CLIENT__;
        queryClient.invalidateQueries({ queryKey: ['labResults'] });
        queryClient.invalidateQueries({ queryKey: ['labs'] });
        queryClient.invalidateQueries({ queryKey: ['lab-analysis'] });
        queryClient.invalidateQueries({ queryKey: ['patient-details'] });
      }
      
      // Auto-remove completed notification after 5 seconds
      setTimeout(() => {
        removeProcessingNotification(notificationId);
      }, 5000);
    } else if (analysisData.processingStatus === 'FAILED') {
      overallStatus = 'failed';
      
      // Auto-remove failed notification after 10 seconds
      setTimeout(() => {
        removeProcessingNotification(notificationId);
      }, 10000);
    }

    const stages = buildLabProgressStages({
      processingStatus: analysisData.processingStatus,
      processingError: analysisData.processingError,
    }) as ProcessingStage[];

    updateProcessingNotification(notificationId, { stages, overallStatus });
  };

  const updateStandaloneReportNotification = (notificationId: string, analysis: any) => {
    let overallStatus: 'processing' | 'completed' | 'failed' = 'processing';

    if (analysis.processingStatus === 'COMPLETED') {
      overallStatus = 'completed';
      
      // Auto-remove completed notification after 5 seconds
      setTimeout(() => {
        removeProcessingNotification(notificationId);
      }, 5000);
    } else if (analysis.processingStatus === 'FAILED') {
      overallStatus = 'failed';
      
      // Auto-remove failed notification after 10 seconds
      setTimeout(() => {
        removeProcessingNotification(notificationId);
      }, 10000);
    }

    const stages = buildLabProgressStages({
      processingStatus: analysis.processingStatus,
      processingError: analysis.processingError,
    }) as ProcessingStage[];

    updateProcessingNotification(notificationId, { stages, overallStatus });
  };

  const updatePrescriptionNotification = (notificationId: string, prescriptionData: any) => {
    const stages: ProcessingStage[] = [];
    let overallStatus: 'processing' | 'completed' | 'failed' = 'processing';

    // Add individual prescription processing stages
    if (prescriptionData.prescriptionStatuses && prescriptionData.prescriptionStatuses.length > 0) {
      prescriptionData.prescriptionStatuses.forEach((prescription: any, index: number) => {
        const fileName = prescription.fileName || `Prescription ${prescription.id}`;
        
        if (prescription.status === 'COMPLETED') {
          stages.push({
            stage: `Processing ${fileName}`,
            status: 'completed',
            message: 'Extracted and analyzed successfully',
            timestamp: new Date()
          });
        } else if (prescription.status === 'FAILED') {
          stages.push({
            stage: `Processing ${fileName}`,
            status: 'failed',
            message: prescription.processingError || 'Processing failed',
            timestamp: new Date()
          });
        } else if (prescription.status === 'PROCESSING') {
          stages.push({
            stage: `Processing ${fileName}`,
            status: 'processing',
            message: 'Extracting text and generating analysis...',
            timestamp: new Date()
          });
        }
      });
    }

    // Determine overall status
    if (prescriptionData.completed === prescriptionData.totalPrescriptions && prescriptionData.totalPrescriptions > 0) {
      overallStatus = 'completed';
      stages.push({
        stage: 'Patient Summary',
        status: 'completed',
        message: 'Generated comprehensive patient summary',
        timestamp: new Date()
      });
      
      // Auto-remove completed notification after 5 seconds
      setTimeout(() => {
        removeProcessingNotification(notificationId);
      }, 5000);
    } else if (prescriptionData.failed > 0) {
      overallStatus = 'failed';
      stages.push({
        stage: 'Patient Summary',
        status: 'failed',
        message: 'Some prescriptions failed to process',
        timestamp: new Date()
      });
    } else if (prescriptionData.processing > 0 || prescriptionData.pending > 0) {
      overallStatus = 'processing';
      stages.push({
        stage: 'Patient Summary',
        status: 'processing',
        message: `Processing ${prescriptionData.completed}/${prescriptionData.totalPrescriptions} prescriptions...`,
        timestamp: new Date()
      });
    }

    updateProcessingNotification(notificationId, { stages, overallStatus });
  };

  return {
    processingNotifications,
    addProcessingNotification,
    updateProcessingNotification,
    removeProcessingNotification,
    updateNotificationStages,
    updateLabAnalysisNotification,
    updateStandaloneReportNotification,
    updatePrescriptionNotification
  };
}
