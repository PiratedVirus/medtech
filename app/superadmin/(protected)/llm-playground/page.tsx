'use client';
import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Copy, List, AlertTriangle, FileText, Stethoscope, TestTube, User, Brain, Settings } from 'lucide-react';

type Profile = {
  id: number;
  name: string;
  description?: string | null;
  model: string;
  temperature?: number | null;
  topP?: number | null;
  maxTokens?: number | null;
  systemPrompt?: string | null;
  userPrompt?: string | null;
  valuesPrompt?: string | null;
  summaryPrompt?: string | null;
  isProductionCandidate?: boolean;
  updatedAt: string;
};

interface RunView {
  id: number;
  status: string;
  finalOutput?: any | null;
  stageLogs?: Array<any> | null;
}

export default function LlmPlaygroundPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [inputType, setInputType] = useState<'pdf'>('pdf');
  const [rawInput, setRawInput] = useState('');
  const [pdfUrl, setPdfUrl] = useState('');
  const [pdfInputMethod, setPdfInputMethod] = useState<'url' | 'upload' | 'database'>('url');
  const [documentType, setDocumentType] = useState<'lab_report' | 'prescription'>('lab_report');
  const [selectedPdfs, setSelectedPdfs] = useState<string[]>([]);
  const [multipleUrls, setMultipleUrls] = useState<string[]>(['']);
  const [uploadedFiles, setUploadedFiles] = useState<Array<{url: string, filename: string}>>([]);
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [availablePdfs, setAvailablePdfs] = useState<Array<{
    id: string;
    fileUrl: string;
    fileName: string;
    uploadedAt: string;
    type: string;
    patientName?: string;
    patientPhone?: string;
    doctorName?: string;
    packageName?: string;
    source: string;
  }>>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [run, setRun] = useState<RunView | null>(null);
  const [currentProductionProfile, setCurrentProductionProfile] = useState<Profile | null>(null);
  const [promotingProfile, setPromotingProfile] = useState<number | null>(null);
  const [expandedStages, setExpandedStages] = useState<Set<string>>(new Set());
  const [stageDisplayModes, setStageDisplayModes] = useState<Record<string, 'rich' | 'raw'>>({});
  const copyText = async (text: string) => {
    try { await navigator.clipboard.writeText(text); } catch {}
  };

  const toggleStageExpansion = (stageName: string) => {
    const newExpanded = new Set(expandedStages);
    if (newExpanded.has(stageName)) {
      newExpanded.delete(stageName);
    } else {
      newExpanded.add(stageName);
    }
    setExpandedStages(newExpanded);
  };

  const getStageDisplayName = (stageName: string) => {
    const stageNames: Record<string, string> = {
      'parse-text': 'Document Text Extraction',
      'extract-values': 'Lab Values Analysis',
      'generate-summary': 'Clinical Summary Generation',
      'llm-call': 'AI Processing',
      'final-output': 'Final Analysis Results'
    };
    return stageNames[stageName] || stageName;
  };

  const getStageDescription = (stageName: string) => {
    const descriptions: Record<string, string> = {
      'parse-text': 'Extracting and processing text from the medical document',
      'extract-values': 'Analyzing and categorizing laboratory values and parameters',
      'generate-summary': 'Generating clinical insights and recommendations',
      'llm-call': 'AI model processing and analysis',
      'final-output': 'Comprehensive medical analysis results'
    };
    return descriptions[stageName] || 'Processing stage';
  };

  const getSeverityClasses = (severity?: string, isAbnormal?: boolean) => {
    const s = (severity || 'NORMAL').toUpperCase();
    if (!isAbnormal || s === 'NORMAL') {
      return {
        bg: 'bg-emerald-100',
        text: 'text-emerald-700',
        dot: 'bg-emerald-500'
      } as const;
    }
    if (s === 'CRITICAL') {
      return {
        bg: 'bg-red-100',
        text: 'text-red-700',
        dot: 'bg-red-500'
      } as const;
    }
    if (s === 'HIGH') {
      return {
        bg: 'bg-orange-100',
        text: 'text-orange-700',
        dot: 'bg-orange-500'
      } as const;
    }
    return {
      bg: 'bg-yellow-100',
      text: 'text-yellow-700',
      dot: 'bg-yellow-500'
    } as const;
  };

  const setStageDisplayMode = (stageName: string, mode: 'rich' | 'raw') => {
    setStageDisplayModes(prev => ({ ...prev, [stageName]: mode }));
  };

  const getStageDisplayMode = (stageName: string) => {
    return stageDisplayModes[stageName] || 'rich';
  };

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch('/api/admin/llm-playground/profiles');
        if (!r.ok) throw new Error(`Failed to load profiles (${r.status})`);
        const text = await r.text();
        if (!text) { setProfiles([]); return; }
        const res = JSON.parse(text);
        if (res?.data) {
          setProfiles(res.data);
          if (!selectedProfile && res.data.length > 0) setSelectedProfile(res.data[0]);
        }
      } catch (e) {
        console.error('Failed to load profiles', e);
      }
    })();
  }, []);

  // Fetch current production profile
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch('/api/admin/llm-playground/production-profile');
        if (r.ok) {
          const text = await r.text();
          if (text) {
            const res = JSON.parse(text);
            if (res?.data) {
              setCurrentProductionProfile(res.data);
            }
          }
        }
      } catch (e) {
        console.error('Failed to load production profile', e);
      }
    })();
  }, []);

  // Fetch available PDFs from healthcare database
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(`/api/admin/llm-playground/healthcare-pdfs?documentType=${documentType}`);
        if (!r.ok) throw new Error(`Failed to load PDFs (${r.status})`);
        const text = await r.text();
        if (!text) { setAvailablePdfs([]); return; }
        const res = JSON.parse(text);
        if (res?.data) {
          setAvailablePdfs(res.data);
        }
      } catch (e) {
        console.error('Failed to load PDFs', e);
      }
    })();
  }, [documentType]);

  async function onCreateProfile() {
    const name = prompt('Profile name?')?.trim();
    if (!name) return;
    const res = await fetch('/api/admin/llm-playground/profiles', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, model: 'openai/gpt-oss-120b' }) });
    const json = await res.json();
    if (json?.data) { setProfiles([json.data, ...profiles]); setSelectedProfile(json.data); }
  }

  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [localProfile, setLocalProfile] = useState<Profile | null>(null);
  const [showAllValues, setShowAllValues] = useState(true);

  // Update local profile when selected profile changes
  useEffect(() => {
    if (selectedProfile) {
      setLocalProfile({ ...selectedProfile });
      setHasUnsavedChanges(false);
    }
  }, [selectedProfile]);

  // Track changes to local profile
  const updateLocalProfile = (partial: Partial<Profile>) => {
    if (!localProfile) return;
    const updated = { ...localProfile, ...partial };
    setLocalProfile(updated);
    setHasUnsavedChanges(true);
  };

  async function onSaveProfile() {
    if (!localProfile || !selectedProfile) return;
    setIsSaving(true);
    setSaveStatus('saving');
    try {
      const res = await fetch(`/api/admin/llm-playground/profiles/${selectedProfile.id}`, { 
        method: 'PUT', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify(localProfile) 
      });
      const json = await res.json();
      if (json?.data) {
        const upd = profiles.map(p => p.id === json.data.id ? json.data : p);
        setProfiles(upd); 
        setSelectedProfile(json.data);
        setLocalProfile(json.data);
        setHasUnsavedChanges(false);
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      } else {
        setSaveStatus('error');
        setTimeout(() => setSaveStatus('idle'), 3000);
      }
    } catch (error) {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } finally {
      setIsSaving(false);
    }
  }

  async function onPromoteToProduction(profileId: number) {
    setPromotingProfile(profileId);
    try {
      const res = await fetch(`/api/admin/llm-playground/profiles/${profileId}/promote`, { method: 'POST' });
      const json = await res.json();
      if (json?.success && json?.data) {
        setCurrentProductionProfile(json.data);
        // Update the profile in the list to show it's now in production
        const upd = profiles.map(p => p.id === profileId ? { ...p, isProductionCandidate: true } : p);
        setProfiles(upd);
        alert(`Profile "${json.data.name}" has been promoted to production!`);
      } else {
        alert(`Failed to promote profile: ${json?.error || 'Unknown error'}`);
      }
    } catch (e) {
      console.error('Failed to promote profile', e);
      alert('Failed to promote profile to production');
    } finally {
      setPromotingProfile(null);
    }
  }

  async function onRun() {
    if (!selectedProfile || !localProfile) return;
    
    // Save any unsaved changes before running
    if (hasUnsavedChanges) {
      await onSaveProfile();
    }
    
    setIsRunning(true);
    setRun(null);
    const body: any = { 
      profileId: selectedProfile.id, 
      inputType,
      documentType 
    };
    
    // Handle different input methods
    if (inputType === 'pdf') {
      if (pdfInputMethod === 'url') {
        if (documentType === 'prescription') {
          // Multiple URLs for prescriptions
          const validUrls = multipleUrls.filter(url => url.trim());
          if (validUrls.length > 0) {
            body.sourceFileUrls = validUrls;
          }
        } else {
          // Single URL for lab reports
          if (pdfUrl) body.sourceFileUrl = pdfUrl;
        }
      } else if (pdfInputMethod === 'upload') {
        if (documentType === 'prescription') {
          // Multiple uploaded files for prescriptions
          if (uploadedFiles.length > 0) {
            body.sourceFileUrls = uploadedFiles.map(file => file.url);
          }
        } else {
          // Single uploaded file for lab reports
          if (pdfUrl) body.sourceFileUrl = pdfUrl;
        }
      } else if (pdfInputMethod === 'database') {
        if (documentType === 'prescription') {
          // Multiple selected PDFs for prescriptions
          if (selectedPdfs.length > 0) {
            body.sourceFileUrls = selectedPdfs;
          }
        } else {
          // Single selected PDF for lab reports
          if (pdfUrl) body.sourceFileUrl = pdfUrl;
        }
      }
    }
    
    if (rawInput) body.rawInput = rawInput;
    const res = await fetch('/api/admin/llm-playground/runs', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const text = await res.text();
    let json: any = {};
    try { json = text ? JSON.parse(text) : {}; } catch { json = {}; }
    if (!json?.data?.runId) { setIsRunning(false); return; }
    const runId = json.data.runId;
    const poll = async () => {
      try {
        const r = await fetch(`/api/admin/llm-playground/runs?id=${runId}`);
        const t = await r.text();
        const j = t ? JSON.parse(t) : {};
        if (j?.data) setRun(j.data);
        if (j?.data?.status === 'completed' || j?.data?.status === 'failed') { setIsRunning(false); return; }
      } catch (e) {
        console.error('Polling error', e);
      }
      setTimeout(poll, 1000);
    };
    poll();
  }

  const stageCards = useMemo(() => {
    const logs = (run?.stageLogs as any[]) || [];
    // Filter out extract-values stage for prescriptions
    const filteredLogs = documentType === 'prescription' 
      ? logs.filter(s => s.name !== 'extract-values')
      : logs;
    return filteredLogs.map((s, idx) => {
      const isExpanded = expandedStages.has(s.name);
      const displayName = getStageDisplayName(s.name);
      const description = getStageDescription(s.name);
      const stageDisplayMode = getStageDisplayMode(s.name);
      
      // Get appropriate icon for each stage
      const getStageIcon = (stageName: string) => {
        const icons: Record<string, any> = {
          'parse-text': FileText,
          'extract-values': TestTube,
          'generate-summary': Brain,
          'llm-call': Brain,
          'final-output': Stethoscope
        };
        return icons[stageName] || FileText;
      };
      
      const StageIcon = getStageIcon(s.name);
      
      // Render rich display based on stage type
      const renderRichDisplay = () => {
      if (s.name === 'parse-text' && s.response) {
        return (
            <div className="space-y-4">
              {/* Extraction Method */}
              {s.response.extractionMethod && (
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="text-sm font-medium text-blue-900 mb-2">Extraction Method</div>
                  <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    s.response.extractionMethod === 'ocr' ? 'bg-orange-100 text-orange-800' :
                    s.response.extractionMethod === 'pdf-parse' ? 'bg-green-100 text-green-800' :
                    s.response.extractionMethod === 'text-input' ? 'bg-blue-100 text-blue-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {s.response.extractionMethod === 'ocr' ? '🔍 OCR (Google Vision)' :
                     s.response.extractionMethod === 'pdf-parse' ? '📄 PDF Parse' :
                     s.response.extractionMethod === 'text-input' ? '📝 Text Input' :
                     '❌ Failed'}
                  </div>
                </div>
              )}
              
              {/* Extracted Text Preview */}
              {s.response.fullText && (
                <div className="p-4 bg-gray-50 rounded-lg border">
                  <div className="text-sm font-medium text-gray-900 mb-2">Extracted Text ({s.response.textLength || 0} chars)</div>
                  <div className="bg-white p-3 rounded border max-h-64 overflow-auto">
                    <pre className="text-sm whitespace-pre-wrap break-words">{s.response.fullText}</pre>
                </div>
                  </div>
                )}
          </div>
        );
      }

      if (s.name === 'extract-values' && s.response) {
          // Skip extract-values stage for prescriptions
          if (documentType === 'prescription') {
            return null; // Don't render this stage at all for prescriptions
          }
          
          const values = s.response.allValues || s.response.criticalValues || [];
          return (
            <div className="space-y-4">
              {/* Lab Values Display - Patient/Doctor View */}
              {values.length > 0 && (
                <div className="p-4 bg-gray-50 rounded-lg border">
                  <div className="text-sm font-medium text-gray-900 mb-3">Lab Values Analysis</div>
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
                    {values.map((value: any, valueIdx: number) => {
                      const severityClasses = getSeverityClasses(value.severity, value.isAbnormal);
                      return (
                        <div
                          key={valueIdx}
                          className={`group relative flex items-center gap-2 rounded-full ${severityClasses.bg} h-8 px-3 shadow-sm`}
                          title={value.normalRange ? `Normal: ${value.normalRange}` : undefined}
                        >
                          <div className="flex items-center w-full gap-2">
                            <span className="flex-1 truncate text-[13px] font-semibold text-gray-700" title={value.parameter}>
                              {value.parameter}
                                </span>
                            <span className="ml-auto inline-flex items-baseline gap-1.5">
                              <span className={`text-[13px] font-bold ${severityClasses.text}`}>
                                {value.value}
                              </span>
                              {value.unit && (
                                <span className="text-[11px] text-gray-600">{value.unit}</span>
                              )}
                            </span>
                    </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
          </div>
        );
      }

      if (s.name === 'generate-summary' && s.response) {
        return (
            <div className="space-y-4">
              {/* Clinical Summary */}
              {s.response.summary && (
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="text-sm font-medium text-blue-900 mb-2">Clinical Summary</div>
                  <div className="bg-white p-3 rounded border">
                    <div className="text-sm whitespace-pre-wrap break-words">{s.response.summary}</div>
                  </div>
                </div>
              )}

              {/* Key Findings */}
              {s.response.keyFindings && s.response.keyFindings.length > 0 && (
                <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div className="text-sm font-medium text-yellow-900 mb-2">Key Findings ({s.response.keyFindings.length})</div>
                    <div className="space-y-2">
                      {s.response.keyFindings.map((finding: string, i: number) => (
                      <div key={i} className="text-sm bg-white p-2 rounded border">
                          • {finding}
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Recommendations */}
              {s.response.recommendations && s.response.recommendations.length > 0 && (
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="text-sm font-medium text-green-900 mb-2">Recommendations ({s.response.recommendations.length})</div>
                    <div className="space-y-2">
                      {s.response.recommendations.map((recommendation: string, i: number) => (
                      <div key={i} className="text-sm bg-white p-2 rounded border">
                          • {recommendation}
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Urgency Level */}
              {s.response.urgency && (
                <div className="p-3 bg-gray-50 rounded-lg border">
                  <div className="text-sm font-medium text-gray-900 mb-2">Urgency Level</div>
                  <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    s.response.urgency === 'URGENT' ? 'bg-red-100 text-red-800' :
                    s.response.urgency === 'SOON' ? 'bg-orange-100 text-orange-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {s.response.urgency}
                  </div>
                </div>
              )}
            </div>
          );
        }
        
        // Default rich display for other stages
        return (
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg border">
              <div className="text-sm font-medium text-gray-900 mb-2">Processing Results</div>
              <div className="bg-white p-3 rounded border">
                <pre className="text-sm whitespace-pre-wrap break-words">{JSON.stringify(s.response, null, 2)}</pre>
              </div>
            </div>
          </div>
        );
      };

      return (
        <div key={idx} className="border rounded-lg p-4 mb-4 w-full bg-white">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <StageIcon className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">{displayName}</h4>
                <p className="text-sm text-gray-600">{description}</p>
                {s.latencyMs && (
                  <p className="text-xs text-gray-500">Processing time: {s.latencyMs} ms</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => toggleStageExpansion(s.name)}
                className="text-xs"
              >
                {isExpanded ? 'Collapse' : 'Expand'}
              </Button>
              <Button size="icon" variant="outline" onClick={() => copyText(JSON.stringify(s, null, 2))}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {s.error && (
            <div className="text-red-600 text-sm mb-3 p-2 bg-red-50 rounded border border-red-200">
              <strong>Error:</strong> {s.error}
            </div>
          )}
          
          {isExpanded && (
            <div className="space-y-4">
              {/* Internal Rich/Raw Toggle */}
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium text-gray-700">Display Mode</div>
                <div className="flex bg-gray-200 rounded-lg p-1">
                  <button
                    onClick={() => setStageDisplayMode(s.name, 'rich')}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                      stageDisplayMode === 'rich'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Patient View
                  </button>
                  <button
                    onClick={() => setStageDisplayMode(s.name, 'raw')}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                      stageDisplayMode === 'raw'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Raw Data
                  </button>
                </div>
              </div>
              
              {/* Content based on display mode */}
              {stageDisplayMode === 'rich' ? renderRichDisplay() : (
                <div className="space-y-4">
                  {/* Request */}
            <div className="relative w-full">
              <Button size="icon" variant="outline" className="absolute top-2 right-2 z-10" aria-label="Copy request" onClick={() => copyText(JSON.stringify(s.request ?? {}, null, 2))}>
                <Copy className="h-4 w-4" />
              </Button>
                    <div className="text-xs text-gray-600 mb-1">Processing Request</div>
                    <pre className="bg-gray-50 p-2 rounded text-xs overflow-auto max-h-64 w-full break-words whitespace-pre-wrap">{JSON.stringify(s.request, null, 2)}</pre>
            </div>

                  {/* Response */}
            <div className="relative w-full">
              <Button size="icon" variant="outline" className="absolute top-2 right-2 z-10" aria-label="Copy response" onClick={() => copyText(JSON.stringify(s.response ?? {}, null, 2))}>
                <Copy className="h-4 w-4" />
              </Button>
                    <div className="text-xs text-gray-600 mb-1">Processing Response</div>
                    <pre className="bg-gray-50 p-2 rounded text-xs overflow-auto max-h-64 w-full break-words whitespace-pre-wrap">{JSON.stringify(s.response, null, 2)}</pre>
            </div>
          </div>
              )}
            </div>
          )}
        </div>
      );
    });
  }, [run, expandedStages, stageDisplayModes, documentType]);

  return (
    <div className="p-6 space-y-6 w-full max-w-[95vw] overflow-x-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Brain className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Healthcare AI Analysis Playground</h2>
            <p className="text-sm text-gray-600">Test and configure AI models for medical document analysis</p>
          </div>
        </div>
        <Button onClick={onCreateProfile} className="flex items-center gap-2">
          <Settings className="h-4 w-4" />
          New Analysis Profile
        </Button>
      </div>

      {/* Production Profile Status */}
      {currentProductionProfile && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Stethoscope className="h-5 w-5 text-green-600" />
              </div>
            <div>
                <h3 className="font-medium text-green-800">Active Clinical Analysis Profile</h3>
              <p className="text-sm text-green-600">
                  <strong>{currentProductionProfile.name}</strong> - Currently processing patient documents
              </p>
              <p className="text-xs text-green-500">
                Last updated: {new Date(currentProductionProfile.updatedAt).toLocaleString()}
              </p>
              </div>
            </div>
            <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
              LIVE IN PRODUCTION
            </div>
          </div>
        </div>
      )}

      {/* Analysis Profiles */}
      <div className="bg-white border rounded-lg p-4">
        <div className="flex items-center gap-2 mb-4">
          <TestTube className="h-5 w-5 text-blue-600" />
          <h3 className="font-medium text-gray-900">Analysis Profiles</h3>
          <span className="text-sm text-gray-500">({profiles.length} configured)</span>
        </div>
      <div className="w-full overflow-x-auto">
        <div className="flex items-center gap-2 min-w-max py-2">
          {profiles.map((p) => (
            <div key={p.id} className="flex items-center gap-2">
              <Button 
                variant={selectedProfile?.id === p.id ? 'default' : 'outline'} 
                  className="whitespace-nowrap flex items-center gap-2" 
                onClick={() => setSelectedProfile(p)}
              >
                  <Brain className="h-4 w-4" />
                {p.name}
                {currentProductionProfile?.id === p.id && (
                  <span className="ml-2 bg-green-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                      LIVE
                  </span>
                )}
              </Button>
              {currentProductionProfile?.id !== p.id && (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => onPromoteToProduction(p.id)}
                  disabled={promotingProfile === p.id}
                    className="text-xs flex items-center gap-1"
                >
                    <Stethoscope className="h-3 w-3" />
                    {promotingProfile === p.id ? 'Activating...' : 'Activate for Production'}
                </Button>
              )}
            </div>
          ))}
          </div>
        </div>
      </div>

      {/* Input Configuration Section */}
      <div className="bg-gray-50 border rounded-lg p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-blue-100 rounded-lg">
            <FileText className="h-5 w-5 text-blue-600" />
          </div>
              <div>
            <h3 className="font-medium text-gray-900">Document Input Configuration</h3>
            <p className="text-sm text-gray-600">Select and configure the medical document for analysis</p>
          </div>
        </div>


        <div className="space-y-6">
          {/* Document Type Selection */}
          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-700">Document Type</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setDocumentType('lab_report')}
                className={`p-4 border-2 rounded-lg text-left transition-all ${
                  documentType === 'lab_report' 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${documentType === 'lab_report' ? 'bg-blue-100' : 'bg-gray-100'}`}>
                    <TestTube className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                    <h4 className="font-medium text-gray-900">Lab Report Analysis</h4>
                    <p className="text-sm text-gray-600">Analyze laboratory test results and extract values</p>
              </div>
            </div>
              </button>
              
              <button
                type="button"
                onClick={() => setDocumentType('prescription')}
                className={`p-4 border-2 rounded-lg text-left transition-all ${
                  documentType === 'prescription' 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${documentType === 'prescription' ? 'bg-blue-100' : 'bg-gray-100'}`}>
                    <FileText className="h-5 w-5 text-blue-600" />
                  </div>
                <div>
                    <h4 className="font-medium text-gray-900">Prescription Analysis</h4>
                    <p className="text-sm text-gray-600">Analyze medical prescriptions and generate summaries</p>
                    {documentType === 'prescription' && (
                      <p className="text-xs text-blue-600 mt-1">💡 Multiple prescriptions recommended for better analysis</p>
                    )}
                </div>
                </div>
              </button>
            </div>
          </div>

          {/* PDF Input Method Selection */}
          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-700">Choose Document Input Method</label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                type="button"
                onClick={() => setPdfInputMethod('url')}
                className={`p-4 border-2 rounded-lg text-left transition-all ${
                  pdfInputMethod === 'url' 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${pdfInputMethod === 'url' ? 'bg-blue-100' : 'bg-gray-100'}`}>
                    <FileText className={`h-4 w-4 ${pdfInputMethod === 'url' ? 'text-blue-600' : 'text-gray-600'}`} />
                  </div>
                <div>
                    <h4 className="font-medium text-sm">Paste PDF URL</h4>
                    <p className="text-xs text-gray-500">Enter a direct PDF link</p>
                </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setPdfInputMethod('upload')}
                className={`p-4 border-2 rounded-lg text-left transition-all ${
                  pdfInputMethod === 'upload' 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${pdfInputMethod === 'upload' ? 'bg-blue-100' : 'bg-gray-100'}`}>
                    <FileText className={`h-4 w-4 ${pdfInputMethod === 'upload' ? 'text-blue-600' : 'text-gray-600'}`} />
                  </div>
                  <div>
                    <h4 className="font-medium text-sm">Upload PDF</h4>
                    <p className="text-xs text-gray-500">Upload a new document</p>
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setPdfInputMethod('database')}
                className={`p-4 border-2 rounded-lg text-left transition-all ${
                  pdfInputMethod === 'database' 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${pdfInputMethod === 'database' ? 'bg-blue-100' : 'bg-gray-100'}`}>
                    <FileText className={`h-4 w-4 ${pdfInputMethod === 'database' ? 'text-blue-600' : 'text-gray-600'}`} />
                  </div>
                  <div>
                    <h4 className="font-medium text-sm">Select from Database</h4>
                    <p className="text-xs text-gray-500">Choose from existing records</p>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* PDF Input Based on Selected Method */}
          <div className="space-y-4">
            {pdfInputMethod === 'url' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {documentType === 'prescription' ? 'PDF URLs (Multiple URLs)' : 'PDF URL'}
                </label>
                {documentType === 'prescription' ? (
                  <div className="space-y-2">
                    {multipleUrls.map((url, index) => (
                      <div key={index} className="flex gap-2">
                        <input
                          type="url"
                          className="border rounded-lg px-3 py-2 flex-1 text-sm"
                          placeholder={`https://example.com/prescription-${index + 1}.pdf`}
                          value={url}
                          onChange={(e) => {
                            const newUrls = [...multipleUrls];
                            newUrls[index] = e.target.value;
                            setMultipleUrls(newUrls);
                          }}
                        />
                        {multipleUrls.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              const newUrls = multipleUrls.filter((_, i) => i !== index);
                              setMultipleUrls(newUrls);
                            }}
                            className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg border border-red-200"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => setMultipleUrls([...multipleUrls, ''])}
                      className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                    >
                      + Add another URL
                    </button>
                    {multipleUrls.filter(url => url.trim()).length > 0 && (
                      <div className="text-sm text-blue-600">
                        ✓ {multipleUrls.filter(url => url.trim()).length} URL{multipleUrls.filter(url => url.trim()).length > 1 ? 's' : ''} provided
                      </div>
                    )}
              </div>
            ) : (
                  <input 
                    type="url"
                    className="border rounded-lg px-3 py-2 w-full text-sm" 
                    placeholder="https://example.com/document.pdf"
                    value={pdfUrl} 
                    onChange={(e) => setPdfUrl(e.target.value)}
                  />
                )}
              </div>
            )}

            {pdfInputMethod === 'upload' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {documentType === 'prescription' ? 'Upload PDF Files (Multiple Files)' : 'Upload PDF File'}
                </label>
                {documentType === 'prescription' ? (
                  <div className="space-y-3">
                    <input 
                      type="file"
                      accept="application/pdf"
                      multiple
                      className="border rounded-lg px-3 py-2 w-full text-sm" 
                      onChange={async (e) => {
                        const files = e.target.files;
                        if (!files || files.length === 0) return;
                        
                        setUploading(true);
                        const newFiles: Array<{url: string, filename: string}> = [];
                        
                        try {
                          for (let i = 0; i < files.length; i++) {
                            const file = files[i];
                            const fd = new FormData();
                            fd.append('file', file);
                            
                            const r = await fetch('/api/admin/llm-playground/upload', { 
                              method: 'POST', 
                              body: fd 
                            });
                            const t = await r.text();
                            const j = t ? JSON.parse(t) : {};
                            
                            if (j?.url) {
                              newFiles.push({url: j.url, filename: file.name});
                            } else {
                              console.error(`Upload failed for file ${i + 1}:`, j?.error);
                            }
                          }
                          
                          if (newFiles.length > 0) {
                            setUploadedFiles((prev: Array<{url: string, filename: string}>) => [...prev, ...newFiles]);
                          }
                        } catch (error) {
                          console.error('Upload error:', error);
                        } finally {
                          setUploading(false);
                        }
                      }}
                    />
                    {uploadedFiles.length > 0 && (
                      <div className="space-y-2">
                        <div className="text-sm font-medium text-gray-700">Uploaded Files:</div>
                        {uploadedFiles.map((file, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-green-50 rounded-lg border border-green-200">
                            <div className="flex items-center gap-2 flex-1">
                              <FileText className="h-4 w-4 text-green-600" />
                              <a 
                                href={file.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-sm text-blue-600 hover:text-blue-800 underline truncate"
                                title={file.filename}
                              >
                                {file.filename}
                              </a>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                const newFiles = uploadedFiles.filter((_, i) => i !== index);
                                setUploadedFiles(newFiles);
                              }}
                              className="text-red-600 hover:text-red-800 text-sm ml-2"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    {uploading && <div className="text-sm text-blue-600">Uploading files...</div>}
                  </div>
                ) : (
                  <input 
                    type="file"
                    accept="application/pdf"
                    className="border rounded-lg px-3 py-2 w-full text-sm" 
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setBusy(true);
                      try {
                        const fd = new FormData();
                        fd.append('file', file);
                        const r = await fetch('/api/admin/llm-playground/upload', { method: 'POST', body: fd });
                        const t = await r.text();
                        const j = t ? JSON.parse(t) : {};
                        if (j?.url) setPdfUrl(j.url);
                      } catch (err) {
                        console.error('Upload failed', err);
                      } finally {
                        setBusy(false);
                      }
                    }}
                  />
                )}
              </div>
            )}

            {pdfInputMethod === 'database' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {documentType === 'prescription' ? 'Select Prescriptions (Multiple Selection)' : 'Select from Patient Records'}
                </label>
                {documentType === 'prescription' ? (
                  <div className="space-y-2 max-h-64 overflow-y-auto border rounded-lg p-3">
                    {availablePdfs.map((pdf) => (
                      <label key={pdf.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedPdfs.includes(pdf.fileUrl)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedPdfs(prev => [...prev, pdf.fileUrl]);
                            } else {
                              setSelectedPdfs(prev => prev.filter(url => url !== pdf.fileUrl));
                            }
                          }}
                          className="rounded border-gray-300"
                        />
                        <div className="flex-1">
                          <div className="font-medium text-sm">{pdf.fileName}</div>
                          <div className="text-xs text-gray-500">
                            {pdf.patientName} • {pdf.doctorName} • {new Date(pdf.uploadedAt).toLocaleDateString()}
              </div>
                        </div>
                      </label>
                    ))}
                    {availablePdfs.length === 0 && (
                      <p className="text-sm text-gray-500">No prescriptions available in database</p>
                    )}
                  </div>
                ) : (
                  <select 
                    className="border rounded-lg px-3 py-2 w-full text-sm" 
                    value={pdfUrl} 
                    onChange={(e) => setPdfUrl(e.target.value)}
                  >
                    <option value="">Choose a lab report...</option>
                    {availablePdfs.map((pdf) => (
                      <option key={pdf.id} value={pdf.fileUrl}>
                        {pdf.fileName} - {pdf.patientName} ({pdf.type})
                      </option>
                    ))}
                  </select>
                )}
                {documentType === 'prescription' && selectedPdfs.length > 0 && (
                  <div className="text-sm text-blue-600 mt-2">
                    ✓ {selectedPdfs.length} prescription{selectedPdfs.length > 1 ? 's' : ''} selected
                  </div>
                )}
                {availablePdfs.length === 0 && documentType !== 'prescription' && (
                  <p className="text-sm text-gray-500 mt-1">No medical documents found in the system</p>
                )}
              </div>
            )}
          </div>

          {/* Additional Clinical Context - Full Width */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">Additional Clinical Context</label>
            <textarea 
              className="border rounded-lg px-4 py-3 w-full min-h-[200px] text-sm" 
              placeholder="Add any additional clinical information, patient history, or specific analysis requirements..."
              value={rawInput} 
              onChange={(e) => setRawInput(e.target.value)} 
            />
          </div>

          {/* Analysis Parameters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Analysis Temperature</label>
              <input 
                type="number" 
                step="0.1" 
                className="border rounded-lg px-3 py-2 w-full text-sm" 
                value={localProfile?.temperature ?? 0.2} 
                onChange={(e) => updateLocalProfile({ temperature: Number(e.target.value) })} 
              />
              <p className="text-xs text-gray-500 mt-1">Controls response creativity (0.0-1.0)</p>
              </div>
              <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Response Diversity</label>
              <input 
                type="number" 
                step="0.05" 
                className="border rounded-lg px-3 py-2 w-full text-sm" 
                value={localProfile?.topP ?? 1} 
                onChange={(e) => updateLocalProfile({ topP: Number(e.target.value) })} 
              />
              <p className="text-xs text-gray-500 mt-1">Controls response variety (0.0-1.0)</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Max Response Length</label>
              <input 
                type="number" 
                className="border rounded-lg px-3 py-2 w-full text-sm" 
                value={localProfile?.maxTokens ?? 2048} 
                onChange={(e) => updateLocalProfile({ maxTokens: Number(e.target.value) })} 
              />
              <p className="text-xs text-gray-500 mt-1">Maximum tokens in response</p>
            </div>
              </div>
            </div>
          </div>

      {/* AI Processing Configuration */}
      <div className="bg-gray-50 border rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Brain className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">AI Processing Configuration</h3>
              <p className="text-sm text-gray-600">Configure how the AI analyzes medical documents</p>
            </div>
          </div>
              <div className="flex items-center gap-2">
                {hasUnsavedChanges && (
                  <span className="text-xs text-orange-600">⚠️ Unsaved changes</span>
                )}
                {saveStatus === 'saving' && (
                  <span className="text-xs text-blue-600">💾 Saving...</span>
                )}
                {saveStatus === 'saved' && (
                  <span className="text-xs text-green-600">✅ Saved</span>
                )}
                {saveStatus === 'error' && (
                  <span className="text-xs text-red-600">❌ Save failed</span>
                )}
                <Button 
                  size="sm" 
                  onClick={onSaveProfile}
                  disabled={!hasUnsavedChanges || isSaving}
                  className="text-xs"
                >
              {isSaving ? 'Saving...' : 'Save Configuration'}
                </Button>
              </div>
            </div>
            
        {/* Variable Information Bar */}
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-3">
            <div className="p-1 bg-blue-100 rounded">
              <Brain className="h-4 w-4 text-blue-600" />
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-blue-900 mb-1">Smart Variable System</h4>
              <p className="text-sm text-blue-800 mb-2">
                Use <code className="bg-blue-100 px-2 py-1 rounded text-blue-900 font-mono text-xs">{'{{TEXT}}'}</code> in your prompts - 
                it will automatically be replaced with the actual document content when processing patient reports.
              </p>
              <p className="text-xs text-blue-700">
                This ensures your prompts work consistently across all patient documents without manual text copying.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
            <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Clinical Analysis Instructions
              <span className="text-xs text-gray-500 ml-2">(Applicable for both document types)</span>
            </label>
              <textarea 
              className="border rounded-lg px-4 py-3 w-full min-h-[200px] text-sm font-mono" 
                value={localProfile?.systemPrompt || ''} 
                onChange={(e) => updateLocalProfile({ systemPrompt: e.target.value })}
              placeholder="Define how the AI should analyze medical documents..."
              />
            </div>
          
            <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Patient Context Template
              <span className="text-xs text-gray-500 ml-2">(Applicable for both document types)</span>
            </label>
              <textarea 
              className="border rounded-lg px-4 py-3 w-full min-h-[160px] text-sm font-mono" 
                value={localProfile?.userPrompt || ''} 
                onChange={(e) => updateLocalProfile({ userPrompt: e.target.value })}
              placeholder="Template for providing patient context to the AI..."
              />
            </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
              Lab Values Extraction Instructions
              {documentType === 'prescription' && (
                <span className="text-xs text-gray-500 ml-2">(Not applicable for prescriptions)</span>
              )}
            </label>
                <textarea 
                rows={25}
                className="border rounded-lg px-4 py-3 w-full min-h-[200px] text-sm font-mono" 
                  value={localProfile?.valuesPrompt || ''} 
                  onChange={(e) => updateLocalProfile({ valuesPrompt: e.target.value })}
                placeholder="Instructions for extracting and analyzing lab values..."
                />
              </div>
            
              <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
              Clinical Summary Generation
              <span className="text-xs text-gray-500 ml-2">(Applicable for both document types)</span>
            </label>
                <textarea 
                rows={25}
                className="border rounded-lg px-4 py-3 w-full min-h-[200px] text-sm font-mono" 
                  value={localProfile?.summaryPrompt || ''} 
                  onChange={(e) => updateLocalProfile({ summaryPrompt: e.target.value })}
                placeholder="Instructions for generating clinical summaries..."
                />
              </div>
        </div>
      </div>

        <div className="flex justify-end pt-6 border-t mt-6">
                      <Button
            onClick={onRun} 
            disabled={!selectedProfile || isRunning || hasUnsavedChanges}
            className="flex items-center gap-2"
          >
            <Brain className="h-4 w-4" />
            {hasUnsavedChanges ? 'Save & Analyze Document' : 'Analyze Document'}
                      </Button>
                    </div>
                  </div>
                  
      {/* Analysis Output */}
      <div className="bg-gray-50 border rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-purple-100 rounded-lg">
            <TestTube className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
            <h3 className="font-medium text-gray-900">Analysis Output</h3>
            <p className="text-sm text-gray-600">AI-generated results and processing outputs</p>
                    </div>
                  </div>
        <div className="max-h-[60vh] overflow-auto space-y-4">
          {stageCards}
                    </div>
                  </div>

    </div>
  );
}

function ParseTextPreview({ run }: { run: RunView | null }) {
  const logs = (run?.stageLogs as any[]) || [];
  const parse = logs.find((l) => l?.name === 'parse-text');
  if (!parse) return null;
  return (
    <div className="border rounded p-3 mt-4">
      <div className="font-medium mb-2">Parse Text Output</div>
      <pre className="bg-gray-50 p-2 rounded text-xs overflow-auto max-h-96">{parse?.response?.textPreview}</pre>
      <div className="text-xs text-gray-500 mt-1">Length: {parse?.response?.textLength || 0} chars</div>
    </div>
  );
}

function HealthcarePdfPicker({ onPick }: { onPick: (url: string) => void }) {
  const [busy, setBusy] = useState(false);
  const [availablePdfs, setAvailablePdfs] = useState<Array<{
    id: string;
    fileUrl: string;
    fileName: string;
    uploadedAt: string;
    type: string;
    patientName?: string;
    patientPhone?: string;
    doctorName?: string;
    packageName?: string;
    source: string;
  }>>([]);
  
  
  async function onUploadFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const r = await fetch('/api/admin/llm-playground/upload', { method: 'POST', body: fd });
      const t = await r.text();
      const j = t ? JSON.parse(t) : {};
      if (j?.url) onPick(j.url);
    } catch (err) {
      console.error('Upload failed', err);
    } finally {
      setBusy(false);
    }
  }

  
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <FileText className="h-4 w-4 text-blue-600" />
        <span className="text-sm font-medium text-gray-700">Medical Document Selection</span>
      </div>
      
      <div className="space-y-3">
      <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Upload New Medical Document</label>
          <div className="flex items-center gap-2">
            <input 
              type="file" 
              accept="application/pdf" 
              onChange={onUploadFile} 
              disabled={busy}
              className="text-sm"
            />
            <Button variant="outline" disabled={busy} size="sm">
              {busy ? 'Uploading…' : 'Upload PDF'}
            </Button>
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Select from Patient Records</label>
          <select 
            className="border rounded-lg px-3 py-2 w-full text-sm" 
            onChange={(e) => e.target.value && onPick(e.target.value)}
          >
            <option value="">Choose from existing medical documents...</option>
            {availablePdfs.map((pdf) => (
              <option key={pdf.id} value={pdf.fileUrl}>
                {pdf.fileName} - {pdf.patientName} ({pdf.type})
              </option>
          ))}
        </select>
          {availablePdfs.length === 0 && (
            <p className="text-sm text-gray-500 mt-1">No medical documents found in the system</p>
          )}
        </div>
      </div>
    </div>
  );
}

function LabAnalysisManager() {
  const [labBookings, setLabBookings] = useState<Array<{
    id: number;
    labPackageName: string;
    labResult: string[];
    analyses: Array<{
      id: number;
      labResultIndex: number;
      processingStatus: string;
      llmSummary?: string;
      processedAt?: string;
    }>;
  }>>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchLabBookings();
  }, []);

  const fetchLabBookings = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/optimized/lab-bookings?pageSize=100');
      const data = await response.json();
      
      if (data.data) {
        // Fetch analyses for each lab booking
        const bookingsWithAnalyses = await Promise.all(
          data.data.map(async (booking: any) => {
            try {
              const analysesResponse = await fetch(`/api/admin/lab-analysis?labBookingId=${booking.id}`);
              const analysesData = await analysesResponse.json();
              
              return {
                id: booking.id,
                labPackageName: booking.labPackage?.name || 'Unknown Package',
                labResult: booking.labResult || [],
                analyses: analysesData.analyses || []
              };
            } catch (error) {
              return {
                id: booking.id,
                labPackageName: booking.labPackage?.name || 'Unknown Package',
                labResult: booking.labResult || [],
                analyses: []
              };
            }
          })
        );
        
        setLabBookings(bookingsWithAnalyses);
      }
    } catch (error) {
      console.error('Failed to fetch lab bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteAnalysis = async (labBookingId: number, labResultIndex: number) => {
    try {
      const response = await fetch(`/api/admin/lab-analysis/delete?labBookingId=${labBookingId}&labResultIndex=${labResultIndex}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        await fetchLabBookings(); // Refresh the list
      } else {
        console.error('Failed to delete analysis');
      }
    } catch (error) {
      console.error('Error deleting analysis:', error);
    }
  };

  const regenerateAnalysis = async (labBookingId: number, labResultIndex: number) => {
    try {
      const response = await fetch('/api/admin/lab-analysis/regenerate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ labBookingId, labResultIndex })
      });
      
      if (response.ok) {
        await fetchLabBookings(); // Refresh the list
      } else {
        console.error('Failed to regenerate analysis');
      }
    } catch (error) {
      console.error('Error regenerating analysis:', error);
    }
  };

  if (loading) {
    return <div className="text-sm text-gray-500">Loading lab analyses...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="text-sm text-gray-600">
        Manage individual lab result analyses. Each lab result can have its own AI analysis.
      </div>
      
      {labBookings.map((booking) => (
        <div key={booking.id} className="border rounded p-3 bg-gray-50">
          <div className="font-medium mb-2">
            {booking.labPackageName} (ID: {booking.id})
          </div>
          
          <div className="space-y-2">
            {booking.labResult.map((result, index) => {
              const analysis = booking.analyses.find(a => a.labResultIndex === index);
              
              return (
                <div key={index} className="flex items-center justify-between p-2 bg-white rounded border">
                  <div className="flex-1">
                    <div className="font-medium text-sm">
                      Result {index + 1} ({result.split('/').pop() || 'Unknown'})
                    </div>
                    <div className="text-xs text-gray-500">
                      Status: {analysis ? analysis.processingStatus : 'No Analysis'}
                      {analysis?.processedAt && ` • Processed: ${new Date(analysis.processedAt).toLocaleString()}`}
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    {analysis && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteAnalysis(booking.id, index)}
                        className="text-red-600 border-red-300 hover:bg-red-50"
                      >
                        Delete
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => regenerateAnalysis(booking.id, index)}
                      className="text-blue-600 border-blue-300 hover:bg-blue-50"
                    >
                      {analysis ? 'Regenerate' : 'Generate'}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
      
      {labBookings.length === 0 && (
        <div className="text-sm text-gray-500 text-center py-4">
          No lab bookings found with analyses.
        </div>
      )}
    </div>
  );
}