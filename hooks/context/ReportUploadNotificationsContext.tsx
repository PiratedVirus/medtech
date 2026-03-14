'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { buildLabProgressStages } from '@/lib/notifications/lab-progress-stages';
import ReportUploadProgressNotifications, {
  UploadProcessingNotification,
  UploadProcessingStage,
} from '@/components/common/ReportUploadProgressNotifications';

type UploadReportType = 'lab_report' | 'prescription' | 'document';
type UploadProgressSource = 'standalone' | 'lab-booking' | 'upload-only';

type ReportAnalysisStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | string;

type UploadNotificationWithMeta = UploadProcessingNotification & {
  reportId?: number;
  labResultIndex?: number;
  patientId: number;
  source: UploadProgressSource;
};

type CreateUploadNotificationInput = {
  fileName: string;
  reportType: UploadReportType;
  patientId: number;
  source?: UploadProgressSource;
};

type UploadStatusContextValue = {
  notifications: UploadProcessingNotification[];
  createUploadNotification: (input: CreateUploadNotificationInput) => string;
  markUploadSucceeded: (notificationId: string, reportId: number) => void;
  markLabBookingUploadSucceeded: (notificationId: string, labBookingId: number, labResultIndex: number) => void;
  markUploadCompleted: (notificationId: string, message?: string) => void;
  markUploadFailed: (notificationId: string, errorMessage?: string) => void;
  removeNotification: (notificationId: string) => void;
};

const ReportUploadNotificationsContext = createContext<UploadStatusContextValue | null>(null);

const ANALYSIS_TYPE_BY_REPORT: Record<UploadReportType, string> = {
  lab_report: 'lab_analysis',
  prescription: 'prescription_analysis',
  document: 'document_summary',
};

function buildGenericStages(
  status: ReportAnalysisStatus,
  errorMessage?: string | null,
  includeUploadStage = false
): UploadProcessingStage[] {
  const processingStage: UploadProcessingStage = {
    stage: 'Analyzing Report',
    status: status === 'COMPLETED' ? 'completed' : status === 'FAILED' ? 'failed' : 'processing',
    message:
      status === 'COMPLETED'
        ? 'Analysis completed successfully.'
        : status === 'FAILED'
        ? errorMessage || 'Analysis failed.'
        : 'Report analysis in progress.',
    timestamp: new Date(),
  };

  if (!includeUploadStage) {
    return [processingStage];
  }

  return [
    {
      stage: 'Uploading File',
      status: 'completed',
      message: 'File uploaded successfully. Starting AI analysis.',
      timestamp: new Date(),
    },
    processingStage,
  ];
}

function normalizeStages(
  reportType: UploadReportType,
  status: ReportAnalysisStatus,
  errorMessage?: string | null
): UploadProcessingStage[] {
  if (reportType === 'lab_report') {
    return buildLabProgressStages({
      processingStatus: status,
      processingError: errorMessage,
      includeUploadStage: true,
    }) as UploadProcessingStage[];
  }

  return buildGenericStages(status, errorMessage, true);
}

function statusToOverall(status: ReportAnalysisStatus): UploadProcessingNotification['overallStatus'] {
  if (status === 'COMPLETED') return 'completed';
  if (status === 'FAILED') return 'failed';
  return 'processing';
}

export function ReportUploadNotificationsProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<UploadNotificationWithMeta[]>([]);
  const scheduledRemovalIds = useRef<Set<string>>(new Set());

  const removeNotification = useCallback((notificationId: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
    scheduledRemovalIds.current.delete(notificationId);
  }, []);

  const scheduleAutoRemoval = useCallback(
    (notificationId: string, delayMs: number) => {
      if (scheduledRemovalIds.current.has(notificationId)) return;
      scheduledRemovalIds.current.add(notificationId);

      window.setTimeout(() => {
        removeNotification(notificationId);
      }, delayMs);
    },
    [removeNotification]
  );

  const createUploadNotification = useCallback((input: CreateUploadNotificationInput) => {
    const notificationId = `upload-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

    const newNotification: UploadNotificationWithMeta = {
      id: notificationId,
      fileName: input.fileName,
      reportType: input.reportType,
      patientId: input.patientId,
      source: input.source || 'upload-only',
      stages: [
        {
          stage: 'Uploading File',
          status: 'processing',
          message: 'Uploading file...',
          timestamp: new Date(),
        },
      ],
      overallStatus: 'processing',
    };

    setNotifications((prev) => [...prev, newNotification]);
    return notificationId;
  }, []);

  const markUploadSucceeded = useCallback((notificationId: string, reportId: number) => {
    setNotifications((prev) =>
      prev.map((notification) => {
        if (notification.id !== notificationId) return notification;

        return {
          ...notification,
          reportId,
          source: 'standalone',
          stages: normalizeStages(notification.reportType, 'PENDING'),
          overallStatus: 'processing' as const,
        };
      })
    );
  }, []);

  const markLabBookingUploadSucceeded = useCallback((notificationId: string, labBookingId: number, labResultIndex: number) => {
    setNotifications((prev) =>
      prev.map((notification) => {
        if (notification.id !== notificationId) return notification;

        return {
          ...notification,
          reportId: labBookingId,
          labResultIndex,
          source: 'lab-booking',
          stages: normalizeStages('lab_report', 'PENDING'),
          overallStatus: 'processing' as const,
        };
      })
    );
  }, []);

  const markUploadCompleted = useCallback((notificationId: string, message?: string) => {
    setNotifications((prev) =>
      prev.map((notification) => {
        if (notification.id !== notificationId) return notification;

        return {
          ...notification,
          overallStatus: 'completed' as const,
          stages: [
            {
              stage: 'Uploading File',
              status: 'completed',
              message: message || 'File uploaded successfully.',
              timestamp: new Date(),
            },
          ],
        };
      })
    );

    scheduleAutoRemoval(notificationId, 7000);
  }, [scheduleAutoRemoval]);

  const markUploadFailed = useCallback((notificationId: string, errorMessage?: string) => {
    setNotifications((prev) =>
      prev.map((notification) => {
        if (notification.id !== notificationId) return notification;

        return {
          ...notification,
          overallStatus: 'failed' as const,
          stages: [
            {
              stage: 'Uploading File',
              status: 'failed',
              message: errorMessage || 'Upload failed.',
              timestamp: new Date(),
            },
          ],
        };
      })
    );

    scheduleAutoRemoval(notificationId, 10000);
  }, [scheduleAutoRemoval]);

  const updateFromAnalysis = useCallback(
    (
      notificationId: string,
      reportType: UploadReportType,
      processingStatus: ReportAnalysisStatus,
      processingError?: string | null
    ) => {
      const overallStatus = statusToOverall(processingStatus);

      setNotifications((prev) =>
        prev.map((notification) => {
          if (notification.id !== notificationId) return notification;

          return {
            ...notification,
            overallStatus,
            stages: normalizeStages(reportType, processingStatus, processingError),
          };
        })
      );

      if (overallStatus === 'completed') {
        scheduleAutoRemoval(notificationId, 7000);
      } else if (overallStatus === 'failed') {
        scheduleAutoRemoval(notificationId, 10000);
      }
    },
    [scheduleAutoRemoval]
  );

  useEffect(() => {
    const activeNotifications = notifications.filter((n) => {
      if (n.overallStatus !== 'processing') return false;
      if (n.source === 'standalone') return !!n.reportId;
      if (n.source === 'lab-booking') return !!n.reportId && n.labResultIndex !== undefined;
      return false;
    });
    if (activeNotifications.length === 0) return;

    const interval = window.setInterval(async () => {
      for (const notification of activeNotifications) {
        if (!notification.reportId) continue;

        try {
          if (notification.source === 'standalone') {
            const response = await fetch(`/api/reports/upload?patientId=${notification.patientId}`);
            if (!response.ok) continue;

            const data = await response.json();
            if (!data?.success || !Array.isArray(data?.reports)) continue;

            const report = data.reports.find((item: any) => item.id === notification.reportId);
            if (!report || !Array.isArray(report.reportAnalyses)) continue;

            const analysisType = ANALYSIS_TYPE_BY_REPORT[notification.reportType];
            const analysis =
              report.reportAnalyses.find((item: any) => item.analysisType === analysisType) ||
              report.reportAnalyses[0];

            if (!analysis) continue;

            updateFromAnalysis(
              notification.id,
              notification.reportType,
              analysis.processingStatus,
              analysis.processingError
            );
            continue;
          }

          if (notification.source === 'lab-booking') {
            const response = await fetch(
              `/api/lab-analysis/check?reportId=${notification.reportId}&labResultIndex=${notification.labResultIndex}`
            );
            if (!response.ok) continue;

            const data = await response.json();
            if (!data?.success || !data?.exists) continue;

            updateFromAnalysis(
              notification.id,
              'lab_report',
              data.processingStatus,
              data.processingError
            );
          }
        } catch (error) {
          console.error('Failed to poll report upload status:', error);
        }
      }
    }, 2000);

    return () => {
      window.clearInterval(interval);
    };
  }, [notifications, updateFromAnalysis]);

  const value = useMemo<UploadStatusContextValue>(
    () => ({
      notifications: notifications.map(({ patientId, reportId, ...rest }) => ({
        ...rest,
        reportId,
      })),
      createUploadNotification,
      markUploadSucceeded,
      markLabBookingUploadSucceeded,
      markUploadCompleted,
      markUploadFailed,
      removeNotification,
    }),
    [notifications, createUploadNotification, markUploadSucceeded, markLabBookingUploadSucceeded, markUploadCompleted, markUploadFailed, removeNotification]
  );

  return (
    <ReportUploadNotificationsContext.Provider value={value}>
      {children}
      <ReportUploadProgressNotifications
        notifications={value.notifications}
        onRemove={removeNotification}
      />
    </ReportUploadNotificationsContext.Provider>
  );
}

export function useReportUploadNotifications() {
  const context = useContext(ReportUploadNotificationsContext);
  if (context) return context;

  // Defensive fallback: avoid runtime crashes if a route/component renders
  // outside the provider tree (e.g., alternate layout shells).
  console.warn('useReportUploadNotifications called outside ReportUploadNotificationsProvider');
  return {
    notifications: [],
    createUploadNotification: () => `upload-fallback-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    markUploadSucceeded: () => {},
    markLabBookingUploadSucceeded: () => {},
    markUploadCompleted: () => {},
    markUploadFailed: () => {},
    removeNotification: () => {},
  };
}
