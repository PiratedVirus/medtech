"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import UsersPage from "@/app/admin/users/page"; 
import ClincsPage from "@/app/admin/clinics/page";
import AppointmentsPage from "@/app/admin/appointments/page";
import DieticiansPage from "@/app/admin/dieticians/page";
import DoctorsPage from "@/app/admin/doctors/page";
import LabsPage from "@/app/admin/labs/page";
import PaymentsPage from "@/app/admin/payments/page";
import SlotsPage from "@/app/admin/slots/page";
import PlansPage from "@/app/admin/plans/page";

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
            <TabsTrigger value="payments">Payments</TabsTrigger>
            <TabsTrigger value="prescriptions">Prescriptions</TabsTrigger>
            <TabsTrigger value="slots">Slots</TabsTrigger>
            <TabsTrigger value="plans">Plans</TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="clinics">
          <ClincsPage/>
        </TabsContent>
        <TabsContent value="users">
          <UsersPage />
        </TabsContent>
        <TabsContent value="doctors">
          <DoctorsPage />
        </TabsContent>
   

        <TabsContent value="dieticians">
          <DieticiansPage/>
        </TabsContent>

        <TabsContent value="labs">
          <LabsPage/>
        </TabsContent>
        <TabsContent value="appointments">
          <AppointmentsPage/>
        </TabsContent>
        <TabsContent value="slots">
          <SlotsPage/>
        </TabsContent>
        <TabsContent value="payments">
          <PaymentsPage/>
        </TabsContent>
        <TabsContent value="plans">
          <PlansPage/>
        </TabsContent>
     
      </Tabs>
    </div>
  );
}
