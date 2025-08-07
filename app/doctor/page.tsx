"use client";

import { useEffect, useState } from "react";
import { useDecryptedProfile } from "@/hooks/use-profile";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Users, DollarSign, Clock, Video } from "lucide-react";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import CdLoader from "@/components/ui/custom/cd-loader";

interface DoctorStats {
  totalAppointments: number;
  upcomingAppointments: number;
  totalPatients: number;
  totalEarnings: number;
}

interface Appointment {
  id: number;
  patient: {
    id: number;
    name: string;
    phoneNumber: string;
  };
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  consultationType: string;
  meetingRoomLink?: string;
  payment?: {
    amount: number;
    status: string;
  };
}

export default function DoctorDashboard() {
  const { profile, isLoading: profileLoading } = useDecryptedProfile();
  const [stats, setStats] = useState<DoctorStats | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [statsResponse, appointmentsResponse] = await Promise.all([
          axios.get("/api/doctor/stats"),
          axios.get("/api/doctor/appointments/upcoming"),
        ]);

        if (statsResponse.data) {
          setStats(statsResponse.data);
        }

        if (appointmentsResponse.data) {
          setAppointments(appointmentsResponse.data);
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        toast.error("Failed to load dashboard data");
      } finally {
        setIsLoading(false);
      }
    };

    if (!profileLoading) {
      fetchDashboardData();
    }
  }, [profileLoading]);

  const handleJoinMeeting = (meetingRoomLink: string) => {
    window.open(meetingRoomLink, "_blank");
  };

  const handleViewPatient = (patientId: number) => {
    router.push(`/doctor/patients/${patientId}`);
  };

  if (profileLoading || isLoading) {
    return <CdLoader />;
  }

  const StatsCard = ({ title, value, icon: Icon, trend }: { title: string; value: string | number; icon: any; trend?: string }) => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <h3 className="text-2xl font-bold mt-1">{value}</h3>
            {trend && <p className="text-sm text-green-600 mt-1">{trend}</p>}
          </div>
          <div className="p-3 bg-primary/10 rounded-full">
            <Icon className="h-6 w-6 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <Button onClick={() => router.push("/doctor/appointments")}>
          View All Appointments
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Appointments"
          value={stats?.totalAppointments || 0}
          icon={Calendar}
        />
        <StatsCard
          title="Upcoming Appointments"
          value={stats?.upcomingAppointments || 0}
          icon={Clock}
        />
        <StatsCard
          title="Total Patients"
          value={stats?.totalPatients || 0}
          icon={Users}
        />
        <StatsCard
          title="Total Earnings"
          value={`₹${stats?.totalEarnings || 0}`}
          icon={DollarSign}
        />
      </div>

      {/* Upcoming Appointments */}
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Appointments</CardTitle>
        </CardHeader>
        <CardContent>
          {appointments.length > 0 ? (
            <div className="space-y-4">
              {appointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="flex items-center justify-between p-4 bg-white rounded-lg border"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-4">
                      <div>
                        <h3 className="font-medium">{appointment.patient.name}</h3>
                        <p className="text-sm text-gray-500">
                          {format(new Date(appointment.date), "MMM d, yyyy")} at{" "}
                          {appointment.startTime}
                        </p>
                        <p className="text-sm text-gray-500">
                          {appointment.consultationType === "video" ? "Video Consultation" : "In-person Consultation"}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {appointment.consultationType === "video" && appointment.meetingRoomLink && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleJoinMeeting(appointment.meetingRoomLink!)}
                      >
                        <Video className="w-4 h-4 mr-2" />
                        Join Meeting
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewPatient(appointment.patient.id)}
                    >
                      View Patient
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-4">No upcoming appointments</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 