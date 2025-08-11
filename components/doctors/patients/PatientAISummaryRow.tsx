'use client'
import { Card } from "@/components/ui/card";
import { Sparkles, RefreshCw, AlertCircle } from "lucide-react";
import { useMemo, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

interface PatientAISummaryRowProps {
  patientId: number;
  summary?: string; // Optional fallback summary
}

interface AISummaryData {
  summary: string;
  keyFindings: string[];
  recommendations: string[];
  urgency: 'ROUTINE' | 'SOON' | 'URGENT';
  lastUpdated: string;
  prescriptionCount: number;
  totalPrescriptions: number;
  lastPrescriptionDate?: string;
}

function patternStyle(rgba: string): React.CSSProperties {
  return {
    backgroundImage: `radial-gradient(circle at 1px 1px, ${rgba} 1px, transparent 0)` ,
    backgroundSize: '18px 18px',
  };
}

export default function PatientAISummaryRow({ patientId, summary: fallbackSummary }: PatientAISummaryRowProps) {
  const [aiSummary, setAiSummary] = useState<AISummaryData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAISummary = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/prescription/ai-summary/${patientId}`);
      const data = await response.json();
      
      if (data.success) {
        setAiSummary(data.data);
      } else {
        setError(data.error || 'Failed to fetch AI summary');
      }
    } catch (err) {
      setError('Failed to fetch AI summary');
    } finally {
      setLoading(false);
    }
  };

  const regenerateSummary = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/prescription/ai-summary/${patientId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ force: true }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setAiSummary(data.data);
      } else {
        setError(data.error || 'Failed to regenerate AI summary');
      }
    } catch (err) {
      setError('Failed to regenerate AI summary');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (patientId) {
      fetchAISummary();
    }
  }, [patientId]);

  const urgencyColor = useMemo(() => {
    if (!aiSummary) return 'text-gray-600';
    switch (aiSummary.urgency) {
      case 'URGENT': return 'text-red-600';
      case 'SOON': return 'text-orange-600';
      case 'ROUTINE': return 'text-green-600';
      default: return 'text-gray-600';
    }
  }, [aiSummary]);

  const urgencyBgColor = useMemo(() => {
    if (!aiSummary) return 'bg-gray-100';
    switch (aiSummary.urgency) {
      case 'URGENT': return 'bg-red-100';
      case 'SOON': return 'bg-orange-100';
      case 'ROUTINE': return 'bg-green-100';
      default: return 'bg-gray-100';
    }
  }, [aiSummary]);

  if (loading && !aiSummary) {
    return (
      <div className="col-span-full mt-5">
        <div className="relative rounded-xl border border-blue-200/50 bg-gradient-to-br from-white/80 via-blue-50/70 to-blue-100/80 p-5 shadow-lg overflow-hidden">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-4 w-4 font-bold text-blue-600" />
            <span className="text-sm font-bold text-blue-700">AI Summary</span>
            <RefreshCw className="h-4 w-4 animate-spin text-blue-600" />
          </div>
          <p className="text-sm text-gray-600">Generating AI summary...</p>
        </div>
      </div>
    );
  }

  if (error && !aiSummary) {
    return (
      <div className="col-span-full mt-5">
        <div className="relative rounded-xl border border-red-200/50 bg-gradient-to-br from-white/80 via-red-50/70 to-red-100/80 p-5 shadow-lg overflow-hidden">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="h-4 w-4 font-bold text-red-600" />
            <span className="text-sm font-bold text-red-700">AI Summary Error</span>
          </div>
          <p className="text-sm text-red-600 mb-3">{error}</p>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={fetchAISummary}
            disabled={loading}
          >
            {loading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : null}
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const displaySummary = aiSummary?.summary || fallbackSummary || 'No AI summary available for this patient.';

  return (
    <div className="col-span-full mt-5">
      <div className="relative rounded-xl border border-blue-200/50 bg-gradient-to-br from-white/80 via-blue-50/70 to-blue-100/80 p-5 shadow-lg overflow-hidden" role="complementary" aria-label="AI generated summary">
        <div className="flex items-center justify-between mb-3 relative z-10">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 font-bold text-blue-600" aria-hidden />
            <span className="text-sm font-bold text-blue-700">AI Summary</span>
            <span className="ml-1 inline-block h-[6px] w-[6px] rounded-full bg-black/10 animate-pulse" aria-hidden />
          </div>
          
          <div className="flex items-center gap-2">
            {aiSummary && (
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${urgencyBgColor} ${urgencyColor} border`}>
                {aiSummary.urgency}
              </span>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={regenerateSummary}
              disabled={loading}
              className="text-xs"
            >
              {loading ? <RefreshCw className="h-3 w-3 animate-spin mr-1" /> : <RefreshCw className="h-3 w-3 mr-1" />}
              Regenerate
            </Button>
          </div>
        </div>

        <p className="text-sm text-gray-800 leading-relaxed relative z-10 mb-3">
          {displaySummary}
        </p>

        {aiSummary && (
          <div className="mt-4 space-y-3">
            <div className="grid grid-cols-2 gap-6">
              {aiSummary.keyFindings.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-blue-700 mb-2">Key Findings</h4>
                  <ul className="space-y-1">
                    {aiSummary.keyFindings.map((finding, index) => (
                      <li key={index} className="text-xs text-gray-700 flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0"></span>
                        {finding}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {aiSummary.recommendations.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-green-700 mb-2">Recommendations</h4>
                  <ul className="space-y-1">
                    {aiSummary.recommendations.map((recommendation, index) => (
                      <li key={index} className="text-xs text-gray-700 flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1.5 flex-shrink-0"></span>
                        {recommendation}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="flex items-center gap-4 text-xs text-gray-500 pt-2 border-t border-blue-200/30">
              <span>Based on {aiSummary.prescriptionCount} prescriptions</span>
              <span>Last updated: {new Date(aiSummary.lastUpdated).toLocaleDateString()}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}