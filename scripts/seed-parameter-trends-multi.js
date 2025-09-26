const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function seedParameterTrendsMulti() {
  console.log("🔬 Seeding multi-value parameter trends data...");

  try {
    // Clear existing trend data and analyses
    console.log("🧹 Clearing existing data...");
    await prisma.reportTrendData.deleteMany({});
    await prisma.labReportAnalysis.deleteMany({});
    await prisma.standaloneReportAnalysis.deleteMany({});
    await prisma.standaloneReport.deleteMany({});

    // Get existing patients and lab bookings
    const patients = await prisma.user.findMany({
      where: { role: "PATIENT" },
      take: 2
    });

    const labBookings = await prisma.labBooking.findMany({
      where: { patientId: { in: patients.map(p => p.id) } },
      take: 3
    });

    if (patients.length === 0 || labBookings.length === 0) {
      console.log("❌ No patients or lab bookings found. Please run main seed first.");
      return;
    }

    const patient = patients[0];
    const baseDate = new Date();
    
    // Create multiple reports for the same patient with different dates and values
    for (let i = 0; i < 4; i++) {
      const booking = labBookings[i % labBookings.length];
      const reportDate = new Date(baseDate);
      reportDate.setDate(reportDate.getDate() - (i * 30)); // 30 days apart

      // Create analysis with realistic lab values that show clear trends
      const allValues = [
        {
          parameter: "Hemoglobin",
          value: (12.5 + (i * 0.8)).toFixed(1),
          unit: "g/dL",
          normalRange: "12.0-16.0 g/dL",
          isAbnormal: (12.5 + (i * 0.8)) < 12.0 || (12.5 + (i * 0.8)) > 16.0,
          severity: (12.5 + (i * 0.8)) < 12.0 ? "LOW" : (12.5 + (i * 0.8)) > 16.0 ? "HIGH" : "NORMAL",
          category: "CBC"
        },
        {
          parameter: "HbA1c",
          value: (6.2 + (i * 0.4)).toFixed(1),
          unit: "%",
          normalRange: "< 7.0%",
          isAbnormal: (6.2 + (i * 0.4)) >= 7.0,
          severity: (6.2 + (i * 0.4)) >= 7.0 ? "HIGH" : "NORMAL",
          category: "Diabetes"
        },
        {
          parameter: "Total Cholesterol",
          value: (180 + (i * 25)).toString(),
          unit: "mg/dL",
          normalRange: "< 200 mg/dL",
          isAbnormal: (180 + (i * 25)) >= 200,
          severity: (180 + (i * 25)) >= 200 ? "HIGH" : "NORMAL",
          category: "Lipid Profile"
        },
        {
          parameter: "Creatinine",
          value: (0.9 + (i * 0.2)).toFixed(1),
          unit: "mg/dL",
          normalRange: "0.6-1.2 mg/dL",
          isAbnormal: (0.9 + (i * 0.2)) < 0.6 || (0.9 + (i * 0.2)) > 1.2,
          severity: (0.9 + (i * 0.2)) < 0.6 ? "LOW" : (0.9 + (i * 0.2)) > 1.2 ? "HIGH" : "NORMAL",
          category: "Kidney Function"
        },
        {
          parameter: "Fasting Blood Sugar",
          value: (95 + (i * 15)).toString(),
          unit: "mg/dL",
          normalRange: "70-100 mg/dL",
          isAbnormal: (95 + (i * 15)) < 70 || (95 + (i * 15)) > 100,
          severity: (95 + (i * 15)) < 70 ? "LOW" : (95 + (i * 15)) > 100 ? "HIGH" : "NORMAL",
          category: "Diabetes"
        }
      ];

      const criticalValues = allValues.filter(v => v.isAbnormal);

      // Create lab report analysis
      const analysis = await prisma.labReportAnalysis.create({
        data: {
          labBookingId: booking.id,
          labResultIndex: i, // Use different result index for each report
          extractedText: `Lab report for ${booking.labPackageName} - Patient ID: ${booking.patientId}`,
          llmSummary: `Comprehensive lab analysis showing ${criticalValues.length} abnormal values requiring attention. Overall health status shows ${criticalValues.length > 2 ? 'concerning' : 'stable'} trends.`,
          allValues: allValues,
          criticalValues: criticalValues,
          trendAnalysis: {},
          llmModel: "meta-llama/llama-4-scout-17b-16e-instruct",
          processingStatus: "COMPLETED",
          processedAt: reportDate,
        }
      });

      // Create trend data entries for each parameter
      for (const value of allValues) {
        await prisma.reportTrendData.create({
          data: {
            patientId: patient.id,
            parameter: value.parameter,
            value: value.value,
            unit: value.unit,
            normalRange: value.normalRange,
            isAbnormal: value.isAbnormal,
            severity: value.severity,
            reportDate: reportDate,
            labBookingId: booking.id,
            sourceReportId: analysis.id
          }
        });
      }
    }

    // Create additional standalone reports for more data
    for (let i = 0; i < 2; i++) {
      const reportDate = new Date(baseDate);
      reportDate.setDate(reportDate.getDate() - (i * 15)); // 15 days apart

      const standaloneReport = await prisma.standaloneReport.create({
        data: {
          patientId: patient.id,
          uploadedByUserId: patient.id,
          reportType: "lab_report",
          fileName: `Lab_Report_${i + 1}.pdf`,
          fileUrl: `https://example.com/reports/lab_${i + 1}.pdf`,
          fileSize: 1024000,
          mimeType: "application/pdf",
          status: "COMPLETED"
        }
      });

      // Create analysis for standalone report
      const standaloneAnalysis = await prisma.standaloneReportAnalysis.create({
        data: {
          reportId: standaloneReport.id,
          analysisType: "lab_analysis",
          extractedText: `Standalone lab report analysis - Patient ID: ${patient.id}`,
          llmSummary: `Standalone report analysis showing comprehensive lab results with detailed parameter evaluation.`,
          allValues: [
            {
              parameter: "Vitamin D",
              value: (25 + (i * 10)).toString(),
              unit: "ng/mL",
              normalRange: "30-100 ng/mL",
              isAbnormal: (25 + (i * 10)) < 30,
              severity: (25 + (i * 10)) < 30 ? "LOW" : "NORMAL",
              category: "Vitamins"
            },
            {
              parameter: "TSH",
              value: (2.5 + (i * 1.0)).toFixed(1),
              unit: "mIU/L",
              normalRange: "0.4-4.0 mIU/L",
              isAbnormal: (2.5 + (i * 1.0)) < 0.4 || (2.5 + (i * 1.0)) > 4.0,
              severity: (2.5 + (i * 1.0)) < 0.4 ? "LOW" : (2.5 + (i * 1.0)) > 4.0 ? "HIGH" : "NORMAL",
              category: "Thyroid"
            }
          ],
          criticalValues: [],
          processingStatus: "COMPLETED",
          processedAt: reportDate,
          llmModel: "llama-3.3-70b-versatile"
        }
      });

      // Create trend data for standalone report
      const allValues = standaloneAnalysis.allValues || [];
      for (const value of allValues) {
        await prisma.reportTrendData.create({
          data: {
            patientId: patient.id,
            parameter: value.parameter,
            value: value.value,
            unit: value.unit,
            normalRange: value.normalRange,
            isAbnormal: value.isAbnormal,
            severity: value.severity,
            reportDate: reportDate,
            labBookingId: labBookings[0].id, // Use existing lab booking
            sourceReportId: null // Will be linked to standalone report analysis
          }
        });
      }
    }

    console.log("✅ Multi-value parameter trends data seeded successfully!");
    console.log(`📊 Created 4 lab report analyses for patient ${patient.id}`);
    console.log(`📈 Created trend data entries for multiple parameters with varying values`);
    console.log(`📋 Created 2 standalone reports with analysis`);

  } catch (error) {
    console.error("❌ Error seeding parameter trends:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed function
if (require.main === module) {
  seedParameterTrendsMulti()
    .then(() => {
      console.log("🎉 Multi-value parameter trends seeding completed!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Multi-value parameter trends seeding failed:", error);
      process.exit(1);
    });
}

module.exports = { seedParameterTrendsMulti };
