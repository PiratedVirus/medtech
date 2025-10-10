import React from 'react';
import { Page, Text, View, Document, StyleSheet, pdf, Image, Font } from '@react-pdf/renderer';
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

const PrescriptionPDF = ({ prescriptionData, patientInfo, doctorInfo, clinicInfo, visibleSections }: any) => (
  <Document>
    <Page style={styles.body}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.clinicInfoRow}>
            {clinicInfo?.logo && (
              <Image 
                src={clinicInfo.logo} 
                style={styles.clinicLogo}
              />
            )}
            <View style={styles.clinicTextContainer}>
              {clinicInfo?.name && (
                <Text style={styles.hospital}>{clinicInfo.name}</Text>
              )}
              {clinicInfo?.subtitle && (
                <Text style={styles.subheading}>{clinicInfo.subtitle}</Text>
              )}
            </View>
          </View>
        </View>
        <View style={styles.headerRight}>
          <Text style={styles.dateTime}>Date & Time: {formatDate(new Date())}</Text>
        </View>
      </View>

      <View style={styles.divider} />

      {/* Patient Info */}
      <View style={styles.patientSection}>
        <Text style={styles.patientInfo}>
          <Text style={styles.bold}>Patient Name:</Text> Mr. {patientInfo.name} ({patientInfo.age || 0} yrs, {patientInfo.gender || 'Not specified'}) - {patientInfo.phone || 'Not provided'}
        </Text>
        <Text style={styles.patientInfo}>
          <Text style={styles.bold}>BP:</Text> {prescriptionData.vitals?.bloodPressure || '-'} mmHg {"   "}
          <Text style={styles.bold}>Pulse:</Text> {prescriptionData.vitals?.pulse || '-'} bpm {"   "}
          <Text style={styles.bold}>Height:</Text> {prescriptionData.vitals?.height || '-'} cm {"   "}
          <Text style={styles.bold}>Weight:</Text> {prescriptionData.vitals?.weight || '-'} kgs
        </Text>

        {/* Complaints with Timeline */}
        {visibleSections?.complaints !== false && prescriptionData.complaints?.length > 0 && (
          <View style={styles.complaintsSection}>
            <Text style={[styles.patientInfo, styles.bold]}>Chief Complaints:</Text>
            {prescriptionData.complaints.map((complaint: any, index: number) => {
              const getTimeAgo = (daysSince?: number) => {
                if (!daysSince || daysSince === 0) return "today";
                if (daysSince === 1) return "1 day ago";
                if (daysSince < 7) return `${daysSince} days ago`;
                if (daysSince < 30) {
                  const weeks = Math.round(daysSince / 7);
                  return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
                }
                const months = Math.round(daysSince / 30);
                return `${months} month${months > 1 ? 's' : ''} ago`;
              };
              
              return (
                <Text key={index} style={styles.complaintItem}>
                  • {complaint.text} {complaint.daysSince !== null && complaint.daysSince !== undefined ? `(${getTimeAgo(complaint.daysSince)})` : ''}
                </Text>
              );
            })}
          </View>
        )}
      </View>

      {/* Prescription Symbol - Medical Style */}
      <View style={styles.rxSection}>
        <Text style={styles.rx}>Rx</Text>
        <View style={styles.rxUnderline} />
      </View>

      {/* Medicine Table */}
      {visibleSections?.medicines !== false && prescriptionData.medicines?.length > 0 && (
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
      )}

      {/* Advice */}
      {visibleSections?.advice !== false && prescriptionData.advice && (
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
      )}

      {/* Tests & Visit */}
      <View style={styles.testVisitSection}>
        {visibleSections?.testsRequested !== false && (
          <View style={styles.testVisitColumn}>
            <Text style={styles.sectionTitle}>Tests Requested:</Text>
            <Text style={styles.bulletPoint}>• {prescriptionData.testsRequested || 'None'}</Text>
          </View>
        )}
        {visibleSections?.nextVisit !== false && (
          <View style={styles.testVisitColumn}>
            <Text style={styles.sectionTitle}>Next Visit:</Text>
            <Text style={styles.testVisitText}>
              {prescriptionData.nextVisit?.value || 45} Days ({prescriptionData.nextVisit?.date ? formatDate(prescriptionData.nextVisit.date) : '14th Feb 2025'})
            </Text>
          </View>
        )}
      </View>

      {/* Signature Section */}
      <View style={styles.signatureSection}>
        <Text style={styles.signatureLine}>__________________________</Text>
        <Text style={styles.doctorName}>Dr. {doctorInfo?.name || "Abhinav"}</Text>
        <Text style={styles.doctorCredentials}>{doctorInfo?.qualification || "MBBS, MD"}</Text>
        <Text style={styles.registrationNumber}>Reg. No: {doctorInfo?.regNumber || "12345"}</Text>
      </View>

      {/* Footer */}
      {(clinicInfo?.address || clinicInfo?.timings) && (
        <View style={styles.footer}>
          {clinicInfo?.address && (
            <Text style={styles.footerText}>
              Address: {clinicInfo.address}
            </Text>
          )}
          {clinicInfo?.timings && (
            <Text style={styles.footerText}>
              Timings: {clinicInfo.timings}
            </Text>
          )}
        </View>
      )}

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
  clinicInfoRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  clinicLogo: {
    width: 60,
    height: 60,
    marginRight: 12,
  },
  clinicTextContainer: {
    flex: 1,
  },
  headerRight: {
    alignItems: "flex-end",
  },
  hospital: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#000000",
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
  complaintsSection: {
    marginBottom: 8,
  },
  complaintItem: {
    fontSize: 10,
    marginBottom: 3,
    marginLeft: 10,
    lineHeight: 1.3,
  },
  bold: {
    fontWeight: "bold",
  },
  rxSection: {
    alignItems: "flex-start",
    marginVertical: 12,
    paddingLeft: 0,
  },
  rx: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#0C7C59",
    marginBottom: 4,
  },
  rxUnderline: {
    width: 40,
    height: 2,
    backgroundColor: "#0C7C59",
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
  signatureSection: {
    alignItems: "flex-end",
    marginTop: 30,
    marginBottom: 15,
  },
  signatureLine: {
    fontSize: 10,
    marginBottom: 5,
  },
  doctorName: {
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 2,
  },
  doctorCredentials: {
    fontSize: 9,
    color: "#666",
    marginBottom: 1,
  },
  registrationNumber: {
    fontSize: 8,
    color: "#666",
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
  appointmentId: string,
  visibleSections?: any
) => {
  try {

    // Create new PDF document
    const doc = new jsPDF();
    
    // Set font
    doc.setFont("helvetica");
    
    // Header
    // Add clinic logo if available
    if (clinicInfo?.logo) {
      try {
        // Note: jsPDF doesn't support direct image URLs, you'd need to convert to base64
        // For now, we'll skip the logo in jsPDF version
        console.log('Clinic logo available:', clinicInfo.logo);
      } catch (error) {
        console.log('Could not add clinic logo to jsPDF:', error);
      }
    }
    
    // Clinic info in single row
    let clinicY = 20;
    if (clinicInfo?.name) {
      doc.setFontSize(16);
      doc.setTextColor(0, 0, 0); // Default black color
      doc.text(clinicInfo.name, 20, clinicY);
    }
    
    if (clinicInfo?.subtitle) {
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.text(clinicInfo.subtitle, 20, clinicY + 8);
    }
    
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
    doc.text(`Name: Mr. ${patientInfo.name} (${patientInfo.age || 0} yrs, ${patientInfo.gender || 'Not specified'}) - +91 ${patientInfo.phone || 'Not provided'}`, 20, 60);
    doc.text(`BP: ${prescriptionData.vitals?.bloodPressure || '120/80'} mmHg | Pulse: ${prescriptionData.vitals?.pulse || '72'} bpm`, 20, 70);
    doc.text(`Height: ${prescriptionData.vitals?.height || '185'} cm | Weight: ${prescriptionData.vitals?.weight || '90'} kgs`, 20, 80);
    doc.text(`Random Blood Sugar: 150 mg/dL`, 20, 90);
    // Complaints with timeline
    if (visibleSections?.complaints !== false && prescriptionData.complaints?.length > 0) {
      doc.setFont("helvetica", "bold");
      doc.text("Chief Complaints:", 20, 100);
      doc.setFont("helvetica", "normal");
      
      prescriptionData.complaints.forEach((complaint: any, index: number) => {
        const getTimeAgo = (daysSince?: number) => {
          if (!daysSince || daysSince === 0) return "today";
          if (daysSince === 1) return "1 day ago";
          if (daysSince < 7) return `${daysSince} days ago`;
          if (daysSince < 30) {
            const weeks = Math.round(daysSince / 7);
            return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
          }
          const months = Math.round(daysSince / 30);
          return `${months} month${months > 1 ? 's' : ''} ago`;
        };
        
        doc.text(`• ${complaint.text} (since ${getTimeAgo(complaint.daysSince)})`, 20, 110 + (index * 5));
      });
    } else {
      doc.text("Complaints: None", 20, 100);
    }
    const diagnosisY = prescriptionData.complaints?.length > 0 ? 110 + (prescriptionData.complaints.length * 5) + 5 : 110;
    
    // Prescription symbol - Medical Style
    const rxY = diagnosisY + 15;
    doc.setFontSize(24);
    doc.setTextColor(12, 124, 89); // Green color
    doc.text("Rx", 20, rxY);
    doc.line(20, rxY + 2, 40, rxY + 2); // Underline
    
    // Medicines table
    let adviceY = rxY + 15;
    if (visibleSections?.medicines !== false && prescriptionData.medicines?.length > 0) {
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 0, 0); // Reset to black
      const tableHeaders = ["Medicine", "Frequency", "Time", "Duration", "Qty"];
      const tableX = 20;
      const tableY = rxY + 15;
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
      
      adviceY = tableY + 10 + (prescriptionData.medicines?.length || 0) * 8 + 20;
    }
    
    // Advice
    if (visibleSections?.advice !== false && prescriptionData.advice) {
      doc.setFont("helvetica", "bold");
      doc.text("Advice:", 20, adviceY);
      doc.setFont("helvetica", "normal");
      
      const adviceLines = prescriptionData.advice?.split('\n') || [];
      adviceLines.forEach((line: string, index: number) => {
        if (line.trim()) {
          doc.text(`• ${line.trim()}`, 20, adviceY + 10 + (index * 5));
        }
      });
      
      adviceY = adviceY + 10 + (adviceLines.length * 5) + 15;
    }
    
    // Tests and Next Visit
    let testsY = adviceY;
    doc.setFont("helvetica", "bold");
    if (visibleSections?.testsRequested !== false) {
      doc.text("Tests Requested:", 20, testsY);
      doc.setFont("helvetica", "normal");
      doc.text(`• ${prescriptionData.testsRequested || 'None'}`, 20, testsY + 8);
    }
    
    if (visibleSections?.nextVisit !== false) {
      doc.setFont("helvetica", "bold");
      doc.text("Next Visit:", 100, testsY);
      doc.setFont("helvetica", "normal");
      doc.text(`${prescriptionData.nextVisit?.value || 45} Days`, 100, testsY + 8);
    }
    
    testsY = testsY + 20;
    
    // Signature Section
    const signatureY = testsY;
    doc.text("__________________________", 140, signatureY);
    doc.setFont("helvetica", "bold");
    doc.text(`Dr. ${doctorInfo?.name || "Abhinav"}`, 140, signatureY + 8);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(`${doctorInfo?.qualification || "MBBS, MD"}`, 140, signatureY + 14);
    doc.text(`Reg. No: ${doctorInfo?.regNumber || "12345"}`, 140, signatureY + 18);
    
    // Footer
    const footerY = 270;
    let currentY = footerY;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    
    if (clinicInfo?.address) {
      doc.text(`Address: ${clinicInfo.address}`, 20, currentY);
      currentY += 5;
    }
    if (clinicInfo?.timings) {
      doc.text(`Timings: ${clinicInfo.timings}`, 20, currentY);
    }
    
    // Get PDF as base64
    const pdfBase64 = doc.output('datauristring').split(',')[1];
    
    return { success: true, pdfBase64 };
  } catch (error) {
    console.error('jsPDF generation error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

// Create a wrapper component for PDF generation
const PDFDocument = ({ prescriptionData, patientInfo, doctorInfo, clinicInfo, visibleSections }: any) => (
  <PrescriptionPDF
    prescriptionData={prescriptionData}
    patientInfo={patientInfo}
    doctorInfo={doctorInfo}
    clinicInfo={clinicInfo}
    visibleSections={visibleSections}
  />
);

// Utility function to generate PDF and return base64 (for upload)
export const generatePDFBase64 = async (
  prescriptionData: any,
  patientInfo: any,
  doctorInfo: any,
  clinicInfo: any,
  appointmentId: string,
  visibleSections?: any
) => {
  try {
    // Debug logging to help identify data structure issues
    console.log('Generating PDF with data:', {
      prescriptionData: prescriptionData ? 'Present' : 'Missing',
      patientInfo: patientInfo ? 'Present' : 'Missing',
      doctorInfo: doctorInfo ? 'Present' : 'Missing',
      clinicInfo: clinicInfo ? 'Present' : 'Missing',
      appointmentId,
      visibleSections: visibleSections || 'All sections visible'
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

    // Generate PDF blob using react-pdf with wrapper component
    const pdfBlob = await pdf(
      <PDFDocument
        prescriptionData={prescriptionData}
        patientInfo={patientInfo}
        doctorInfo={doctorInfo}
        clinicInfo={clinicInfo}
        visibleSections={visibleSections}
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
    return await generatePDFWithJsPDF(prescriptionData, patientInfo, doctorInfo, clinicInfo, appointmentId, visibleSections);
  }
};

// Utility function to generate and download PDF on frontend
export const generateAndDownloadPDF = async (
  prescriptionData: any,
  patientInfo: any,
  doctorInfo: any,
  clinicInfo: any,
  appointmentId: string,
  visibleSections?: any
) => {
  try {
    // Debug logging to help identify data structure issues
    console.log('Generating PDF with data:', {
      prescriptionData: prescriptionData ? 'Present' : 'Missing',
      patientInfo: patientInfo ? 'Present' : 'Missing',
      doctorInfo: doctorInfo ? 'Present' : 'Missing',
      clinicInfo: clinicInfo ? 'Present' : 'Missing',
      appointmentId,
      visibleSections: visibleSections || 'All sections visible'
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

    // Generate PDF blob using react-pdf with wrapper component
    const pdfBlob = await pdf(
      <PDFDocument
        prescriptionData={prescriptionData}
        patientInfo={patientInfo}
        doctorInfo={doctorInfo}
        clinicInfo={clinicInfo}
        visibleSections={visibleSections}
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
    return await generatePDFWithJsPDF(prescriptionData, patientInfo, doctorInfo, clinicInfo, appointmentId, visibleSections);
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
    // Generate PDF blob using react-pdf with wrapper component
    const pdfBlob = await pdf(
      <PDFDocument
        prescriptionData={sampleData.prescriptionData}
        patientInfo={sampleData.patientInfo}
        doctorInfo={sampleData.doctorInfo}
        clinicInfo={sampleData.clinicInfo}
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
