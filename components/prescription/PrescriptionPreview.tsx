"use client";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

interface PrescriptionPreviewProps {
  prescriptionData: any;
  patientInfo: any;
  visibleSections: {
    complaints: boolean;
    vitals: boolean;
    history: boolean;
    systemicExamination: boolean;
    medicines: boolean;
    advice: boolean;
    testsRequested: boolean;
    nextVisit: boolean;
  };
}

export default function PrescriptionPreview({
  prescriptionData,
  patientInfo,
  visibleSections,
}: PrescriptionPreviewProps) {
  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="bg-white p-8 font-sans text-sm text-gray-800">
      {/* Header */}
      <header className="flex justify-between items-center pb-4 border-b">
        <div className="flex items-center">
          <Image src="/images/logo.png" alt="Care Diabetics Logo" width={100} height={100} />
          <div className="ml-4">
            <h1 className="text-2xl font-bold text-black">Care Diabetics Hospital</h1>
            <p className="text-gray-500">AIIMS (NEW DELHI) ALUMNI INITIATIVE</p>
          </div>
        </div>
        <div className="text-right">
          <p className="font-semibold">Date & Time:</p>
          <p>{formatDate(new Date())}</p>
        </div>
      </header>

      <Separator className="my-4" />

      {/* Patient Info */}
      <section className="mt-6">
        <p><span className="font-semibold">Patient name:</span> Mr. {patientInfo.name}</p>
        <div className="grid grid-cols-4 gap-4 mt-2">
          <p><span className="font-semibold">BP:</span> {prescriptionData.vitals?.bloodPressure} mm/Hg</p>
          <p><span className="font-semibold">Pulse:</span> {prescriptionData.vitals?.pulse} bpm</p>
          <p><span className="font-semibold">Height:</span> {prescriptionData.vitals?.height} cm</p>
          <p><span className="font-semibold">Weight:</span> {prescriptionData.vitals?.weight} kgs</p>
        </div>
        {visibleSections.complaints && prescriptionData.complaints?.length > 0 && (
          <p className="mt-2"><span className="font-semibold">Complaints:</span> {prescriptionData.complaints.map((c: any) => c.text).join(", ")}</p>
        )}
      </section>

      <Separator className="my-4" />

      {/* Diagnosis */}
      <section>
        <p className="text-2xl font-serif">Rx</p>
      </section>

      {/* Medicines Table */}
      {visibleSections.medicines && prescriptionData.medicines?.length > 0 && (
        <section className="mt-4">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b">
                <th className="pb-2 font-semibold">Medicine</th>
                <th className="pb-2 font-semibold">Frequency</th>
                <th className="pb-2 font-semibold">Medicine Time</th>
                <th className="pb-2 font-semibold">Duration</th>
                <th className="pb-2 font-semibold">Quantity</th>
              </tr>
            </thead>
            <tbody>
              {prescriptionData.medicines.map((med: any, index: number) => (
                <tr key={index} className="border-b">
                  <td className="py-2">{med.name}</td>
                  <td>{med.frequency}</td>
                  <td>{med.medicineTime}</td>
                  <td>{med.duration}</td>
                  <td>{med.quantity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {/* Advice, Tests, Next Visit */}
      <section className="mt-6">
        {visibleSections.advice && (
          <div>
            <h3 className="font-semibold">Advice:</h3>
            <ul className="list-disc list-inside">
              {prescriptionData.advice.split('\n').map((line: string, i: number) => (
                <li key={i}>{line}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex mt-4">
          {visibleSections.testsRequested && (
            <div className="w-1/2">
              <h3 className="font-semibold">Tests Requested:</h3>
              <p>{prescriptionData.testsRequested || 'None'}</p>
            </div>
          )}
          {visibleSections.nextVisit && (
            <div className="w-1/2">
              <h3 className="font-semibold">Next Visit:</h3>
              <p>{prescriptionData.nextVisit?.value} Days</p>
            </div>
          )}
        </div>
      </section>

      <Separator className="my-6 border-green-500 border-2" />

      {/* Footer */}
      <footer className="flex justify-between items-end">
        <div className="text-center">
          {/* Placeholder for QR Code */}
          <div className="w-24 h-24 bg-gray-200 mb-2 flex items-center justify-center">
            <p className="text-xs">QR Code</p>
          </div>
          <p className="text-xs">Scan QR Code to<br />download the prescription</p>
        </div>
        <div className="text-right">
          {/* Placeholder for Signature */}
          <div className="w-40 h-16 mb-2">
            {/* Signature would go here */}
          </div>
          <p className="font-semibold">Dr. Abhinav</p>
        </div>
      </footer>
      <div className="text-center mt-4 text-xs text-gray-500">
        <p>Address: Care Diabetics Hospital, 123 Well Ave, Springfield, IL 62704 Timings: Mon - Sat ( 9:00 AM to 5:00 PM )</p>
      </div>
    </div>
  );
}
