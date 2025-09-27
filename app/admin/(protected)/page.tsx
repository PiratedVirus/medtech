'use client'
import type { Metadata } from "next"
import Link from "next/link"
import { BarChart3, CalendarPlus, Clock, DollarSign, FlaskConical, IndianRupee, UserPlus, Users } from "lucide-react"
import { useState, useEffect } from "react"
import axios from "axios"
import { fetchWithCacheBusting, clearAdminCache } from "@/lib/admin-api-client"
import { useAdminCache } from "@/hooks/use-admin-cache"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AppointmentsTable } from "@/components/admin/AppointmentsTable"
import { LabBookingsTable } from "@/components/admin/LabBookingsTable"
import { PatientViewCard } from "@/components/admin/PatientViewCard"
import { NotificationsList } from "@/components/admin/NotificationsList"
import { SummaryCard } from "@/components/admin/SummaryCard"
import NotificationTestPanel from "@/components/admin/NotificationTestPanel"



export default function DashboardPage() {
  const [summaryData, setSummaryData] = useState({
    totalPatients: 0,
    activeSubscriptions: 0,
    todaysAppointments: 0,
    labBookingsPending: 0,
    monthlyRevenue: 0,
    newSignupsThisWeek: 0,
  });
  const [patients, setPatients] = useState<Array<{ id: number; name: string; phoneNumber: string }>>([]);
  const { clearCache, forceRefresh } = useAdminCache();

  useEffect(() => {
    const fetchSummaryData = async () => {
      try {
        // Use cache-busting utility to prevent stale data
        const response = await fetchWithCacheBusting("/api/admin/optimized/dashboard-summary");
        console.log("Summary API response:", response.data);
        setSummaryData(response.data);
      } catch (error) {
        console.error("Optimized summary failed, falling back:", error);
        try {
          // Fallback to non-optimized endpoint with cache-busting
          const fallback = await fetchWithCacheBusting("/api/admin/dashboard/summary");
          console.log("Fallback summary response:", fallback.data);
          setSummaryData(fallback.data);
        } catch (fallbackError) {
          console.error("Cache-busting fallback failed, trying regular axios:", fallbackError);
          try {
            // Final fallback to regular axios
            const regularFallback = await axios.get("/api/admin/dashboard/summary");
            console.log("Regular axios fallback response:", regularFallback.data);
            setSummaryData(regularFallback.data);
          } catch (finalError) {
            console.error("All summary endpoints failed:", finalError);
            // Set default values on complete failure
            setSummaryData({
              totalPatients: 0,
              activeSubscriptions: 0,
              todaysAppointments: 0,
              labBookingsPending: 0,
              monthlyRevenue: 0,
              newSignupsThisWeek: 0,
            });
          }
        }
      }
    };

    const fetchPatients = async () => {
      try {
        // Use cache-busting utility to prevent stale data
        const response = await fetchWithCacheBusting("/api/admin/patients");
        console.log("Patients API response:", response.data);
        setPatients(response.data.data || []);
      } catch (error) {
        console.error("Cache-busting patients failed, trying regular axios:", error);
        try {
          // Fallback to regular axios
          const regularResponse = await axios.get("/api/admin/patients");
          console.log("Regular patients response:", regularResponse.data);
          setPatients(regularResponse.data.data || []);
        } catch (fallbackError) {
          console.error("All patients endpoints failed:", fallbackError);
          // Set empty array on error to prevent undefined
          setPatients([]);
        }
      }
    };

    fetchSummaryData();
    fetchPatients();
  }, []);

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between space-y-2 px-2 pt-6 md:px-4">
        <div>
          <p className="text-muted-foreground">Overview of your clinic's performance and activities</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            onClick={forceRefresh}
            title="Clear cache and refresh data"
          >
             Refresh Data
          </Button>
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
          trend=""
          PrimaryIcon={Users}
          OutlineIcon={Users}
          accentColor="#F28A2E"
          primaryIconColor="#134F30"
        />
        <SummaryCard
          title="Active Subscriptions"
          value={summaryData.activeSubscriptions.toString()}
          trend=""
          PrimaryIcon={BarChart3}
          OutlineIcon={BarChart3}
          accentColor="#F28A2E"
          primaryIconColor="#134F30"
        />
        <SummaryCard
          title="Today's Appointments"
          value={summaryData.todaysAppointments.toString()}
          trend=""
          PrimaryIcon={Clock}
          OutlineIcon={Clock}
          accentColor="#F28A2E"
          primaryIconColor="#134F30"
        />
        <SummaryCard
          title="Lab Bookings Pending"
          value={summaryData.labBookingsPending.toString()}
          trend=""
          PrimaryIcon={FlaskConical}
          OutlineIcon={FlaskConical}
          accentColor="#F28A2E"
          primaryIconColor="#134F30"
        />
        <SummaryCard
          title="Monthly Revenue"
          value={`₹ ${(summaryData.monthlyRevenue/100).toString()}`}
          trend=""
          PrimaryIcon={IndianRupee}
          OutlineIcon={IndianRupee}
          accentColor="#F28A2E"
          primaryIconColor="#134F30"
        />
        <SummaryCard
          title="New Sign-ups This Week"
          value={summaryData.newSignupsThisWeek.toString()}
          trend=""
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
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Recent Lab Bookings</CardTitle>
                  <CardDescription>View and manage recent laboratory test bookings</CardDescription>
                </div>
                <Button asChild variant="outline" size="sm">
                  <Link href="/admin/lab-bookings">
                    Manage Lab Bookings
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <LabBookingsTable />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>New Patients This Week</CardTitle>
                  <CardDescription>Patients who registered in the last 7 days</CardDescription>
                </div>
                <Button asChild variant="outline" size="sm">
                  <Link href="/admin/patients">
                    View All Patients
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <PatientViewCard />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
