import type { Metadata } from "next"
import Link from "next/link"
import { BarChart3, CalendarPlus, Clock, DollarSign, FlaskConical, UserPlus, Users } from "lucide-react"
import { useState, useEffect } from "react"
import axios from "axios"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AppointmentsTable } from "@/components/admin/appointments-table"
import { LabBookingsTable } from "@/components/admin/lab-bookings-table"
import { NewPatientsTable } from "@/components/admin/new-patients-table"
import { NotificationsList } from "@/components/admin/notifications-list"
import { SummaryCard } from "@/components/admin/summary-card"

export const metadata: Metadata = {
  title: "Dashboard | MedTech Clinic Admin",
  description: "Clinic administration dashboard",
}

export default function DashboardPage() {
  const [summaryData, setSummaryData] = useState({
    totalPatients: 0,
    activeSubscriptions: 0,
    todaysAppointments: 0,
    labBookingsPending: 0,
    monthlyRevenue: 0,
    newSignupsThisWeek: 0,
  });

  useEffect(() => {
    const fetchSummaryData = async () => {
      try {
        const response = await axios.get("/api/admin-dashboard/summary");
        setSummaryData(response.data);
      } catch (error) {
        console.error("Failed to fetch summary data:", error);
      }
    };

    fetchSummaryData();
  }, []);

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between space-y-2 px-2 pt-6 md:px-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">Overview of your clinic's performance and activities</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button asChild>
            <Link href="/appointments/new">
              <CalendarPlus className="mr-2 h-4 w-4" />
              New Appointment
            </Link>
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="mt-4 grid gap-4 px-2 md:px-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <SummaryCard
          title="Total Patients"
          value={summaryData.totalPatients.toString()}
          trend="+12% from last month"
          PrimaryIcon={Users}
          OutlineIcon={Users}
          accentColor="#F28A2E"
          primaryIconColor="#134F30"
        />
        <SummaryCard
          title="Active Subscriptions"
          value={summaryData.activeSubscriptions.toString()}
          trend="+5.2% from last month"
          PrimaryIcon={BarChart3}
          OutlineIcon={BarChart3}
          accentColor="#F28A2E"
          primaryIconColor="#134F30"
        />
        <SummaryCard
          title="Today's Appointments"
          value={summaryData.todaysAppointments.toString()}
          trend="6 more than yesterday"
          PrimaryIcon={Clock}
          OutlineIcon={Clock}
          accentColor="#F28A2E"
          primaryIconColor="#134F30"
        />
        <SummaryCard
          title="Lab Bookings Pending"
          value={summaryData.labBookingsPending.toString()}
          trend="4 require immediate attention"
          PrimaryIcon={FlaskConical}
          OutlineIcon={FlaskConical}
          accentColor="#F28A2E"
          primaryIconColor="#134F30"
        />
        <SummaryCard
          title="Monthly Revenue"
          value={`$${summaryData.monthlyRevenue.toString()}`}
          trend="+20.1% from last month"
          PrimaryIcon={DollarSign}
          OutlineIcon={DollarSign}
          accentColor="#F28A2E"
          primaryIconColor="#134F30"
        />
        <SummaryCard
          title="New Sign-ups This Week"
          value={summaryData.newSignupsThisWeek.toString()}
          trend="+12 from previous week"
          PrimaryIcon={UserPlus}
          OutlineIcon={UserPlus}
          accentColor="#F28A2E"
          primaryIconColor="#134F30"
        />
      </div>

      <div className="grid gap-4 px-2 md:px-4 md:grid-cols-3 mt-4">
        {/* Upcoming Appointments (moved to where Quick Actions was) */}
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Appointments</CardTitle>
              <CardDescription>View and manage upcoming patient appointments</CardDescription>
            </CardHeader>
            <CardContent>
              <AppointmentsTable />
            </CardContent>
          </Card>
        </div>

        {/* Notifications Section */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
            <CardDescription>Important alerts</CardDescription>
          </CardHeader>
          <CardContent>
            <NotificationsList />
          </CardContent>
        </Card>
      </div>

      {/* Tables Section */}
      <div className="mt-4 grid gap-4 px-2 md:px-4">
        <div className="grid md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Lab Bookings</CardTitle>
              <CardDescription>View and manage recent laboratory test bookings</CardDescription>
            </CardHeader>
            <CardContent>
              <LabBookingsTable />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>New Patients This Week</CardTitle>
              <CardDescription>Patients who registered in the last 7 days</CardDescription>
            </CardHeader>
            <CardContent>
              <NewPatientsTable />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
