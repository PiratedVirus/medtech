'use client'
import { useMemo, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CalendarDays, Maximize2 } from 'lucide-react'

interface Appointment {
  id: number
  date: string
  status?: string
  prescriptionLink?: string | null
}

interface PastAppointmentRowProps {
  appointments: Appointment[]
  patientId: string
}

export default function PastAppointmentRow({ appointments, patientId }: PastAppointmentRowProps) {
  const [open, setOpen] = useState(false)

  const sorted = useMemo(() => {
    return [...(appointments || [])]
      .filter(a => !!a?.date)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [appointments])

  const recent = sorted.slice(0, 3)

  return (
    <Card className="col-span-6 relative overflow-hidden rounded-xl bg-gray-50/80 p-4 shadow-sm border border-gray-100 h-16">
      <div className="absolute inset-0 bg-gradient-to-br from-gray-50/50 to-gray-100/30 rounded-xl" />

      {sorted.length > 0 && (
        <div className="absolute top-2 right-2 z-30 translate-x-1 md:translate-x-0">
          <div className="group relative">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-gray-500 hover:text-secondary hover:bg-secondary/10 rounded"
              title="View all appointments"
              onClick={() => setOpen(true)}
            >
              <Maximize2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      )}

      <div className="relative z-10 flex items-center justify-between h-full pr-12">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-bold text-gray-900">Past Appointments</h3>
        </div>

        <div className="flex gap-2 mr-12 md:mr-8">
          {recent.map(apt => (
            <Button
              key={apt.id}
              variant="ghost"
              size="sm"
              className="font-semibold text-xs text-secondary hover:bg-secondary/20 hover:text-secondary bg-secondary/10 border border-secondary/10 rounded-lg px-3 py-2 h-auto"
              title={`Appointment #${apt.id}`}
            >
              <CalendarDays className="h-3 w-3 mr-1" />
               {new Date(apt.date).toLocaleDateString('en-GB')}
            </Button>
          ))}

          {recent.length === 0 && (
            <div className="text-center">
              <p className="text-xs text-gray-500">No past appointments</p>
            </div>
          )}
        </div>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="relative z-10 w-[720px] max-w-[95vw] rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between px-5 py-3 border-b">
              <h3 className="text-lg font-semibold">All Appointments</h3>
              <Button variant="ghost" size="sm" onClick={() => setOpen(false)} aria-label="Close">✕</Button>
            </div>
            <div className="p-4 max-h-[70vh] overflow-y-auto">
              {sorted.length === 0 ? (
                <div className="text-sm text-gray-500">No appointments available.</div>
              ) : (
                <ul className="divide-y">
                  {sorted.map(apt => (
                    <li key={apt.id} className="py-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CalendarDays className="h-4 w-4 text-secondary" />
                        <span className="text-sm font-medium text-gray-800">Appointment #{apt.id}</span>
                      </div>
                      <div className="text-xs text-gray-600">
                        {new Date(apt.date).toLocaleString()}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </Card>
  )
}


