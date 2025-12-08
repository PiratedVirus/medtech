'use client'
import { useState, useEffect, useRef } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import AllValuesModal, { AllValuesModalRef } from "./AllValuesModal";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ChevronDown, Eye } from "lucide-react";
import TrackedValuesList from "./TrackedValuesList";

interface Checkup {
  name: string;
  value: string;
  unit: string;
  normalRange?: string;
  isAbnormal?: boolean;
  severity?: string;
  category?: string;
  reportDate?: string;
}

interface Appointment {
  id: number;
  date: string;
  complaints?: string;
  medicines?: string;
  doctorNotes?: string;
  prescriptionLink?: string | null;
}

interface PatientSummarySectionProps {
  patientId: string;
  latestCompletedAppointment?: Appointment;
  previousCompletedAppointments: Appointment[];
  doctorNotes: string;
  onNotesChange: (notes: string) => void;
  onSaveNotes: () => void;
  savingNotes: boolean;
}

export default function PatientSummarySection({
  patientId,
  latestCompletedAppointment,
  previousCompletedAppointments,
  doctorNotes,
  onNotesChange,
  onSaveNotes,
  savingNotes
}: PatientSummarySectionProps) {
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string>("");
  const [checkups, setCheckups] = useState<Checkup[]>([]);
  const [loadingCheckups, setLoadingCheckups] = useState(false);
  const [showAllValuesModal, setShowAllValuesModal] = useState(false);
  const [showAllLatestComplaints, setShowAllLatestComplaints] = useState(false);
  const allValuesModalRef = useRef<AllValuesModalRef>(null);

  const refreshCheckups = async () => {
    setLoadingCheckups(true);
    try {
      const response = await fetch(`/api/patient/${patientId}/tracked-values`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data.criticalValues) {
          const transformedCheckups: Checkup[] = data.data.criticalValues.map((cv: any) => ({
            name: cv.parameter,
            value: cv.value.toString(),
            unit: cv.unit || '',
            normalRange: cv.normalRange,
            isAbnormal: cv.isAbnormal,
            severity: cv.severity,
            category: cv.category,
            reportDate: cv.reportDate
          }));
          setCheckups(transformedCheckups);
        } else {
          setCheckups([]);
        }
      }
    } catch (error) {
      console.error('Error fetching tracked values:', error);
    } finally {
      setLoadingCheckups(false);
    }
  };

  const handleUntrack = async (parameter: string) => {
    const previous = [...checkups];
    // Optimistically update UI
    setCheckups((current) => current.filter((c) => c.name.toLowerCase() !== parameter.toLowerCase()));
    
    try {
      const response = await fetch(`/api/patient/${patientId}/tracked-values/track`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parameter, isTracked: false })
      });
      
      if (!response.ok) {
        // Revert on error
        setCheckups(previous);
        return;
      }
      
      // Refresh modal if it's open
      if (showAllValuesModal && allValuesModalRef.current) {
        allValuesModalRef.current.refresh();
      }
      
      // Refresh checkups to ensure consistency
      await refreshCheckups();
    } catch (e) {
      // Revert on error
      setCheckups(previous);
      console.error('Error untracking parameter:', e);
    }
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
    if (s === 'LOW') {
      return {
        bg: 'bg-sky-100',
        text: 'text-sky-700',
        dot: 'bg-sky-500'
      } as const;
    }
    return {
      bg: 'bg-gray-100',
      text: 'text-gray-700',
      dot: 'bg-gray-400'
    } as const;
  };

  // Fetch critical values from lab reports
  useEffect(() => {
    if (!patientId) return;
    refreshCheckups();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId]);

  // Get selected appointment or aggregate all previous
  const selectedAppointment = selectedAppointmentId
    ? previousCompletedAppointments.find(apt => apt.id.toString() === selectedAppointmentId)
    : null;

  // Aggregate data from previous appointments
  const aggregatedComplaints = !selectedAppointmentId ? previousCompletedAppointments
    .map(apt => {
      const complaints = apt.complaints;
      if (Array.isArray(complaints)) {
        return complaints.map((c: any) => typeof c === 'string' ? c : (c.complaintText || c.text || '')).join(", ");
      }
      return typeof complaints === 'string' ? complaints : '';
    })
    .filter(Boolean)
    .join(", ") : "";

  const aggregatedMedicines = !selectedAppointmentId ? previousCompletedAppointments
    .map(apt => apt.medicines)
    .filter(Boolean)
    .join(", ") : "";

  // Latest appointment complaints: flagged vs all
  // Handle both array format (new) and string format (legacy) for backward compatibility
  const latestComplaintsRaw = latestCompletedAppointment?.complaints || [];
  const latestComplaintsArray = Array.isArray(latestComplaintsRaw)
    ? latestComplaintsRaw.map((c: any) => ({
        text: typeof c === 'string' ? c : (c.complaintText || c.text || ''),
        isFlagged: typeof c === 'string' ? false : (c.isFlagged || false)
      }))
    : typeof latestComplaintsRaw === 'string'
    ? latestComplaintsRaw.split(',').map(c => ({ text: c.trim(), isFlagged: false })).filter(c => c.text)
    : [];
  
  // Filter by isFlagged property instead of regex
  const flaggedLatestComplaints = latestComplaintsArray.filter(c => c.isFlagged === true);
  const latestComplaintsToShow = showAllLatestComplaints ? latestComplaintsArray : flaggedLatestComplaints;

  // Previous appointments for dropdown (all completed appointments)
  const previousAppointments = previousCompletedAppointments;

  return (
    <div className="col-span-full">
      <div className="relative">
        <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide">
          {/* Latest Completed Appointment Card */}
          <Card className="w-[85%] flex-shrink-0 bg-white shadow-sm rounded-lg">
            <div className="flex h-full">
              {/* Left Side Header */}
              <div className="relative max-w-[56px] w-[56px] border-r border-white/20">
                <div className="absolute inset-0 bg-gradient-to-b to-[#1e5636] from-[#2e8b57] rounded-lg" />
                <div className="relative h-full w-full flex items-end justify-center pb-2.5">
                  <h2
                    className="font-extrabold text-white text-base md:text-lg leading-tight tracking-wide drop-shadow-[0_1px_1px_rgba(0,0,0,0.35)] rotate-180"
                    style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
                  >
                    Latest Appointment
                  </h2>
                </div>
              </div>
              
              {/* Content */}
              <CardContent className="p-6 bg-stone-10 flex-1 relative">
                {/* Top Right Corner Elements */}
                <div className="absolute top-4 right-4 flex items-center gap-2">
                  <div className="flex items-center gap-2">
                    {latestCompletedAppointment?.prescriptionLink && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-5 min-h-0 px-2 py-0 leading-none text-secondary border-secondary/30 hover:bg-secondary/10 text-xs rounded-full"
                        onClick={() => window.open(latestCompletedAppointment.prescriptionLink as string, '_blank')}
                      >
                        <Eye className="h-3 w-3 mr-1" /> View Prescription
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-5 min-h-0 px-2 py-0 leading-none text-secondary border-secondary/30 hover:bg-secondary/10 text-xs rounded-full"
                      onClick={onSaveNotes}
                      disabled={savingNotes}
                    >
                      {savingNotes ? 'Saving...' : 'Save Notes'}
                    </Button>
                    {latestCompletedAppointment && (
                      <Badge variant="outline" className="bg-secondary/30 text-secondary border-secondary/30 rounded-full px-2 py-0.5 text-xs">
                        {new Date(latestCompletedAppointment.date).toLocaleDateString()}
                      </Badge>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-6">
                  {/* Left Column */}
                  <div className="space-y-6">
                    {/* Checkups */}
                    <div className="flex justify-between">
                      <h5 className="font-semibold text-gray-800 mb-1 flex items-center gap-2">Tracked Values</h5>
                      <button onClick={() => setShowAllValuesModal(true)} className="w-8 h-8 bg-secondary text-white rounded-full flex mr-10 items-center justify-center hover:bg-secondary/90 transition-colors">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      </button>
                    </div>
                    <div className="mt-2">
                      <TrackedValuesList
                        values={checkups}
                        loading={loadingCheckups}
                        onUntrack={handleUntrack}
                        showUntrack
                      />
                    </div>

                    {/* Latest Complaints with toggle */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="font-semibold text-gray-800 flex items-center gap-2">
                          {showAllLatestComplaints ? 'All Complaints' : 'Flagged Complaints'}
                        </h5>
                        <button
                          className="text-xs text-secondary hover:underline"
                          onClick={() => setShowAllLatestComplaints(v => !v)}
                        >
                          {showAllLatestComplaints ? 'Show flagged' : 'Show all'}
                        </button>
                      </div>
                      <div className="space-y-2">
                        {latestComplaintsToShow.length > 0 ? (
                          latestComplaintsToShow.map((complaint, index) => {
                            const complaintText = typeof complaint === 'string' ? complaint : complaint.text;
                            return (
                              <div key={index} className="text-sm text-gray-700 flex items-start gap-2">
                                <span className="flex items-center gap-2 bg-secondary/10 p-2 rounded-lg">
                                  {complaintText}
                                  {complaintText.toLowerCase().includes('blood pressure') && (
                                    <svg className="h-3 w-3 text-orange-500" fill="currentColor" viewBox="0 0 24 24">
                                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                    </svg>
                                  )}
                                </span>
                              </div>
                            );
                          })
                        ) : (
                          <p className="text-sm text-gray-500">{showAllLatestComplaints ? 'No complaints recorded' : 'No flagged complaints for latest appointment'}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-6">
                    {/* Notes */}
                    <div>
                      <div className="mb-3">
                        <h5 className="font-semibold text-gray-800 flex items-center gap-2">Notes</h5>
                      </div>
                      <Textarea
                        placeholder="Doctor Notes will be displayed here"
                        value={doctorNotes}
                        onChange={(e) => onNotesChange(e.target.value)}
                        className="min-h-[100px] resize-none bg-gray-50 border-gray-200"
                      />
                    </div>

                    {/* Medicines */}
                    <div>
                      <h5 className="font-bold text-gray-800 mb-3">Medicines</h5>
                      <div className="space-y-2">
                        {latestCompletedAppointment?.medicines ? (
                          latestCompletedAppointment.medicines.split(',').map((medicine, index) => (
                            <div key={index} className="text-sm text-gray-700 bg-secondary/10 p-3 rounded">
                              <div className="font-semibold">{medicine.trim()}</div>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-gray-500">No medicines prescribed</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </div>
          </Card>
          {showAllValuesModal && (
            <AllValuesModal 
              ref={allValuesModalRef}
              patientId={patientId} 
              onClose={() => setShowAllValuesModal(false)} 
              onChanged={refreshCheckups}
            />
          )}

          {/* Previous Appointments Card */}
          <Card className="w-[85%] flex-shrink-0 border-1 border-gray-200 rounded-lg shadow-sm">
            <div className="flex h-full">
              {/* Left Side Header */}
              <div className="relative max-w-[44px] w-[44px] border-r border-white/20">
                <div className="absolute inset-0 bg-gradient-to-b to-[#1e5636] from-[#2e8b57] rounded-l-lg" />
                <div className="relative h-full w-full flex items-end justify-center pb-2.5">
                  <h4
                    className="font-extrabold text-white text-sm md:text-base leading-tight tracking-wide drop-shadow-[0_1px_1px_rgba(0,0,0,0.35)] rotate-180"
                    style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
                  >
                    Previous Appointments
                  </h4>
                </div>
              </div>
              
              {/* Content */}
              <CardContent className="p-6 flex-1 relative">
                {/* Top Right Corner Elements */}
                <div className="absolute top-4 right-4 flex items-center gap-2">
                  {/* View Prescription for selected previous appointment */}
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-5 min-h-0 px-2 py-0 leading-none text-xs rounded-full"
                    disabled={!selectedAppointment || !selectedAppointment?.prescriptionLink}
                    onClick={() => {
                      if (selectedAppointment?.prescriptionLink) {
                        window.open(selectedAppointment.prescriptionLink as string, '_blank')
                      }
                    }}
                  >
                    <Eye className="h-3 w-3 mr-1" /> View Prescription
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="h-5 min-h-0 px-2 py-0 leading-none text-xs flex items-center gap-1 rounded-full">
                        <span>
                          {selectedAppointmentId
                            ? `Selected: ${new Date((previousAppointments.find(a => a.id.toString() === selectedAppointmentId)?.date || '')).toLocaleDateString()}`
                            : 'All Previous'}
                        </span>
                        <ChevronDown className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="bg-white" align="end">
                      <DropdownMenuItem onClick={() => setSelectedAppointmentId("")}>All Previous</DropdownMenuItem>
                      {previousAppointments.map(apt => (
                        <DropdownMenuItem key={apt.id} onClick={() => setSelectedAppointmentId(apt.id.toString())}>
                          {new Date(apt.date).toLocaleDateString()}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <Badge variant="outline" className="bg-secondary/10 text-secondary border-secondary/20 rounded-full px-2 py-0.5 text-xs">
                    {selectedAppointmentId ? '1' : previousAppointments.length} appointment{selectedAppointmentId ? '' : 's'}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 gap-6">
                  {/* Left Column */}
                  <div className="space-y-6">

                    {/* All Complaints */}
                    <div>
                      <h5 className="font-semibold text-gray-800 mb-3">
                        All Complaints
                      </h5>
                      <div className="max-h-28 overflow-y-auto pr-1 custom-scrollbar">
                        <div className="flex flex-wrap gap-2">
                          {(selectedAppointment ? selectedAppointment.complaints : aggregatedComplaints)
                            ?.split(',')
                            .map(c => c.trim())
                            .filter(Boolean)
                            .map((complaint, index) => (
                              <span key={`complaint-${index}`} className="inline-flex items-center gap-1.5 rounded-full bg-secondary/10 px-2.5 py-1 text-xs text-secondary">
                                {complaint}
                                {complaint.toLowerCase().includes('blood pressure') && (
                                  <svg className="h-3 w-3 text-orange-500" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                  </svg>
                                )}
                              </span>
                            ))
                          || (
                            <span className="text-sm text-gray-500">No complaints recorded</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-6">
                    {/* Details container with scroll to avoid height growth */}
                    <div>
                      <h5 className="font-bold text-gray-800 mb-3">Details</h5>
                      <div className="max-h-44 overflow-y-auto pr-1 custom-scrollbar space-y-4">
                        {/* Medicines */}
                        <div>
                          <div className="text-xs font-semibold text-gray-600 mb-1">Medicines</div>
                          <div className="flex flex-wrap gap-2">
                            {(selectedAppointment ? selectedAppointment.medicines : aggregatedMedicines)
                              ?.split(',')
                              .map(m => m.trim())
                              .filter(Boolean)
                              .map((medicine, index) => (
                                <span key={`medicine-${index}`} className="inline-flex items-center rounded-full bg-secondary/10 px-2.5 py-1 text-xs text-secondary">
                                  {medicine}
                                </span>
                              ))
                            || (
                              <span className="text-sm text-gray-500">No medicines prescribed</span>
                            )}
                          </div>
                        </div>
                        {/* Notes for selected appointment */}
                        <div>
                          <div className="text-xs font-semibold text-gray-600 mb-1">Notes</div>
                          {selectedAppointment ? (
                            selectedAppointment.doctorNotes ? (
                              <div className="text-sm text-gray-700 bg-secondary/10 p-3 rounded whitespace-pre-wrap">
                                {selectedAppointment.doctorNotes}
                              </div>
                            ) : (
                              <p className="text-sm text-gray-500">No notes recorded for this appointment</p>
                            )
                          ) : previousCompletedAppointments.length > 0 ? (
                            <p className="text-sm text-gray-500">Select an appointment to view its notes</p>
                          ) : (
                            <p className="text-sm text-gray-500">No previous appointments</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </div>
          </Card>
        </div>
      </div>


    </div>
  );
} 