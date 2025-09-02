import { useState } from 'react';
import { LabAnalysis, LabBooking, StandaloneReport, StandaloneReportAnalysis } from '@/types/analysis';

export function useAnalysisModals() {
  // Lab analysis modal state
  const [selectedAnalysis, setSelectedAnalysis] = useState<LabAnalysis | null>(null);
  const [selectedLabBooking, setSelectedLabBooking] = useState<LabBooking | null>(null);
  const [analysisModalOpen, setAnalysisModalOpen] = useState(false);
  const [showAllValues, setShowAllValues] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [extractedText, setExtractedText] = useState<string>('');
  const [loadingText, setLoadingText] = useState(false);
  const [activeModalTab, setActiveModalTab] = useState('analysis');
  
  // Standalone report modal state
  const [selectedStandaloneReport, setSelectedStandaloneReport] = useState<StandaloneReport | null>(null);
  const [selectedStandaloneAnalysis, setSelectedStandaloneAnalysis] = useState<StandaloneReportAnalysis | null>(null);
  const [standaloneModalOpen, setStandaloneModalOpen] = useState(false);
  const [standaloneSearchTerm, setStandaloneSearchTerm] = useState('');

  const handleViewAnalysis = async (labBooking: LabBooking, labResultIndex: number) => {
    const analysis = labBooking.analyses.find(a => a.labResultIndex === labResultIndex);
    if (!analysis) return;

    setSelectedLabBooking(labBooking);
    setSelectedAnalysis(analysis);
    setAnalysisModalOpen(true);
    setActiveModalTab('analysis');
    setSearchTerm(''); // Reset search term
    setShowAllValues(false); // Reset to show critical values by default
    
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

  const handleViewStandaloneReport = async (report: StandaloneReport) => {
    setSelectedStandaloneReport(report);
    // Get the most recent completed analysis, or the first one if none completed
    const completedAnalysis = report.analyses.find(a => a.processingStatus === 'COMPLETED');
    const analysis = completedAnalysis || report.analyses[0] || null;
    console.log('Viewing standalone report analysis:', analysis);
    console.log('Report analyses:', report.analyses);
    console.log('Selected analysis allValues:', analysis?.allValues);
    console.log('Selected analysis criticalValues:', analysis?.criticalValues);
    setSelectedStandaloneAnalysis(analysis);
    setStandaloneModalOpen(true);
    setStandaloneSearchTerm(''); // Reset search term
    setShowAllValues(false); // Reset to show critical values by default
  };

  const closeAnalysisModal = () => {
    setAnalysisModalOpen(false);
    setSelectedAnalysis(null);
    setSelectedLabBooking(null);
    setSearchTerm('');
    setShowAllValues(false);
    setExtractedText('');
    setActiveModalTab('analysis');
  };

  const closeStandaloneModal = () => {
    setStandaloneModalOpen(false);
    setSelectedStandaloneReport(null);
    setSelectedStandaloneAnalysis(null);
    setStandaloneSearchTerm('');
    setShowAllValues(false);
  };

  return {
    // Lab analysis modal
    selectedAnalysis,
    selectedLabBooking,
    analysisModalOpen,
    showAllValues,
    searchTerm,
    extractedText,
    loadingText,
    activeModalTab,
    setShowAllValues,
    setSearchTerm,
    setActiveModalTab,
    handleViewAnalysis,
    closeAnalysisModal,
    
    // Standalone report modal
    selectedStandaloneReport,
    selectedStandaloneAnalysis,
    standaloneModalOpen,
    standaloneSearchTerm,
    setStandaloneSearchTerm,
    handleViewStandaloneReport,
    closeStandaloneModal
  };
}
