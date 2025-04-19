'use client'
import { useState, useEffect } from "react";
import axios from "axios";
import { useRouter, useParams } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

const PatientDetailsPage = () => {
  const [patientDetails, setPatientDetails] = useState(null);
  const router = useRouter();
  const { patientId } = useParams();

  useEffect(() => {
    const fetchPatientDetails = async () => {
      try {
        const response = await axios.get(`/api/admin-dashboard/new-patients?patientId=${patientId}`);
        setPatientDetails(response.data);
      } catch (error) {
        console.error("Failed to fetch patient details:", error);
      }
    };

    fetchPatientDetails();
  }, [patientId]);

  const handleFileUpload = (e, id, type) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // implement upload logic based on `type`
  };

  if (!patientDetails) {
    return <p>Loading...</p>;
  }

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>Patient: {patientDetails.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Basic Information</h3>
              <p><strong>Email:</strong> {patientDetails.email}</p>
              <p><strong>Joined On:</strong> {new Date(patientDetails.joinedOn).toLocaleDateString()}</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Current Plan</h3>
              {patientDetails.plans.length > 0 ? (
                <div>
                  <p><strong>Plan:</strong> {patientDetails.plans[0].planName}</p>
                  <p><strong>Subscribed:</strong> {new Date(patientDetails.plans[0].startDate).toLocaleDateString()}</p>
                  <p><strong>Expiry:</strong> {new Date(patientDetails.plans[0].endDate).toLocaleDateString()}</p>
                  <p><strong>Active:</strong> {patientDetails.plans[0].isActive ? 'Yes' : 'No'}</p>
                </div>
              ) : <p>No active plan</p>}
            </div>
          </div>

          <Tabs defaultValue="doctor" className="mt-6">
            <TabsList>
              <TabsTrigger value="doctor">Doctor Appointments</TabsTrigger>
              <TabsTrigger value="dietician">Dietician Appointments</TabsTrigger>
              <TabsTrigger value="lab">Lab Reports</TabsTrigger>
            </TabsList>
            <TabsContent value="doctor">
              {patientDetails.doctorAppointments.map(a => (
                <div key={a.id} className="p-4 border-b">
                  <p><strong>Date:</strong> {new Date(a.date).toLocaleString()}</p>
                  <p><strong>Type:</strong> {a.type}</p>
                  <p><strong>Status:</strong> {a.status}</p>
                  {a.prescriptionLink
                    ? <a href={a.prescriptionLink} target="_blank">View Prescription</a>
                    : <Input type="file" onChange={e => handleFileUpload(e, a.id, 'prescription')} />
                  }
                </div>
              ))}
            </TabsContent>
            <TabsContent value="dietician">
              {patientDetails.dieticianAppointments.map(a => (
                <div key={a.id} className="p-4 border-b">
                  <p><strong>Date:</strong> {new Date(a.date).toLocaleString()}</p>
                  <p><strong>Type:</strong> {a.type}</p>
                  <p><strong>Status:</strong> {a.status}</p>
                  {a.dietPlanLink
                    ? <a href={a.dietPlanLink} target="_blank">View Diet Plan</a>
                    : <Input type="file" onChange={e => handleFileUpload(e, a.id, 'dietplan')} />
                  }
                </div>
              ))}
            </TabsContent>
            <TabsContent value="lab">
              {patientDetails.labBookings.map(lb => (
                <div key={lb.id} className="p-4 border-b">
                  <p><strong>Date:</strong> {new Date(lb.date).toLocaleDateString()}</p>
                  <p><strong>Package:</strong> {lb.labPackageName}</p>
                  <p><strong>Status:</strong> {lb.status}</p>
                  {lb.reportLink
                    ? <a href={lb.reportLink} target="_blank">View Report</a>
                    : <Input type="file" onChange={e => handleFileUpload(e, lb.id, 'labreport')} />
                  }
                </div>
              ))}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default PatientDetailsPage;
