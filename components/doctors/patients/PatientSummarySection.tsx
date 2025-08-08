'use client'
import { useState } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";

interface Checkup {
  name: string;
  value: string;
  unit: string;
}

interface Appointment {
  id: number;
  date: string;
  complaints?: string;
  medicines?: string;
  doctorNotes?: string;
}

interface PatientSummarySectionProps {
  latestCompletedAppointment?: Appointment;
  previousCompletedAppointments: Appointment[];
  doctorNotes: string;
  onNotesChange: (notes: string) => void;
  onSaveNotes: () => void;
  savingNotes: boolean;
}

export default function PatientSummarySection({
  latestCompletedAppointment,
  previousCompletedAppointments,
  doctorNotes,
  onNotesChange,
  onSaveNotes,
  savingNotes
}: PatientSummarySectionProps) {
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string>("");

  // Mock checkups data
  const mockCheckups: Checkup[] = [
    { name: "HbA1c", value: "48", unit: "mmol | mol" },
    { name: "FBS", value: "100", unit: "mg | dL" },
    { name: "BP", value: "140 / 70", unit: "mm | Hg" }
  ];

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
              <div className="bg-primary/20 p-4 flex items-center justify-center max-w-[40px]">
                <div className="writing-mode-vertical text-center">
                  <h4 className="font-semibold text-lg text-primary transform -rotate-90 whitespace-nowrap">
                    Latest Appointment
                  </h4>
                </div>
              </div>
              
              {/* Content */}
              <CardContent className="p-6 bg-stone-10 flex-1 relative">
                {/* Top Right Corner Elements */}
                <div className="absolute top-4 right-4 flex items-center gap-2">
                  {latestCompletedAppointment && (
                    <Badge variant="outline" className="bg-primary/30 text-primary border-primary/30">
                      {new Date(latestCompletedAppointment.date).toLocaleDateString()}
                    </Badge>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-6">
                  {/* Left Column */}
                  <div className="space-y-6">
                    {/* Checkups */}
                    <div className="flex justify-between">
                      <h5 className="font-semibold text-gray-800 mb-1 flex items-center gap-2">Checkups</h5>
                      <button className="w-8 h-8 bg-primary text-white rounded-full flex mr-10 items-center justify-center hover:bg-primary/90 transition-colors">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      </button>
                    </div>
                    <div className="space-y-3">
                      {mockCheckups.map((checkup, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-700 min-w-[60px]">{checkup.name}:</span>
                          <span className="bg-primary/10 text-primary px-2 py-1 rounded text-sm font-medium">{checkup.value}</span>
                          <span className="rounded text-sm font-medium">{checkup.unit}</span>
                          <button className="text-primary hover:text-primary/80">
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* All Complaints */}
                    <div>
                      <h5 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                        All Complaints
                      </h5>
                      <div className="space-y-2">
                        {latestCompletedAppointment?.complaints ? (
                          latestCompletedAppointment.complaints.split(',').map((complaint, index) => (
                            <div key={index} className="text-sm text-gray-700 flex items-start gap-2">
                              <span className="flex items-center gap-2 bg-primary/10 p-2 rounded-lg">
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
                      <h5 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                        Notes
                      </h5>
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
                            <div key={index} className="text-sm text-gray-700 bg-primary/10 p-3 rounded">
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

          {/* Previous Appointments Card */}
          <Card className="w-[85%] flex-shrink-0 border-1 border-gray-200 rounded-lg shadow-sm">
            <div className="flex h-full">
              {/* Left Side Header */}
              <div className="bg-primary/20 p-4 flex items-center justify-center max-w-[30px]">
                <div className="writing-mode-vertical text-center">
                  <h4 className="font-semibold text-lg text-primary transform -rotate-90 whitespace-nowrap">
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
                  <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                    {selectedAppointmentId ? "1" : previousCompletedAppointments.length} appointment{selectedAppointmentId ? "" : "s"}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 gap-6">
                  {/* Left Column */}
                  <div className="space-y-6">
                    {/* Checkups */}
                    <div>
                      <div className="flex justify-between">
                        <h5 className="font-semibold text-gray-800 mb-1 flex items-center gap-2">Checkups</h5>
                        <button className="w-8 h-8 bg-primary text-white rounded-full flex mr-10 items-center justify-center hover:bg-primary/90 transition-colors">
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                        </button>
                      </div>
                      <div className="space-y-3">
                        {mockCheckups.map((checkup, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-700 min-w-[60px]">{checkup.name}:</span>
                            <span className="bg-primary/10 text-primary px-2 py-1 rounded text-sm font-medium">{checkup.value}</span>
                            <span className="bg-primary/10 text-primary px-2 py-1 rounded text-sm font-medium">{checkup.unit}</span>
                            <button className="text-primary hover:text-primary/80">
                              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                              </svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* All Complaints */}
                    <div>
                      <h5 className="font-semibold text-gray-800 mb-3">
                        All Complaints
                      </h5>
                      <div className="space-y-2">
                        {selectedAppointment ? (
                          selectedAppointment.complaints ? (
                            selectedAppointment.complaints.split(',').map((complaint, index) => (
                              <div key={index} className="text-sm text-gray-700 flex items-start gap-2">
                                <span className="flex items-center gap-2 bg-primary/10 p-2 rounded-lg">
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
                          )
                        ) : (
                          <p className="text-sm text-gray-700 bg-primary/10 p-3 rounded-lg">
                            {aggregatedComplaints || "No complaints recorded"}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-6">
                    {/* AI Summary */}
                    <div>
                      <h5 className="font-semibold text-gray-800 mb-3">
                        AI Summary (Coming Soon)
                      </h5>
                      <div className="bg-primary/10 p-4 rounded-lg border border-primary/20">
                        <p className="text-sm text-primary">
                          AI-powered analysis of patient history will be available here to provide insights and trends.
                        </p>
                      </div>
                    </div>

                    {/* Medicines */}
                    <div>
                      <h5 className="font-bold text-gray-800 mb-3">Medicines</h5>
                      <div className="space-y-2">
                        {selectedAppointment ? (
                          selectedAppointment.medicines ? (
                            selectedAppointment.medicines.split(',').map((medicine, index) => (
                              <div key={index} className="text-sm text-gray-700 bg-primary/10 p-3 rounded">
                                <div className="font-semibold">{medicine.trim()}</div>
                              </div>
                            ))
                          ) : (
                            <p className="text-sm text-gray-500">No medicines prescribed</p>
                          )
                        ) : (
                          <div className="text-sm text-gray-700 bg-primary/10 p-3 rounded">
                            <div className="font-semibold">{aggregatedMedicines || "No medicines prescribed"}</div>
                          </div>
                        )}
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
          <div className="w-3 h-3 bg-primary rounded-full"></div>
          <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
        </div> */}
      </div>

      {/* Save Notes Button */}
      {/* <div className="mt-6 flex justify-end">
        <Button
          onClick={onSaveNotes}
          disabled={savingNotes}
          className="bg-primary hover:bg-primary/90"
        >
          {savingNotes ? "Saving..." : "Save Notes"}
        </Button>
      </div> */}
    </div>
  );
} 