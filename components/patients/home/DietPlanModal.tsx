"use client";

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Copy, Printer, Info, Coffee, Sun, UtensilsCrossed, Sandwich, Moon } from "lucide-react";

interface DietPlanModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientId: string | number | undefined;
  clinicId?: string | number | null;
  dietPlan: any | null;
}

export default function DietPlanModal({ open, onOpenChange, patientId, clinicId, dietPlan }: DietPlanModalProps) {
  const { toast } = useToast();
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [plans, setPlans] = useState<any[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<any | null>(dietPlan || null);
  const [dieticians, setDieticians] = useState<any[]>([]);
  const [selectedDieticianId, setSelectedDieticianId] = useState<string>("");
  const [dieticianQuery, setDieticianQuery] = useState("");
  const [activeTab, setActiveTab] = useState<'overview' | 'meals' | 'requests'>("overview");
  const [expandAll, setExpandAll] = useState(true);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [dietComplaint, setDietComplaint] = useState("");

  useEffect(() => {
    if (!open) {
      setShowRequestForm(false);
      setActiveTab("overview");
    }
  }, [open]);

  // Load all plans for left column list
  useEffect(() => {
    async function loadPlans() {
      try {
        if (!open || !patientId) return;
        const res = await axios.get(`/api/dieticians/diet/history?patientId=${patientId}`);
        const list = res.data?.plans || [];
        setPlans(list);
        if (list.length > 0) setSelectedPlan(list[0]);
        else setSelectedPlan(dietPlan || null);
      } catch {
        setPlans(dietPlan ? [dietPlan] : []);
        setSelectedPlan(dietPlan || null);
      }
    }
    loadPlans();
  }, [open, patientId, dietPlan]);

  useEffect(() => {
    async function loadDieticians() {
      try {
        if (!open || !clinicId) return;
        const res = await axios.get(`/api/dieticians/get-dieticians?clinicId=${clinicId}`);
        setDieticians(res.data?.dieticians || []);
      } catch {}
    }
    loadDieticians();
  }, [open, clinicId]);

  useEffect(() => {
    async function loadRequests() {
      try {
        if (!open || !patientId) return;
        const res = await axios.get(`/api/dieticians/requests?patientId=${patientId}`);
        const list = res.data?.requests || [];
        setPendingRequests(list.filter((r: any) => r.status === 'PENDING'));
      } catch {}
    }
    loadRequests();
  }, [open, patientId]);

  const filteredDieticians = useMemo(() => (dieticians || []).filter((d: any) => d?.name?.toLowerCase().includes(dieticianQuery.toLowerCase())), [dieticians, dieticianQuery]);

  function formatDateRange(plan: any): string | null {
    const s = plan?.startDate ? new Date(plan.startDate) : null;
    const e = plan?.endDate ? new Date(plan.endDate) : null;
    if (!s && !e) return null;
    const fmt = (d: Date) => d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    return `${s ? fmt(s) : '—'} • ${e ? fmt(e) : '—'}`;
  }

  function deriveStatus(plan: any): { text: string; className: string } | null {
    const now = new Date();
    const s = plan?.startDate ? new Date(plan.startDate) : null;
    const e = plan?.endDate ? new Date(plan.endDate) : null;
    if (!s && !e) return null;
    if (s && now < s) return { text: 'Upcoming', className: 'bg-blue-100 text-blue-800' };
    if (e && now > e) return { text: 'Expired', className: 'bg-gray-200 text-gray-700' };
    return { text: 'Active', className: 'bg-emerald-100 text-emerald-800' };
  }

  function parseMealItems(raw: any): string[] {
    if (typeof raw !== 'string') return [];
    return raw.split(/\n|,/).map((s) => s.trim()).filter(Boolean);
  }

  function mealIcon(key: string) {
    const k = key.toLowerCase();
    if (k.includes('breakfast')) return <Coffee className="h-4 w-4 text-amber-700" />;
    if (k.includes('mid') || k.includes('morning')) return <Sun className="h-4 w-4 text-yellow-600" />;
    if (k.includes('lunch')) return <UtensilsCrossed className="h-4 w-4 text-rose-700" />;
    if (k.includes('snack') || k.includes('evening')) return <Sandwich className="h-4 w-4 text-orange-600" />;
    if (k.includes('dinner')) return <UtensilsCrossed className="h-4 w-4 text-indigo-700" />;
    if (k.includes('bed')) return <Moon className="h-4 w-4 text-slate-600" />;
    return <UtensilsCrossed className="h-4 w-4 text-gray-600" />;
  }

  // Helper function to get meal display info
  function getMealDisplayInfo(plan: any, mealKey: string) {
    if (plan?.customMealTimings) {
      const customTiming = plan.customMealTimings.find((t: any) => t.id === mealKey);
      if (customTiming) {
        return {
          name: customTiming.name,
          icon: customTiming.icon,
          order: customTiming.order
        };
      }
    }
    
    // Fallback to default meal names and icons
    const defaultNames: Record<string, string> = {
      breakfast: 'Breakfast',
      midMorning: 'Mid-morning Snack',
      lunch: 'Lunch',
      eveningSnack: 'Evening Snack',
      dinner: 'Dinner',
      bedtime: 'Bedtime'
    };
    
    const defaultIcons: Record<string, string> = {
      breakfast: '🌅',
      midMorning: '☕',
      lunch: '🍽️',
      eveningSnack: '🍎',
      dinner: '🌙',
      bedtime: '🛏️'
    };
    
    return {
      name: defaultNames[mealKey] || mealKey,
      icon: defaultIcons[mealKey] || '🍽️',
      order: 0
    };
  }

  // Sort meals by custom order if available
  function getSortedMeals(plan: any) {
    if (!plan?.meals) return [];
    
    const mealEntries = Object.entries(plan.meals);
    
    if (plan?.customMealTimings) {
      // Sort by custom order
      return mealEntries.sort(([a], [b]) => {
        const aInfo = getMealDisplayInfo(plan, a);
        const bInfo = getMealDisplayInfo(plan, b);
        return aInfo.order - bInfo.order;
      });
    }
    
    // Default order
    return mealEntries;
  }

  async function copyMeal(key: string, value: any) {
    const text = typeof value === 'string' ? value : '';
    try { await navigator.clipboard.writeText(text); toast({ variant: 'success', title: `Copied ${key}` }); } catch {}
  }

  async function copyAllMeals() {
    if (!dietPlan?.meals) return;
    const joined = Object.entries(dietPlan.meals).map(([k, v]: any) => `${k}: ${typeof v === 'string' ? v : ''}`).join('\n');
    try { await navigator.clipboard.writeText(joined); toast({ variant: 'success', title: 'Copied all meals' }); } catch {}
  }

  async function submitRequest() {
    try {
      if (!patientId) return;
      if (!selectedDieticianId) { toast({ variant: 'destructive', title: 'Please select a dietician' }); return; }
      if (!dietComplaint.trim()) { toast({ variant: 'destructive', title: 'Please add your complaint' }); return; }
      const res = await axios.post('/api/dieticians/requests', {
        patientId,
        dieticianId: Number(selectedDieticianId),
        complaint: dietComplaint.trim(),
      });
      if (res.data.success) {
        toast({ variant: 'success', title: 'Diet plan request sent' });
        setDietComplaint("");
        setSelectedDieticianId("");
        setShowRequestForm(false);
      } else {
        toast({ variant: 'destructive', title: 'Failed to send request', description: res.data.error });
      }
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Failed to send request', description: e?.message });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl sm:max-w-5xl h-[85vh] p-0 overflow-hidden">
        {/* Sticky Header */}
        <div className="sticky top-0 z-10 border-b bg-white/90 backdrop-blur px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <DialogTitle>Diet Plan</DialogTitle>
            {pendingRequests.length > 0 && (
              <div className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                <Info className="h-3 w-3" /> Request submitted • Pending
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            {/* {selectedPlan && (
              <Button variant="ghost" size="sm" onClick={copyAllMeals} className="h-8 px-2">
                <Copy className="h-4 w-4 mr-1" /> Copy all
              </Button>
            )} */}
            <Button variant="outline" size="sm" onClick={() => window.print()} className="h-8 px-2">
              <Printer className="h-4 w-4 mr-1" /> Print
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowRequestForm((v) => !v)} className="h-8 px-3">
              {showRequestForm ? 'Close Request Form' : 'Request New Plan'}
            </Button>
          </div>
        </div>
        {/* Scrollable Body */}
        <div className="px-6 py-4 h-[calc(85vh-52px)] overflow-auto">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
            <div className="flex items-center justify-between mb-3">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="meals">Meals</TabsTrigger>
                <TabsTrigger value="requests">Requests</TabsTrigger>
              </TabsList>
              {activeTab === 'meals' && dietPlan && (
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setExpandAll((v) => !v)} className="h-8 px-2">
                    {expandAll ? 'Collapse all' : 'Expand all'}
                  </Button>
                </div>
              )}
            </div>

            <TabsContent value="overview">
                {selectedPlan ? (
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                  {/* Left column: Stacked plan cards */}
                  <div className="md:col-span-4 space-y-3">
                    {plans.map((p) => (
                      <button key={p.id} onClick={() => setSelectedPlan(p)} className={`w-full text-left rounded-lg border p-3 ${selectedPlan?.id===p.id? 'border-primary bg-primary/5' : 'border-gray-200 bg-gray-50 hover:bg-gray-100'}`}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="text-sm font-semibold text-gray-800 line-clamp-1">{p.title || 'Diet plan'}</div>
                          {(() => { const s = deriveStatus(p); return s ? (
                            <span className={`ml-2 inline-flex px-2 py-0.5 rounded-full text-xs font-semibold border ${s.className}`}>{s.text}</span>
                          ) : null; })()}
                        </div>
                        <div className="text-xs text-gray-600">{formatDateRange(p) || '—'}</div>
                        <div className="text-xs text-gray-500">Dietician: {(() => { const d = (dieticians || []).find((x: any) => String(x.id) === String(p?.dieticianId)); return d?.name || '—'; })()}</div>
                      </button>
                    ))}
                    {plans.length===0 && (
                      <div className="text-sm text-gray-500">No plans to show</div>
                    )}
                  </div>
                  {/* Right column: Meals for selected plan */}
                  <div className="md:col-span-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {getSortedMeals(selectedPlan).map(([k, v]: any) => {
                        const mealInfo = getMealDisplayInfo(selectedPlan, k);
                        return (
                          <div key={k} className="rounded-lg border p-3 bg-white">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                                <span>{mealInfo.icon}</span>
                                <span>{mealInfo.name}</span>
                              </div>
                              <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => copyMeal(k, v)}>
                                <Copy className="h-4 w-4" />
                              </Button>
                            </div>
                            <ul className="list-disc pl-5 space-y-1 text-sm text-gray-700">
                              {(expandAll ? parseMealItems(v) : parseMealItems(v).slice(0, 3)).map((item, idx) => (
                                <li key={idx}>{item}</li>
                              ))}
                            </ul>
                            {parseMealItems(v).length > 3 && (
                              <button className="mt-2 text-xs text-primary" onClick={() => setExpandAll((val) => !val)}>
                                {expandAll ? 'Show less' : `Show all (${parseMealItems(v).length})`}
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-[48vh]">
                  <div className="text-center text-gray-600">
                    <div className="text-base font-semibold">No diet plan available yet</div>
                    <div className="text-sm">Click "Request New Plan" to get started</div>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="meals">
            {selectedPlan ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {getSortedMeals(selectedPlan).map(([k, v]: any) => {
                  const mealInfo = getMealDisplayInfo(selectedPlan, k);
                  return (
                    <div key={k} className="rounded-lg border p-3 bg-white">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                          <span>{mealInfo.icon}</span>
                          <span>{mealInfo.name}</span>
                        </div>
                        <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => copyMeal(k, v)}>
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                      <ul className="list-disc pl-5 space-y-1 text-sm text-gray-700">
                        {(expandAll ? parseMealItems(v) : parseMealItems(v).slice(0, 5)).map((item, idx) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                      {parseMealItems(v).length > 5 && (
                        <button className="mt-2 text-xs text-primary" onClick={() => setExpandAll((val) => !val)}>
                          {expandAll ? 'Show less' : `Show all (${parseMealItems(v).length})`}
                        </button>
                      )}
                    </div>
                  );
                })}
                </div>
              ) : (
                <div className="flex items-center justify-center h-[48vh]">
                  <div className="text-center text-gray-600">
                    <div className="text-base font-semibold">No diet plan available yet</div>
                    <div className="text-sm">Click "Request New Plan" to get started</div>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="requests">
              <div className="space-y-2">
                {pendingRequests.length === 0 ? (
                  <div className="text-sm text-gray-600">No pending requests.</div>
                ) : (
                  pendingRequests.map((r: any) => (
                    <div key={r.id} className="rounded-md border p-3 bg-gray-50 text-sm text-gray-700 flex items-center justify-between">
                      <div>
                        <div className="font-medium">Pending</div>
                        <div className="text-xs text-gray-500">{new Date(r.createdAt).toLocaleString()}</div>
                      </div>
                      <div className="text-xs text-gray-500 line-clamp-1 max-w-[60%]">{r.complaint}</div>
                    </div>
                  ))
                )}
              </div>
            </TabsContent>
          </Tabs>

          {showRequestForm && (
            <div className="border-t pt-4">
              <div className="rounded-lg border bg-gray-50 p-4 space-y-3">
                <div className="text-sm font-semibold">Request a diet plan</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-600">Select Dietician</label>
                    <Input placeholder="Search dietician..." value={dieticianQuery} onChange={(e) => setDieticianQuery(e.target.value)} className="mb-2" />
                    <Select value={selectedDieticianId} onValueChange={setSelectedDieticianId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a dietician" />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredDieticians.map((d: any) => (
                          <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-600">Your complaint</label>
                    <Textarea
                      value={dietComplaint}
                      onChange={(e) => setDietComplaint(e.target.value)}
                      placeholder="e.g., weight goals, conditions, preferences"
                      className="bg-white"
                    />
                  </div>
                </div>
                <div className="flex justify-end sticky bottom-0 pt-2 bg-gray-50">
                  <Button onClick={submitRequest} disabled={!selectedDieticianId || !dietComplaint.trim()}>
                    Submit Request
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}


