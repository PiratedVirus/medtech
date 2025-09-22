"use client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit, Plus, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useDecryptedProfile } from "@/hooks/use-centralized-profile";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "react-toastify";

interface PatientPill {
  id: number;
  key: string;
  value: string;
}

interface PatientPillsRowProps {
  pills?: PatientPill[];
  onEditPill?: (pillId: string) => void;
  onAddPill?: () => void;
  userIdOverride?: number;
  inline?: boolean; // render pills inline without Card wrapper
}

export default function PatientPillsRow({ pills: pillsProp, onEditPill, onAddPill, userIdOverride, inline }: PatientPillsRowProps) {
  const { profile } = useDecryptedProfile();
  const userId = userIdOverride ?? (profile?.id ? Number(profile.id) : undefined);

  const [pills, setPills] = useState<PatientPill[]>(pillsProp || []);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<{ id: number | null; key: string; value: string }>({ id: null, key: "", value: "" });
  const [isAdding, setIsAdding] = useState(false);

  // fetch from backend
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/patients/pills?userId=${userId}`);
        const json = await res.json();
        if (!cancelled && json?.success) setPills(json.data || []);
      } catch (_) {
        // swallow
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const handleStartEdit = (pill: PatientPill) => {
    setEditing({ id: pill.id, key: pill.key, value: pill.value });
    setIsAdding(false);
    setEditOpen(true);
  };

  const handleSave = async () => {
    if (!editing.key.trim() || !editing.value.trim()) {
      toast.error("Please fill in both metric name and value");
      return;
    }
    
    try {
      if (isAdding) {
        // Adding new pill
        const res = await fetch(`/api/patients/pills`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, key: editing.key.trim(), value: editing.value.trim() }),
        });
        const json = await res.json();
        if (json?.success) {
          const newPill: PatientPill = { id: json.data.id, key: json.data.key, value: json.data.value };
          setPills(prev => [newPill, ...prev]);
          toast.success("Metric added successfully!");
        } else {
          toast.error(json?.error || "Failed to add metric");
        }
      } else {
        // Editing existing pill
        const res = await fetch(`/api/patients/pills`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editing.id, key: editing.key.trim(), value: editing.value.trim() }),
        });
        const json = await res.json();
        if (json?.success) {
          setPills(prev => prev.map(p => (p.id === editing.id ? { ...p, key: editing.key.trim(), value: editing.value.trim() } : p)));
          toast.success("Metric updated successfully!");
        } else {
          toast.error(json?.error || "Failed to update metric");
        }
      }
      setEditOpen(false);
      setEditing({ id: null, key: "", value: "" });
      setIsAdding(false);
    } catch (error) {
      toast.error("An error occurred. Please try again.");
    }
  };

  const handleAdd = () => {
    if (!userId) {
      toast.error("User ID not found");
      return;
    }
    setEditing({ id: null, key: "", value: "" });
    setIsAdding(true);
    setEditOpen(true);
  };

  if (inline) {
    return (
      <div className="relative z-10">
        <div className="flex flex-wrap gap-3 items-center justify-end">
           {pills.map((pill) => (
            <div key={pill.id} className="group relative">
              <Button
                variant="ghost"
                size="sm"
                className="absolute -top-2 -right-2 h-6 w-6 p-0 bg-white/80 hover:bg-white text-gray-600 hover:text-secondary rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-all duration-200 z-10"
                onClick={() => (onEditPill ? onEditPill(String(pill.id)) : handleStartEdit(pill))}
              >
                <Edit className="h-3 w-3" />
              </Button>
              <div className="rounded-full px-4 py-2 shadow-sm hover:shadow-md transition-all duration-200 bg-gradient-to-b from-[#2e8b57] to-[#1e5636] border border-white/30">
                <div className="flex items-center gap-2 text-white">
                  <span className="text-sm font-bold opacity-90">{pill.key}:</span>
                  <span className="text-sm font-semibold">{pill.value}</span>
                  <button
                    className="ml-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/20 hover:bg-white/30 text-white/90 hover:text-white"
                    title="Delete metric"
                    onClick={async () => {
                      try {
                        await fetch(`/api/patients/pills?id=${pill.id}`, { method: 'DELETE' });
                        setPills(prev => prev.filter(p => p.id !== pill.id));
                        toast.success('Metric deleted');
                      } catch {
                        toast.error('Failed to delete');
                      }
                    }}
                    aria-label="Delete metric"
                  >
                    {/* <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5">
                      <path fillRule="evenodd" d="M6.225 4.811a.75.75 0 011.06 0L12 9.525l4.715-4.714a.75.75 0 111.06 1.06L13.06 10.586l4.715 4.714a.75.75 0 11-1.06 1.06L12 11.646l-4.715 4.714a.75.75 0 11-1.06-1.06l4.714-4.715-4.714-4.715a.75.75 0 010-1.059z" clipRule="evenodd" />
                    </svg> */}
                    <X className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>
          ))}
          <Button
            variant="outline"
            size="sm"
            className="rounded-full px-4 py-2 border border-emerald-300 text-emerald-700 hover:bg-emerald-50/50"
            onClick={() => (onAddPill ? onAddPill() : handleAdd())}
          >
            <Plus className="h-4 w-4 mr-1" />
            <span className="text-sm font-medium">Add Metric</span>
          </Button>
        </div>

        <Dialog open={editOpen} onOpenChange={(open) => {
          if (!open) {
            setEditOpen(false);
            setEditing({ id: null, key: "", value: "" });
            setIsAdding(false);
          }
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{isAdding ? "Add New Metric" : "Edit Metric"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <Input 
                placeholder="Metric name (e.g., Blood Pressure)" 
                value={editing.key} 
                onChange={(e) => setEditing(prev => ({ ...prev, key: e.target.value }))} 
              />
              <Input 
                placeholder="Value (e.g., 120/80 mmHg)" 
                value={editing.value} 
                onChange={(e) => setEditing(prev => ({ ...prev, value: e.target.value }))} 
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setEditOpen(false);
                setEditing({ id: null, key: "", value: "" });
                setIsAdding(false);
              }}>Cancel</Button>
              <Button onClick={handleSave} disabled={!editing.key.trim() || !editing.value.trim()}>
                {isAdding ? "Add" : "Save"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <Card className="col-span-full relative overflow-hidden rounded-xl bg-gray-50/80 p-4 shadow-sm border border-gray-100">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-50/50 to-gray-100/30 rounded-xl" />
      
      <div className="relative z-10">
        
        {/* Pills Container */}
        <div className="flex flex-wrap gap-3 items-start">
          {pills.map((pill) => (
            <div key={pill.id} className="group relative">
              {/* Edit Icon - Top Right */}
              <Button
                variant="ghost"
                size="sm"
                className="absolute -top-2 -right-2 h-6 w-6 p-0 bg-white/80 hover:bg-white text-gray-500 hover:text-secondary rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-all duration-200 z-10"
                onClick={() => (onEditPill ? onEditPill(String(pill.id)) : handleStartEdit(pill))}
              >
                <Edit className="h-3 w-3" />
              </Button>
              
              {/* Pill */}
              <div className="rounded-full px-4 py-2 shadow-sm hover:shadow-md transition-all duration-200 bg-gradient-to-b from-[#2e8b57] to-[#1e5636] border border-white/30">
                <div className="flex items-center gap-2 text-white">
                  <span className="text-sm font-medium opacity-90">{pill.key}:</span>
                  <span className="text-sm font-semibold">{pill.value}</span>
                </div>
              </div>
            </div>
          ))}
          
          {/* Add New Pill Button */}
          <Button
            variant="outline"
            size="sm"
            className="rounded-full px-4 py-2 border border-emerald-300 text-emerald-700 hover:bg-emerald-50/50"
            onClick={() => (onAddPill ? onAddPill() : handleAdd())}
          >
            <Plus className="h-4 w-4 mr-1" />
            <span className="text-sm font-medium">Add Metric</span>
          </Button>
        </div>
      </div>

      <Dialog open={editOpen} onOpenChange={(open) => {
        if (!open) {
          setEditOpen(false);
          setEditing({ id: null, key: "", value: "" });
          setIsAdding(false);
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isAdding ? "Add New Metric" : "Edit Metric"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input 
              placeholder="Metric name (e.g., Blood Pressure)" 
              value={editing.key} 
              onChange={(e) => setEditing(prev => ({ ...prev, key: e.target.value }))} 
            />
            <Input 
              placeholder="Value (e.g., 120/80 mmHg)" 
              value={editing.value} 
              onChange={(e) => setEditing(prev => ({ ...prev, value: e.target.value }))} 
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setEditOpen(false);
              setEditing({ id: null, key: "", value: "" });
              setIsAdding(false);
            }}>Cancel</Button>
            <Button onClick={handleSave} disabled={!editing.key.trim() || !editing.value.trim()}>
              {isAdding ? "Add" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
} 