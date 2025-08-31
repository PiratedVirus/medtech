import { useState, useEffect } from 'react';
import { ProcessingNotification, ProcessingStage } from '@/types/analysis';

export function useProcessingNotifications() {
  const [processingNotifications, setProcessingNotifications] = useState<ProcessingNotification[]>([]);

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

  return {
    processingNotifications,
    addProcessingNotification,
    updateProcessingNotification,
    removeProcessingNotification,
    updateNotificationStages,
    updateLabAnalysisNotification,
    updateStandaloneReportNotification
  };
}
