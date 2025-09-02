'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle, AlertCircle, Loader2, X, FileText, TrendingUp, Upload } from 'lucide-react';

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

interface ProcessingProgressNotificationProps {
  notifications: ProcessingNotification[];
  onRemove: (id: string) => void;
}

const getTypeIcon = (type: string) => {
  switch (type) {
    case 'lab-analysis':
      return <TrendingUp className="h-4 w-4" />;
    case 'standalone-report':
      return <Upload className="h-4 w-4" />;
    case 'prescription':
      return <FileText className="h-4 w-4" />;
    default:
      return <FileText className="h-4 w-4" />;
  }
};

const getStageIcon = (status: string) => {
  switch (status) {
    case 'completed':
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case 'failed':
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    case 'processing':
      return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
    default:
      return <div className="h-4 w-4 rounded-full border-2 border-gray-300" />;
  }
};

export default function ProcessingProgressNotification({ notifications, onRemove }: ProcessingProgressNotificationProps) {
  if (notifications.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2 max-w-md">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`bg-white rounded-lg shadow-lg border p-4 ${
            notification.overallStatus === 'completed' ? 'border-green-200' :
            notification.overallStatus === 'failed' ? 'border-red-200' :
            'border-blue-200'
          }`}
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              {getTypeIcon(notification.type)}
              <div>
                <h4 className="font-medium text-sm">{notification.title}</h4>
                <p className="text-xs text-gray-500 capitalize">{notification.type.replace('-', ' ')}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onRemove(notification.id)}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-2">
            {notification.stages.map((stage, index) => (
              <div key={index} className="flex items-center gap-2 text-sm">
                {getStageIcon(stage.status)}
                <span className={`flex-1 ${
                  stage.status === 'completed' ? 'text-green-700' :
                  stage.status === 'failed' ? 'text-red-700' :
                  stage.status === 'processing' ? 'text-blue-700' :
                  'text-gray-500'
                }`}>
                  {stage.stage}
                </span>
                <span className="text-xs text-gray-400">
                  {stage.timestamp.toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>

          {notification.overallStatus === 'completed' && (
            <div className="mt-3 pt-2 border-t border-green-200">
              <p className="text-sm text-green-700 font-medium">✅ Processing completed successfully!</p>
            </div>
          )}

          {notification.overallStatus === 'failed' && (
            <div className="mt-3 pt-2 border-t border-red-200">
              <p className="text-sm text-red-700 font-medium">❌ Processing failed. Please try again.</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
