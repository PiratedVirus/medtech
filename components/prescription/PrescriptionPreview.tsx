"use client";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
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
          {clinicInfo?.logo && (
            <Image 
              src={clinicInfo.logo} 
              alt={`${clinicInfo.name} Logo`} 
              width={60} 
              height={60}
              className="object-contain mr-3"
            />
          )}
          <div>
            {clinicInfo?.name && (
              <h1 className="text-lg font-bold text-gray-900">{clinicInfo.name}</h1>
            )}
            {clinicInfo?.subtitle && (
              <p className="text-xs text-gray-500">{clinicInfo.subtitle}</p>
            )}
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

        {/* Complaints with Timeline */}
        {visibleSections.complaints && prescriptionData.complaints?.length > 0 && (
          <div className="mb-3">
            <p className="font-semibold mb-2">Chief Complaints:</p>
            <div className="ml-4">
              {prescriptionData.complaints.map((complaint: any, index: number) => {
                const getTimeAgo = (daysSince?: number) => {
                  if (!daysSince || daysSince === 0) return "recent";
                  if (daysSince === 1) return "1 day";
                  if (daysSince < 7) return `${daysSince} days`;
                  if (daysSince < 30) {
                    const weeks = Math.floor(daysSince / 7);
                    return `${weeks} week${weeks > 1 ? 's' : ''}`;
                  }
                  const months = Math.floor(daysSince / 30);
                  return `${months} month${months > 1 ? 's' : ''}`;
                };
                
                return (
                  <p key={index} className="text-sm mb-1">
                    • {complaint.text} (since {getTimeAgo(complaint.daysSince)})
                  </p>
                );
              })}
            </div>
          </div>
        )}

      </section>

      {/* Rx Section - Medical Style */}
      <div className="text-left mb-6">
        <div className="text-3xl font-bold text-[#0C7C59] mb-2">Rx</div>
        <div className="w-12 h-0.5 bg-[#0C7C59]"></div>
      </div>

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
      <footer className="flex justify-end items-end mt-8">
        <div className="text-right">
          {/* Signature Line */}
          <div className="w-32 border-b border-gray-900 mb-2"></div>
          <p className="font-semibold text-gray-900">Dr. {doctorInfo?.name || "Abhinav"}</p>
          <p className="text-xs text-gray-600">{doctorInfo?.qualification || "MBBS, MD"}</p>
          <p className="text-xs text-gray-600">Reg. No: {doctorInfo?.regNumber || "12345"}</p>
        </div>
      </footer>
      
      {(clinicInfo?.address || clinicInfo?.timings) && (
        <div className="flex justify-between mt-4 text-xs text-gray-500 border-t pt-2">
          {clinicInfo?.address && <p>Address: {clinicInfo.address}</p>}
          {clinicInfo?.timings && <p>Timings: {clinicInfo.timings}</p>}
        </div>
      )}
    </div>
  );
}
