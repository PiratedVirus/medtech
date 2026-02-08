import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { normalizeStatus, normalizeLabAssignmentStatus } from "@/lib/utils/status";
import { getAdminClinicId, createClinicFilter } from "@/lib/admin-clinic-middleware";

// Optimized patients details API 
export async function GET(request: NextRequest) {
  try {
    // Get admin's clinic ID for filtering
    const clinicId = getAdminClinicId(request);
    if (!clinicId) {
      return NextResponse.json({ 
        error: "Unauthorized", 
        message: "Please log out and log back in to access your clinic data" 
      }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const patientIdParam = searchParams.get("patientId");
    const patientId = patientIdParam ? parseInt(patientIdParam) : null;

    // Create clinic filter
    const clinicFilter = createClinicFilter(clinicId);

    if (patientId) {
      // Single patient details with optimized includes - verify patient belongs to clinic
      const patient = await prisma.user.findFirst({
        where: { 
          id: patientId,
          ...clinicFilter
        },
        select: {
          id: true,
          name: true,
          email: true,
          phoneNumber: true,
          createdAt: true,
          patientProfile: {
            select: {
              age: true,
              weight: true,
              height: true,
              gender: true,
              allergies: true,
              medicalHistory: true,
              emergencyContact: true,
              dateOfBirth: true,
              address: true,
              profilePicture: true,
              planTrackers: {
                select: {
                  subscriptionId: true,
                  startDate: true,
                  endDate: true,
                  isActive: true,
                  plan: { select: { id: true, name: true } },
                  payments: {
                    select: {
                      id: true,
                      amount: true,
                      currency: true,
                      paymentStatus: true,
                      razorpayPaymentId: true,
                      createdAt: true
                    }
                  }
                }
              }
            }
          },
          patientAppointments: {
            select: {
              id: true,
              doctorAvailability: { 
                select: { 
                  date: true 
                } 
              },
              consultationType: true,
              status: true,
              isDietician: true,
              prescriptionLink: true,
              appointmentFor: true,
              doctor: { select: { id: true, name: true } },
              payment: {
                select: {
                  id: true,
                  amount: true,
                  currency: true,
                  paymentStatus: true,
                  razorpayPaymentId: true,
                  createdAt: true
                }
              }
            }
          },
          labPatientBookings: {
            select: {
              id: true,
              labDate: true,
              status: true,
              labResult: true,
              labPackage: { select: { id: true, name: true } },
              payment: {
                select: {
                  id: true,
                  amount: true,
                  currency: true,
                  paymentStatus: true,
                  razorpayPaymentId: true,
                  createdAt: true
                }
              },
              reportAnalyses: {
                where: { deletedAt: null },
                select: {
                  id: true,
                  labBookingId: true,
                  labResultIndex: true,
                  processingStatus: true,
                  processingError: true,
                  processedAt: true,
                  llmSummary: true
                },
                orderBy: { createdAt: 'desc' }
              }
            }
          }
        }
      });

      if (!patient) {
        return NextResponse.json({ error: "Patient not found" }, { status: 404 });
      }

      // Split appointments by doctor vs dietician
      const doctorAppointments = patient.patientAppointments.filter(a => a.isDietician === false);
      const dieticianAppointments = patient.patientAppointments.filter(a => a.isDietician === true);

      const transformedPatient = {
        ...patient,
        doctorAppointments,
        dieticianAppointments,
        subscriptions: patient.patientProfile?.planTrackers || []
      };

      return NextResponse.json(transformedPatient);
    } else {
      // All patients list with optimized query - filter by clinic
      const patients = await prisma.user.findMany({
        where: {
          role: 'PATIENT',
          deletedAt: null,
          ...clinicFilter
        },
        select: {
          id: true,
          name: true,
          email: true,
          phoneNumber: true,
          createdAt: true,
          patientProfile: {
            select: {
              planTrackers: {
                where: {
                  isActive: true,
                  deletedAt: null
                },
                select: {
                  plan: {
                    select: {
                      id: true,
                      name: true
                    }
                  }
                },
                take: 1
              }
            }
          }
        },
        orderBy: { createdAt: "desc" },
      });

      return NextResponse.json(patients);
    }
  } catch (error) {
    console.error("Patient details query error:", error);
    return NextResponse.json({ error: "Failed to fetch patient details" }, { status: 500 });
  }
}

// Optimized PUT endpoint for updating lab results and payments
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    console.log("PUT /api/admin/optimized/dashboard/patients-details called with body:", body);
    const { labBookingId, links, status, paymentId } = body;

    if (labBookingId && links) {
      // Get existing lab booking to append new links
      const existing = await prisma.labBooking.findUnique({
        where: { id: labBookingId },
        select: { 
          labResult: true,
          patientId: true,
          labDate: true
        }
      });

      if (!existing) {
        return NextResponse.json({ error: "Lab booking not found" }, { status: 404 });
      }

      // Update lab booking with new links (append to existing)
      const updatedLabBooking = await prisma.labBooking.update({
        where: { id: labBookingId },
        data: { 
          labResult: {
            set: [...(existing.labResult || []), ...links]
          },
          ...(status ? { status: normalizeLabAssignmentStatus(status) } : {})
        },
        select: {
          id: true,
          labResult: true,
          patient: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });

      // Trigger automatic AI processing for newly uploaded lab reports using unified processor
      if (links && links.length > 0) {
        console.log(`[ADMIN-UPLOAD] Triggering unified LLM processing for ${links.length} new reports`);
        
        // Get the starting index for new reports
        const existingCount = existing.labResult?.length || 0;
        
        // Trigger processing for each new report
        for (let i = 0; i < links.length; i++) {
          const labResultIndex = existingCount + i;
          const pdfUrl = links[i];
          
          try {
            // Create or update analysis record
            const analysis = await prisma.labReportAnalysis.upsert({
              where: {
                labBookingId_labResultIndex: {
                  labBookingId: labBookingId,
                  labResultIndex: labResultIndex
                }
              },
              update: {
                reportUrl: pdfUrl,
                processingStatus: 'PENDING',
                processingError: null,
                processedAt: null,
                deletedAt: null
              },
              create: {
                labBookingId: labBookingId,
                labResultIndex: labResultIndex,
                reportUrl: pdfUrl,
                processingStatus: 'PENDING'
              }
            });

            // Use unified processor instead of old processWithOpenRouter
            const { processLabReportWithLLM } = await import('@/lib/llm/unified-lab-processor');
            
            const context = {
              reportType: 'labBooking' as const,
              labBookingId: labBookingId,
              labReportAnalysisId: analysis.id,
              labResultIndex: labResultIndex,
              pdfUrl: pdfUrl,
              patientId: existing.patientId,
              reportDate: existing.labDate || new Date()
            };

            // Process in background with progress tracking
            processLabReportWithLLM(context, {
              analysisType: 'lab_analysis',
              updateProgress: async (stage, message) => {
                // Update progress in database for polling
                await prisma.labReportAnalysis.update({
                  where: { id: analysis.id },
                  data: { processingError: message }
                });
              }
            }).catch((error: any) => {
              console.error(`[ADMIN-UPLOAD] Unified LLM processing failed for analysis ${analysis.id}:`, error);
            });
            
            console.log(`[ADMIN-UPLOAD] Unified LLM processing started for analysis ${analysis.id}, index ${labResultIndex}`);
          } catch (error) {
            console.error(`[ADMIN-UPLOAD] Failed to trigger LLM processing for report at index ${labResultIndex}:`, error);
          }
        }
      }

      return NextResponse.json({
        success: true,
        message: "Lab results updated successfully",
        data: updatedLabBooking
      });
    }

    if (labBookingId && status) {
      // Update lab booking status
      const updatedLabBooking = await prisma.labBooking.update({
        where: { id: labBookingId },
        data: { status: normalizeLabAssignmentStatus(status) },
        select: {
          id: true,
          status: true
        }
      });

      return NextResponse.json({
        success: true,
        message: "Lab booking status updated successfully",
        data: updatedLabBooking
      });
    }

    if (paymentId) {
      // Update payment status to PAID
      const updatedPayment = await prisma.payment.update({
        where: { id: paymentId },
        data: { paymentStatus: "PAID" },
        select: {
          id: true,
          paymentStatus: true
        }
      });

      return NextResponse.json({
        success: true,
        message: "Payment marked as paid successfully",
        data: updatedPayment
      });
    }

    return NextResponse.json({ error: "Invalid request data" }, { status: 400 });
  } catch (error) {
    console.error("Patient details update error:", error);
    return NextResponse.json({ error: "Failed to update patient details" }, { status: 500 });
  }
}
