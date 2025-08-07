// Doctor Home Page
'use client'
import DoctorUpcomingAppointment from '@/components/doctors/home/DoctorUpcomingAppointment';
import DoctorQuickActions from '@/components/doctors/home/DoctorQuickActions';
import DoctorActivePatients from '@/components/doctors/home/DoctorActivePatients';
import DoctorDashboardActionCard from "@/components/ui/custom/cd-doctor-dashboard-action-card";
import { BicepsFlexed, FileText, LineChart, Users, Video, VideoIcon, Videotape, VideotapeIcon } from "lucide-react"
import { useDecryptedProfile } from '@/hooks/use-profile';

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export default function DoctorDashboardPage() {
  const { profile } = useDecryptedProfile();
  const doctorName = profile?.name || 'Doctor';

  return (
    <div className="min-h-screen bg-[#F8FAF9] px-8 py-8">
      {/* Top Row: Upcoming Appointment, Earnings, Manage Slots */}
      <div className="text-3xl font-bold text-[#134F30] mb-4">
          {getGreeting()}, Dr. {doctorName}! 
        </div>
      <div className="grid grid-cols-12 gap-6 mb-8 items-stretch">
        <div className="col-span-12 md:col-span-6 flex flex-col">

          <div className="col-span-6">
            <DoctorUpcomingAppointment />
          </div>
          <div className="flex flex-row gap-4">
            {/* wrap each card in a flex-item that can grow */}
            <div className="flex-1">
              <DoctorDashboardActionCard
                href="/dashboard/insights"
                headerLabel="Patient Analytics"
                cardTitle="View Patients Info"
                cardDescription="Personalized analysis of your patients health"
                PrimaryIcon={Users}
                OutlineIcon={Users}
              />
            </div>

            <div className="flex-1">
              <DoctorDashboardActionCard
                href="/dashboard/dieticians"
                headerLabel="Video Consultation"
                cardTitle="Join meet room"
                cardDescription="Single meet link for all video consultations"
                PrimaryIcon={Video}
                OutlineIcon={VideotapeIcon}
              />
            </div>
          </div>
        </div>
        <div className="col-span-12 sm:col-span-6 md:col-span-3">
          <DoctorQuickActions type="earnings" />
        </div>
        <div className="col-span-12 sm:col-span-6 md:col-span-3">
          <DoctorQuickActions type="slots" />
        </div>
      </div>
      {/* Active Patients */}
      <DoctorActivePatients />
    </div>
  );
} 