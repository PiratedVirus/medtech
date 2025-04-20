'use client'
import { User, Calendar, Phone, Heart, Droplet, Activity, Ruler, Scale, FileText } from "lucide-react";

import  { PlanUsageMinimal } from "@/components/patients/plans/PlanUsage";
import { useState, useEffect } from "react";
import axios from "axios";
import { useRouter, useParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import CdLoader from "@/components/ui/custom/cd-loader";
import TotalEarningsCard from "@/components/admin/TotalEarningsCars";

const PatientDetailsPage = () => {
  interface PatientDetails {
    id: number;
    name: string;
    email: string;
    joinedOn: string;
    plans: {
      id: number;
      planName: string;
      startDate: string;
      endDate: string;
      isActive: boolean;
    }[];
    profile: {
      age: number;
      weight: number;
      height: number;
      gender: string;
      allergies?: string;
      medicalHistory?: string;
      emergencyContact: string;
      dateOfBirth?: string;
      address?: string;
      profilePicture?: string | null;
      planTrackers: {
        subscriptionId: number;
        startDate: string;
        endDate: string;
        isActive: boolean;
        plan: {
          id: number;
          name: string;
        };
      }[];
    };
    labBookings: {
      id: number;
      labPackageName: string;
      date: string;
      status: string;
      reportLink?: string | null;
    }[];
    doctorAppointments: {
      id: number;
      doctorName: string;
      date: string;
      type: string;
      status: string;
      prescriptionLink?: string | null;
      payment?: {
        amount: number;
        currency: string;
        paymentStatus: string;
        razorpayPaymentId?: string;
        createdAt: string;
      } | null;
    }[];
    dieticianAppointments: {
      id: number;
      date: string;
      status: string;
      dietPlanLink?: string;
    }[];
  }

  const [patientDetails, setPatientDetails] = useState<PatientDetails | null>(null);
  const router = useRouter();
  const { patientId } = useParams();

  useEffect(() => {
    const fetchPatientDetails = async () => {
      try {
        const response = await axios.get(`/api/admin-dashboard/patients-details?patientId=${patientId}`);
        setPatientDetails(response.data);
      } catch (error) {
        console.error("Failed to fetch patient details:", error);
      }
    };

    fetchPatientDetails();
  }, [patientId]);

  interface PlanUsage {
    doctorConsultationDates?: string[];
    dieticianConsultationDates?: string[];
    labTestsDates?: string[];
    ophthalmologistConsultationDates?: string[];
  }

  const [planUsage, setPlanUsage] = useState<PlanUsage | null>(null);

  useEffect(() => {
    if (patientDetails?.plans?.[0]?.id) {
      axios
        .get(`/api/plans/planUsage?subscriptionId=${patientDetails.plans[0].id}`)
        .then(res => setPlanUsage(res.data.data.subscriptionTracker))
        .catch(err => console.error("Failed to fetch plan usage:", err));
    }
  }, [patientDetails]);

  // const handleFileUpload = (e, id, type) => {
  //   const file = e.target.files?.[0];
  //   if (!file) return;
  //   // implement upload logic based on `type`
  // };

  if (!patientDetails) {
    return <CdLoader />;
  }

  return (
    <div className="container mx-auto p-4 bg-muted">
      {/* Header */}


      {/* Dashboard Grid */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
        {/* Patient Info */}
        <Card className="col-span-full relative overflow-hidden rounded-lg bg-muted text-gray-500 p-6">
          {/* Background icon */}
          <div className="absolute -right-10 -top-6 opacity-10">
            <User size={200} />
          </div>
          {/* Content */}
          <div className="relative space-y-4">

            <div className="flex justify-between items-center my-4">
              <div>
                <h2 className="text-3xl text-secondary font-bold">{patientDetails.name}</h2>
                <p className="text-gray-600">
                  Member since <b> {new Date(patientDetails.joinedOn).toLocaleDateString()}</b>
                </p>
              </div>
              {patientDetails.plans.length > 0 && (
                <div className="text-lg px-3 py-1 mr-14">
                  Subscribed to <span className="text-secondary"><strong>{patientDetails.plans[0].planName}</strong></span> till{" "}
                  {new Date(patientDetails.plans[0].endDate).toLocaleDateString()}
                </div>
              )}
            </div>



            <div className="flex flex-wrap gap-2 mt-4">
              <div className="flex items-center gap-1.5 rounded-full bg-custom-mutedgreen px-3 py-2 text-sm">
                <Calendar className="h-4 w-4 flex-shrink-0" />
                <span className="text-xs ">Age:</span>
                <span className="font-semibold">{patientDetails.profile.age} yrs</span>
              </div>
              <div className="flex items-center gap-1.5 rounded-full bg-custom-mutedgreen px-3 py-2 text-sm">
                <Scale className="h-4 w-4 flex-shrink-0" />
                <span className="text-xs ">Weight:</span>
                <span className="font-semibold">{patientDetails.profile.weight} kg</span>
              </div>
              <div className="flex items-center gap-1.5 rounded-full bg-custom-mutedgreen px-3 py-2 text-sm">
                <Ruler className="h-4 w-4 flex-shrink-0" />
                <span className="text-xs ">Height:</span>
                <span className="font-semibold">{patientDetails.profile.height} cm</span>
              </div>
              <div className="flex items-center gap-1.5 rounded-full bg-custom-mutedgreen px-3 py-2 text-sm">
                <Activity className="h-4 w-4 flex-shrink-0" />
                <span className="text-xs ">Gender:</span>
                <span className="font-semibold">{patientDetails.profile.gender}</span>
              </div>
              <div className="flex items-center gap-1.5 rounded-full bg-custom-mutedgreen px-3 py-2 text-sm">
                <Droplet className="h-4 w-4 flex-shrink-0" />
                <span className="text-xs ">Allergies:</span>
                <span className="font-semibold">{patientDetails.profile.allergies || 'None'}</span>
              </div>
              <div className="flex items-center gap-1.5 rounded-full bg-custom-mutedgreen px-3 py-2 text-sm">
                <Heart className="h-4 w-4 flex-shrink-0" />
                <span className="text-xs ">Medical History:</span>
                <span className="font-semibold">{patientDetails.profile.medicalHistory || 'N/A'}</span>
              </div>
              <div className="flex items-center gap-1.5 rounded-full bg-custom-mutedgreen px-3 py-2 text-sm">
                <Phone className="h-4 w-4 flex-shrink-0" />
                <span className="text-xs ">Emergency Contact:</span>
                <span className="font-semibold">{patientDetails.profile.emergencyContact}</span>
              </div>
              <div className="flex items-center gap-1.5 rounded-full bg-custom-mutedgreen px-3 py-2 text-sm">
                <Calendar className="h-4 w-4 flex-shrink-0" />
                <span className="text-xs ">Date of Birth:</span>
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
        <div className="col-span-1">
          <PlanUsageMinimal
            userId={Number(patientDetails.id)}
            subscriptionId={patientDetails.plans[0]?.id}
          />
        </div>

        <TotalEarningsCard
          patientDetails={{
            doctorAppointments: patientDetails.doctorAppointments.map(a => ({
              payment: a.payment ? { amount: a.payment.amount } : undefined,
            })),
            plans: patientDetails.plans.map(p => ({
              amount: undefined, // Adjust if there's an amount field in plans
            })),
            labBookings: patientDetails.labBookings.map(lb => ({
              paymentOption: undefined, // Adjust if there's a paymentOption field in labBookings
            })),
          }}
        />


        {/* Appointment Dates */}
        <div className="col-span-full grid grid-cols-4 gap-2">
          {[
            {
              label: "Doctor Consultations",
              dates: planUsage?.doctorConsultationDates || []
            },
            {
              label: "Dietician Consultations",
              dates: planUsage?.dieticianConsultationDates || []
            },
            {
              label: "Lab Tests",
              dates: planUsage?.labTestsDates || []
            },
            {
              label: "Ophthalmologist Consultations",
              dates: planUsage?.ophthalmologistConsultationDates || []
            },
          ].map(sec => (
            <Card key={sec.label} className="border rounded-lg p-3 bg-white  text-center">
              <h4 className="font-semibold mb-3">{sec.label}</h4>
              <div className="flex flex-wrap justify-center gap-2">
                {sec.dates.map(dt => (
                  <span
                    key={dt}
                    className="inline-flex items-center px-3 py-1 rounded-full bg-custom-mutedgreen text-sm "
                  >
                    {new Date(dt).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "long",
                      year: "2-digit",
                    })}
                  </span>
                ))}
              </div>
            </Card>
          ))}
        </div>
        {/* Lab Reports */}
        <Card className="border rounded-lg p-4 bg-white">
          <h3 className="font-semibold mb-4">Lab Reports</h3>
          <div className="flex flex-wrap gap-4">
            {patientDetails.labBookings.map(lb => (
              <Card
                key={lb.id}
                className="group relative overflow-hidden border border-gray-100 bg-custom-mutedgreen shadow-sm transition-all duration-300 rounded-lg p-4 w-36 h-48 flex flex-col items-center text-center"
              >
                <div className="absolute -right-4 -top-4 h-24 w-24 opacity-5">
                  <FileText className="h-full w-full" />
                </div>
                <h4 className="font-medium mb-2"><b>{lb.labPackageName}</b></h4>
                <p className="text-sm mb-4">Booked on {new Date(lb.date).toLocaleDateString()}</p>
                <div className="mt-auto flex items-center justify-between">
                  {lb.reportLink
                    ? <Button variant="outline" size="sm">View</Button>
                    : <Button size="sm">Add Report</Button>
                  }
                  {/* <a href={`/api/admin-dashboard/history/labreport/${lb.id}`} className="text-xs underline">
                    History
                  </a> */}
                </div>
              </Card>
            ))}
          </div>
        </Card>

        {/* Appointment Prescriptions */}
        <Card className="border rounded-lg p-4 bg-white">
          <h3 className="font-semibold mb-4">Appointment Prescriptions</h3>
          <div className="flex flex-wrap gap-4">
            {patientDetails.doctorAppointments.map(a => (
              <Card key={a.id}
                className="group relative overflow-hidden border border-gray-100 bg-custom-mutedgreen shadow-sm transition-all duration-300 rounded-lg p-4 w-36 h-48 flex flex-col items-center text-center">
                {/* <div className="absolute -right-4 -top-4 h-24 w-24 opacity-5">
                  <FileText className="h-full w-full" />
                </div> */}
                <h4 className="font-medium mb-2">{a.doctorName}</h4>
                <p className="text-sm mb-2">
                  Date: {new Date(a.date).toLocaleDateString('en-GB')}
                </p>
                {/* <p className="text-sm mb-4">Status: {a.status}</p> */}
                <div className="mt-auto flex flex-col items-center gap-2">
                  <a
                    href={`/api/admin-dashboard/history/prescription/${a.id}`}
                    className="text-xs underline"
                  >
                    History
                  </a>
                  {a.prescriptionLink ? (
                    <Button variant="outline" size="sm">View</Button>
                  ) : (
                    <Button size="sm">Add Prescription</Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </Card>

        {/* Diet Plans */}
        <Card className="border rounded-lg p-4 bg-white">
          <h3 className="font-semibold mb-4">Diet Plans</h3>
          <div className="flex flex-wrap gap-4">
            {patientDetails.dieticianAppointments.map(a => (
              <Card key={a.id} className="bg-custom-mutedgreen rounded-lg p-4 w-36 h-48 flex flex-col">
                <h4 className="font-medium mb-2">Dietician Consultation</h4>
                <p className="text-sm mb-2">Booked: {new Date(a.date).toLocaleDateString()}</p>
                <p className="text-sm mb-4">Status: {a.status}</p>
                <div className="mt-auto flex items-center justify-between">
                  {a.dietPlanLink
                    ? <Button variant="outline" size="sm">View</Button>
                    : <Button size="sm">Add Plan</Button>
                  }
                  <a href={`/api/admin-dashboard/history/dietplan/${a.id}`} className="text-xs underline">
                    History
                  </a>
                </div>
              </Card>
            ))}
          </div>
        </Card>



        {/* Payment History */}
        <div className="border rounded-lg p-4 bg-white">
          <h3 className="font-semibold mb-2">Payment History</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-left">
              <thead className="bg-muted text-secondary font-semibold">
                <tr>
                  <th className="px-4 py-2">Type</th>
                  <th className="px-4 py-2">Reference</th>
                  <th className="px-4 py-2">Amount</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2">Method</th>
                  <th className="px-4 py-2">Date</th>
                </tr>
              </thead>
              <tbody>
                {/* Appointment Payments */}
                {patientDetails.doctorAppointments.map(a => (
                  a.payment ? (
                    <tr key={`appointment-${a.id}`} className="border-b">
                      <td className="px-4 py-2">Appointment</td>
                      <td className="px-4 py-2">{a.doctorName}</td>
                      <td className="px-4 py-2">{a.payment.amount} {a.payment.currency}</td>
                      <td className="px-4 py-2">{a.payment.paymentStatus}</td>
                      <td className="px-4 py-2">{a.payment.razorpayPaymentId ? "Online" : "Offline"}</td>
                      <td className="px-4 py-2">{new Date(a.payment.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ) : null
                ))}

                {/* Lab Bookings Payments */}
                {patientDetails.labBookings.map(lb => (
                  lb.reportLink ? (
                    <tr key={`lab-${lb.id}`} className="border-b">
                      <td className="px-4 py-2">Lab Booking</td>
                      <td className="px-4 py-2">{lb.labPackageName}</td>
                      <td className="px-4 py-2">--</td>
                      <td className="px-4 py-2">{lb.status}</td>
                      {/* // TODo: Uncomment when payment option is available */}
                      {/* <td className="px-4 py-2">{lb.paymentOption || "Offline"}</td> */}
                      <td className="px-4 py-2">{new Date(lb.date).toLocaleDateString()}</td>
                    </tr>
                  ) : null
                ))}

                {/* Subscription Payments */}
                {patientDetails.plans.map(p => (
                  <tr key={`plan-${p.id}`} className="border-b">
                    <td className="px-4 py-2">Subscription</td>
                    <td className="px-4 py-2">{p.planName}</td>
                    <td className="px-4 py-2">--</td>
                    <td className="px-4 py-2">Active</td>
                    <td className="px-4 py-2">Online</td>
                    <td className="px-4 py-2">{new Date(p.endDate).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientDetailsPage;
