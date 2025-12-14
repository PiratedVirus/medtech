import React from 'react';
import { Page, Text, View, Document, StyleSheet, pdf, Image, Font } from '@react-pdf/renderer';
import jsPDF from 'jspdf';
import QRCode from 'qrcode';
import { TranslationLanguage, getTranslatedFrequency, getMedicineTimeTranslation } from '@/lib/translations';

// Register Devanagari font for Hindi/Marathi support
let devanagariFontRegistered = false;

// Helper function to convert ArrayBuffer to Base64
const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

// Function to register Devanagari font from local TTF file
// This must be called before PDF generation when translation is needed
const registerDevanagariFontAsync = async (): Promise<boolean> => {
  if (devanagariFontRegistered) {
    console.log('Devanagari font already registered');
    return true;
  }
  
  try {
    // Fetch the font file from public folder
    const fontUrl = '/fonts/NotoSansDevanagari-Regular.ttf';
    console.log('Fetching Devanagari font from:', fontUrl);
    
    const response = await fetch(fontUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch font: ${response.status} ${response.statusText}`);
    }
    
    const fontBuffer = await response.arrayBuffer();
    console.log('Font fetched successfully, size:', fontBuffer.byteLength, 'bytes');
    
    // Convert to data URL for react-pdf compatibility
    const base64Font = arrayBufferToBase64(fontBuffer);
    const dataUrl = `data:font/truetype;base64,${base64Font}`;
    
    // Register font with react-pdf
    Font.register({
      family: 'NotoSansDevanagari',
      src: dataUrl,
    });
    
    devanagariFontRegistered = true;
    console.log('Devanagari font registered successfully');
    return true;
  } catch (error) {
    console.error('Failed to register Devanagari font:', error);
    return false;
  }
};

// Format duration from "5d" to "5 days"
const formatDuration = (duration: string): string => {
  if (!duration) return duration;
  // Replace "d" at the end with " days"
  return duration.replace(/d$/, ' days');
};

// Sanitize text for PDF rendering - replace special characters with ASCII equivalents
const sanitizeForPDF = (text: string): string => {
  if (!text) return text;
  return text
    // Greek letters and symbols
    .replace(/μ/g, 'u')      // micro symbol → u
    .replace(/µ/g, 'u')      // micro sign → u
    .replace(/α/g, 'a')      // alpha → a
    .replace(/β/g, 'b')      // beta → b
    .replace(/γ/g, 'g')      // gamma → g
    .replace(/δ/g, 'd')      // delta → d
    .replace(/Δ/g, 'D')      // Delta → D
    .replace(/λ/g, 'l')      // lambda → l
    .replace(/π/g, 'pi')     // pi → pi
    .replace(/Σ/g, 'S')      // Sigma → S
    .replace(/σ/g, 's')      // sigma → s
    .replace(/Ω/g, 'Ohm')    // Omega → Ohm
    .replace(/ω/g, 'w')      // omega → w
    // Superscripts and subscripts
    .replace(/²/g, '2')      // superscript 2 → 2
    .replace(/³/g, '3')      // superscript 3 → 3
    .replace(/¹/g, '1')      // superscript 1 → 1
    .replace(/⁰/g, '0')      // superscript 0 → 0
    // Fractions
    .replace(/½/g, '1/2')    // half → 1/2
    .replace(/¼/g, '1/4')    // quarter → 1/4
    .replace(/¾/g, '3/4')    // three quarters → 3/4
    // Other common symbols
    .replace(/°/g, ' deg')   // degree → deg
    .replace(/±/g, '+/-')    // plus-minus → +/-
    .replace(/×/g, 'x')      // multiplication → x
    .replace(/÷/g, '/')      // division → /
    .replace(/≤/g, '<=')     // less than or equal → <=
    .replace(/≥/g, '>=')     // greater than or equal → >=
    .replace(/≠/g, '!=')     // not equal → !=
    .replace(/∞/g, 'inf')    // infinity → inf
    // Clean up any remaining non-ASCII printable characters
    .replace(/[^\x20-\x7E]/g, (char) => {
      // Keep common printable characters, replace others with empty string
      console.warn(`Removing unsupported character: ${char} (code: ${char.charCodeAt(0)})`);
      return '';
    });
};

const formatDate = (date: Date) => {
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getRecommendedLinks = (prescriptionData: any): string[] => {
  if (Array.isArray(prescriptionData?.recommendedLinks)) {
    return prescriptionData.recommendedLinks.filter((l: string) => typeof l === "string" && l.trim()).map((l: string) => l.trim());
  }
  if (typeof prescriptionData?.recommendedLinks === "string" && prescriptionData.recommendedLinks.trim()) {
    return prescriptionData.recommendedLinks.split(",").map((l: string) => l.trim()).filter(Boolean);
  }
  return [];
};

const PrescriptionPDF = ({ prescriptionData, patientInfo, doctorInfo, clinicInfo, visibleSections, qrLinks, translationLanguage }: any) => {
  const now = new Date();
  const timeString = now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  const dateString = now.toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" });
  const recommendedLinks = getRecommendedLinks(prescriptionData);

  return (
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
            <Text style={styles.dateTime}>{timeString}</Text>
            <Text style={styles.dateTime}>{dateString}</Text>
          </View>
        </View>

        <View style={styles.divider} />

      {/* Patient Info */}
      <View style={styles.patientSection}>
        <Text style={styles.patientInfo}>
          <Text style={styles.bold}>Patient Name:</Text> {patientInfo.name} ({patientInfo.age || 0} yrs, {patientInfo.gender || 'Not specified'}) - {patientInfo.phone || 'Not provided'}
        </Text>
        <Text style={styles.patientInfo}>
          <Text style={styles.bold}>BP:</Text> {prescriptionData.vitals?.bloodPressure || '-'} mmHg {"   "}
          <Text style={styles.bold}>Pulse:</Text> {prescriptionData.vitals?.pulse || '-'} bpm {"   "}
          <Text style={styles.bold}>Height:</Text> {prescriptionData.vitals?.height || '-'} cm {"   "}
          <Text style={styles.bold}>Weight:</Text> {prescriptionData.vitals?.weight || '-'} kgs
        </Text>

        {Array.isArray(prescriptionData.investigationValues) && prescriptionData.investigationValues.length > 0 && (
          <View style={styles.labParametersSection}>
            <Text style={[styles.patientInfo, styles.bold]}>Lab Parameters:</Text>
            <View style={styles.labParametersGrid}>
              {prescriptionData.investigationValues.map((v: any, idx: number) => {
                // Sanitize unit text for PDF rendering (handles special characters like μ)
                const sanitizedUnit = v.unit ? sanitizeForPDF(v.unit) : "";
                const unitText = sanitizedUnit ? ` ${sanitizedUnit}` : "";
                const parameterName = sanitizeForPDF(v.parameter || "Value");
                const severityText = v.severity ? ` (${v.severity})` : "";
                return (
                  <View key={idx} style={styles.labParameterItem}>
                    <Text style={styles.labParameterText}>
                      <Text style={styles.bold}>{parameterName}:</Text> {v.value}{unitText}{severityText}
                    </Text>
                  </View>
                );
              })}
            </View>
            <View style={styles.sectionDivider} />
          </View>
        )}

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
            <View style={styles.sectionDivider} />
          </View>
        )}

        {/* History of Presenting Illness */}
        {visibleSections?.history !== false && prescriptionData.historyOfCurrentIllness && (
          <View style={styles.historySection}>
            <Text style={[styles.patientInfo, styles.bold]}>History of Presenting Illness:</Text>
            <Text style={styles.historyValue}>{prescriptionData.historyOfCurrentIllness}</Text>
            <View style={styles.sectionDivider} />
          </View>
        )}

        {/* Medical History Section */}
        {visibleSections?.history !== false && (
          <View style={styles.historySection}>
            <Text style={[styles.patientInfo, styles.bold]}>Medical History:</Text>
            <View style={styles.historyGrid}>
              <View style={styles.historyItem}>
                <Text style={styles.historyLabel}>Allergies:</Text>
                <Text style={styles.historyValue}>
                  {(prescriptionData.history?.allergies || '').toString().trim() || '—'}
                </Text>
              </View>
              <View style={styles.historyItem}>
                <Text style={styles.historyLabel}>Personal History:</Text>
                <Text style={styles.historyValue}>
                  {(prescriptionData.history?.personalHistory || '').toString().trim() || '—'}
                </Text>
              </View>
              <View style={styles.historyItem}>
                <Text style={styles.historyLabel}>Past Medical History:</Text>
                <Text style={styles.historyValue}>
                  {(prescriptionData.history?.pastMedicalHistory || '').toString().trim() || '—'}
                </Text>
              </View>
              <View style={styles.historyItem}>
                <Text style={styles.historyLabel}>Family History:</Text>
                <Text style={styles.historyValue}>
                  {(prescriptionData.history?.familyHistory || '').toString().trim() || '—'}
                </Text>
              </View>
            </View>
            <View style={styles.sectionDivider} />
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
          {prescriptionData.medicines?.map((med: any, index: number) => {
            const frequencyData = getTranslatedFrequency(med.frequency, translationLanguage);
            const medicineTimeTranslated = getMedicineTimeTranslation(med.medicineTime, translationLanguage);
            const compositionText = [med.composition, med.composition2].filter(Boolean).join(', ') || '';
            
            // Debug: Log translation data
            if (translationLanguage) {
              console.log('PDF Translation Debug:', {
                medicine: med.name,
                frequency: med.frequency,
                frequencyData,
                medicineTime: med.medicineTime,
                medicineTimeTranslated,
                translationLanguage,
                fontRegistered: devanagariFontRegistered,
                willShowFrequency: translationLanguage && frequencyData.translated,
                willShowTime: translationLanguage && medicineTimeTranslated
              });
            }
            
            return (
              <View key={index} style={styles.tableRow}>
                <View style={styles.tableCell}>
                  <Text>{med.name}</Text>
                  {compositionText && (
                    <Text style={styles.compositionText}>{compositionText}</Text>
                  )}
                </View>
                <View style={styles.tableCell}>
                  <Text>{frequencyData.english}</Text>
                  {translationLanguage && frequencyData.translated && (
                    <Text style={styles.translationText}>{frequencyData.translated}</Text>
                  )}
                </View>
                <View style={styles.tableCell}>
                  <Text>{med.medicineTime}</Text>
                  {translationLanguage && medicineTimeTranslated && (
                    <Text style={styles.translationText}>{medicineTimeTranslated}</Text>
                  )}
                </View>
                <Text style={styles.tableCell}>{formatDuration(med.duration)}</Text>
                <Text style={styles.tableCell}>{med.quantity}</Text>
              </View>
            );
          })}
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

      {/* Recommended Links as QR Codes */}
      {recommendedLinks.length > 0 && qrLinks?.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recommended Links:</Text>
          <View style={styles.qrRow}>
            {qrLinks.map((qr: any, idx: number) => (
              <View key={idx} style={styles.qrItem}>
                <Image src={qr.dataUrl} style={styles.qrImage} />
              </View>
            ))}
          </View>
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
};

const styles = StyleSheet.create({
  body: {
    padding: 16,
    fontSize: 11,
    fontFamily: "Helvetica",
    paddingBottom: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 6,
  },
  headerLeft: {
    flex: 1,
  },
  clinicInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 2,
  },
  clinicLogo: {
    width: 60,
    height: 60,
    marginRight: 10,
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
    marginBottom: 2,
  },
  subheading: {
    fontSize: 9,
    color: "#666",
    marginTop: -1,
  },
  dateTime: {
    fontSize: 10,
    color: "#333",
  },
  divider: {
    borderBottom: "1px solid #ddd",
    marginVertical: 2,
  },
  patientSection: {
    marginTop: 4,
    marginBottom: 2,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#333",
  },
  patientInfo: {
    fontSize: 11,
    marginBottom: 6,
    lineHeight: 1.4,
  },
  complaintsSection: {
    marginBottom: 4,
  },
  complaintItem: {
    fontSize: 11,
    marginBottom: 3,
    marginLeft: 10,
    lineHeight: 1.3,
  },
  historySection: {
    marginBottom: 4,
  },
  historyGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 4,
  },
  historyItem: {
    width: "48%",
    marginBottom: 6,
    marginRight: "2%",
  },
  historyLabel: {
    fontSize: 10,
    fontWeight: "bold",
    marginBottom: 2,
  },
  historyValue: {
    fontSize: 10,
    lineHeight: 1.3,
    marginLeft: 8,
  },
  labParametersSection: {
    marginBottom: 4,
  },
  labParametersGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 2,
  },
  labParameterItem: {
    width: "48%",
    marginBottom: 3,
    marginRight: "2%",
  },
  labParameterText: {
    fontSize: 11,
    lineHeight: 1.3,
  },
  sectionDivider: {
    borderBottom: "1px solid #e5e5e5",
    marginTop: 4,
    marginBottom: 2,
  },
  bold: {
    fontWeight: "bold",
  },
  rxSection: {
    alignItems: "flex-start",
    marginTop: 2,
    marginBottom: 3,
    paddingLeft: 0,
  },
  rx: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#0C7C59",
    marginBottom: 0.5,
  },
  rxUnderline: {
    width: 35,
    height: 1.5,
    backgroundColor: "#0C7C59",
  },
  tableContainer: {
    marginBottom: 8,
  },
  tableHeader: {
    flexDirection: "row",
    borderBottom: "1px solid #000",
    paddingVertical: 4,
  },
  tableHeaderCell: {
    flex: 1,
    fontSize: 11,
    fontWeight: "bold",
    textAlign: "center",
    color: "#333",
  },
  tableRow: {
    flexDirection: "row",
    borderBottom: "1px solid #ccc",
    paddingVertical: 6,
  },
  tableRowEven: {
    backgroundColor: "#fafafa",
  },
  tableCell: {
    flex: 1,
    fontSize: 10,
    textAlign: "center",
    paddingHorizontal: 4,
  },
  compositionText: {
    fontSize: 8,
    color: "#666",
    marginTop: 2,
  },
  translationText: {
    fontSize: 8,
    color: "#666",
    marginTop: 2,
    fontFamily: 'NotoSansDevanagari',
  },
  section: {
    marginVertical: 6,
  },
  bulletPoint: {
    fontSize: 11,
    marginBottom: 2,
    lineHeight: 1.4,
    paddingLeft: 10,
  },
  testVisitSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 6,
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
    marginTop: 16,
    marginBottom: 10,
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
  qrRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 4,
    gap: 8,
    alignItems: "flex-start",
  },
  qrItem: {
    alignItems: "center",
    width: "30%",
    marginRight: "2%",
    marginBottom: 6,
  },
  qrImage: {
    width: 70,
    height: 70,
  },
  qrLabel: {
    fontSize: 8,
    textAlign: "center",
    marginTop: 2,
    color: "#333",
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
  visibleSections?: any,
  translationLanguage?: TranslationLanguage
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
    const rxY = diagnosisY + 7;
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
        const rowY = tableY + 10 + (index * 10);
        const frequencyData = getTranslatedFrequency(med.frequency, translationLanguage || null);
        const medicineTimeTranslated = getMedicineTimeTranslation(med.medicineTime, translationLanguage || null);
        const compositionText = [med.composition, med.composition2].filter(Boolean).join(', ') || '';
        
        // Medicine name with composition
        doc.setFontSize(9);
        doc.text(med.name, tableX, rowY);
        if (compositionText) {
          doc.setFontSize(7);
          doc.setTextColor(100, 100, 100);
          doc.text(compositionText, tableX, rowY + 4);
          doc.setTextColor(0, 0, 0);
        }
        
        // Frequency with translation
        doc.setFontSize(9);
        doc.text(frequencyData.english, tableX + colWidth, rowY);
        // Note: jsPDF doesn't support Devanagari fonts well, so we skip translations in fallback
        // The main react-pdf version will handle translations properly
        
        // Medicine time with translation
        doc.setFontSize(9);
        doc.text(med.medicineTime, tableX + (colWidth * 2), rowY);
        // Note: jsPDF doesn't support Devanagari fonts well, so we skip translations in fallback
        
        doc.setFontSize(9);
        doc.text(formatDuration(med.duration), tableX + (colWidth * 3), rowY);
        doc.text(med.quantity, tableX + (colWidth * 4), rowY);
      });
      
      adviceY = tableY + 10 + (prescriptionData.medicines?.length || 0) * 10 + 20;
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
    
    // Recommended Links
    const links = Array.isArray(prescriptionData.recommendedLinks) 
      ? prescriptionData.recommendedLinks 
      : (typeof prescriptionData.recommendedLinks === 'string' && prescriptionData.recommendedLinks.trim() 
          ? prescriptionData.recommendedLinks.split(',').filter((link: string) => link.trim() !== '')
          : []);
    if (links.length > 0) {
      doc.setFont("helvetica", "bold");
      doc.text("Recommended Links:", 20, adviceY);
      doc.setFont("helvetica", "normal");
      
      links.forEach((link: string, index: number) => {
        doc.text(`• ${link.trim()}`, 20, adviceY + 10 + (index * 5));
      });
      
      adviceY = adviceY + 10 + (links.length * 5) + 15;
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
const PDFDocument = ({ prescriptionData, patientInfo, doctorInfo, clinicInfo, visibleSections, qrLinks, translationLanguage }: any) => (
  <PrescriptionPDF
    prescriptionData={prescriptionData}
    patientInfo={patientInfo}
    doctorInfo={doctorInfo}
    clinicInfo={clinicInfo}
    visibleSections={visibleSections}
    qrLinks={qrLinks}
    translationLanguage={translationLanguage}
  />
);

// Utility function to generate PDF and return base64 (for upload)
export const generatePDFBase64 = async (
  prescriptionData: any,
  patientInfo: any,
  doctorInfo: any,
  clinicInfo: any,
  appointmentId: string,
  visibleSections?: any,
  translationLanguage?: TranslationLanguage
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

    // Ensure Devanagari font is loaded before generating PDF with translations
    if (translationLanguage) {
      console.log('Translation language selected:', translationLanguage, '- Loading Devanagari font...');
      const fontLoaded = await registerDevanagariFontAsync();
      if (!fontLoaded) {
        console.error('Failed to load Devanagari font. Translations may not render correctly.');
      }
    }

    // Generate PDF blob using react-pdf with wrapper component
    const links = getRecommendedLinks(prescriptionData);
    const qrLinks = await Promise.all(
      links.map(async (link: string) => ({
        link,
        dataUrl: await QRCode.toDataURL(link, { margin: 1, width: 120 }),
      }))
    );

    const pdfBlob = await pdf(
      <PDFDocument
        prescriptionData={prescriptionData}
        patientInfo={patientInfo}
        doctorInfo={doctorInfo}
        clinicInfo={clinicInfo}
        visibleSections={visibleSections}
        qrLinks={qrLinks}
        translationLanguage={translationLanguage}
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
    return await generatePDFWithJsPDF(prescriptionData, patientInfo, doctorInfo, clinicInfo, appointmentId, visibleSections, translationLanguage);
  }
};

// Utility function to generate and download PDF on frontend
export const generateAndDownloadPDF = async (
  prescriptionData: any,
  patientInfo: any,
  doctorInfo: any,
  clinicInfo: any,
  appointmentId: string,
  visibleSections?: any,
  translationLanguage?: TranslationLanguage
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

    // Ensure Devanagari font is loaded before generating PDF with translations
    if (translationLanguage) {
      console.log('Translation language selected:', translationLanguage, '- Loading Devanagari font...');
      const fontLoaded = await registerDevanagariFontAsync();
      if (!fontLoaded) {
        console.error('Failed to load Devanagari font. Translations may not render correctly.');
      }
    }
    
    console.log('PDF Generation - Translation Language:', translationLanguage, 'Font Registered:', devanagariFontRegistered);

    // Generate PDF blob using react-pdf with wrapper component
    const links = getRecommendedLinks(prescriptionData);
    const qrLinks = await Promise.all(
      links.map(async (link: string) => ({
        link,
        dataUrl: await QRCode.toDataURL(link, { margin: 1, width: 120 }),
      }))
    );

    const pdfBlob = await pdf(
      <PDFDocument
        prescriptionData={prescriptionData}
        patientInfo={patientInfo}
        doctorInfo={doctorInfo}
        clinicInfo={clinicInfo}
        visibleSections={visibleSections}
        qrLinks={qrLinks}
        translationLanguage={translationLanguage}
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
    return await generatePDFWithJsPDF(prescriptionData, patientInfo, doctorInfo, clinicInfo, appointmentId, visibleSections, translationLanguage);
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
