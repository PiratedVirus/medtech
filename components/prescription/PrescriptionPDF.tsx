import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image, pdf } from '@react-pdf/renderer';
import QRCode from 'qrcode';
import jsPDF from 'jspdf';

const formatDate = (date: Date) => {
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const PrescriptionPDF = ({ prescriptionData, patientInfo, doctorInfo, clinicInfo, qrCodeDataURL }: any) => (
  <Document>
    <Page style={styles.body}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.hospital}>{clinicInfo?.name || "Care Diabetics Hospital"}</Text>
          <Text style={styles.subheading}>{clinicInfo?.subtitle || "AIIMS (NEW DELHI) ALUMNI INITIATIVE"}</Text>
        </View>
        <View style={styles.headerRight}>
          <Text style={styles.dateTime}>Date & Time: {formatDate(new Date())}</Text>
        </View>
      </View>

      <View style={styles.divider} />

      {/* Patient Info */}
      <View style={styles.patientSection}>
        <Text style={styles.sectionTitle}>Patient Information</Text>
        <Text style={styles.patientInfo}>
          <Text style={styles.bold}>Patient Name:</Text> Mr. {patientInfo.name} (28 yrs, Male) - +91 {patientInfo.phone || '9949693659'}
        </Text>
        <Text style={styles.patientInfo}>
          <Text style={styles.bold}>BP:</Text> {prescriptionData.vitals?.bloodPressure || '120/80'} mmHg {"   "}
          <Text style={styles.bold}>Pulse:</Text> {prescriptionData.vitals?.pulse || '72'} bpm {"   "}
          <Text style={styles.bold}>Height:</Text> {prescriptionData.vitals?.height || '185'} cm {"   "}
          <Text style={styles.bold}>Weight:</Text> {prescriptionData.vitals?.weight || '90'} kgs
        </Text>
        <Text style={styles.patientInfo}>
          <Text style={styles.bold}>Random Blood Sugar:</Text> 150 mg/dL
        </Text>
        <Text style={styles.patientInfo}>
          <Text style={styles.bold}>Complaints:</Text> {prescriptionData.complaints?.map((c: any) => c.text).join(', ') || 'None'}
        </Text>
        <Text style={styles.patientInfo}>
          <Text style={styles.bold}>Diagnosis:</Text> {prescriptionData.diagnosis || 'Chronic Pulpitis'}
        </Text>
      </View>

      {/* Prescription Symbol */}
      <View style={styles.rxSection}>
        <Text style={styles.rx}>℞</Text>
      </View>

      {/* Medicine Table */}
      <View style={styles.tableContainer}>
        <View style={styles.tableHeader}>
          <Text style={styles.tableHeaderCell}>Medicine</Text>
          <Text style={styles.tableHeaderCell}>Frequency</Text>
          <Text style={styles.tableHeaderCell}>Time</Text>
          <Text style={styles.tableHeaderCell}>Duration</Text>
          <Text style={styles.tableHeaderCell}>Qty</Text>
        </View>
        {prescriptionData.medicines?.map((med: any, index: number) => (
          <View key={index} style={styles.tableRow}>
            <Text style={styles.tableCell}>{med.name}</Text>
            <Text style={styles.tableCell}>{med.frequency}</Text>
            <Text style={styles.tableCell}>{med.medicineTime}</Text>
            <Text style={styles.tableCell}>{med.duration}</Text>
            <Text style={styles.tableCell}>{med.quantity}</Text>
          </View>
        ))}
      </View>

      {/* Advice */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Advice:</Text>
        {prescriptionData.advice?.split('\n').map((line: string, index: number) => (
          line.trim() && (
            <Text key={index} style={styles.bulletPoint}>
              • {line.trim()}
            </Text>
          )
        ))}
      </View>

      {/* Tests & Visit */}
      <View style={styles.testVisitSection}>
        <View style={styles.testVisitColumn}>
          <Text style={styles.sectionTitle}>Tests Requested:</Text>
          <Text style={styles.bulletPoint}>• {prescriptionData.testsRequested || 'None'}</Text>
        </View>
        <View style={styles.testVisitColumn}>
          <Text style={styles.sectionTitle}>Next Visit:</Text>
          <Text style={styles.testVisitText}>
            {prescriptionData.nextVisit?.value || 45} Days ({prescriptionData.nextVisit?.date ? formatDate(prescriptionData.nextVisit.date) : '14th Feb 2025'})
          </Text>
        </View>
      </View>

      {/* QR + Signature */}
      <View style={styles.qrSignatureSection}>
        <View style={styles.qrSection}>
          {qrCodeDataURL ? (
            <Image src={qrCodeDataURL} style={styles.qrCode} />
          ) : (
            <Text style={styles.qrPlaceholder}>[ QR CODE ]</Text>
          )}
          <Text style={styles.qrText}>Scan QR to download prescription</Text>
        </View>
        <View style={styles.signatureSection}>
          <Text style={styles.signatureLine}>__________________________</Text>
          <Text style={styles.doctorName}>Dr. {doctorInfo?.name || "Abhinav"}</Text>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          {clinicInfo?.address || "Care Diabetics Hospital, 123 Well Ave, Springfield, IL 62704"}
        </Text>
        <Text style={styles.footerText}>
          {clinicInfo?.timings || "Mon - Sat (9:00 AM to 5:00 PM)"}
        </Text>
      </View>

      {/* Page Number */}
      <Text
        style={styles.pageNumber}
        render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
        fixed
      />
    </Page>
  </Document>
);

const styles = StyleSheet.create({
  body: {
    padding: 40,
    fontSize: 10,
    fontFamily: "Helvetica",
    paddingBottom: 30,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    alignItems: "flex-end",
  },
  hospital: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#0C7C59",
    marginBottom: 4,
  },
  subheading: {
    fontSize: 9,
    color: "#666",
  },
  dateTime: {
    fontSize: 10,
    color: "#333",
  },
  divider: {
    borderBottom: "1px solid #ddd",
    marginVertical: 8,
  },
  patientSection: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#333",
  },
  patientInfo: {
    fontSize: 10,
    marginBottom: 6,
    lineHeight: 1.4,
  },
  bold: {
    fontWeight: "bold",
  },
  rxSection: {
    textAlign: "center",
    marginVertical: 8,
  },
  rx: {
    fontSize: 24,
    fontWeight: "bold",
  },
  tableContainer: {
    marginBottom: 12,
  },
  tableHeader: {
    flexDirection: "row",
    borderBottom: "1px solid #000",
    paddingVertical: 4,
  },
  tableHeaderCell: {
    flex: 1,
    fontSize: 10,
    fontWeight: "bold",
    textAlign: "center",
    color: "#333",
  },
  tableRow: {
    flexDirection: "row",
    borderBottom: "1px solid #ccc",
    paddingVertical: 8,
  },
  tableRowEven: {
    backgroundColor: "#fafafa",
  },
  tableCell: {
    flex: 1,
    fontSize: 9,
    textAlign: "center",
    paddingHorizontal: 4,
  },
  section: {
    marginVertical: 10,
  },
  bulletPoint: {
    fontSize: 10,
    marginBottom: 4,
    lineHeight: 1.4,
    paddingLeft: 10,
  },
  testVisitSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 10,
  },
  testVisitColumn: {
    width: "48%",
  },
  testVisitText: {
    fontSize: 10,
    marginTop: 4,
  },
  qrSignatureSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginTop: 20,
    marginBottom: 15,
  },
  qrSection: {
    alignItems: "center",
  },
  qrCode: {
    width: 50,
    height: 50,
    marginBottom: 5,
  },
  qrPlaceholder: {
    fontSize: 10,
    color: "#999",
    marginBottom: 5,
  },
  qrText: {
    fontSize: 8,
    color: "#666",
    textAlign: "center",
  },
  signatureSection: {
    alignItems: "flex-end",
  },
  signatureLine: {
    fontSize: 10,
    marginBottom: 5,
  },
  doctorName: {
    fontSize: 11,
    fontWeight: "bold",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 15,
    paddingTop: 10,
    borderTop: "1px solid #eee",
  },
  footerText: {
    fontSize: 8,
    color: "#666",
  },
  pageNumber: {
    position: "absolute",
    fontSize: 9,
    bottom: 20,
    left: 0,
    right: 0,
    textAlign: "center",
    color: "#999",
  },
});

// Alternative PDF generation using jsPDF (fallback method)
export const generatePDFWithJsPDF = async (
  prescriptionData: any,
  patientInfo: any,
  doctorInfo: any,
  clinicInfo: any,
  appointmentId: string
) => {
  try {
    // Generate QR code
    const qrRedirectUrl = `${window.location.origin}/api/prescription/qr/${appointmentId}`;
    const qrCodeDataURL = await QRCode.toDataURL(qrRedirectUrl);

    // Create new PDF document
    const doc = new jsPDF();
    
    // Set font
    doc.setFont("helvetica");
    
    // Header
    doc.setFontSize(16);
    doc.setTextColor(12, 124, 89); // Green color
    doc.text(clinicInfo?.name || "Care Diabetics Hospital", 20, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text(clinicInfo?.subtitle || "AIIMS (NEW DELHI) ALUMNI INITIATIVE", 20, 30);
    
    // Date
    const currentDate = new Date().toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
    doc.text(`Date & Time: ${currentDate}`, 120, 20);
    
    // Line separator
    doc.line(20, 35, 190, 35);
    
    // Patient Info
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Patient Information:", 20, 50);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Name: Mr. ${patientInfo.name} (28 yrs, Male) - +91 ${patientInfo.phone || '9949693659'}`, 20, 60);
    doc.text(`BP: ${prescriptionData.vitals?.bloodPressure || '120/80'} mmHg | Pulse: ${prescriptionData.vitals?.pulse || '72'} bpm`, 20, 70);
    doc.text(`Height: ${prescriptionData.vitals?.height || '185'} cm | Weight: ${prescriptionData.vitals?.weight || '90'} kgs`, 20, 80);
    doc.text(`Random Blood Sugar: 150 mg/dL`, 20, 90);
    doc.text(`Complaints: ${prescriptionData.complaints?.map((c: any) => c.text).join(', ') || 'None'}`, 20, 100);
    doc.text(`Diagnosis: ${prescriptionData.diagnosis || 'Chronic Pulpitis'}`, 20, 110);
    
    // Prescription symbol
    doc.setFontSize(20);
    doc.text("℞", 20, 125);
    
    // Medicines table
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    const tableHeaders = ["Medicine", "Frequency", "Time", "Duration", "Qty"];
    const tableX = 20;
    const tableY = 135;
    const colWidth = 34;
    
    tableHeaders.forEach((header, index) => {
      doc.text(header, tableX + (index * colWidth), tableY);
    });
    
    // Medicine rows
    doc.setFont("helvetica", "normal");
    prescriptionData.medicines?.forEach((med: any, index: number) => {
      const rowY = tableY + 10 + (index * 8);
      doc.text(med.name, tableX, rowY);
      doc.text(med.frequency, tableX + colWidth, rowY);
      doc.text(med.medicineTime, tableX + (colWidth * 2), rowY);
      doc.text(med.duration, tableX + (colWidth * 3), rowY);
      doc.text(med.quantity, tableX + (colWidth * 4), rowY);
    });
    
    // Advice
    const adviceY = tableY + 10 + (prescriptionData.medicines?.length || 0) * 8 + 20;
    doc.setFont("helvetica", "bold");
    doc.text("Advice:", 20, adviceY);
    doc.setFont("helvetica", "normal");
    
    const adviceLines = prescriptionData.advice?.split('\n') || [];
    adviceLines.forEach((line: string, index: number) => {
      if (line.trim()) {
        doc.text(`• ${line.trim()}`, 20, adviceY + 10 + (index * 5));
      }
    });
    
    // Tests and Next Visit
    const testsY = adviceY + 10 + (adviceLines.length * 5) + 15;
    doc.setFont("helvetica", "bold");
    doc.text("Tests Requested:", 20, testsY);
    doc.text("Next Visit:", 100, testsY);
    
    doc.setFont("helvetica", "normal");
    doc.text(`• ${prescriptionData.testsRequested || 'None'}`, 20, testsY + 8);
    doc.text(`${prescriptionData.nextVisit?.value || 45} Days`, 100, testsY + 8);
    
    // QR Code and Signature
    const qrY = testsY + 20;
    doc.addImage(qrCodeDataURL, 'PNG', 20, qrY, 20, 20);
    doc.text("Scan QR to download prescription", 45, qrY + 10);
    
    // Signature
    doc.text("__________________________", 120, qrY);
    doc.setFont("helvetica", "bold");
    doc.text(`Dr. ${doctorInfo?.name || "Abhinav"}`, 120, qrY + 10);
    
    // Footer
    const footerY = 270;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(clinicInfo?.address || "Care Diabetics Hospital, 123 Well Ave, Springfield, IL 62704", 20, footerY);
    doc.text(clinicInfo?.timings || "Mon - Sat (9:00 AM to 5:00 PM)", 20, footerY + 5);
    
    // Get PDF as base64
    const pdfBase64 = doc.output('datauristring').split(',')[1];
    
    return { success: true, pdfBase64 };
  } catch (error) {
    console.error('jsPDF generation error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

// Create a wrapper component for PDF generation
const PDFDocument = ({ prescriptionData, patientInfo, doctorInfo, clinicInfo, qrCodeDataURL }: any) => (
  <PrescriptionPDF
    prescriptionData={prescriptionData}
    patientInfo={patientInfo}
    doctorInfo={doctorInfo}
    clinicInfo={clinicInfo}
    qrCodeDataURL={qrCodeDataURL}
  />
);

// Utility function to generate PDF and return base64 (for upload)
export const generatePDFBase64 = async (
  prescriptionData: any,
  patientInfo: any,
  doctorInfo: any,
  clinicInfo: any,
  appointmentId: string
) => {
  try {
    // Debug logging to help identify data structure issues
    console.log('Generating PDF with data:', {
      prescriptionData: prescriptionData ? 'Present' : 'Missing',
      patientInfo: patientInfo ? 'Present' : 'Missing',
      doctorInfo: doctorInfo ? 'Present' : 'Missing',
      clinicInfo: clinicInfo ? 'Present' : 'Missing',
      appointmentId
    });

    // Validate required data
    if (!prescriptionData) {
      throw new Error('Prescription data is required');
    }
    if (!patientInfo) {
      throw new Error('Patient info is required');
    }
    if (!doctorInfo) {
      throw new Error('Doctor info is required');
    }
    if (!clinicInfo) {
      throw new Error('Clinic info is required');
    }

    // Generate QR code
    const qrRedirectUrl = `${window.location.origin}/api/prescription/qr/${appointmentId}`;
    const qrCodeDataURL = await QRCode.toDataURL(qrRedirectUrl);

    // Generate PDF blob using react-pdf with wrapper component
    const pdfBlob = await pdf(
      <PDFDocument
        prescriptionData={prescriptionData}
        patientInfo={patientInfo}
        doctorInfo={doctorInfo}
        clinicInfo={clinicInfo}
        qrCodeDataURL={qrCodeDataURL}
      />
    ).toBlob();
    
    // Convert blob to base64 for upload
    const arrayBuffer = await pdfBlob.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    // Convert to base64 using browser-compatible method
    let binary = '';
    for (let i = 0; i < uint8Array.byteLength; i++) {
      binary += String.fromCharCode(uint8Array[i]);
    }
    const base64 = btoa(binary);
    
    console.log('PDF generated successfully, base64 length:', base64.length);
    return { success: true, pdfBase64: base64 };
  } catch (error) {
    console.error('React-PDF generation error:', error);
    
    // Fallback to jsPDF
    console.log('Falling back to jsPDF...');
    return await generatePDFWithJsPDF(prescriptionData, patientInfo, doctorInfo, clinicInfo, appointmentId);
  }
};

// Utility function to generate and download PDF on frontend
export const generateAndDownloadPDF = async (
  prescriptionData: any,
  patientInfo: any,
  doctorInfo: any,
  clinicInfo: any,
  appointmentId: string
) => {
  try {
    // Debug logging to help identify data structure issues
    console.log('Generating PDF with data:', {
      prescriptionData: prescriptionData ? 'Present' : 'Missing',
      patientInfo: patientInfo ? 'Present' : 'Missing',
      doctorInfo: doctorInfo ? 'Present' : 'Missing',
      clinicInfo: clinicInfo ? 'Present' : 'Missing',
      appointmentId
    });

    // Validate required data
    if (!prescriptionData) {
      throw new Error('Prescription data is required');
    }
    if (!patientInfo) {
      throw new Error('Patient info is required');
    }
    if (!doctorInfo) {
      throw new Error('Doctor info is required');
    }
    if (!clinicInfo) {
      throw new Error('Clinic info is required');
    }

    // Generate QR code
    const qrRedirectUrl = `${window.location.origin}/api/prescription/qr/${appointmentId}`;
    const qrCodeDataURL = await QRCode.toDataURL(qrRedirectUrl);

    // Generate PDF blob using react-pdf with wrapper component
    const pdfBlob = await pdf(
      <PDFDocument
        prescriptionData={prescriptionData}
        patientInfo={patientInfo}
        doctorInfo={doctorInfo}
        clinicInfo={clinicInfo}
        qrCodeDataURL={qrCodeDataURL}
      />
    ).toBlob();
    
    // Create download link
    const url = URL.createObjectURL(pdfBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `prescription-${appointmentId}-${Date.now()}.pdf`;
    
    // Trigger download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up
    URL.revokeObjectURL(url);
    
    return { success: true };
  } catch (error) {
    console.error('React-PDF generation error:', error);
    
    // Fallback to jsPDF
    console.log('Falling back to jsPDF...');
    return await generatePDFWithJsPDF(prescriptionData, patientInfo, doctorInfo, clinicInfo, appointmentId);
  }
};

// Test function to verify PDF generation
export const testPDFGeneration = async () => {
  const sampleData = {
    prescriptionData: {
      complaints: [{ text: "Headache", severity: "MODERATE" }],
      vitals: {
        bloodPressure: "120/80",
        pulse: "72",
        height: "175",
        weight: "70"
      },
      medicines: [
        {
          name: "Paracetamol",
          frequency: "3 times daily",
          medicineTime: "After meals",
          duration: "5 days",
          quantity: "10 tablets"
        }
      ],
      advice: "Take rest and drink plenty of water",
      testsRequested: "Blood test",
      nextVisit: { value: 7, type: "days" },
      diagnosis: "Tension headache"
    },
    patientInfo: {
      name: "John Doe",
      phone: "1234567890"
    },
    doctorInfo: {
      name: "Dr. Smith"
    },
    clinicInfo: {
      name: "Care Diabetics Hospital",
      subtitle: "AIIMS (NEW DELHI) ALUMNI INITIATIVE",
      address: "123 Medical Center, City",
      timings: "Mon - Sat (9:00 AM to 5:00 PM)"
    },
    appointmentId: "TEST-001"
  };

  return await generateAndDownloadPDF(
    sampleData.prescriptionData,
    sampleData.patientInfo,
    sampleData.doctorInfo,
    sampleData.clinicInfo,
    sampleData.appointmentId
  );
};

// Test function that only uses react-pdf (no fallback)
export const testReactPDFOnly = async () => {
  const sampleData = {
    prescriptionData: {
      complaints: [{ text: "Headache", severity: "MODERATE" }],
      vitals: {
        bloodPressure: "120/80",
        pulse: "72",
        height: "175",
        weight: "70"
      },
      medicines: [
        {
          name: "Paracetamol",
          frequency: "3 times daily",
          medicineTime: "After meals",
          duration: "5 days",
          quantity: "10 tablets"
        }
      ],
      advice: "Take rest and drink plenty of water",
      testsRequested: "Blood test",
      nextVisit: { value: 7, type: "days" },
      diagnosis: "Tension headache"
    },
    patientInfo: {
      name: "John Doe",
      phone: "1234567890"
    },
    doctorInfo: {
      name: "Dr. Smith"
    },
    clinicInfo: {
      name: "Care Diabetics Hospital",
      subtitle: "AIIMS (NEW DELHI) ALUMNI INITIATIVE",
      address: "123 Medical Center, City",
      timings: "Mon - Sat (9:00 AM to 5:00 PM)"
    },
    appointmentId: "TEST-001"
  };

  try {
    // Generate QR code
    const qrRedirectUrl = `${window.location.origin}/api/prescription/qr/${sampleData.appointmentId}`;
    const qrCodeDataURL = await QRCode.toDataURL(qrRedirectUrl);

    // Generate PDF blob using react-pdf with wrapper component
    const pdfBlob = await pdf(
      <PDFDocument
        prescriptionData={sampleData.prescriptionData}
        patientInfo={sampleData.patientInfo}
        doctorInfo={sampleData.doctorInfo}
        clinicInfo={sampleData.clinicInfo}
        qrCodeDataURL={qrCodeDataURL}
      />
    ).toBlob();
    
    // Create download link
    const url = URL.createObjectURL(pdfBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `react-pdf-test-${Date.now()}.pdf`;
    
    // Trigger download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up
    URL.revokeObjectURL(url);
    
    return { success: true };
  } catch (error) {
    console.error('React-PDF only test error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

export default PrescriptionPDF;
