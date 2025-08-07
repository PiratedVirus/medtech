"use client";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import QRCode from "qrcode";
import { useEffect, useState } from "react";

interface PrescriptionPreviewProps {
  prescriptionData: any;
  patientInfo: any;
  doctorInfo?: any;
  clinicInfo?: any;
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
  doctorInfo,
  clinicInfo,
  visibleSections,
}: PrescriptionPreviewProps) {
  const [qrCodeDataURL, setQrCodeDataURL] = useState<string>("");

  useEffect(() => {
    // Generate QR code for the prescription
    const generateQRCode = async () => {
      try {
        const qrCodeData = JSON.stringify({
          appointmentId: patientInfo.appointmentId,
          patientName: patientInfo.name,
          prescriptionId: patientInfo.prescriptionId,
          timestamp: new Date().toISOString(),
        });

        const dataURL = await QRCode.toDataURL(qrCodeData, {
          width: 200,
          margin: 2,
          color: {
            dark: '#1F2937', // Dark gray
            light: '#FFFFFF' // White
          }
        });
        setQrCodeDataURL(dataURL);
      } catch (error) {
        console.error("Error generating QR code:", error);
      }
    };

    generateQRCode();
  }, [patientInfo]);

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
      <header className="flex justify-between items-start pb-4 border-b border-gray-200">
        <div className="flex items-center">
          {clinicInfo?.logo ? (
            <Image src={clinicInfo.logo} alt={`${clinicInfo.name} Logo`} width={60} height={60} />
          ) : (
            <Image src="/images/logo.png" alt="Care Diabetics Logo" width={60} height={60} />
          )}
          <div className="ml-3">
            <h1 className="text-lg font-bold text-gray-900">{clinicInfo?.name || "Care Diabetics Hospital"}</h1>
            <p className="text-xs text-gray-500">{clinicInfo?.subtitle || "AIIMS (NEW DELHI) ALUMNI INITIATIVE"}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs font-semibold text-gray-900">Date & Time:</p>
          <p className="text-xs text-gray-700">{formatDate(new Date())}</p>
        </div>
      </header>

      {/* Patient Info */}
      <section className="mt-4">
        <p className="mb-2"><span className="font-semibold">Patient name:</span> Mr. {patientInfo.name} (28 yrs, Male) - +91 {patientInfo.phone || '9949693659'}</p>
        
        {visibleSections.vitals && (
          <div className="flex flex-wrap gap-6 text-sm mb-3">
            <span><span className="font-semibold">BP</span> {prescriptionData.vitals?.bloodPressure || '120/80'} mm/Hg</span>
            <span><span className="font-semibold">Pulse</span> {prescriptionData.vitals?.pulse || '72'} bpm</span>
            <span><span className="font-semibold">Height</span> {prescriptionData.vitals?.height || '185'} cm</span>
            <span><span className="font-semibold">Weight</span> {prescriptionData.vitals?.weight || '90'} kgs</span>
            <span><span className="font-semibold">Random Blood Sugar</span> 150 mg/dL</span>
          </div>
        )}

        {/* Complaints */}
        {visibleSections.complaints && prescriptionData.complaints?.length > 0 && (
          <p className="mb-2">
            <span className="font-semibold">Complaints:</span> {prescriptionData.complaints.map((c: any) => c.text).join(', ')}
          </p>
        )}

        {/* Diagnosis */}
        <p className="mb-4">
          <span className="font-semibold">Diagnosis:</span> {prescriptionData.diagnosis || 'Chronic Pulpits'}
        </p>
      </section>

      {/* Rx Section */}
      <div className="text-2xl font-bold text-gray-900 mb-4">Rx</div>

      {/* Medicines Table */}
      {visibleSections.medicines && prescriptionData.medicines?.length > 0 && (
        <table className="w-full text-left border-collapse mb-6">
          <thead>
            <tr className="border-b">
              <th className="text-xs font-semibold py-2 pr-4">Medicine</th>
              <th className="text-xs font-semibold py-2 pr-4">Frequency</th>
              <th className="text-xs font-semibold py-2 pr-4">Medicine Time</th>
              <th className="text-xs font-semibold py-2 pr-4">Duration</th>
              <th className="text-xs font-semibold py-2">Quantity</th>
            </tr>
          </thead>
          <tbody>
            {prescriptionData.medicines.map((med: any, index: number) => (
              <tr key={index} className="border-b text-sm">
                <td className="py-2 pr-4">{med.name}</td>
                <td className="py-2 pr-4">{med.frequency}</td>
                <td className="py-2 pr-4">{med.medicineTime}</td>
                <td className="py-2 pr-4">{med.duration}</td>
                <td className="py-2">{med.quantity}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Advice Section */}
      {visibleSections.advice && prescriptionData.advice && (
        <div className="mb-4">
          <p className="font-semibold mb-2">Advice:</p>
          <div className="text-sm">
            {prescriptionData.advice.split('\n').map((line: string, index: number) => (
              line.trim() && <p key={index} className="mb-1">• {line.trim()}</p>
            ))}
          </div>
        </div>
      )}

      {/* Tests Requested and Next Visit in 2 columns */}
      <div className="flex justify-between mb-6">
        <div>
          <p className="font-semibold">Tests Requested:</p>
          <p className="text-sm">• {prescriptionData.testsRequested || 'None'}</p>
        </div>
        <div>
          <p className="font-semibold">Next Visit:</p>
          <p className="text-sm">• {prescriptionData.nextVisit?.value || 45} Days {prescriptionData.nextVisit?.date ? `(${formatDate(prescriptionData.nextVisit.date)})` : '(14th Feb 2025)'}</p>
        </div>
      </div>

      {/* Footer */}
      <footer className="flex justify-between items-end mt-8">
        <div>
          {/* QR Code */}
          {qrCodeDataURL && (
            <div className="w-16 h-16 mb-2">
              <img src={qrCodeDataURL} alt="QR Code" className="w-full h-full" />
            </div>
          )}
          <p className="text-xs text-gray-500">Scan QR Code to<br />download the prescription</p>
        </div>
        <div className="text-right">
          {/* Signature Line */}
          <div className="w-32 border-b border-gray-900 mb-2"></div>
          <p className="font-semibold text-gray-900">Dr. {doctorInfo?.name || "Abhinav"}</p>
        </div>
      </footer>
      
      <div className="flex justify-between mt-4 text-xs text-gray-500 border-t pt-2">
        <p>Address: {clinicInfo?.address || "Care Diabetics Hospital, 123 Well Ave, Springfield, IL 62704"}</p>
        <p>Timings: {clinicInfo?.timings || "Mon - Sat (9:00 AM to 5:00 PM)"}</p>
      </div>
    </div>
  );
}
