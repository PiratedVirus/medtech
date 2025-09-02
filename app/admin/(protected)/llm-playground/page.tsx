'use client';
import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Copy, List, AlertTriangle } from 'lucide-react';

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
  const [inputType, setInputType] = useState<'pdf'|'text'|'json'|'prescriptionDraft'>('text');
  const [rawInput, setRawInput] = useState('');
  const [pdfUrl, setPdfUrl] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [run, setRun] = useState<RunView | null>(null);
  const [currentProductionProfile, setCurrentProductionProfile] = useState<Profile | null>(null);
  const [promotingProfile, setPromotingProfile] = useState<number | null>(null);
  const copyText = async (text: string) => {
    try { await navigator.clipboard.writeText(text); } catch {}
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

  async function onCreateProfile() {
    const name = prompt('Profile name?')?.trim();
    if (!name) return;
    const res = await fetch('/api/admin/llm-playground/profiles', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, model: 'llama-3.3-70b-versatile' }) });
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
    const body: any = { profileId: selectedProfile.id, inputType };
    if (pdfUrl && inputType === 'pdf') body.sourceFileUrl = pdfUrl;
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
    return logs.map((s, idx) => {
      // Special handling for parse-text stage
      if (s.name === 'parse-text' && s.response) {
        return (
          <div key={idx} className="border rounded p-3 mb-3 w-full max-w-full overflow-x-auto">
            <div className="font-semibold">{s.name}</div>
            {s.error ? <div className="text-red-600 text-sm">{s.error}</div> : null}
            <div className="space-y-4 mt-2">
              {/* Request */}
              <div className="relative w-full">
                <Button size="icon" variant="outline" className="absolute top-2 right-2 z-10" aria-label="Copy request" onClick={() => copyText(JSON.stringify(s.request ?? {}, null, 2))}>
                  <Copy className="h-4 w-4" />
                </Button>
                <div className="text-xs text-gray-600 mb-1">Request</div>
                <pre className="bg-gray-50 p-2 rounded text-xs overflow-auto max-h-64 w-full break-words whitespace-pre-wrap">{JSON.stringify(s.request, null, 2)}</pre>
              </div>

              {/* Extraction Method */}
              {s.response.extractionMethod && (
                <div className="relative w-full">
                  <div className="text-xs text-gray-600 mb-1">Extraction Method</div>
                  <div className={`p-2 rounded border text-sm font-medium w-full ${
                    s.response.extractionMethod === 'ocr' ? 'bg-orange-100 border-orange-300 text-orange-800' :
                    s.response.extractionMethod === 'pdf-parse' ? 'bg-green-100 border-green-300 text-green-800' :
                    s.response.extractionMethod === 'text-input' ? 'bg-blue-100 border-blue-300 text-blue-800' :
                    'bg-red-100 border-red-300 text-red-800'
                  }`}>
                    {s.response.extractionMethod === 'ocr' ? '🔍 OCR (Google Vision)' :
                     s.response.extractionMethod === 'pdf-parse' ? '📄 PDF Parse' :
                     s.response.extractionMethod === 'text-input' ? '📝 Text Input' :
                     '❌ Failed'}
                  </div>
                </div>
              )}
              
              {/* Full Extracted Text */}
              <div className="relative w-full">
                <Button size="icon" variant="outline" className="absolute top-2 right-2 z-10" aria-label="Copy full text" onClick={() => copyText(s.response.fullText || s.response.textPreview || '')}>
                  <Copy className="h-4 w-4" />
                </Button>
                <div className="text-xs text-gray-600 mb-1">Full Extracted Text ({s.response.textLength || 0} chars)</div>
                <div className="bg-gray-50 p-2 rounded text-xs max-h-96 overflow-auto w-full">
                  <pre className="whitespace-pre-wrap break-words">{s.response.fullText || s.response.textPreview || 'No text extracted'}</pre>
                </div>
                {s.response.fullText && s.response.textPreview && s.response.fullText.length > s.response.textPreview.length && (
                  <div className="text-xs text-green-600 mt-1">
                    ✅ Full text ({s.response.fullText.length} chars) is being used for processing
                  </div>
                )}
              </div>

              {/* Raw JSON Response */}
              <div className="relative w-full">
                <Button size="icon" variant="outline" className="absolute top-2 right-2 z-10" aria-label="Copy full response" onClick={() => copyText(JSON.stringify(s.response, null, 2))}>
                  <Copy className="h-4 w-4" />
                </Button>
                <div className="text-xs text-gray-600 mb-1">Raw JSON Response</div>
                <pre className="bg-gray-50 p-2 rounded text-xs overflow-auto max-h-64 w-full break-words whitespace-pre-wrap">{JSON.stringify(s.response, null, 2)}</pre>
              </div>
            </div>
            <div className="text-xs text-gray-500 mt-2">{s.latencyMs ? `${s.latencyMs} ms` : ''}</div>
          </div>
        );
      }

      // Special handling for extract-values stage
      if (s.name === 'extract-values' && s.response) {
        return (
          <div key={idx} className="border rounded p-3 mb-3 w-full">
            <div className="font-semibold">{s.name}</div>
            {s.error ? <div className="text-red-600 text-sm">{s.error}</div> : null}
            <div className="space-y-4 mt-2">
              {/* Request */}
              <div className="relative w-full">
                <Button size="icon" variant="outline" className="absolute top-2 right-2 z-10" aria-label="Copy request" onClick={() => copyText(JSON.stringify(s.request ?? {}, null, 2))}>
                  <Copy className="h-4 w-4" />
                </Button>
                <div className="text-xs text-gray-600 mb-1">Request</div>
                <pre className="bg-gray-50 p-2 rounded text-xs overflow-auto max-h-64 w-full break-words whitespace-pre-wrap">{JSON.stringify(s.request, null, 2)}</pre>
                {s.request?.textLength && (
                  <div className="text-xs text-green-600 mt-1">
                    ✅ Full text ({s.request.textLength} chars) is being used for processing
                  </div>
                )}
              </div>

              {/* Full Text Being Processed */}
              {s.request?.variablesFull?.TEXT && (
                <div className="relative w-full">
                  <Button size="icon" variant="outline" className="absolute top-2 right-2 z-10" aria-label="Copy full text" onClick={() => copyText(s.request.variablesFull.TEXT)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                  <div className="text-xs text-gray-600 mb-1">Full Text Being Processed ({s.request.variablesFull.TEXT.length} chars)</div>
                  <div className="bg-blue-50 p-2 rounded text-xs max-h-96 overflow-auto w-full border border-blue-200">
                    <pre className="whitespace-pre-wrap break-words">{s.request.variablesFull.TEXT}</pre>
                  </div>
                </div>
              )}

              {/* Lab Values with Toggle (same as unified modal) */}
              {((s.response.allValues && s.response.allValues.length > 0) || (s.response.criticalValues && s.response.criticalValues.length > 0)) && (
                <div className="relative w-full">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-xs text-gray-600">
                      {showAllValues 
                        ? `All Values (${s.response.allValues?.length || 0} total)` 
                        : `Critical Values (${s.response.criticalValues?.length || 0} total)`
                      }
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant={showAllValues ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setShowAllValues(true)}
                        className={`text-xs ${showAllValues ? 'bg-blue-600 text-white' : 'text-blue-700 border-blue-300'}`}
                      >
                        <List className="h-3 w-3 mr-1" /> All
                      </Button>
                      <Button
                        variant={!showAllValues ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setShowAllValues(false)}
                        className={`text-xs ${!showAllValues ? 'bg-red-600 text-white' : 'text-red-700 border-red-300'}`}
                      >
                        <AlertTriangle className="h-3 w-3 mr-1" /> Critical
                      </Button>
                      <Button size="icon" variant="outline" className="h-6 w-6" aria-label="Copy values" onClick={() => copyText(JSON.stringify(showAllValues ? s.response.allValues : s.response.criticalValues, null, 2))}>
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className={`p-2 rounded text-xs max-h-96 overflow-auto w-full ${
                    showAllValues ? 'bg-gray-50' : 'bg-red-50 border border-red-200'
                  }`}>
                    <div className={`rounded-lg border bg-white ${
                      showAllValues ? 'border-gray-200' : 'border-red-200'
                    }`}>
                      <table className="w-full text-xs">
                        <thead>
                          <tr className={`text-left text-gray-600 border-b ${
                            showAllValues ? 'bg-gray-50' : 'bg-red-50'
                          }`}>
                            <th className="p-2 font-medium">Parameter</th>
                            <th className="p-2 font-medium">Value</th>
                            <th className="p-2 font-medium">Normal Range</th>
                            <th className="p-2 font-medium">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(showAllValues ? s.response.allValues : s.response.criticalValues)?.map((val: any, i: number) => (
                            <tr key={i} className={`border-b ${
                              val.isAbnormal 
                                ? val.severity === 'CRITICAL' 
                                  ? 'bg-red-50' 
                                  : val.severity === 'HIGH' 
                                  ? 'bg-orange-50' 
                                  : 'bg-yellow-50'
                                : 'bg-white hover:bg-gray-50'
                            } ${showAllValues ? 'border-gray-100' : 'border-red-100'}`}>
                              <td className={`p-2 font-medium break-words ${
                                showAllValues ? 'text-gray-900' : 'text-red-800'
                              }`}>{val.parameter}</td>
                              <td className="p-2">
                                <span className={`font-semibold ${
                                  showAllValues ? '' : 'text-red-600'
                                }`}>{val.value}</span>
                                {val.unit && <span className="text-gray-600 ml-1">{val.unit}</span>}
                              </td>
                              <td className="p-2 text-gray-600 break-words">{val.normalRange}</td>
                              <td className="p-2">
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                  val.isAbnormal 
                                    ? val.severity === 'CRITICAL' 
                                      ? 'bg-red-100 text-red-800' 
                                      : val.severity === 'HIGH' 
                                      ? 'bg-orange-100 text-orange-800' 
                                      : 'bg-yellow-100 text-yellow-800'
                                    : 'bg-green-100 text-green-800'
                                }`}>
                                  {val.isAbnormal ? val.severity : 'NORMAL'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* Raw JSON Response */}
              <div className="relative w-full">
                <Button size="icon" variant="outline" className="absolute top-2 right-2 z-10" aria-label="Copy full response" onClick={() => copyText(JSON.stringify(s.response, null, 2))}>
                  <Copy className="h-4 w-4" />
                </Button>
                <div className="text-xs text-gray-600 mb-1">Raw JSON Response</div>
                <pre className="bg-gray-50 p-2 rounded text-xs overflow-auto max-h-64 w-full break-words whitespace-pre-wrap">{JSON.stringify(s.response, null, 2)}</pre>
              </div>
            </div>
            <div className="text-xs text-gray-500 mt-2">{s.latencyMs ? `${s.latencyMs} ms` : ''}</div>
          </div>
        );
      }

      // Special handling for generate-summary stage
      if (s.name === 'generate-summary' && s.response) {
        return (
          <div key={idx} className="border rounded p-3 mb-3 w-full">
            <div className="font-semibold">{s.name}</div>
            {s.error ? <div className="text-red-600 text-sm">{s.error}</div> : null}
            <div className="space-y-4 mt-2">
              {/* Request */}
              <div className="relative w-full">
                <Button size="icon" variant="outline" className="absolute top-2 right-2 z-10" aria-label="Copy request" onClick={() => copyText(JSON.stringify(s.request ?? {}, null, 2))}>
                  <Copy className="h-4 w-4" />
                </Button>
                <div className="text-xs text-gray-600 mb-1">Request</div>
                <pre className="bg-gray-50 p-2 rounded text-xs overflow-auto max-h-64 w-full break-words whitespace-pre-wrap">{JSON.stringify(s.request, null, 2)}</pre>
                {s.request?.textLength && (
                  <div className="text-xs text-green-600 mt-1">
                    ✅ Full text ({s.request.textLength} chars) is being used for processing
                  </div>
                )}
              </div>

              {/* Full Text Being Processed */}
              {s.request?.variablesFull?.TEXT && (
                <div className="relative w-full">
                  <Button size="icon" variant="outline" className="absolute top-2 right-2 z-10" aria-label="Copy full text" onClick={() => copyText(s.request.variablesFull.TEXT)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                  <div className="text-xs text-gray-600 mb-1">Full Text Being Processed ({s.request.variablesFull.TEXT.length} chars)</div>
                  <div className="bg-blue-50 p-2 rounded text-xs max-h-96 overflow-auto w-full border border-blue-200">
                    <pre className="whitespace-pre-wrap break-words">{s.request.variablesFull.TEXT}</pre>
                  </div>
                </div>
              )}

              {/* Full Summary */}
              {s.response.summary && (
                <div className="relative w-full">
                  <Button size="icon" variant="outline" className="absolute top-2 right-2 z-10" aria-label="Copy summary" onClick={() => copyText(s.response.summary)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                  <div className="text-xs text-gray-600 mb-1">Clinical Summary</div>
                  <div className="bg-blue-50 p-3 rounded text-sm border border-blue-200 w-full">
                    <div className="whitespace-pre-wrap break-words">{s.response.summary}</div>
                  </div>
                </div>
              )}

              {/* All Key Findings */}
              {s.response.keyFindings && s.response.keyFindings.length > 0 && (
                <div className="relative w-full">
                  <Button size="icon" variant="outline" className="absolute top-2 right-2 z-10" aria-label="Copy key findings" onClick={() => copyText(JSON.stringify(s.response.keyFindings, null, 2))}>
                    <Copy className="h-4 w-4" />
                  </Button>
                  <div className="text-xs text-gray-600 mb-1">Key Findings ({s.response.keyFindings.length} total)</div>
                  <div className="bg-yellow-50 p-3 rounded border border-yellow-200 w-full">
                    <div className="space-y-2">
                      {s.response.keyFindings.map((finding: string, i: number) => (
                        <div key={i} className="text-sm bg-white p-2 rounded border break-words">
                          • {finding}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* All Recommendations */}
              {s.response.recommendations && s.response.recommendations.length > 0 && (
                <div className="relative w-full">
                  <Button size="icon" variant="outline" className="absolute top-2 right-2 z-10" aria-label="Copy recommendations" onClick={() => copyText(JSON.stringify(s.response.recommendations, null, 2))}>
                    <Copy className="h-4 w-4" />
                  </Button>
                  <div className="text-xs text-gray-600 mb-1">Recommendations ({s.response.recommendations.length} total)</div>
                  <div className="bg-green-50 p-3 rounded border border-green-200 w-full">
                    <div className="space-y-2">
                      {s.response.recommendations.map((recommendation: string, i: number) => (
                        <div key={i} className="text-sm bg-white p-2 rounded border break-words">
                          • {recommendation}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Urgency */}
              {s.response.urgency && (
                <div className="relative w-full">
                  <div className="text-xs text-gray-600 mb-1">Urgency Level</div>
                  <div className={`p-2 rounded border text-sm font-medium w-full ${
                    s.response.urgency === 'URGENT' ? 'bg-red-100 border-red-300 text-red-800' :
                    s.response.urgency === 'SOON' ? 'bg-orange-100 border-orange-300 text-orange-800' :
                    'bg-green-100 border-green-300 text-green-800'
                  }`}>
                    {s.response.urgency}
                  </div>
                </div>
              )}

              {/* Raw JSON Response */}
              <div className="relative w-full">
                <Button size="icon" variant="outline" className="absolute top-2 right-2 z-10" aria-label="Copy full response" onClick={() => copyText(JSON.stringify(s.response, null, 2))}>
                  <Copy className="h-4 w-4" />
                </Button>
                <div className="text-xs text-gray-600 mb-1">Raw JSON Response</div>
                <pre className="bg-gray-50 p-2 rounded text-xs overflow-auto max-h-64 w-full break-words whitespace-pre-wrap">{JSON.stringify(s.response, null, 2)}</pre>
              </div>
            </div>
            <div className="text-xs text-gray-500 mt-2">{s.latencyMs ? `${s.latencyMs} ms` : ''}</div>
          </div>
        );
      }

      // Default stage display
      return (
        <div key={idx} className="border rounded p-3 mb-3 w-full">
          <div className="font-semibold">{s.name}</div>
          {s.error ? <div className="text-red-600 text-sm">{s.error}</div> : null}
          <div className="space-y-4 mt-2">
            <div className="relative w-full">
              <Button size="icon" variant="outline" className="absolute top-2 right-2 z-10" aria-label="Copy request" onClick={() => copyText(JSON.stringify(s.request ?? {}, null, 2))}>
                <Copy className="h-4 w-4" />
              </Button>
              <div className="text-xs text-gray-600 mb-1">Request</div>
              <pre className="bg-gray-50 p-2 rounded text-xs overflow-auto max-h-64 w-full break-words">{JSON.stringify(s.request, null, 2)}</pre>
            </div>
            <div className="relative w-full">
              <Button size="icon" variant="outline" className="absolute top-2 right-2 z-10" aria-label="Copy response" onClick={() => copyText(JSON.stringify(s.response ?? {}, null, 2))}>
                <Copy className="h-4 w-4" />
              </Button>
              <div className="text-xs text-gray-600 mb-1">Response</div>
              <pre className="bg-gray-50 p-2 rounded text-xs overflow-auto max-h-64 w-full break-words">{JSON.stringify(s.response, null, 2)}</pre>
            </div>
          </div>
          <div className="text-xs text-gray-500 mt-2">{s.latencyMs ? `${s.latencyMs} ms` : ''}</div>
        </div>
      );
    });
  }, [run]);

  return (
    <div className="p-6 space-y-6 w-full max-w-[95vw] overflow-x-auto">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">LLM Playground</h2>
        <Button onClick={onCreateProfile}>New Profile</Button>
      </div>

      {/* Production Profile Status */}
      {currentProductionProfile && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-green-800">Current Production Profile</h3>
              <p className="text-sm text-green-600">
                <strong>{currentProductionProfile.name}</strong> - {currentProductionProfile.model}
              </p>
              <p className="text-xs text-green-500">
                Last updated: {new Date(currentProductionProfile.updatedAt).toLocaleString()}
              </p>
            </div>
            <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
              ACTIVE
            </div>
          </div>
        </div>
      )}

      {/* Profiles row */}
      <div className="w-full overflow-x-auto">
        <div className="flex items-center gap-2 min-w-max py-2">
          {profiles.map((p) => (
            <div key={p.id} className="flex items-center gap-2">
              <Button 
                variant={selectedProfile?.id === p.id ? 'default' : 'outline'} 
                className="whitespace-nowrap" 
                onClick={() => setSelectedProfile(p)}
              >
                {p.name}
                {currentProductionProfile?.id === p.id && (
                  <span className="ml-2 bg-green-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                    PROD
                  </span>
                )}
              </Button>
              {currentProductionProfile?.id !== p.id && (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => onPromoteToProduction(p.id)}
                  disabled={promotingProfile === p.id}
                  className="text-xs"
                >
                  {promotingProfile === p.id ? 'Promoting...' : 'Promote to Production'}
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Runner card - full width */}
      <div className="border rounded p-4 space-y-4 relative">
        <div className="font-medium">Runner</div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pr-36">{/* right padding to avoid overlap with Run button */}
          {/* Left: input + params */}
          <div className="lg:col-span-5 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-600">Input Type</label>
                <select className="border rounded px-2 py-1 w-full" value={inputType} onChange={(e) => setInputType(e.target.value as any)}>
                  <option value="text">Text</option>
                  <option value="pdf">PDF URL</option>
                  <option value="json">JSON</option>
                  <option value="prescriptionDraft">Prescription Draft</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-600">Model</label>
                <input className="border rounded px-2 py-1 w-full" value={localProfile?.model || ''} onChange={(e) => updateLocalProfile({ model: e.target.value })} />
              </div>
            </div>
            {inputType === 'pdf' ? (
              <div className="space-y-2">
                <div>
                  <label className="block text-xs text-gray-600">PDF URL</label>
                  <input className="border rounded px-2 py-1 w-full" placeholder="https://...pdf" value={pdfUrl} onChange={(e) => setPdfUrl(e.target.value)} />
                </div>
                <PdfUploadPicker onPick={(url) => setPdfUrl(url)} />
                <div>
                  <label className="block text-xs text-gray-600">Additional Context</label>
                  <textarea className="border rounded px-2 py-1 w-full min-h-[120px] bg-gray-50" placeholder="Optional extra user input to combine with PDF text" value={rawInput} onChange={(e) => setRawInput(e.target.value)} />
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-xs text-gray-600">Input</label>
                <textarea className="border rounded px-2 py-1 w-full min-h-[160px]" value={rawInput} onChange={(e) => setRawInput(e.target.value)} />
              </div>
            )}

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-gray-600">Temperature</label>
                <input type="number" step="0.1" className="border rounded px-2 py-1 w-full" value={localProfile?.temperature ?? 0.2} onChange={(e) => updateLocalProfile({ temperature: Number(e.target.value) })} />
              </div>
              <div>
                <label className="block text-xs text-gray-600">top_p</label>
                <input type="number" step="0.05" className="border rounded px-2 py-1 w-full" value={localProfile?.topP ?? 1} onChange={(e) => updateLocalProfile({ topP: Number(e.target.value) })} />
              </div>
              <div>
                <label className="block text-xs text-gray-600">max_tokens</label>
                <input type="number" className="border rounded px-2 py-1 w-full" value={localProfile?.maxTokens ?? 2048} onChange={(e) => updateLocalProfile({ maxTokens: Number(e.target.value) })} />
              </div>
            </div>
          </div>

          {/* Right: prompts with grey background */}
          <div className="lg:col-span-7 space-y-3">
            {/* Save Status Indicator */}
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">Prompts Configuration</h3>
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
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </div>
            
            <div>
              <label className="block text-xs text-gray-600 mb-1">System Prompt</label>
              <textarea 
                className="border rounded px-2 py-1 w-full min-h-[160px] bg-gray-50 text-sm font-mono overflow-x-auto" 
                value={localProfile?.systemPrompt || ''} 
                onChange={(e) => updateLocalProfile({ systemPrompt: e.target.value })}
                placeholder="Enter system prompt for the LLM..."
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">User Prompt</label>
              <textarea 
                className="border rounded px-2 py-1 w-full min-h-[80px] bg-gray-50 text-sm font-mono overflow-x-auto" 
                value={localProfile?.userPrompt || ''} 
                onChange={(e) => updateLocalProfile({ userPrompt: e.target.value })}
                placeholder="Enter user prompt template..."
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Values Prompt</label>
                <textarea 
                  className="border rounded px-2 py-1 w-full min-h-[160px] bg-gray-50 text-sm font-mono overflow-x-auto" 
                  value={localProfile?.valuesPrompt || ''} 
                  onChange={(e) => updateLocalProfile({ valuesPrompt: e.target.value })}
                  placeholder="Enter prompt for extracting lab values..."
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Summary Prompt</label>
                <textarea 
                  className="border rounded px-2 py-1 w-full min-h-[80px] bg-gray-50 text-sm font-mono overflow-x-auto" 
                  value={localProfile?.summaryPrompt || ''} 
                  onChange={(e) => updateLocalProfile({ summaryPrompt: e.target.value })}
                  placeholder="Enter prompt for generating summaries..."
                />
              </div>
            </div>
            
            {/* Prompt Templates */}

          </div>
        </div>
        <div className="absolute right-4 bottom-4">
          <Button onClick={onRun} disabled={!selectedProfile || isRunning || hasUnsavedChanges}>
            {hasUnsavedChanges ? 'Save & Run' : 'Run'}
          </Button>
        </div>
      </div>

      {/* Stages output - full width, vertical list with internal scroll */}
      <div className="border rounded p-3 w-full max-w-[95vw] overflow-x-auto">
        <div className="font-medium mb-2">Stages Output <span className="text-xs text-gray-500">Variables available: <code>{'{{TEXT}}'}</code>, <code>{'{{PDF_URL}}'}</code>, <code>{'{{ADDITIONAL_CONTEXT}}'}</code></span></div>
        <div className="max-h-[60vh] overflow-auto space-y-3 w-full">
          {stageCards}
        </div>
      </div>

      {/* Final Output - full width */}
      <div className="border rounded p-3 w-full max-w-[95vw] overflow-x-auto">
        <div className="font-medium mb-2">Final Output</div>
        <div className="relative w-full">
          <Button size="icon" variant="outline" className="absolute top-2 right-2 z-10" aria-label="Copy final output" onClick={() => copyText(String(run?.finalOutput ?? ''))}>
            <Copy className="h-4 w-4" />
          </Button>
          
          {/* Structured display for lab analysis results */}
          {run?.finalOutput && typeof run.finalOutput === 'object' && (
            <div className="space-y-4">
              {/* Summary Section */}
              {run.finalOutput.summary && (
                <div className="bg-blue-50 p-3 rounded border">
                  <h4 className="font-medium text-blue-900 mb-2">Clinical Summary</h4>
                  <p className="text-sm text-blue-800">{run.finalOutput.summary}</p>
                </div>
              )}
              
              {/* Key Findings */}
              {run.finalOutput.keyFindings && run.finalOutput.keyFindings.length > 0 && (
                <div className="bg-yellow-50 p-3 rounded border">
                  <h4 className="font-medium text-yellow-900 mb-2">Key Findings</h4>
                  <ul className="text-sm text-yellow-800 space-y-1">
                    {run.finalOutput.keyFindings.map((finding: string, i: number) => (
                      <li key={i} className="flex items-start">
                        <span className="text-yellow-600 mr-2">•</span>
                        {finding}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {/* Recommendations */}
              {run.finalOutput.recommendations && run.finalOutput.recommendations.length > 0 && (
                <div className="bg-green-50 p-3 rounded border">
                  <h4 className="font-medium text-green-900 mb-2">Recommendations</h4>
                  <ul className="text-sm text-green-800 space-y-1">
                    {run.finalOutput.recommendations.map((rec: string, i: number) => (
                      <li key={i} className="flex items-start">
                        <span className="text-green-600 mr-2">•</span>
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {/* Urgency */}
              {run.finalOutput.urgency && (
                <div className="bg-purple-50 p-3 rounded border">
                  <h4 className="font-medium text-purple-900 mb-2">Urgency Level</h4>
                  <span className={`inline-block px-2 py-1 rounded text-sm font-medium ${
                    run.finalOutput.urgency === 'URGENT' ? 'bg-red-100 text-red-800' :
                    run.finalOutput.urgency === 'SOON' ? 'bg-orange-100 text-orange-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {run.finalOutput.urgency}
                  </span>
                </div>
              )}
              
              {/* Lab Values Summary with Toggle */}
              {((run.finalOutput.allValues && run.finalOutput.allValues.length > 0) || (run.finalOutput.criticalValues && run.finalOutput.criticalValues.length > 0)) && (
                <div className="bg-gray-50 p-3 rounded border">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-900">Lab Values Summary</h4>
                    <div className="flex items-center gap-2">
                      <Button
                        variant={showAllValues ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setShowAllValues(true)}
                        className={`text-xs ${showAllValues ? 'bg-blue-600 text-white' : 'text-blue-700 border-blue-300'}`}
                      >
                        <List className="h-3 w-3 mr-1" /> All
                      </Button>
                      <Button
                        variant={!showAllValues ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setShowAllValues(false)}
                        className={`text-xs ${!showAllValues ? 'bg-red-600 text-white' : 'text-red-700 border-red-300'}`}
                      >
                        <AlertTriangle className="h-3 w-3 mr-1" /> Critical
                      </Button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                    <div>
                      <span className="font-medium">Total Values:</span> {run.finalOutput.allValues?.length || 0}
                    </div>
                    <div>
                      <span className="font-medium">Critical Values:</span> {run.finalOutput.criticalValues?.length || 0}
                    </div>
                  </div>
                  
                  {/* Values Table with Toggle */}
                  <div className="mb-4">
                    <h5 className="font-medium text-gray-800 mb-2">
                      {showAllValues ? 'All Values' : 'Critical Values'}
                    </h5>
                    <div className={`rounded-lg border bg-white overflow-x-auto ${
                      showAllValues ? 'border-gray-200' : 'border-red-200'
                    }`}>
                      <table className="w-full text-sm">
                        <thead>
                          <tr className={`text-left text-gray-600 border-b ${
                            showAllValues ? 'bg-gray-50' : 'bg-red-50'
                          }`}>
                            <th className="p-2 font-medium">Parameter</th>
                            <th className="p-2 font-medium">Value</th>
                            <th className="p-2 font-medium">Normal Range</th>
                            <th className="p-2 font-medium">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(showAllValues ? run.finalOutput.allValues : run.finalOutput.criticalValues)?.map((val: any, i: number) => (
                            <tr key={i} className={`border-b ${
                              val.isAbnormal 
                                ? val.severity === 'CRITICAL' 
                                  ? 'bg-red-50' 
                                  : val.severity === 'HIGH' 
                                  ? 'bg-orange-50' 
                                  : 'bg-yellow-50'
                                : 'bg-white hover:bg-gray-50'
                            } ${showAllValues ? 'border-gray-100' : 'border-red-100'}`}>
                              <td className={`p-2 font-medium break-words ${
                                showAllValues ? 'text-gray-900' : 'text-red-800'
                              }`}>{val.parameter}</td>
                              <td className="p-2">
                                <span className={`font-semibold ${
                                  showAllValues ? '' : 'text-red-600'
                                }`}>{val.value}</span>
                                {val.unit && <span className="text-gray-600 ml-1">{val.unit}</span>}
                              </td>
                              <td className="p-2 text-gray-600 break-words">{val.normalRange}</td>
                              <td className="p-2">
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                  val.isAbnormal 
                                    ? val.severity === 'CRITICAL' 
                                      ? 'bg-red-100 text-red-800' 
                                      : val.severity === 'HIGH' 
                                      ? 'bg-orange-100 text-orange-800' 
                                      : 'bg-yellow-100 text-yellow-800'
                                    : 'bg-green-100 text-green-800'
                                }`}>
                                  {val.isAbnormal ? val.severity : 'NORMAL'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="mt-2"
                    onClick={() => copyText(JSON.stringify(run.finalOutput, null, 2))}
                  >
                    View Full JSON Data
                  </Button>
                </div>
              )}
            </div>
          )}
          
          {/* Fallback to raw display */}
          {(!run?.finalOutput || typeof run.finalOutput === 'string') && (
          <pre className="bg-gray-50 p-2 rounded text-xs overflow-auto min-h-[240px] max-h-[60vh] whitespace-pre-wrap w-full break-words overflow-x-auto">{run?.finalOutput}</pre>
          )}
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

function PdfUploadPicker({ onPick }: { onPick: (url: string) => void }) {
  const [busy, setBusy] = useState(false);
  const [existing, setExisting] = useState<Array<{ id: number; fileUrl: string; fileName: string; uploadedAt: string; appointmentId: number }>>([]);
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch('/api/admin/llm-playground/pdfs');
        if (!r.ok) return;
        const t = await r.text();
        if (!t) return;
        const j = JSON.parse(t);
        if (Array.isArray(j?.data)) setExisting(j.data);
      } catch {}
    })();
  }, []);
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
    <div className="space-y-2">
      <div className="text-xs text-gray-600">Upload PDF or pick existing</div>
      <div className="flex items-center gap-2">
        <input type="file" accept="application/pdf" onChange={onUploadFile} disabled={busy} />
        <Button variant="outline" disabled>{busy ? 'Uploading…' : 'Upload'}</Button>
      </div>
      <div>
        <label className="block text-xs text-gray-600">Choose from existing</label>
        <select className="border rounded px-2 py-1 w-full" onChange={(e) => e.target.value && onPick(e.target.value)}>
          <option value="">Select a previously uploaded PDF</option>
          {existing.map((r) => (
            <option key={r.id} value={r.fileUrl}>{r.fileName} (#{r.id})</option>
          ))}
        </select>
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
      const response = await fetch('/api/admin/dashboard/lab-bookings?pageSize=100');
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