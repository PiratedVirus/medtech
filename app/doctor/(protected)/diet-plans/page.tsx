'use client'
import { useEffect, useState } from 'react';
import axios from 'axios';
import { useDecryptedProfile } from '@/hooks/use-centralized-profile';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import MealTimingTemplateManager from '@/components/doctors/patients/MealTimingTemplateManager';

interface DietPlanRequest {
  id: number;
  patientId: number;
  dieticianId: number;
  complaint: string;
  status: string;
  patient?: { id: number; name: string };
}

interface MealTiming {
  id: string;
  name: string;
  order: number;
  icon: string;
  color: string;
}

interface MealTimingTemplate {
  id: number;
  name: string;
  mealTimings: MealTiming[];
  isDefault: boolean;
  createdAt: string;
}

export default function DietPlansPage() {
  const { profile } = useDecryptedProfile();
  const dieticianId = profile?.id;
  const { toast } = useToast();

  const [requests, setRequests] = useState<DietPlanRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<DietPlanRequest | null>(null);
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<MealTimingTemplate | null>(null);
  const [meals, setMeals] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<'requests' | 'templates'>('requests');
  const [templates, setTemplates] = useState<MealTimingTemplate[]>([]);

  useEffect(() => {
    if (!dieticianId) return;
    axios.get(`/api/doctor/diet-requests?dieticianId=${dieticianId}`).then(res => {
      setRequests(res.data.requests || []);
    });
  }, [dieticianId]);

  // Load meal timing templates
  const loadTemplates = async () => {
    if (!dieticianId) return;
    try {
      const res = await axios.get(`/api/doctor/diet-meal-timings?dieticianId=${dieticianId}`);
      if (res.data.success) {
        setTemplates(res.data.templates);
        // Auto-select default template if available
        const defaultTemplate = res.data.templates.find((t: MealTimingTemplate) => t.isDefault);
        if (defaultTemplate) {
          setSelectedTemplate(defaultTemplate);
        }
      }
    } catch (error) {
      console.error('Failed to load templates:', error);
    }
  };

  useEffect(() => {
    loadTemplates();
  }, [dieticianId]);

  useEffect(() => {
    if (selectedTemplate) {
      // Initialize meals based on selected template
      const initialMeals: Record<string, string> = {};
      selectedTemplate.mealTimings.forEach(timing => {
        initialMeals[timing.id] = '';
      });
      setMeals(initialMeals);
    }
  }, [selectedTemplate]);

  function handleMealChange(key: string, value: string) {
    setMeals(prev => ({ ...prev, [key]: value }));
  }

  function handleTemplateSelect(template: MealTimingTemplate) {
    setSelectedTemplate(template);
    // Reset meals when template changes
    const initialMeals: Record<string, string> = {};
    template.mealTimings.forEach(timing => {
      initialMeals[timing.id] = '';
    });
    setMeals(initialMeals);
  }

  async function handleCreatePlan() {
    if (!selectedRequest || !dieticianId || !selectedTemplate) {
      toast({ variant: 'destructive', title: 'Please select a request and template' });
      return;
    }

    try {
      const res = await axios.post('/api/doctor/diet-plans', {
        patientId: selectedRequest.patientId,
        dieticianId,
        title,
        notes,
        startDate,
        endDate,
        meals,
        customMealTimings: selectedTemplate.mealTimings,
        requestId: selectedRequest.id,
      });
      
      if (res.data.success) {
        toast({ variant: 'success', title: 'Diet plan created' });
        setSelectedRequest(null);
        setTitle(''); 
        setNotes(''); 
        setStartDate(''); 
        setEndDate('');
        setMeals({});
        setSelectedTemplate(null);
        // Refresh requests
        const next = await axios.get(`/api/doctor/diet-requests?dieticianId=${dieticianId}`);
        setRequests(next.data.requests || []);
      } else {
        toast({ variant: 'destructive', title: 'Failed to create plan', description: res.data.error });
      }
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Failed to create plan', description: e?.message });
    }
  }

  return (
    <div className="min-h-screen bg-muted px-6 py-6">
      <h1 className="text-2xl font-bold mb-4">Diet Plans</h1>
      
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'requests' | 'templates')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="requests">Diet Requests</TabsTrigger>
          <TabsTrigger value="templates">Meal Timing Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="requests" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="p-4">
              <h2 className="font-semibold mb-2">Incoming Requests</h2>
              <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                {requests.map((r) => (
                  <button 
                    key={r.id} 
                    onClick={() => setSelectedRequest(r)} 
                    className={`w-full text-left p-3 rounded border ${
                      selectedRequest?.id===r.id?'border-primary bg-primary/5':'border-gray-200'
                    }`}
                  >
                    <div className="text-sm font-medium">{r.patient?.name || `Patient #${r.patientId}`}</div>
                    <div className="text-xs text-gray-600 line-clamp-2">{r.complaint}</div>
                  </button>
                ))}
                {requests.length===0 && <div className="text-sm text-gray-500">No requests</div>}
              </div>
            </Card>

            <Card className="p-4 md:col-span-2">
              <h2 className="font-semibold mb-4">Create Diet Plan</h2>
              {selectedRequest ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-gray-600">Title</label>
                      <Input value={title} onChange={e=>setTitle(e.target.value)} placeholder="e.g., 1200 kcal low-carb" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-gray-600">Start Date</label>
                        <Input type="date" value={startDate} onChange={e=>setStartDate(e.target.value)} />
                      </div>
                      <div>
                        <label className="text-xs text-gray-600">End Date</label>
                        <Input type="date" value={endDate} onChange={e=>setEndDate(e.target.value)} />
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-xs text-gray-600">Notes</label>
                    <Textarea value={notes} onChange={e=>setNotes(e.target.value)} placeholder="General guidance, hydration, activity..." />
                  </div>

                  <div>
                    <label className="text-xs text-gray-600 mb-2 block">Meal Timing Template</label>
                    {selectedTemplate ? (
                      <div className="p-3 border rounded-lg bg-gray-50">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-sm">{selectedTemplate.name}</span>
                          <select
                            value={selectedTemplate.id}
                            onChange={(e) => {
                              const templateId = Number(e.target.value);
                              const newTemplate = templates.find(t => t.id === templateId);
                              if (newTemplate) {
                                handleTemplateSelect(newTemplate);
                              }
                            }}
                            className="text-sm border rounded px-2 py-1"
                          >
                            {templates.map((template) => (
                              <option key={template.id} value={template.id}>
                                {template.name} {template.isDefault ? '(Default)' : ''}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {selectedTemplate.mealTimings.map((timing) => (
                            <span key={timing.id} className="inline-flex items-center gap-1 px-2 py-1 bg-white border rounded text-xs">
                              <span>{timing.icon}</span>
                              <span>{timing.name}</span>
                            </span>
                          ))}
                        </div>
                        <div className="mt-3 pt-3 border-t">
                          <Button 
                            variant="outline" 
                            onClick={() => setActiveTab('templates')}
                            size="sm"
                            className="w-full"
                          >
                            Manage Templates
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <select
                          value=""
                          onChange={(e) => {
                            const templateId = Number(e.target.value);
                            if (templateId) {
                              const template = templates.find(t => t.id === templateId);
                              if (template) {
                                handleTemplateSelect(template);
                              }
                            }
                          }}
                          className="w-full border rounded px-3 py-2"
                        >
                          <option value="">Select a meal timing template</option>
                          {templates.length > 0 ? (
                            templates.map((template) => (
                              <option key={template.id} value={template.id}>
                                {template.name} {template.isDefault ? '(Default)' : ''}
                              </option>
                            ))
                          ) : (
                            <option value="" disabled>No templates available</option>
                          )}
                        </select>
                        {templates.length === 0 && (
                          <div className="text-xs text-gray-500 text-center">
                            No meal timing templates found. Create your first template to get started.
                          </div>
                        )}
                        <Button 
                          variant="outline" 
                          onClick={() => setActiveTab('templates')}
                          className="w-full"
                          size="sm"
                        >
                          Create New Template
                        </Button>
                      </div>
                    )}
                  </div>

                  {selectedTemplate && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedTemplate.mealTimings.map((timing) => (
                        <div key={timing.id} className="space-y-1">
                          <label className="text-xs text-gray-600 flex items-center gap-2">
                            <span>{timing.icon}</span>
                            <span>{timing.name}</span>
                          </label>
                          <Textarea 
                            value={meals[timing.id] || ''} 
                            onChange={e=>handleMealChange(timing.id, e.target.value)} 
                            placeholder="Comma-separated items or a paragraph" 
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex justify-end">
                    <Button 
                      onClick={handleCreatePlan} 
                      disabled={!selectedTemplate || Object.keys(meals).length === 0}
                    >
                      Save Plan
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-gray-500">Select a request to start creating a plan</div>
              )}
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="templates" className="mt-6">
          {dieticianId && (
            <MealTimingTemplateManager
              dieticianId={Number(dieticianId)}
              onTemplateSelect={handleTemplateSelect}
              selectedTemplate={selectedTemplate}
              onTemplateUpdate={loadTemplates}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}


