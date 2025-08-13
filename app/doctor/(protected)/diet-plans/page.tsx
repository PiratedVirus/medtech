'use client'
import { useEffect, useState } from 'react';
import axios from 'axios';
import { useDecryptedProfile } from '@/hooks/use-profile';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

interface DietPlanRequest {
  id: number;
  patientId: number;
  dieticianId: number;
  complaint: string;
  status: string;
  patient?: { id: number; name: string };
}

type MealTimeKey = 'breakfast' | 'midMorning' | 'lunch' | 'eveningSnack' | 'dinner' | 'bedtime';

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
  const [meals, setMeals] = useState<Record<MealTimeKey, string>>({
    breakfast: '',
    midMorning: '',
    lunch: '',
    eveningSnack: '',
    dinner: '',
    bedtime: '',
  });

  useEffect(() => {
    if (!dieticianId) return;
    axios.get(`/api/doctor/diet-requests?dieticianId=${dieticianId}`).then(res => {
      setRequests(res.data.requests || []);
    });
  }, [dieticianId]);

  function handleMealChange(key: MealTimeKey, value: string) {
    setMeals(prev => ({ ...prev, [key]: value }));
  }

  async function handleCreatePlan() {
    if (!selectedRequest || !dieticianId) return;
    try {
      const res = await axios.post('/api/doctor/diet-plans', {
        patientId: selectedRequest.patientId,
        dieticianId,
        title,
        notes,
        startDate,
        endDate,
        meals,
        requestId: selectedRequest.id,
      });
      if (res.data.success) {
        toast({ variant: 'success', title: 'Diet plan created' });
        setSelectedRequest(null);
        setTitle(''); setNotes(''); setStartDate(''); setEndDate('');
        setMeals({ breakfast: '', midMorning: '', lunch: '', eveningSnack: '', dinner: '', bedtime: '' });
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-4">
          <h2 className="font-semibold mb-2">Incoming Requests</h2>
          <div className="space-y-2 max-h-[60vh] overflow-y-auto">
            {requests.map((r) => (
              <button key={r.id} onClick={() => setSelectedRequest(r)} className={`w-full text-left p-3 rounded border ${selectedRequest?.id===r.id?'border-primary bg-primary/5':'border-gray-200'}`}>
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
            <div className="space-y-3">
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {([['breakfast','Breakfast'],['midMorning','Mid-morning Snack'],['lunch','Lunch'],['eveningSnack','Evening Snack'],['dinner','Dinner'],['bedtime','Bedtime']] as [MealTimeKey,string][]).map(([key,label]) => (
                  <div key={key} className="space-y-1">
                    <label className="text-xs text-gray-600">{label}</label>
                    <Textarea value={meals[key]} onChange={e=>handleMealChange(key, e.target.value)} placeholder="Comma-separated items or a paragraph" />
                  </div>
                ))}
              </div>
              <div className="flex justify-end">
                <Button onClick={handleCreatePlan}>Save Plan</Button>
              </div>
            </div>
          ) : (
            <div className="text-sm text-gray-500">Select a request to start creating a plan</div>
          )}
        </Card>
      </div>
    </div>
  );
}


