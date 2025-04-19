'use client'
import { User, Calendar, Phone, Heart, Droplet, Activity, Ruler, Scale } from "lucide-react";
import { Badge } from "@/components/ui/badge";
 
import PlanUsage, { PlanUsageMinimal } from "@/components/patients/plans/PlanUsage";
import { useState, useEffect } from "react";
import axios from "axios";
import { useRouter, useParams } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
// Removed Tabs imports as they are no longer used

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

  const [planUsage, setPlanUsage] = useState(null);
  
  useEffect(() => {
    if (patientDetails?.plans?.[0]?.id) {
      axios
        .get(`/api/plans/planUsage?subscriptionId=${patientDetails.plans[0].id}`)
        .then(res => setPlanUsage(res.data.data.subscriptionTracker))
        .catch(err => console.error("Failed to fetch plan usage:", err));
    }
  }, [patientDetails]);

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
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-2xl font-bold">{patientDetails.name}</h2>
          <p className="text-gray-600">
            Member since {new Date(patientDetails.joinedOn).toLocaleDateString()}
          </p>
        </div>
        {patientDetails.plans.length > 0 && (
          <div className="text-sm bg-muted rounded px-3 py-1">
            Subscribed to <strong>{patientDetails.plans[0].planName}</strong> till{" "}
            {new Date(patientDetails.plans[0].endDate).toLocaleDateString()}
          </div>
        )}
      </div>

      {/* Dashboard Grid */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-2">
        {/* Patient Info */}
        <Card className="relative overflow-hidden border rounded-lg bg-gradient-to-tr from-orange-600 to-orange-400 text-white p-6">
          {/* Background icon */}
          <div className="absolute -right-10 -top-6 opacity-10">
            <User size={200} />
          </div>
          {/* Content */}
          <div className="relative space-y-4">
            <div className="flex items-center gap-3">
              <User className="w-6 h-6" />
              <span className="text-lg font-semibold">Patient Overview</span>
            </div>
            <div className="flex flex-wrap gap-2 mt-4">
              <div className="flex items-center gap-1.5 rounded-full bg-white/30 px-3 py-2 text-sm backdrop-blur-sm">
                <Calendar className="h-4 w-4 flex-shrink-0" />
                <span className="text-xs text-white/80">Age:</span>
                <span className="font-semibold">{patientDetails.profile.age} yrs</span>
              </div>
              <div className="flex items-center gap-1.5 rounded-full bg-white/30 px-3 py-2 text-sm backdrop-blur-sm">
                <Scale className="h-4 w-4 flex-shrink-0" />
                <span className="text-xs text-white/80">Weight:</span>
                <span className="font-semibold">{patientDetails.profile.weight} kg</span>
              </div>
              <div className="flex items-center gap-1.5 rounded-full bg-white/30 px-3 py-2 text-sm backdrop-blur-sm">
                <Ruler className="h-4 w-4 flex-shrink-0" />
                <span className="text-xs text-white/80">Height:</span>
                <span className="font-semibold">{patientDetails.profile.height} cm</span>
              </div>
              <div className="flex items-center gap-1.5 rounded-full bg-white/30 px-3 py-2 text-sm backdrop-blur-sm">
                <Activity className="h-4 w-4 flex-shrink-0" />
                <span className="text-xs text-white/80">Gender:</span>
                <span className="font-semibold">{patientDetails.profile.gender}</span>
              </div>
              <div className="flex items-center gap-1.5 rounded-full bg-white/30 px-3 py-2 text-sm backdrop-blur-sm">
                <Droplet className="h-4 w-4 flex-shrink-0" />
                <span className="text-xs text-white/80">Allergies:</span>
                <span className="font-semibold">{patientDetails.profile.allergies || 'None'}</span>
              </div>
              <div className="flex items-center gap-1.5 rounded-full bg-white/30 px-3 py-2 text-sm backdrop-blur-sm">
                <Heart className="h-4 w-4 flex-shrink-0" />
                <span className="text-xs text-white/80">Medical History:</span>
                <span className="font-semibold">{patientDetails.profile.medicalHistory || 'N/A'}</span>
              </div>
              <div className="flex items-center gap-1.5 rounded-full bg-white/30 px-3 py-2 text-sm backdrop-blur-sm">
                <Phone className="h-4 w-4 flex-shrink-0" />
                <span className="text-xs text-white/80">Emergency Contact:</span>
                <span className="font-semibold">{patientDetails.profile.emergencyContact}</span>
              </div>
              <div className="flex items-center gap-1.5 rounded-full bg-white/30 px-3 py-2 text-sm backdrop-blur-sm">
                <Calendar className="h-4 w-4 flex-shrink-0" />
                <span className="text-xs text-white/80">Date of Birth:</span>
                <span className="font-semibold">
                  {patientDetails.profile.dateOfBirth
                    ? new Date(patientDetails.profile.dateOfBirth).toLocaleDateString()
                    : 'N/A'}
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Plan Usage */}
        <div className="border rounded-lg p-4 bg-muted">
          <h3 className="font-semibold mb-2">Plan Usage</h3>
          <PlanUsageMinimal
            userId={patientDetails.id}
            subscriptionId={patientDetails.plans[0]?.id}
          />
        </div>

        {/* Lab Reports */}
        <div className="border rounded-lg p-4 bg-muted">
          <h3 className="font-semibold mb-2">Lab Reports</h3>
          {patientDetails.labBookings.map(lb => (
            <div key={lb.id} className="border rounded p-3 flex justify-between items-center mb-2">
              <div>
                <p><strong>{lb.labPackageName}</strong></p>
                <p>Booked: {new Date(lb.date).toLocaleDateString()}</p>
                <p>Status: {lb.status}</p>
              </div>
              {lb.reportLink
                ? <Button variant="outline" size="sm">View</Button>
                : <Button size="sm">Add Report</Button>
              }
            </div>
          ))}
        </div>

        {/* Appointment Prescriptions */}
        <div className="border rounded-lg p-4 bg-muted">
          <h3 className="font-semibold mb-2">Appointment Prescriptions</h3>
          {patientDetails.doctorAppointments.map(a => (
            <div key={a.id} className="border rounded p-3 flex justify-between items-center mb-2">
              <div>
                <p><strong>{a.doctorName}</strong></p>
                <p>Booked: {new Date(a.date).toLocaleString()}</p>
                <p>Status: {a.status}</p>
              </div>
              {a.prescriptionLink
                ? <Button variant="outline" size="sm">View</Button>
                : <Button size="sm">Add Report</Button>
              }
            </div>
          ))}
        </div>

        {/* Diet Plans */}
        <div className="border rounded-lg p-4 bg-muted">
          <h3 className="font-semibold mb-2">Diet Plans</h3>
          {patientDetails.dieticianAppointments.map(a => (
            <div key={a.id} className="border rounded p-3 flex justify-between items-center mb-2">
              <div>
                <p><strong>Dietician</strong></p>
                <p>Booked: {new Date(a.date).toLocaleDateString()}</p>
                <p>Status: {a.status}</p>
              </div>
              {a.dietPlanLink
                ? <Button variant="outline" size="sm">View</Button>
                : <Button size="sm">Add Plan</Button>
              }
            </div>
          ))}
        </div>
        
        {/* Appointment Dates */}
        <Card className="border rounded-lg p-4 bg-muted">
          <h3 className="font-semibold mb-2">Appointment Dates</h3>
          {planUsage ? (
            <div className="space-y-4 text-sm">
              <div>
                <strong>Doctor Consultations:</strong>
                <ul className="list-disc list-inside">
                  {planUsage.doctorConsultationDates.map(dt => (
                    <li key={dt}>{new Date(dt).toLocaleString()}</li>
                  ))}
                </ul>
              </div>
              <div>
                <strong>Dietician Consultations:</strong>
                <ul className="list-disc list-inside">
                  {planUsage.dieticianConsultationDates.map(dt => (
                    <li key={dt}>{new Date(dt).toLocaleString()}</li>
                  ))}
                </ul>
              </div>
              <div>
                <strong>Lab Tests:</strong>
                <ul className="list-disc list-inside">
                  {planUsage.labTestsDates.map(dt => (
                    <li key={dt}>{new Date(dt).toLocaleDateString()}</li>
                  ))}
                </ul>
              </div>
              <div>
                <strong>Ophthalmologist Consultations:</strong>
                <ul className="list-disc list-inside">
                  {planUsage.ophthalmologistConsultationDates.map(dt => (
                    <li key={dt}>{new Date(dt).toLocaleString()}</li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <p>Loading appointment dates...</p>
          )}
        </Card>

        {/* Payment History */}
        <div className="border rounded-lg p-4 bg-muted">
          <h3 className="font-semibold mb-2">Payment History</h3>
          {/* TODO: Populate payment history here */}
          <p>No payment records available.</p>
        </div>
      </div>
    </div>
  );
};

export default PatientDetailsPage;
