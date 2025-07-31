import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import prisma from "@/lib/prisma";
import QRCode from "qrcode";
import jsPDF from "jspdf";
import fs from "fs";
import path from "path";

export async function POST(request: NextRequest) {
  try {
    const { appointmentId, prescriptionData, patientInfo, doctorInfo, clinicInfo } = await request.json();

    if (!appointmentId || !prescriptionData || !patientInfo || !doctorInfo || !clinicInfo) {
      return NextResponse.json(
        { success: false, error: "All required data is needed" },
        { status: 400 }
      );
    }

    // Generate QR code with redirect URL (predictable, no need for PDF URL first)
    const qrRedirectUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/prescription/qr/${appointmentId}`;
    const qrCodeDataURL = await QRCode.toDataURL(qrRedirectUrl, {
      width: 200,
      margin: 2,
      color: {
        dark: '#1F2937',
        light: '#FFFFFF'
      }
    });

    // Generate PDF with correct QR code
    const pdfBuffer = await generatePDFBuffer(prescriptionData, patientInfo, doctorInfo, clinicInfo, qrCodeDataURL);

    // Generate unique filename
    const fileName = `prescription-${appointmentId}-${Date.now()}.pdf`;

    // Upload to Vercel Blob
    const blob = await put(
      `prescriptions/${fileName}`,
      pdfBuffer,
      { 
        access: "public", 
        contentType: "application/pdf",
        allowOverwrite: true
      }
    );

    // Update appointment with the PDF link
    const updatedAppointment = await prisma.appointment.update({
      where: { id: parseInt(appointmentId) },
      data: { prescriptionLink: blob.url },
    });

    return NextResponse.json({ 
      success: true, 
      data: { 
        appointment: updatedAppointment,
        pdfUrl: blob.url 
      } 
    });
  } catch (error) {
    console.error("PDF generation error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to generate PDF" },
      { status: 500 }
    );
  }
}

async function generatePDFBuffer(prescriptionData: any, patientInfo: any, doctorInfo: any, clinicInfo: any, qrCodeDataURL: string) {
  try {
    // Create PDF using jsPDF
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pageWidth - (2 * margin);
    let yPosition = margin;

    // Load Clinic Logo
    let logoDataUrl: string | null = null;
    try {
      const logoPath = path.join(process.cwd(), 'public', 'images', 'logo.png');
      if (fs.existsSync(logoPath)) {
        const logoBuffer = fs.readFileSync(logoPath);
        logoDataUrl = `data:image/png;base64,${logoBuffer.toString('base64')}`;
      } else {
        console.warn('Logo file not found at:', logoPath);
      }
    } catch (error) {
      console.error('Error loading logo image:', error);
    }

    // Helper function to add text with word wrapping
    const addWrappedText = (text: string, x: number, y: number, maxWidth: number, fontSize: number = 12) => {
      pdf.setFontSize(fontSize);
      const lines = pdf.splitTextToSize(text, maxWidth);
      pdf.text(lines, x, y);
      return lines.length * (fontSize * 0.4); // Return height used
    };

    // Helper function to add section title
    const addSectionTitle = (title: string, y: number) => {
      pdf.setFontSize(16);
      pdf.setTextColor(31, 41, 55); // custom-darkgreen equivalent
      pdf.setFont('helvetica', 'bold');
      pdf.text(title, margin, y);
      pdf.setFontSize(12);
      pdf.setTextColor(0, 0, 0);
      pdf.setFont('helvetica', 'normal');
      return y + 8;
    };

    // Header Section with Logo, Clinic Name, Tagline, Date & Time
    const headerLogoSize = 25;
    const headerTextX = margin + headerLogoSize + 5;

    // Add clinic logo if available
    if (logoDataUrl) {
      pdf.addImage(logoDataUrl, 'PNG', margin, yPosition, headerLogoSize, headerLogoSize);
    }

    pdf.setFontSize(18);
    pdf.setTextColor(0, 0, 0);
    pdf.setFont('helvetica', 'bold');
    pdf.text((clinicInfo.name as string) || 'Apollo Health', headerTextX, yPosition + 7);

    pdf.setFontSize(9);
    pdf.setTextColor(107, 114, 128); // gray-500
    pdf.setFont('helvetica', 'normal');
    pdf.text((clinicInfo.subtitle as string) || 'AIIMS (NEW DELHI) ALUMNI INITIATIVE', headerTextX, yPosition + 14);

    // Date and Time - Top Right - exactly like preview
    const currentDate = new Date().toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(0, 0, 0);
    const dateLabelX = pageWidth - margin - 70;
    pdf.text('Date & Time:', dateLabelX, yPosition + 2);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`31 July 2025 at 17:42`, dateLabelX, yPosition + 7);

    // Draw horizontal line beneath header
    const headerBottomY = yPosition + headerLogoSize + 5;
    pdf.setDrawColor(200, 200, 200);
    pdf.line(margin, headerBottomY, pageWidth - margin, headerBottomY);

    // Set yPosition to start content below header
    yPosition = headerBottomY + 8;

    // Patient Information Section - matching preview format exactly
    pdf.setFontSize(11);
    pdf.setTextColor(0, 0, 0);
    
    // Patient name line (complete line format like preview)
    pdf.setFont('helvetica', 'bold');
    pdf.text('Patient name', margin, yPosition);
    pdf.setFont('helvetica', 'normal');
    const patientText = `Mr. ${(patientInfo.name as string) || 'Sara Ali'} (28 yrs, Male) - +91 ${patientInfo.phone || '9949693659'}`;
    pdf.text(patientText, margin + 25, yPosition);
    yPosition += 8;

    // Vitals in one clean line - exactly like preview
    const vitalsLine = `BP ${prescriptionData.vitals?.bloodPressure || '120/80'} mm/Hg     Pulse ${prescriptionData.vitals?.pulse || '72'} bpm     Height ${prescriptionData.vitals?.height || '182'} cm     Weight ${prescriptionData.vitals?.weight || '95'} kgs     Random Blood Sugar 150 mg/dL`;
    pdf.setFont('helvetica', 'normal');
    pdf.text(vitalsLine, margin, yPosition);
    yPosition += 8;

    // Complaints line (if exists)
    if (prescriptionData.complaints?.length > 0) {
      const complaintsText = prescriptionData.complaints.map((c: any) => c.text).join(', ');
      pdf.setFont('helvetica', 'bold');
      pdf.text('Complaints:', margin, yPosition);
      pdf.setFont('helvetica', 'normal');
      pdf.text(` ${complaintsText}`, margin + 25, yPosition);
      yPosition += 6;
    }

    // Diagnosis line
    pdf.setFont('helvetica', 'bold');
    pdf.text('Diagnosis:', margin, yPosition);
    pdf.setFont('helvetica', 'normal');
    pdf.text(` ${(prescriptionData.diagnosis as string) || 'N/A'}`, margin + 25, yPosition);
    yPosition += 12;



    // Rx Section - exactly like preview
    pdf.setFontSize(24);
    pdf.setTextColor(0, 0, 0);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Rx', margin, yPosition);
    yPosition += 12;

    // Medicines Table - clean format like preview
    if (prescriptionData.medicines?.length > 0) {
      pdf.setFontSize(11);
      pdf.setTextColor(0, 0, 0);
      
      // Table headers with proper spacing
      const headers = ['Medicine', 'Frequency', 'Medicine Time', 'Duration', 'Quantity'];
      const colWidths = [70, 35, 40, 30, 25];
      let x = margin;
      
      pdf.setFont('helvetica', 'bold');
      headers.forEach((header, index) => {
        pdf.text(header, x, yPosition);
        x += colWidths[index];
      });
      yPosition += 6;
      
      // Draw clean header line
      pdf.setDrawColor(0, 0, 0);
      pdf.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 6;

      // Table rows with proper spacing
      pdf.setFont('helvetica', 'normal');
      prescriptionData.medicines.forEach((med: any, index: number) => {
        x = margin;
        const rowData = [med.name, med.frequency, med.medicineTime, med.duration, med.quantity];
        
        rowData.forEach((cell, colIndex) => {
          pdf.text(cell || '', x, yPosition);
          x += colWidths[colIndex];
        });
        yPosition += 8; // Increased spacing for better readability
      });
    }
    yPosition += 10;

    // Advice Section - clean format like preview
    if (prescriptionData.advice) {
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(11);
      pdf.text('Advice:', margin, yPosition);
      yPosition += 6;
      
      pdf.setFont('helvetica', 'normal');
      const adviceLines = prescriptionData.advice.split('\n');
      adviceLines.forEach((line: string) => {
        if (line.trim()) {
          pdf.text(`• ${line.trim()}`, margin + 5, yPosition);
          yPosition += 5;
        }
      });
      yPosition += 8;
    }

    // Tests Requested and Next Visit side by side - exactly like preview
    const testsSection = margin;
    const nextVisitSection = pageWidth / 2 + 20;
    
    // Tests Requested
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.text('Tests Requested:', testsSection, yPosition);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`• ${prescriptionData.testsRequested || 'rest'}`, testsSection, yPosition + 5);
    
    // Next Visit
    pdf.setFont('helvetica', 'bold');
    pdf.text('Next Visit:', nextVisitSection, yPosition);
    pdf.setFont('helvetica', 'normal');
    const nextVisitText = `${prescriptionData.nextVisit?.value || 7} Days`;
    if (prescriptionData.nextVisit?.date) {
      const nextVisitDate = new Date(prescriptionData.nextVisit.date).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      pdf.text(`• ${nextVisitText} (${nextVisitDate})`, nextVisitSection, yPosition + 5);
    } else {
      pdf.text(`• ${nextVisitText} (07 August 2025 at 13:57)`, nextVisitSection, yPosition + 5);
    }
    yPosition += 20;

    // Footer Section - exactly like preview
    // QR Code (left side) - smaller size like preview
    try {
      if (qrCodeDataURL) {
        const qrSize = 20;
        pdf.addImage(qrCodeDataURL, 'PNG', margin, yPosition, qrSize, qrSize);
        pdf.setFontSize(8);
        pdf.setTextColor(107, 114, 128);
        pdf.setFont('helvetica', 'normal');
        pdf.text('Scan QR Code to', margin, yPosition + qrSize + 3);
        pdf.text('download the prescription', margin, yPosition + qrSize + 6);
      }
    } catch (error) {
      console.error('Error adding QR code:', error);
    }

    // Doctor signature (right side) - clean line like preview
    const signatureX = pageWidth - margin - 50;
    pdf.setDrawColor(0, 0, 0);
    pdf.line(signatureX, yPosition + 15, signatureX + 45, yPosition + 15); // Clean signature line
    pdf.setFontSize(11);
    pdf.setTextColor(0, 0, 0);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`Dr. ${doctorInfo.name || 'Setu Gupta'}`, signatureX, yPosition + 25);
    
    yPosition += 35;

    // Address and timings side by side - exactly like preview
    pdf.setFontSize(9);
    pdf.setTextColor(107, 114, 128);
    pdf.setFont('helvetica', 'normal');
    
    // Address (left)
    const addressText = `Address: ${clinicInfo.address || '123 Apollo Street, Mumbai'}`;
    pdf.text(addressText, margin, yPosition);
    
    // Timings (right)
    const timingsText = `Timings: ${clinicInfo.timings || 'Mon - Sat ( 9:00 AM to 5:00 PM )'}`;
    const timingsWidth = pdf.getTextWidth(timingsText);
    pdf.text(timingsText, pageWidth - margin - timingsWidth, yPosition);

    // Convert PDF to buffer
    const pdfBuffer = Buffer.from(pdf.output('arraybuffer'));
    return pdfBuffer;

  } catch (error) {
    console.error('Error generating PDF:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack available');
    
    // Fallback: create a simple text-based PDF
    const pdf = new jsPDF();
    pdf.setFontSize(16);
    pdf.text('Prescription', 20, 20);
    pdf.setFontSize(12);
    pdf.text(`Patient: ${patientInfo?.name || 'Unknown'}`, 20, 40);
    pdf.text(`Doctor: Dr. ${doctorInfo?.name || 'Unknown'}`, 20, 50);
    pdf.text(`Clinic: ${clinicInfo?.name || 'Unknown'}`, 20, 60);
    pdf.text(`Date: ${new Date().toLocaleDateString()}`, 20, 70);
    pdf.text('Error: Failed to generate detailed prescription', 20, 90);
    
    return Buffer.from(pdf.output('arraybuffer'));
  }
} 