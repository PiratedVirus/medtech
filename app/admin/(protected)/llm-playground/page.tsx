'use client';
import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Copy } from 'lucide-react';

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

  async function onCreateProfile() {
    const name = prompt('Profile name?')?.trim();
    if (!name) return;
    const res = await fetch('/api/admin/llm-playground/profiles', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, model: 'llama-3.3-70b-versatile' }) });
    const json = await res.json();
    if (json?.data) { setProfiles([json.data, ...profiles]); setSelectedProfile(json.data); }
  }

  async function onUpdateProfile(partial: Partial<Profile>) {
    if (!selectedProfile) return;
    const res = await fetch(`/api/admin/llm-playground/profiles/${selectedProfile.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(partial) });
    const json = await res.json();
    if (json?.data) {
      const upd = profiles.map(p => p.id === json.data.id ? json.data : p);
      setProfiles(upd); setSelectedProfile(json.data);
    }
  }

  async function onRun() {
    if (!selectedProfile) return;
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
      // Special handling for extract-values stage
      if (s.name === 'extract-values' && s.response) {
        return (
      <div key={idx} className="border rounded p-3 mb-3">
        <div className="font-semibold">{s.name}</div>
        {s.error ? <div className="text-red-600 text-sm">{s.error}</div> : null}
        <div className="grid grid-cols-2 gap-3 mt-2">
          <div className="relative">
            <Button size="icon" variant="outline" className="absolute top-2 right-2 z-10" aria-label="Copy request" onClick={() => copyText(JSON.stringify(s.request ?? {}, null, 2))}>
              <Copy className="h-4 w-4" />
            </Button>
                <div className="text-xs text-gray-600 mb-1">Request</div>
            <pre className="bg-gray-50 p-2 rounded text-xs overflow-auto max-h-64">{JSON.stringify(s.request, null, 2)}</pre>
          </div>
          <div className="relative">
            <Button size="icon" variant="outline" className="absolute top-2 right-2 z-10" aria-label="Copy response" onClick={() => copyText(JSON.stringify(s.response ?? {}, null, 2))}>
              <Copy className="h-4 w-4" />
            </Button>
                <div className="text-xs text-gray-600 mb-1">Response</div>
                <div className="bg-gray-50 p-2 rounded text-xs">
                  <div className="mb-2">
                    <strong>Summary:</strong> {s.response.summary || `${s.response.allValuesCount} total values, ${s.response.criticalValuesCount} critical`}
                  </div>
                  {s.response.allValues && s.response.allValues.length > 0 && (
                    <div className="mb-2">
                      <strong>Sample Values:</strong>
                      <div className="mt-1 space-y-1">
                        {s.response.allValues.slice(0, 3).map((val: any, i: number) => (
                          <div key={i} className="text-xs bg-white p-1 rounded border">
                            {val.parameter}: {val.value} {val.unit} ({val.isAbnormal ? 'ABNORMAL' : 'Normal'})
                          </div>
                        ))}
                        {s.response.allValues.length > 3 && (
                          <div className="text-gray-500 text-xs">... and {s.response.allValues.length - 3} more</div>
                        )}
                      </div>
                    </div>
                  )}
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="w-full mt-2"
                    onClick={() => copyText(JSON.stringify(s.response, null, 2))}
                  >
                    View Full JSON
                  </Button>
                </div>
          </div>
        </div>
        <div className="text-xs text-gray-500 mt-2">{s.latencyMs ? `${s.latencyMs} ms` : ''}</div>
      </div>
        );
      }

      // Special handling for generate-summary stage
      if (s.name === 'generate-summary' && s.response) {
        return (
          <div key={idx} className="border rounded p-3 mb-3">
            <div className="font-semibold">{s.name}</div>
            {s.error ? <div className="text-red-600 text-sm">{s.error}</div> : null}
            <div className="grid grid-cols-2 gap-3 mt-2">
              <div className="relative">
                <Button size="icon" variant="outline" className="absolute top-2 right-2 z-10" aria-label="Copy request" onClick={() => copyText(JSON.stringify(s.request ?? {}, null, 2))}>
                  <Copy className="h-4 w-4" />
                </Button>
                <div className="text-xs text-gray-600 mb-1">Request</div>
                <pre className="bg-gray-50 p-2 rounded text-xs overflow-auto max-h-64">{JSON.stringify(s.request, null, 2)}</pre>
              </div>
              <div className="relative">
                <Button size="icon" variant="outline" className="absolute top-2 right-2 z-10" aria-label="Copy response" onClick={() => copyText(JSON.stringify(s.response ?? {}, null, 2))}>
                  <Copy className="h-4 w-4" />
                </Button>
                <div className="text-xs text-gray-600 mb-1">Response</div>
                <div className="bg-gray-50 p-2 rounded text-xs">
                  <div className="mb-2">
                    <strong>Summary:</strong> {s.response.summaryPreview || s.response.summary?.slice(0, 100)}
                  </div>
                  {s.response.keyFindings && s.response.keyFindings.length > 0 && (
                    <div className="mb-2">
                      <strong>Key Findings:</strong>
                      <div className="mt-1 space-y-1">
                        {s.response.keyFindings.slice(0, 3).map((finding: string, i: number) => (
                          <div key={i} className="text-xs bg-white p-1 rounded border">
                            • {finding}
                          </div>
                        ))}
                        {s.response.keyFindings.length > 3 && (
                          <div className="text-gray-500 text-xs">... and {s.response.keyFindings.length - 3} more</div>
                        )}
                      </div>
                    </div>
                  )}
                  <div className="mb-2">
                    <strong>Urgency:</strong> <span className="font-medium">{s.response.urgency || 'N/A'}</span>
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="w-full mt-2"
                    onClick={() => copyText(JSON.stringify(s.response, null, 2))}
                  >
                    View Full JSON
                  </Button>
                </div>
              </div>
            </div>
            <div className="text-xs text-gray-500 mt-2">{s.latencyMs ? `${s.latencyMs} ms` : ''}</div>
          </div>
        );
      }

      // Default stage display
      return (
        <div key={idx} className="border rounded p-3 mb-3">
          <div className="font-semibold">{s.name}</div>
          {s.error ? <div className="text-red-600 text-sm">{s.error}</div> : null}
          <div className="grid grid-cols-2 gap-3 mt-2">
            <div className="relative">
              <Button size="icon" variant="outline" className="absolute top-2 right-2 z-10" aria-label="Copy request" onClick={() => copyText(JSON.stringify(s.request ?? {}, null, 2))}>
                <Copy className="h-4 w-4" />
              </Button>
              <div className="text-xs text-gray-600 mb-1">Request</div>
              <pre className="bg-gray-50 p-2 rounded text-xs overflow-auto max-h-64">{JSON.stringify(s.request, null, 2)}</pre>
            </div>
            <div className="relative">
              <Button size="icon" variant="outline" className="absolute top-2 right-2 z-10" aria-label="Copy response" onClick={() => copyText(JSON.stringify(s.response ?? {}, null, 2))}>
                <Copy className="h-4 w-4" />
              </Button>
              <div className="text-xs text-gray-600 mb-1">Response</div>
              <pre className="bg-gray-50 p-2 rounded text-xs overflow-auto max-h-64">{JSON.stringify(s.response, null, 2)}</pre>
            </div>
          </div>
          <div className="text-xs text-gray-500 mt-2">{s.latencyMs ? `${s.latencyMs} ms` : ''}</div>
        </div>
      );
    });
  }, [run]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">LLM Playground</h2>
        <Button onClick={onCreateProfile}>New Profile</Button>
      </div>

      {/* Profiles row */}
      <div className="w-full overflow-x-auto">
        <div className="flex items-center gap-2 min-w-max py-2">
          {profiles.map((p) => (
            <Button key={p.id} variant={selectedProfile?.id === p.id ? 'default' : 'outline'} className="whitespace-nowrap" onClick={() => setSelectedProfile(p)}>
              {p.name}
            </Button>
          ))}
        </div>
      </div>

      {/* Runner card - full width */}
      <div className="border rounded p-4 space-y-4 relative">
        <div className="font-medium">Runner</div>
        <div className="grid grid-cols-12 gap-6 pr-36">{/* right padding to avoid overlap with Run button */}
          {/* Left: input + params */}
          <div className="col-span-5 space-y-4">
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
                <input className="border rounded px-2 py-1 w-full" value={selectedProfile?.model || ''} onChange={(e) => onUpdateProfile({ model: e.target.value })} />
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
                <input type="number" step="0.1" className="border rounded px-2 py-1 w-full" value={selectedProfile?.temperature ?? 0.2} onChange={(e) => onUpdateProfile({ temperature: Number(e.target.value) })} />
              </div>
              <div>
                <label className="block text-xs text-gray-600">top_p</label>
                <input type="number" step="0.05" className="border rounded px-2 py-1 w-full" value={selectedProfile?.topP ?? 1} onChange={(e) => onUpdateProfile({ topP: Number(e.target.value) })} />
              </div>
              <div>
                <label className="block text-xs text-gray-600">max_tokens</label>
                <input type="number" className="border rounded px-2 py-1 w-full" value={selectedProfile?.maxTokens ?? 2048} onChange={(e) => onUpdateProfile({ maxTokens: Number(e.target.value) })} />
              </div>
            </div>
          </div>

          {/* Right: prompts with grey background */}
          <div className="col-span-7 space-y-3">
            <div>
              <label className="block text-xs text-gray-600">System Prompt</label>
              <textarea className="border rounded px-2 py-1 w-full min-h-[160px] bg-gray-50" value={selectedProfile?.systemPrompt || ''} onChange={(e) => onUpdateProfile({ systemPrompt: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs text-gray-600">User Prompt</label>
              <textarea className="border rounded px-2 py-1 w-full min-h-[80px] bg-gray-50" value={selectedProfile?.userPrompt || ''} onChange={(e) => onUpdateProfile({ userPrompt: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-600">Values Prompt</label>
                <textarea className="border rounded px-2 py-1 w-full min-h-[160px] bg-gray-50" value={selectedProfile?.valuesPrompt || ''} onChange={(e) => onUpdateProfile({ valuesPrompt: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs text-gray-600">Summary Prompt</label>
                <textarea className="border rounded px-2 py-1 w-full min-h-[80px] bg-gray-50" value={selectedProfile?.summaryPrompt || ''} onChange={(e) => onUpdateProfile({ summaryPrompt: e.target.value })} />
              </div>
            </div>
          </div>
        </div>
        <div className="absolute right-4 bottom-4">
          <Button onClick={onRun} disabled={!selectedProfile || isRunning}>Run</Button>
        </div>
      </div>

      {/* Stages output - full width, vertical list with internal scroll */}
      <div className="border rounded p-3">
        <div className="font-medium mb-2">Stages Output <span className="text-xs text-gray-500">Variables available: <code>{'{{TEXT}}'}</code>, <code>{'{{PDF_URL}}'}</code>, <code>{'{{ADDITIONAL_CONTEXT}}'}</code></span></div>
        <div className="max-h-[60vh] overflow-auto space-y-3">
          {stageCards}
        </div>
      </div>

      {/* Final Output - full width */}
      <div className="border rounded p-3">
        <div className="font-medium mb-2">Final Output</div>
        <div className="relative">
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
              
              {/* Lab Values Summary */}
              {run.finalOutput.allValues && run.finalOutput.allValues.length > 0 && (
                <div className="bg-gray-50 p-3 rounded border">
                  <h4 className="font-medium text-gray-900 mb-2">Lab Values Summary</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Total Values:</span> {run.finalOutput.allValues.length}
                    </div>
                    <div>
                      <span className="font-medium">Critical Values:</span> {run.finalOutput.criticalValues?.length || 0}
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
          <pre className="bg-gray-50 p-2 rounded text-xs overflow-auto min-h-[240px] max-h-[60vh] whitespace-pre-wrap">{run?.finalOutput}</pre>
          )}
        </div>
      </div>

      {/* Lab Analysis Management - full width */}
      <div className="border rounded p-3 mt-4">
        <div className="font-medium mb-2">Lab Analysis Management</div>
        <LabAnalysisManager />
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