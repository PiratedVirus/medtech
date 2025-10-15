"use client";

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Copy, Info, Coffee, Sun, UtensilsCrossed, Sandwich, Moon, X, Plus } from "lucide-react";
import { useDecryptedProfile } from "@/hooks/use-centralized-profile";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function DietRequestsPage() {
  const { profile, clinicId } = useDecryptedProfile();
  const { toast } = useToast();
  
  const [plans, setPlans] = useState<any[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<any | null>(null);
  const [dieticians, setDieticians] = useState<any[]>([]);
  const [selectedDieticianId, setSelectedDieticianId] = useState<string>("");
  const [activeTab, setActiveTab] = useState<'overview' | 'meals' | 'requests'>("overview");
  const [expandAll, setExpandAll] = useState(true);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [dietComplaint, setDietComplaint] = useState("");
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [sidebarItems, setSidebarItems] = useState<any[]>([]);

  // Load all data
  useEffect(() => {
    async function loadAllData() {
      setIsLoading(true);
      try {
        if (!profile?.id) return;
        
        // Load plans
        const plansRes = await axios.get(`/api/dieticians/diet/history?patientId=${profile.id}`);
        const plansList = plansRes.data?.plans || [];
        setPlans(plansList);
        if (plansList.length > 0) setSelectedPlan(plansList[0]);

        // Load dieticians
        if (clinicId) {
          const dieticiansRes = await axios.get(`/api/dieticians/get-dieticians?clinicId=${clinicId}`);
          setDieticians(dieticiansRes.data?.dieticians || []);
        }

        // Load requests
        const requestsRes = await axios.get(`/api/dieticians/requests?patientId=${profile.id}`);
        const requests = requestsRes.data?.requests || [];
        setPendingRequests(requests);

        // Build sidebar items using the new linked structure
        const groupedItems: any[] = [];
        
        // Add all requests (now with linked plans via dietPlan field)
        requests.forEach((request: any) => {
          if (request.dietPlan) {
            // Request with completed plan
            groupedItems.push({
              ...request,
              type: 'request',
              hasPlan: true,
              plan: request.dietPlan
            });
          } else {
            // Pending request
            groupedItems.push({
              ...request,
              type: 'request',
              hasPlan: false
            });
          }
        });
        
        // Add standalone plans (plans not linked to any request)
        plansList.forEach((plan: any) => {
          const isLinkedToRequest = requests.some((request: any) => 
            request.dietPlan && request.dietPlan.id === plan.id
          );
          
          if (!isLinkedToRequest) {
            groupedItems.push({
              ...plan,
              type: 'plan',
              hasPlan: true
            });
          }
        });
        
        // Sort by creation date
        groupedItems.sort((a, b) => new Date(b.createdAt || b.updatedAt).getTime() - new Date(a.createdAt || a.updatedAt).getTime());
        
        setSidebarItems(groupedItems);
      } catch (error) {
        console.error('Error loading data:', error);
        toast({ title: "Error", description: "Failed to load data", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    }
    loadAllData();
  }, [profile?.id, clinicId, toast]);

  const submitRequest = async () => {
    if (!selectedDieticianId || !dietComplaint.trim()) {
      toast({ title: "Error", description: "Please fill all fields", variant: "destructive" });
      return;
    }

    try {
      const response = await axios.post("/api/dieticians/requests", {
        patientId: profile?.id,
        dieticianId: selectedDieticianId,
        complaint: dietComplaint,
      });
      
      toast({ title: "Success", description: "Diet request submitted successfully" });
      setIsRequestModalOpen(false);
      setDietComplaint("");
      setSelectedDieticianId("");
      
      // Add the new request to the sidebar immediately
      const newRequest = { ...response.data.request, type: 'request' };
      setSidebarItems(prev => [newRequest, ...prev]);
      setPendingRequests(prev => [response.data.request, ...prev]);
      
      // Select the new request to show it in the details
      setSelectedPlan(newRequest);
      setActiveTab('requests');
    } catch (error) {
      toast({ title: "Error", description: "Failed to submit request", variant: "destructive" });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING": return "bg-yellow-100 text-yellow-800";
      case "APPROVED": return "bg-green-100 text-green-800";
      case "REJECTED": return "bg-red-100 text-red-800";
      case "CREATED": return "bg-blue-100 text-blue-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getMealIcon = (mealName: string) => {
    const name = mealName.toLowerCase();
    if (name.includes("breakfast") || name.includes("morning")) return <Sun className="w-4 h-4" />;
    if (name.includes("lunch") || name.includes("afternoon")) return <UtensilsCrossed className="w-4 h-4" />;
    if (name.includes("dinner") || name.includes("evening")) return <Moon className="w-4 h-4" />;
    if (name.includes("snack")) return <Sandwich className="w-4 h-4" />;
    return <Coffee className="w-4 h-4" />;
  };

  const renderMealContent = (meal: any, customTimings: any[], mealId: string) => {
    if (!meal) return null;
    
    // Get meal display info
    const customTiming = customTimings.find((t: any) => t.id === mealId);
    const mealIcon = customTiming?.icon || '🍽️';
    
    // Meal content is a string, display it directly
    return (
      <div className="space-y-2">
        <p className="text-sm text-gray-800 whitespace-pre-wrap">{String(meal)}</p>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading diet plans...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-muted min-h-full lg:px-20 px-5 pt-5 pb-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Diet Plans & Requests</h1>
        <p className="text-gray-600">Manage your diet plans and submit new requests</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-[600px]">
        {/* Left Column - Plans & Requests List */}
        <div className="lg:col-span-1 flex flex-col">
          <Card className="border-primary/20 flex flex-col h-full">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Diet Plans & Requests</CardTitle>
                  <CardDescription>Your plans and pending requests</CardDescription>
                </div>
                <Dialog open={isRequestModalOpen} onOpenChange={setIsRequestModalOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      Request New Plan
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Request a Diet Plan</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-gray-600">Select Dietician</label>
                        <Select value={selectedDieticianId} onValueChange={setSelectedDieticianId}>
                          <SelectTrigger>
                            <SelectValue placeholder="Choose a dietician" />
                          </SelectTrigger>
                          <SelectContent>
                            {dieticians.map((d: any) => (
                              <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Your complaint</label>
                        <Textarea
                          value={dietComplaint}
                          onChange={(e) => setDietComplaint(e.target.value)}
                          placeholder="e.g., weight goals, conditions, preferences"
                          className="bg-white"
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="outline" 
                          onClick={() => setIsRequestModalOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button 
                          onClick={submitRequest} 
                          disabled={!selectedDieticianId || !dietComplaint.trim()}
                        >
                          Submit Request
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent className="flex-1">
              <div className="space-y-2">
                {sidebarItems.length === 0 ? (
                  <div className="text-center py-8">
                    <UtensilsCrossed className="w-12 h-12 mx-auto mb-4" />
                    <p className="text-sm">No diet plans or requests</p>
                    <p className="text-xs mt-1">Submit a request to get started</p>
                  </div>
                ) : (
                  sidebarItems.map((item, index) => (
                    <div
                      key={`${item.type}-${item.id || index}`}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors relative ${
                        selectedPlan?.id === item.id && selectedPlan?.type === item.type ? 'border-primary/40' : 'bg-white hover:bg-primary/5'
                      }`}
                      onClick={() => setSelectedPlan(item)}
                    >
                      {/* Status badge in top-right corner */}
                      {item.type === 'request' && item.hasPlan ? (
                        <Badge className="absolute top-2 right-2 bg-green-100 text-green-800">
                          COMPLETED
                        </Badge>
                      ) : item.type === 'request' ? (
                        <Badge className={`absolute top-2 right-2 ${getStatusColor(item.status)}`}>
                          {item.status}
                        </Badge>
                      ) : null}
                      
                      <div className="flex items-center justify-between pr-20">
                        <div className="flex-1">
                          <div className="mb-1">
                            <p className="font-medium text-sm">
                              {item.type === 'request' && item.hasPlan 
                                ? `${item.plan?.title || 'Diet Plan'} `
                                : item.type === 'request'
                                ? ``
                                : (item.title || `Plan ${index + 1}`)
                              }
                            </p>
                          </div>
                          {item.type === 'request' ? (
                            <>
                              <p className="text-xs text-gray-500 mt-1">
                                Submitted: {new Date(item.createdAt).toLocaleDateString()}
                              </p>
                              <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                                <span className="font-medium">Complaint:</span> {item.complaint}
                              </p>
                              {item.dietician && (
                                <p className="text-xs text-gray-600 mt-1">
                                  <span className="font-medium">Dietician:</span> {item.dietician.name}
                                </p>
                              )}
                            </>
                          ) : (
                            <p className="text-xs text-gray-500">
                              {item.startDate ? new Date(item.startDate).toLocaleDateString() : 'No date'}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Plan Details */}
        <div className="lg:col-span-2 flex flex-col">
          <Card className="flex flex-col h-full">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Diet Plan Details</CardTitle>
                  <CardDescription>
                    {selectedPlan 
                      ? selectedPlan.type === 'request' && selectedPlan.hasPlan 
                        ? `${selectedPlan.plan?.title || 'Diet Plan'} (Request #${selectedPlan.id})`
                        : selectedPlan.type === 'request'
                        ? `Request #${selectedPlan.id} - Pending`
                        : (selectedPlan.title || 'Diet Plan')
                      : 'Select a plan or request to view details'
                    }
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-1">
              {selectedPlan ? (
                selectedPlan.type === 'request' && selectedPlan.hasPlan && selectedPlan.plan ? (
                  // Show only diet plan details for completed requests
                  <div className="space-y-4">
                    {/* Diet Plan Details */}
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-gray-600">Plan Name</label>
                          <p className="text-sm font-medium">{selectedPlan.plan.title || 'Diet Plan'}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-600">Status</label>
                          <p className="text-sm text-green-600"> Completed</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-gray-600">Start Date</label>
                          <p className="text-sm">{selectedPlan.plan.startDate ? new Date(selectedPlan.plan.startDate).toLocaleDateString() : 'Not set'}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-600">End Date</label>
                          <p className="text-sm">{selectedPlan.plan.endDate ? new Date(selectedPlan.plan.endDate).toLocaleDateString() : 'Not set'}</p>
                        </div>
                      </div>
                      {selectedPlan.plan.notes && (
                        <div>
                          <label className="text-sm font-medium text-gray-600">Notes</label>
                          <p className="text-sm mt-1 p-3 bg-gray-50 rounded-lg">{selectedPlan.plan.notes}</p>
                        </div>
                      )}
                      
                      {/* Meal Schedule */}
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium">Meal Schedule</h4>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setExpandAll(!expandAll)}
                          >
                            {expandAll ? 'Collapse All' : 'Expand All'}
                          </Button>
                        </div>
                        
                        {selectedPlan.plan.meals && typeof selectedPlan.plan.meals === 'object' ? (
                          <div className="space-y-3">
                            {(() => {
                              // Get custom meal timings if available
                              const customTimings = selectedPlan.plan.customMealTimings || [];
                              const meals = selectedPlan.plan.meals;
                              
                              // Sort meals by custom order if available
                              const mealEntries = Object.entries(meals);
                              if (customTimings.length > 0) {
                                mealEntries.sort(([a], [b]) => {
                                  const aInfo = customTimings.find((t: any) => t.id === a);
                                  const bInfo = customTimings.find((t: any) => t.id === b);
                                  return (aInfo?.order || 0) - (bInfo?.order || 0);
                                });
                              }
                              
                              return mealEntries.map(([mealId, mealData]: [string, any]) => {
                                // Get meal display info
                                const customTiming = customTimings.find((t: any) => t.id === mealId);
                                const mealName = customTiming?.name || mealId;
                                const mealIcon = customTiming?.icon || '🍽️';
                                
                                return (
                                  <div key={mealId} className="border rounded-lg p-4 bg-white">
                                    <div className="flex items-center gap-2 mb-2">
                                      <span className="text-lg">{mealIcon}</span>
                                      <h5 className="font-medium">{mealName}</h5>
                                    </div>
                                    {expandAll && (
                                      <p className="text-sm text-gray-800 whitespace-pre-wrap">{String(mealData)}</p>
                                    )}
                                  </div>
                                );
                              });
                            })()}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500">No meal details available</p>
                        )}
                      </div>
                    </div>
                  </div>
                ) : selectedPlan.type === 'request' ? (
                  // Pending request - show message
                  <div className="flex items-center justify-center h-[48vh]">
                    <div className="text-center text-gray-600">
                      <div className="text-base font-semibold mb-2">Request Pending</div>
                      <div className="text-sm">Your diet plan request is being processed by the dietician.</div>
                      <div className="text-sm text-gray-500 mt-2">You'll be notified once the plan is ready.</div>
                    </div>
                  </div>
                ) : selectedPlan.type === 'plan' ? (
                  // Standalone Plan Details
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-600">Plan Name</label>
                        <p className="text-sm font-medium">{selectedPlan.title || 'Diet Plan'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Status</label>
                        <p className="text-sm text-green-600"> Active</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-600">Start Date</label>
                        <p className="text-sm">{selectedPlan.startDate ? new Date(selectedPlan.startDate).toLocaleDateString() : 'Not set'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">End Date</label>
                        <p className="text-sm">{selectedPlan.endDate ? new Date(selectedPlan.endDate).toLocaleDateString() : 'Not set'}</p>
                      </div>
                    </div>
                    {selectedPlan.notes && (
                      <div>
                        <label className="text-sm font-medium text-gray-600">Notes</label>
                        <p className="text-sm mt-1 p-3 bg-gray-50 rounded-lg">{selectedPlan.notes}</p>
                      </div>
                    )}
                    
                    {/* Meal Schedule */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-medium">Meal Schedule</h3>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setExpandAll(!expandAll)}
                        >
                          {expandAll ? 'Collapse All' : 'Expand All'}
                        </Button>
                      </div>
                      
                      {selectedPlan.meals && typeof selectedPlan.meals === 'object' ? (
                        <div className="space-y-3">
                          {(() => {
                            // Get custom meal timings if available
                            const customTimings = selectedPlan.customMealTimings || [];
                            const meals = selectedPlan.meals;
                            
                            // Sort meals by custom order if available
                            const mealEntries = Object.entries(meals);
                            if (customTimings.length > 0) {
                              mealEntries.sort(([a], [b]) => {
                                const aInfo = customTimings.find((t: any) => t.id === a);
                                const bInfo = customTimings.find((t: any) => t.id === b);
                                return (aInfo?.order || 0) - (bInfo?.order || 0);
                              });
                            }
                            
                            return mealEntries.map(([mealId, mealData]: [string, any]) => {
                              // Get meal display info
                              const customTiming = customTimings.find((t: any) => t.id === mealId);
                              const mealName = customTiming?.name || mealId;
                              const mealIcon = customTiming?.icon || '🍽️';
                              
                              return (
                                <div key={mealId} className="border rounded-lg p-4 bg-white">
                                  <div className="flex items-center gap-2 mb-2">
                                    <span className="text-lg">{mealIcon}</span>
                                    <h4 className="font-medium">{mealName}</h4>
                                  </div>
                                  {expandAll && (
                                    <p className="text-sm text-gray-800 whitespace-pre-wrap">{String(mealData)}</p>
                                  )}
                                </div>
                              );
                            });
                          })()}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">No meal details available</p>
                      )}
                    </div>
                  </div>
                ) : null
              ) : (
                <div className="text-center py-8">
                  <UtensilsCrossed className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Select a plan or request to view details</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
