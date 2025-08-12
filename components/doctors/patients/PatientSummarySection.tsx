'use client'
import { useState, useEffect } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import AllValuesModal from "./AllValuesModal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";

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

  const handleUntrack = async (parameter: string) => {
    const previous = [...checkups];
    setCheckups((current) => current.filter((c) => c.name.toLowerCase() !== parameter.toLowerCase()));
    try {
      await fetch(`/api/patient/${patientId}/tracked-values/track`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parameter, isTracked: false })
      });
    } catch (e) {
      setCheckups(previous);
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
    const fetchLabAnalysis = async () => {
      if (!patientId) return;
      
      setLoadingCheckups(true);
      try {
        const response = await fetch(`/api/patient/${patientId}/tracked-values`);
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data.criticalValues) {
            // Transform critical values to Checkup format
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
          }
        }
      } catch (error) {
        console.error('Error fetching lab analysis:', error);
        // Fallback to empty array if API fails
        setCheckups([]);
      } finally {
        setLoadingCheckups(false);
      }
    };

    fetchLabAnalysis();
  }, [patientId]);

  // Get selected appointment or aggregate all previous
  const selectedAppointment = selectedAppointmentId
    ? previousCompletedAppointments.find(apt => apt.id.toString() === selectedAppointmentId)
    : null;

  // Aggregate data from previous appointments
  const aggregatedComplaints = !selectedAppointmentId ? previousCompletedAppointments
    .map(apt => apt.complaints)
    .filter(Boolean)
    .join(", ") : "";

  const aggregatedMedicines = !selectedAppointmentId ? previousCompletedAppointments
    .map(apt => apt.medicines)
    .filter(Boolean)
    .join(", ") : "";

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
                    <Button size="sm" variant="outline" className="text-secondary border-secondary/30 hover:bg-secondary/10 text-xs"
                      onClick={onSaveNotes} disabled={savingNotes}
                    >
                      {savingNotes ? 'Saving...' : 'Save Notes'}
                    </Button>
                    {latestCompletedAppointment && (
                      <Badge variant="outline" className="bg-secondary/30 text-secondary border-secondary/30">
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
                      {loadingCheckups ? (
                        <div className="text-sm text-gray-500">Loading lab values...</div>
                      ) : checkups.length > 0 ? (
                        <div className="max-h-36 overflow-y-auto pr-1 custom-scrollbar">
                          <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
                            {checkups.map((checkup, index) => {
                              const s = getSeverityClasses(checkup.severity, checkup.isAbnormal);
                              return (
                                <div
                                  key={`${checkup.name}-${index}`}
                                  className={`group relative flex items-center gap-2 rounded-full ${s.bg} h-8 px-3 shadow-sm`}
                                  title={checkup.normalRange ? `Normal: ${checkup.normalRange}` : undefined}
                                >
                                  <div className="flex items-center w-full gap-2">
                                    <span className="flex-1 truncate text-[13px] font-semibold text-gray-700" title={checkup.name}>{checkup.name}</span>
                                    <span className="ml-auto inline-flex items-baseline gap-1.5">
                                      <span className={`text-[13px] font-bold ${s.text}`}>{checkup.value}</span>
                                      {checkup.unit && (
                                        <span className="text-[11px] text-gray-600">{checkup.unit}</span>
                                      )}
                                    </span>
                                  </div>
                                  <button
                                    className="absolute right-1 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center rounded-full bg-white/70 hover:bg-red-100 text-gray-600 hover:text-red-600 h-6 w-6 transition-opacity opacity-0 group-hover:opacity-100"
                                    title="Untrack"
                                    onClick={() => handleUntrack(checkup.name)}
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5">
                                      <path fillRule="evenodd" d="M16.5 4.478v.227a48.816 48.816 0 013.878.512.75.75 0 11-.256 1.476l-.209-.035-1.005 12.063A3.75 3.75 0 0115.168 22H8.832a3.75 3.75 0 01-3.74-3.279L4.087 6.658l-.209.035a.75.75 0 11-.256-1.476A48.567 48.567 0 017.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.969a52.662 52.662 0 013.368 0C15.287 1.805 16.5 3.141 16.5 4.705zm-6.136-1.47a51.196 51.196 0 013.272 0C14.454 3.074 15 3.62 15 4.295v.26a49.488 49.488 0 00-6 0v-.26c0-.674.546-1.22 1.364-1.287zM9.75 9a.75.75 0 00-1.5 0v8.25a.75.75 0 001.5 0V9zm3 0a.75.75 0 00-1.5 0v8.25a.75.75 0 001.5 0V9zm3 0a.75.75 0 00-1.5 0v8.25a.75.75 0 001.5 0V9z" clipRule="evenodd" />
                            </svg>
                          </button>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm text-gray-500">No lab values available</div>
                      )}
                    </div>

                    {/* All Complaints */}
                    <div>
                      <h5 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                        Flagged  Complaints
                      </h5>
                      <div className="space-y-2">
                        {latestCompletedAppointment?.complaints ? (
                          latestCompletedAppointment.complaints.split(',').map((complaint, index) => (
                            <div key={index} className="text-sm text-gray-700 flex items-start gap-2">
                              <span className="flex items-center gap-2 bg-secondary/10 p-2 rounded-lg">
                                {complaint.trim()}
                                {complaint.toLowerCase().includes('blood pressure') && (
                                  <svg className="h-3 w-3 text-orange-500" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                  </svg>
                                )}
                              </span>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-gray-500">No complaints recorded</p>
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
              patientId={patientId} 
              onClose={() => setShowAllValuesModal(false)} 
              onChanged={() => {
                // Refresh tracked values after a change
                (async () => {
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
                      }
                    }
                  } finally {
                    setLoadingCheckups(false);
                  }
                })();
              }}
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
                  <select
                    value={selectedAppointmentId}
                    onChange={(e) => setSelectedAppointmentId(e.target.value)}
                    className="text-sm border border-gray-300 rounded px-2 py-1 bg-white"
                  >
                    <option value="">All Previous</option>
                    {previousCompletedAppointments.map(apt => (
                      <option key={apt.id} value={apt.id.toString()}>
                        {new Date(apt.date).toLocaleDateString()}
                      </option>
                    ))}
                  </select>
                  <Badge variant="outline" className="bg-secondary/10 text-secondary border-secondary/20">
                    {selectedAppointmentId ? "1" : previousCompletedAppointments.length} appointment{selectedAppointmentId ? "" : "s"}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 gap-6">
                  {/* Left Column */}
                  <div className="space-y-6">

                    {/* All Complaints */}
                    <div>
                      <h5 className="font-semibold text-gray-800 mb-3">
                        Flagged Complaints
                      </h5>
                      <div className="max-h-28 overflow-y-auto pr-1 custom-scrollbar">
                        <div className="flex flex-wrap gap-2">
                          {(selectedAppointment ? selectedAppointment.complaints : aggregatedComplaints)
                            ?.split(',')
                            .map(c => c.trim())
                            .filter(Boolean)
                            .filter(c => /high|low|severe|critical|urgent|blood pressure|bp|sugar|glucose|pain|fever/i.test(c))
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

        {/* Carousel Indicators
        <div className="flex justify-center mt-4 gap-2">
          <div className="w-3 h-3 bg-secondary rounded-full"></div>
          <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
        </div> */}
      </div>

      {/* Save Notes Button */}
      {/* <div className="mt-6 flex justify-end">
        <Button
          onClick={onSaveNotes}
          disabled={savingNotes}
          className="bg-secondary hover:bg-secondary/90"
        >
          {savingNotes ? "Saving..." : "Save Notes"}
        </Button>
      </div> */}
    </div>
  );
} 