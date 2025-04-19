"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";

const DashboardPage = () => {
  const [data, setData] = useState({
    upcomingAppointments: [],
    upcomingLabBookings: [],
    totalEarnings: 0,
    userStatistics: {},
    recentActivities: [],
    systemHealthStatus: {},
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get("/api/admin/insights");
        setData(response.data);
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="container mx-auto p-4 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Total Earnings</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">${data.totalEarnings}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Appointments</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient</TableHead>
                  <TableHead>Doctor</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.upcomingAppointments.map((appointment) => (
                  <TableRow key={appointment.id}>
                    <TableCell>{appointment.patientName}</TableCell>
                    <TableCell>{appointment.doctorName}</TableCell>
                    <TableCell>{appointment.date}</TableCell>
                    <TableCell>{appointment.time}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Lab Bookings</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient</TableHead>
                  <TableHead>Lab</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.upcomingLabBookings.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell>{booking.patientName}</TableCell>
                    <TableCell>{booking.labName}</TableCell>
                    <TableCell>{booking.date}</TableCell>
                    <TableCell>{booking.time}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
      <Tabs defaultValue="userStatistics">
        <TabsList>
          <TabsTrigger value="userStatistics">User Statistics</TabsTrigger>
          <TabsTrigger value="recentActivities">Recent Activities</TabsTrigger>
          <TabsTrigger value="systemHealthStatus">System Health Status</TabsTrigger>
        </TabsList>
        <TabsContent value="userStatistics">
          <Card>
            <CardHeader>
              <CardTitle>User Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <pre>{JSON.stringify(data.userStatistics, null, 2)}</pre>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="recentActivities">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activities</CardTitle>
            </CardHeader>
            <CardContent>
              <ul>
                {data.recentActivities.map((activity, index) => (
                  <li key={index}>{activity}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="systemHealthStatus">
          <Card>
            <CardHeader>
              <CardTitle>System Health Status</CardTitle>
            </CardHeader>
            <CardContent>
              <pre>{JSON.stringify(data.systemHealthStatus, null, 2)}</pre>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DashboardPage;
