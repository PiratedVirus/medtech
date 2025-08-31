'use client'
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import UnifiedAnalysisModal from './UnifiedAnalysisModal';

// Demo component to test the unified modal
export default function UnifiedAnalysisModalDemo() {
  const [isOpen, setIsOpen] = useState(false);
  const [documentType, setDocumentType] = useState<'lab_report' | 'standalone_report' | 'prescription'>('lab_report');

  // Sample data for testing
  const sampleData = {
    labReports: [
      {
        id: 1,
        labPackageName: 'Complete Blood Count',
        date: '2024-01-15',
        status: 'COMPLETED',
        labResult: ['https://example.com/report1.pdf']
      },
      {
        id: 2,
        labPackageName: 'Lipid Profile',
        date: '2024-01-10', 
        status: 'PENDING',
        labResult: ['https://example.com/report2.pdf']
      }
    ],
    standaloneReports: [
      {
        id: 1,
        reportType: 'lab_report',
        fileName: 'Blood_Test_Results.pdf',
        createdAt: '2024-01-20',
        status: 'COMPLETED',
        fileUrl: 'https://example.com/standalone1.pdf',
        reportAnalyses: [{
          id: 1,
          analysisType: 'lab_analysis',
          processingStatus: 'COMPLETED' as const,
          llmSummary: 'Sample analysis summary for standalone report.',
          keyFindings: ['Finding 1', 'Finding 2'],
          recommendations: ['Recommendation 1', 'Recommendation 2'],
          urgency: 'ROUTINE' as const,
          llmModel: 'llama-3.3-70b-versatile',
          processedAt: '2024-01-20T10:30:00Z',
          allValues: [
            {
              parameter: 'Hemoglobin',
              value: '12.5',
              unit: 'g/dL',
              normalRange: '13.0-17.0',
              isAbnormal: true,
              severity: 'LOW',
              category: 'CBC'
            },
            {
              parameter: 'White Blood Cell Count',
              value: '7.2',
              unit: 'K/μL',
              normalRange: '4.0-11.0',
              isAbnormal: false,
              severity: 'NORMAL',
              category: 'CBC'
            }
          ],
          criticalValues: [
            {
              parameter: 'Hemoglobin',
              value: '12.5',
              unit: 'g/dL',
              normalRange: '13.0-17.0',
              isAbnormal: true,
              severity: 'LOW',
              category: 'CBC'
            }
          ]
        }]
      }
    ],
    prescriptions: [
      {
        id: 1,
        patientId: 123,
        doctorId: 456,
        title: 'Hypertension Management',
        content: 'Amlodipine 5mg once daily',
        createdAt: '2024-01-18',
        updatedAt: '2024-01-18',
        analysisStatus: 'COMPLETED' as const
      }
    ]
  };

  const openModal = (type: 'lab_report' | 'standalone_report' | 'prescription') => {
    setDocumentType(type);
    setIsOpen(true);
  };

  return (
    <div className="p-8 space-y-4">
      <h1 className="text-2xl font-bold">Unified Analysis Modal Demo</h1>
      <p className="text-gray-600">Test the unified modal with different document types:</p>
      
      <div className="flex gap-4">
        <Button onClick={() => openModal('lab_report')}>
          Open Lab Reports Modal
        </Button>
        <Button onClick={() => openModal('standalone_report')}>
          Open Standalone Reports Modal  
        </Button>
        <Button onClick={() => openModal('prescription')}>
          Open Prescriptions Modal
        </Button>
      </div>

      <UnifiedAnalysisModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        patientId="123"
        labReports={sampleData.labReports}
        standaloneReports={sampleData.standaloneReports}
      />
    </div>
  );
}
