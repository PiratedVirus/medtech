'use client';

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Clock, Users, DollarSign, FileText, Activity, Award, Building } from "lucide-react";
import { format } from "date-fns";

interface DoctorDetails {
  id: number;
  user: {
    id: number;
    name: string;
    email: string;
    phoneNumber: string;
    status: string;
    clinic?: {
      id: number;
      name: string;
    };
  };
  specialty: string;
  yearsOfExperience: number;
  consultationFee: number;
  doctorCode: string;
  isDietician: boolean;
  createdAt: string;
  appointments: {
    id: number;
    date: string;
    status: string;
    consultationType: string;
    patient: {
      id: number;
      name: string;
      phoneNumber: string;
    };
    payment?: {
      amount: number;
      status: string;
      createdAt: string;
    };
  }[];
  availabilities: {
    id: number;
    date: string;
    startTime: string;
    endTime: string;
    status: string;
  }[];
  earnings: {
    total: number;
    thisMonth: number;
    lastMonth: number;
  };
  stats: {
    totalPatients: number;
    totalAppointments: number;
    completedAppointments: number;
    upcomingAppointments: number;
  };
}

export default function DoctorDetailsPage() {
  const [doctorDetails, setDoctorDetails] = useState<DoctorDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const { doctorId } = useParams();
  const router = useRouter();

  useEffect(() => {
    fetchDoctorDetails();
  }, [doctorId]);

  const fetchDoctorDetails = async () => {
    try {
      const response = await axios.get(`/api/admin/doctors/${doctorId}`);
      const raw = response.data;
      setDoctorDetails({
        ...raw,
        availabilities: raw.availability,
      });
    } catch (error) {
      console.error("Failed to fetch doctor details:", error);
      toast.error("Failed to fetch doctor details");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!doctorDetails) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg text-gray-600">Doctor not found</p>
      </div>
    );
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
    <div className="container mx-auto p-4 space-y-6">
      <ToastContainer />
      
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">{doctorDetails.user.name}</h1>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant={doctorDetails.user.status === "ACTIVE" ? "default" : "secondary"}>
              {doctorDetails.user.status}
            </Badge>
            <span className="text-gray-500">•</span>
            <span className="text-gray-600">{doctorDetails.specialty}</span>
            <span className="text-gray-500">•</span>
            <span className="text-gray-600">{doctorDetails.yearsOfExperience} years experience</span>
          </div>
        </div>
        <Button variant="outline" onClick={() => router.back()}>Back to Doctors</Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatsCard
          title="Total Earnings"
          value={`₹${doctorDetails.earnings.total.toLocaleString()}`}
          icon={DollarSign}
          trend={`+₹${doctorDetails.earnings.thisMonth.toLocaleString()} this month`}
        />
        <StatsCard
          title="Total Patients"
          value={doctorDetails.stats.totalPatients}
          icon={Users}
        />
        <StatsCard
          title="Completed Appointments"
          value={doctorDetails.stats.completedAppointments}
          icon={Activity}
        />
        <StatsCard
          title="Upcoming Appointments"
          value={doctorDetails.stats.upcomingAppointments}
          icon={Calendar}
        />
      </div>

      {/* Main Content */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="appointments">Appointments</TabsTrigger>
          <TabsTrigger value="availability">Availability</TabsTrigger>
          <TabsTrigger value="earnings">Earnings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Profile Information */}
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium">{doctorDetails.user.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <p className="font-medium">{doctorDetails.user.phoneNumber}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Clinic</p>
                    <p className="font-medium">{doctorDetails.user.clinic?.name || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Doctor Code</p>
                    <p className="font-medium">{doctorDetails.doctorCode}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Consultation Fee</p>
                    <p className="font-medium">₹{doctorDetails.consultationFee}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Joined On</p>
                    <p className="font-medium">{format(new Date(doctorDetails.createdAt), "PPP")}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {doctorDetails.appointments.slice(0, 5).map((appointment) => (
                    <div key={appointment.id} className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
                      <div>
                        <p className="font-medium">{appointment.patient.name}</p>
                        <p className="text-sm text-gray-500">
                          {format(new Date(appointment.date), "PPP")} • {appointment.consultationType}
                        </p>
                      </div>
                      <Badge variant={appointment.status === "COMPLETED" ? "default" : "secondary"}>
                        {appointment.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="appointments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Appointments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {doctorDetails.appointments.map((appointment) => (
                  <div key={appointment.id} className="flex items-center justify-between p-4 rounded-lg border">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{appointment.patient.name}</h3>
                        <Badge variant={appointment.status === "COMPLETED" ? "default" : "secondary"}>
                          {appointment.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-500">
                        {format(new Date(appointment.date), "PPP")} • {appointment.consultationType}
                      </p>
                      <p className="text-sm text-gray-500">Phone: {appointment.patient.phoneNumber}</p>
                    </div>
                    {appointment.payment && (
                      <div className="text-right">
                        <p className="font-medium">₹{appointment.payment.amount}</p>
                        <p className="text-sm text-gray-500">
                          {format(new Date(appointment.payment.createdAt), "PPP")}
                        </p>
                        <Badge variant={appointment.payment.status === "PAID" ? "default" : "secondary"}>
                          {appointment.payment.status}
                        </Badge>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="availability" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Availability Schedule</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {doctorDetails.availabilities.map((availability) => (
                  <div key={availability.id} className="flex items-center justify-between p-4 rounded-lg border">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-primary/10 rounded-full">
                        <Calendar className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{format(new Date(availability.date), "PPP")}</p>
                        <p className="text-sm text-gray-500">
                          {availability.startTime} - {availability.endTime}
                        </p>
                      </div>
                    </div>
                    <Badge variant={availability.status === "AVAILABLE" ? "default" : "secondary"}>
                      {availability.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="earnings" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Earnings Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Total Earnings</p>
                    <p className="text-2xl font-bold">₹{doctorDetails.earnings.total.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">This Month</p>
                    <p className="text-2xl font-bold">₹{doctorDetails.earnings.thisMonth.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Last Month</p>
                    <p className="text-2xl font-bold">₹{doctorDetails.earnings.lastMonth.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Average per Appointment</p>
                    <p className="text-2xl font-bold">
                      ₹{Math.round(doctorDetails.earnings.total / doctorDetails.stats.completedAppointments).toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Payment History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {doctorDetails.appointments
                    .filter(a => a.payment)
                    .map((appointment) => (
                      <div key={appointment.id} className="flex items-center justify-between p-4 rounded-lg border">
                        <div>
                          <p className="font-medium">{appointment.patient.name}</p>
                          <p className="text-sm text-gray-500">
                            {format(new Date(appointment.date), "PPP")}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">₹{appointment.payment?.amount}</p>
                          <Badge variant={appointment.payment?.status === "PAID" ? "default" : "secondary"}>
                            {appointment.payment?.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 