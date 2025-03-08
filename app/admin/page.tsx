"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import UsersPage from "@/app/admin/users/page"; 
import ClincsPafe from "@/app/admin/clinics/page";
import AppointmentsPage from "@/app/admin/appointments/page";
import DieticiansPage from "@/app/admin/dieticians/page";
import DoctorsPage from "@/app/admin/doctors/page";
import LabsPage from "@/app/admin/labs/page";
import MedicinesPage from "@/app/admin/medicines/page";
import PaymentsPage from "@/app/admin/payments/page";
import PrescriptionsPage from "@/app/admin/prescriptions/page";
export default function AdminPage() {
  return (
    <div className="container mx-auto p-4">
      <Tabs defaultValue="users">
        <div className="flex justify-center">

          <TabsList className="mb-4">
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="clinics">Clinics</TabsTrigger>
            <TabsTrigger value="appointments">Appointments</TabsTrigger>
            <TabsTrigger value="dieticians">Dieticians</TabsTrigger>
            <TabsTrigger value="doctors">Doctors</TabsTrigger>
            <TabsTrigger value="labs">Labs</TabsTrigger>
            <TabsTrigger value="medicines">Medicines</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
            <TabsTrigger value="prescriptions">Prescriptions</TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="users">
          <UsersPage />
        </TabsContent>
        <TabsContent value="clinics">
          <p>Clinics page content goes here.</p>
        </TabsContent>
        <TabsContent value="appointments">
          <p>Appointments page content goes here.</p>
        </TabsContent>
        <TabsContent value="dieticians">
          <p>Dieticians page content goes here.</p>
        </TabsContent>
        <TabsContent value="doctors">
          <DoctorsPage />
        </TabsContent>
        <TabsContent value="labs">
          <p>Labs page content goes here.</p>
        </TabsContent>
        <TabsContent value="medicines">
          <p>Medicines page content goes here.</p>
        </TabsContent>
        <TabsContent value="payments">
          <p>Payments page content goes here.</p>
        </TabsContent>
        <TabsContent value="prescriptions">
          <p>Prescriptions page content goes here.</p>
        </TabsContent>
      </Tabs>
    </div>
  );
}