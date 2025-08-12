'use client'
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pill, Plus, Eye } from "lucide-react";
import { useState } from "react";

interface PrescriptionsSectionProps {
  appointments: Array<{
    id: number;
    appointmentDate?: string;
    date?: string;
    prescriptionLink?: string | null;
    doctorName?: string;
  }>;
  patientName: string;
}

export default function PrescriptionsSection({ appointments, patientName }: PrescriptionsSectionProps) {
  const [open, setOpen] = useState(false);
  const prescriptions = appointments?.filter(apt => apt.prescriptionLink) || [];

  const items = prescriptions.slice(0, 3);
  const placeholders = Array(Math.max(0, 3 - items.length)).fill(null);

  return (
    <div className="relative h-full">
      {/* <div aria-hidden="true" className="absolute -inset-0.5 rounded-[14px] bg-[conic-gradient(at_70%_20%,#84cc16_0deg,#10b981_120deg,#065f46_240deg,#84cc16_360deg)] opacity-80 blur" /> */}
      <Card className="relative overflow-hidden rounded-xl border border-emerald-300 bg-white p-4 shadow-md h-full min-h-[220px]">
        <div className="absolute inset-0 -skew-y-2 bg-gradient-to-tr from-emerald-100 via-emerald-50 to-lime-100 opacity-60" />

        <div className="relative z-10 h-full flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-bold text-gray-900">Prescriptions</h3>
            <Button variant="outline" size="sm" className="text-secondary border-secondary/30 hover:bg-secondary/10 rounded-lg text-xs">
              <Eye className="h-3 w-3 mr-1" />
              View More
            </Button>
          </div>

          <div className="space-y-2 mb-3 flex-1">
            {items.map((prescription) => (
              <div key={prescription.id} className="group relative overflow-hidden rounded-lg border border-emerald-200/60 p-3 shadow-sm hover:shadow-md transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-b to-[#1e5636] from-[#2e8b57] rounded-lg opacity-90" />
                <div className="absolute -right-2 -bottom-2 w-12 h-12 opacity-10">
                  <Pill className="w-full h-full text-green-50" />
                </div>
                <div className="relative z-10">
                  <div className="flex items-center gap-3">
                    <h4 className="font-semibold text-white text-sm truncate flex-1">
                      {prescription.doctorName ? `Prescription - Dr. ${prescription.doctorName}` : 'Prescription'}
                    </h4>
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full whitespace-nowrap">
                      {new Date(prescription.date || prescription.appointmentDate || '').toLocaleDateString('en-GB')}
                    </span>
                    <div className="ml-auto">
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`p-1 h-auto text-xs ${prescription.prescriptionLink ? 'text-green-50 hover:text-white' : 'text-green-200 cursor-not-allowed'}`}
                        onClick={() => {
                          if (prescription.prescriptionLink) {
                            window.open(prescription.prescriptionLink, '_blank');
                          }
                        }}
                        aria-disabled={!prescription.prescriptionLink}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {placeholders.map((_, idx) => (
              <div key={`ph-${idx}`} className="relative overflow-hidden rounded-lg border border-gray-200 bg-gray-100/70 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">Prescriptions will appear here after they are created.</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-200 text-gray-600">Pending</span>
                </div>
              </div>
            ))}
          </div>

          <Button onClick={() => setOpen(true)} className="w-full bg-secondary hover:bg-secondary/90 text-white rounded-xl py-2 shadow-lg hover:shadow-xl transition-all duration-300 group text-sm">
            <Plus className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform duration-200" />
            <span className="font-semibold">Create New Prescription</span>
          </Button>
        </div>
      </Card>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="relative z-10 w-[720px] max-w-[95vw] rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between px-5 py-3 border-b">
              <h3 className="text-lg font-semibold">Select Appointment</h3>
              <button className="text-gray-500 hover:text-gray-700" onClick={() => setOpen(false)} aria-label="Close">✕</button>
            </div>
            <div className="p-4 max-h-[70vh] overflow-y-auto">
              <ul className="divide-y">
                {appointments?.map((apt) => {
                  const hasPrescription = Boolean(apt.prescriptionLink);
                  const viewHref = apt.prescriptionLink || `/doctor/appointments/${apt.id}/prescription`;
                  return (
                    <li key={apt.id} className="py-2 flex items-center">
                      <div className="text-sm text-gray-800">Appointment #{apt.id} · {new Date(apt.date || apt.appointmentDate || '').toLocaleString()}</div>
                      <div className="flex items-center gap-2 ml-auto">
                        {hasPrescription && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(viewHref, '_blank')}
                          >
                            View
                          </Button>
                        )}
                        {hasPrescription ? (
                          <Button
                            size="sm"
                            className="w-44 shrink-0"
                            onClick={() => window.open(`/doctor/appointments/${apt.id}`, '_blank')}
                          >
                            Edit Prescription
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            className="w-44 shrink-0"
                            onClick={() => window.open(`/doctor/appointments/${apt.id}`, '_blank')}
                          >
                            Generate Prescription
                          </Button>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}