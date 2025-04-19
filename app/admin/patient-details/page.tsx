import { useState, useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/router";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const PatientDetailsPage = ({ patientId }) => {
  const [patientDetails, setPatientDetails] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const fetchPatientDetails = async () => {
      try {
        const response = await axios.get(`/api/admin-dashboard/patient-details/${patientId}`);
        setPatientDetails(response.data);
      } catch (error) {
        console.error("Failed to fetch patient details:", error);
      }
    };

    fetchPatientDetails();
  }, [patientId]);

  if (!patientDetails) {
    return <p>Loading...</p>;
  }

  return (
    <div className="container mx-auto p-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>{patientDetails.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Email: {patientDetails.email}</p>
          <p>Joined On: {new Date(patientDetails.joinedOn).toLocaleDateString()}</p>
          <p>Plan: {patientDetails.plan}</p>
          <p>Subscribed On: {patientDetails.subscribedOn}</p>
          <p>Expiry Date: {patientDetails.expiryDate}</p>
          <p>Next Appointment: {patientDetails.nextAppointment}</p>
          <p>Plan Usage: {patientDetails.planUsage}</p>
          <p>Lab Bookings: {patientDetails.labBookings}</p>
          <p>Appointments: {patientDetails.appointments}</p>
        </CardContent>
        <CardFooter>
          <div>
            <label>Upload Lab Reports</label>
            <Input type="file" />
          </div>
          <div>
            <label>Upload Diet Plan</label>
            <Input type="file" />
          </div>
          <div>
            <label>Upload Prescription</label>
            <Input type="file" />
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default PatientDetailsPage;
