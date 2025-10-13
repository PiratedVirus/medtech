import { useState, useEffect } from 'react';
import { ProcessingNotification, ProcessingStage } from '@/types/analysis';

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
      // Always treat FAILED status as failed, regardless of error message content
      const errorMsg = analysis.processingError || '';
      
      // Determine which stage failed based on error message
      if (errorMsg.includes('Stage 1')) {
        stages.push(
          { stage: 'Text Extraction', status: 'failed', message: errorMsg || 'Text extraction failed', timestamp: new Date() }
        );
      } else if (errorMsg.includes('Stage 2')) {
        stages.push(
          { stage: 'Text Extraction', status: 'completed', message: 'Text extracted successfully', timestamp: new Date() },
          { stage: 'Summary Generation', status: 'failed', message: errorMsg || 'Summary generation failed', timestamp: new Date() }
        );
      } else if (errorMsg.includes('Stage 3')) {
        stages.push(
          { stage: 'Text Extraction', status: 'completed', message: 'Text extracted successfully', timestamp: new Date() },
          { stage: 'Summary Generation', status: 'completed', message: 'Summary generated successfully', timestamp: new Date() },
          { stage: 'Value Extraction', status: 'failed', message: errorMsg || 'Value extraction failed', timestamp: new Date() }
        );
      } else {
        stages.push(
          { stage: 'Processing', status: 'failed', message: errorMsg || 'Processing failed', timestamp: new Date() }
        );
      }
      
      overallStatus = 'failed';
      
      // Auto-remove failed notification after 10 seconds
      setTimeout(() => {
        removeProcessingNotification(notificationId);
      }, 10000);
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
