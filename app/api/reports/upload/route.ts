import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import * as jose from 'jose';
import { generateSummary, extractValues } from '@/lib/llm/unified-service';

// JWT payload interface
interface JWTPayload {
  plusAddedPhoneNumber: string;
  userExists: boolean;
  userRole: string;
}

// Function to verify JWT token and get user
async function verifyUserToken(token: string): Promise<JWTPayload | null> {
  try {
    const secretKey = new TextEncoder().encode(process.env.JWT_SECRET!);
    const { payload } = await jose.jwtVerify(token, secretKey);
    return payload as unknown as JWTPayload;
  } catch (error) {
    console.error('JWT verification error:', error);
    return null;
  }
}

// Function to get user from request
async function getUserFromRequest(request: NextRequest) {
  const token = request.cookies.get("token")?.value;
  if (!token) return null;
  
  const decoded = await verifyUserToken(token);
  if (!decoded) return null;
  
  // Get user from database using phone number from JWT
  const user = await prisma.user.findFirst({
    where: { 
      phoneNumber: decoded.plusAddedPhoneNumber,
      deletedAt: null
    },
    select: { id: true, name: true, role: true, phoneNumber: true }
  });
  
  return user;
}

// Removed local duplicate functions - using unified-service instead

// Function to trigger LLM processing for standalone reports
async function triggerLLMProcessing(reportId: number, analysisType: string) {
  try {
    console.log(`[UPLOAD] Triggering LLM processing for report ${reportId}, type: ${analysisType}`);
    
    // Update status to PROCESSING
    await prisma.standaloneReportAnalysis.updateMany({
      where: { reportId, analysisType },
      data: { 
        processingStatus: 'PROCESSING',
        processingError: null
      }
    });

    // Get the report details
    const report = await prisma.standaloneReport.findUnique({
      where: { id: reportId }
    });

    if (!report) {
      throw new Error('Report not found');
    }

    // Stage 1: Parse Text
    console.log(`[UPLOAD][${reportId}] Stage 1: Starting text extraction`);
    await prisma.standaloneReportAnalysis.updateMany({
      where: { reportId, analysisType },
      data: { 
        processingError: 'Stage 1: Extracting text from file...'
      }
    });

    let extractedText = '';
    try {
      if (report.fileUrl.startsWith('http')) {
        // Use existing parse-text API for remote files
        // For server-side API calls, we need to use the full URL or call the function directly
        // Let's call the OCR function directly instead of making an HTTP request
        console.log(`[UPLOAD][${reportId}] Calling OCR function directly instead of HTTP request`);
        
        try {
          const { ocrExtractPdfTextFromUrl } = await import('@/lib/ocr/google-vision');
          extractedText = await ocrExtractPdfTextFromUrl(report.fileUrl);
          
          console.log(`[UPLOAD][${reportId}] Direct OCR extraction completed (${extractedText.length} chars)`);
          
          // Update database with extracted text and progress
          await prisma.standaloneReportAnalysis.updateMany({
            where: { reportId, analysisType },
            data: { 
              extractedText,
              processingError: 'Stage 2: Generating summary...'
            }
          });
        } catch (directOcrError) {
          console.error(`[UPLOAD][${reportId}] Direct OCR extraction failed:`, directOcrError);
          throw new Error(`Failed to extract text from file: ${directOcrError instanceof Error ? directOcrError.message : 'Unknown error'}`);
        }
      } else {
        throw new Error('Invalid file URL');
      }
    } catch (parseError) {
      console.error('Text extraction failed:', parseError);
      await prisma.standaloneReportAnalysis.updateMany({
        where: { reportId, analysisType },
        data: { 
          processingStatus: 'FAILED',
          processingError: `Stage 1 failed: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`
        }
      });
      throw new Error('Failed to extract text from file');
    }

    if (!extractedText || extractedText.trim().length < 50) {
      throw new Error('Insufficient text extracted from file');
    }

    // Process based on analysis type
    let llmSummary = '';
    let allValues: any[] = [];
    let criticalValues: any[] = [];
    let keyFindings: any[] = [];
    let recommendations: any[] = [];
    let urgency = 'ROUTINE';

    if (analysisType === 'lab_analysis') {
      // Stage 2: Generate Summary
      console.log(`[UPLOAD][${reportId}] Stage 2: Generating summary`);
      try {
        const groqApiKey = process.env.GROQ_API_KEY || '';
        const summaryResult = await generateSummary(extractedText, groqApiKey);
        llmSummary = summaryResult.summary;
        keyFindings = summaryResult.keyFindings;
        recommendations = summaryResult.recommendations;
        urgency = summaryResult.urgency;
        
        console.log(`[UPLOAD][${reportId}] Stage 2: Summary generation completed`);
        
        // Update database with summary progress
        await prisma.standaloneReportAnalysis.updateMany({
          where: { reportId, analysisType },
          data: { 
            llmSummary,
            keyFindings,
            recommendations,
            urgency,
            processingError: 'Stage 3: Extracting lab values...'
          }
        });
      } catch (summaryError) {
        console.error('Summary generation failed:', summaryError);
        await prisma.standaloneReportAnalysis.updateMany({
          where: { reportId, analysisType },
          data: { 
            processingStatus: 'FAILED',
            processingError: `Stage 2 failed: ${summaryError instanceof Error ? summaryError.message : 'Unknown error'}`
          }
        });
        throw summaryError;
      }

      // Stage 3: Extract Lab Values
      console.log(`[UPLOAD][${reportId}] Stage 3: Extracting lab values`);
      try {
        const groqApiKey = process.env.GROQ_API_KEY || '';
        const valuesResult = await extractValues(extractedText, groqApiKey);
        allValues = valuesResult.allValues;
        criticalValues = valuesResult.criticalValues;
        
        console.log(`[UPLOAD][${reportId}] Stage 3: Lab values extraction completed (${allValues.length} total, ${criticalValues.length} critical)`);
        
        // Log some sample values for debugging
        if (allValues.length > 0) {
          console.log(`[UPLOAD][${reportId}] Sample values:`, allValues.slice(0, 3));
        }
        if (criticalValues.length > 0) {
          console.log(`[UPLOAD][${reportId}] Critical values:`, criticalValues.slice(0, 3));
        }
        
        // Verify the data is properly assigned
        console.log(`[UPLOAD][${reportId}] Variables after assignment:`, {
          allValuesType: typeof allValues,
          allValuesLength: Array.isArray(allValues) ? allValues.length : 'not array',
          criticalValuesType: typeof criticalValues,
          criticalValuesLength: Array.isArray(criticalValues) ? criticalValues.length : 'not array'
        });
        
      } catch (valuesError) {
        console.error('Lab values extraction failed:', valuesError);
        await prisma.standaloneReportAnalysis.updateMany({
          where: { reportId, analysisType },
          data: { 
            processingStatus: 'FAILED',
            processingError: `Stage 3 failed: ${valuesError instanceof Error ? valuesError.message : 'Unknown error'}`
          }
        });
        throw valuesError;
      }
    } else if (analysisType === 'prescription_analysis') {
      // For prescriptions, use a simpler approach
      console.log(`[UPLOAD][${reportId}] Stage 2: Analyzing prescription`);
      await prisma.standaloneReportAnalysis.updateMany({
        where: { reportId, analysisType },
        data: { 
          processingError: 'Stage 2: Analyzing prescription...'
        }
      });

      const apiKey = process.env.OPENROUTER_API_KEY;
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
      
      if (apiKey) {
        try {
          const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'HTTP-Referer': siteUrl,
              'X-Title': 'CareDB Prescription Analysis',
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              model: 'meta-llama/llama-3.2-3b-instruct:free',
              messages: [
                {
                  role: 'system',
                  content: 'You are a medical prescription analyzer. Return JSON with summary, key findings, and recommendations.'
                },
                {
                  role: 'user',
                  content: `Analyze this prescription text and return JSON: ${extractedText}`
                }
              ],
              max_tokens: 1000,
              temperature: 0.1,
              response_format: { type: 'json_object' }
            })
          });

          if (response.ok) {
            const data = await response.json();
            const content = data.choices[0]?.message?.content;
            if (content) {
              try {
                const parsed = JSON.parse(content);
                llmSummary = parsed.summary || '';
                keyFindings = parsed.keyFindings || [];
                recommendations = parsed.recommendations || [];
              } catch (e) {
                llmSummary = content.substring(0, 500);
              }
            }
          }
        } catch (error) {
          console.error('LLM processing failed:', error);
        }
      }
    } else {
      // For general documents
      console.log(`[UPLOAD][${reportId}] Stage 2: Processing general document`);
      await prisma.standaloneReportAnalysis.updateMany({
        where: { reportId, analysisType },
        data: { 
          processingError: 'Stage 2: Processing document...'
        }
      });
      
      llmSummary = `Document analysis completed. Extracted ${extractedText.length} characters of text.`;
    }

    // Final stage: Update with completed results
    console.log(`[UPLOAD][${reportId}] Final stage: Updating database with results`);
    
    // Debug the final data before database update
    console.log(`[UPLOAD][${reportId}] Final data to be stored:`, {
      allValuesCount: Array.isArray(allValues) ? allValues.length : 'not array',
      criticalValuesCount: Array.isArray(criticalValues) ? criticalValues.length : 'not array',
      allValuesSample: Array.isArray(allValues) && allValues.length > 0 ? allValues[0] : 'none',
      criticalValuesSample: Array.isArray(criticalValues) && criticalValues.length > 0 ? criticalValues[0] : 'none'
    });
    
    await prisma.standaloneReportAnalysis.updateMany({
      where: { reportId, analysisType },
      data: { 
        processingStatus: 'COMPLETED',
        extractedText,
        llmSummary,
        allValues,
        criticalValues,
        keyFindings,
        recommendations,
        urgency,
        llmModel: 'meta-llama/llama-4-scout-17b-16e-instruct',
        processedAt: new Date(),
        processingError: null
      }
    });
    
    // Create trend data for standalone reports
    if (analysisType === 'lab_analysis' && Array.isArray(allValues) && allValues.length > 0) {
      console.log(`[UPLOAD][${reportId}] Creating trend data for ${allValues.length} parameters`);
      
      try {
        // Get the first available lab booking for standalone reports
        const firstLabBooking = await prisma.labBooking.findFirst({
          where: { deletedAt: null }
        });

        if (firstLabBooking) {
          // Create trend data for each parameter
          for (const value of allValues) {
            if (value.parameter && value.value) {
              try {
                await prisma.reportTrendData.create({
                  data: {
                    patientId: report.patientId,
                    parameter: String(value.parameter),
                    value: String(value.value),
                    unit: value.unit ? String(value.unit) : null,
                    normalRange: value.normalRange ? String(value.normalRange) : null,
                    isAbnormal: Boolean(value.isAbnormal),
                    severity: value.severity && ['LOW','NORMAL','HIGH','CRITICAL'].includes(String(value.severity).toUpperCase())
                      ? String(value.severity).toUpperCase() as 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL'
                      : null,
                    reportDate: report.createdAt,
                    labBookingId: firstLabBooking.id, // Use existing lab booking for standalone reports
                    sourceReportId: null // Standalone reports don't have sourceReportId
                  }
                });
              } catch (trendError) {
                console.log(`[UPLOAD][${reportId}] Error creating trend data for ${value.parameter}: ${trendError instanceof Error ? trendError.message : 'Unknown error'}`);
              }
            }
          }
          console.log(`[UPLOAD][${reportId}] Trend data creation completed`);
        } else {
          console.log(`[UPLOAD][${reportId}] No lab booking found, skipping trend data creation`);
        }
      } catch (trendError) {
        console.error(`[UPLOAD][${reportId}] Error creating trend data:`, trendError);
        // Don't fail the upload, just log the error
      }
    }

    console.log(`[UPLOAD] Successfully processed report ${reportId}`);
    console.log(`[UPLOAD][${reportId}] Database update completed with:`, {
      allValues: Array.isArray(allValues) ? allValues.length : 'not array',
      criticalValues: Array.isArray(criticalValues) ? criticalValues.length : 'not array'
    });
    
  } catch (error) {
    console.error(`[UPLOAD] Failed to process report ${reportId}:`, error);
    
    // Update status to FAILED
    await prisma.standaloneReportAnalysis.updateMany({
      where: { reportId, analysisType },
      data: { 
        processingStatus: 'FAILED',
        processingError: error instanceof Error ? error.message : 'Unknown error'
      }
    });
    
    throw error;
  }
}

export async function POST(request: NextRequest) {
  const requestId = Math.random().toString(36).substring(7);
  console.log(`[UPLOAD][${requestId}] Starting report upload process`);
  
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      console.log(`[UPLOAD][${requestId}] Authentication failed - no valid user token`);
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    console.log(`[UPLOAD][${requestId}] User authenticated: ${user.name} (${user.role})`);

    const formData = await request.formData();
    const patientId = formData.get('patientId') as string;
    const reportType = formData.get('reportType') as string;
    const file = formData.get('file') as File;

    console.log(`[UPLOAD][${requestId}] Form data received:`, {
      patientId,
      reportType,
      hasFile: !!file,
      fileSize: file?.size,
      fileType: file?.type,
      fileName: file?.name
    });

    if (!patientId || !reportType || !file) {
      console.log(`[UPLOAD][${requestId}] Missing required fields:`, { patientId, reportType, hasFile: !!file });
      return NextResponse.json({ 
        success: false, 
        error: 'Missing required fields: patientId, reportType, file' 
      }, { status: 400 });
    }

    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      console.log(`[UPLOAD][${requestId}] Invalid file type: ${file.type}`);
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid file type. Only PDF and image files are allowed.' 
      }, { status: 400 });
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      console.log(`[UPLOAD][${requestId}] File size exceeds limit: ${file.size} bytes`);
      return NextResponse.json({ 
        success: false, 
        error: 'File size too large. Maximum size is 10MB.' 
      }, { status: 400 });
    }

    console.log(`[UPLOAD][${requestId}] File validation passed: ${file.name} (${file.size} bytes, ${file.type})`);

    const isPatient = user.id === Number(patientId);
    const isDoctor = user.role === 'DOCTOR' || user.role === 'DIETICIAN';
    const isAdmin = user.role === 'ADMIN';
    
    console.log(`[UPLOAD][${requestId}] Permission check:`, {
      isPatient,
      isDoctor,
      isAdmin,
      userId: user.id,
      patientId: Number(patientId),
      userRole: user.role
    });
    
    if (!isPatient && !isDoctor && !isAdmin) {
      console.log(`[UPLOAD][${requestId}] Permission denied for user ${user.id} to upload for patient ${patientId}`);
      return NextResponse.json({ 
        success: false, 
        error: 'You do not have permission to upload reports for this patient' 
      }, { status: 403 });
    }

    // Upload file to Vercel Blob
    console.log(`[UPLOAD][${requestId}] Starting file upload to Vercel Blob...`);
    let fileUrl = '';
    try {
      const { put } = await import('@vercel/blob');
      const arrayBuffer = await file.arrayBuffer();
      const fileName = `standalone-report-${Date.now()}-${file.name}`;
      
      console.log(`[UPLOAD][${requestId}] Uploading file: ${fileName} (${arrayBuffer.byteLength} bytes)`);
      
      const { url } = await put(fileName, arrayBuffer, {
        access: 'public',
        token: process.env.NEXT_PUBLIC_BLOB_READ_WRITE_TOKEN,
      });
      
      fileUrl = url;
      console.log(`[UPLOAD][${requestId}] File uploaded successfully: ${fileUrl}`);
    } catch (uploadError) {
      console.error(`[UPLOAD][${requestId}] File upload failed:`, uploadError);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to upload file to storage' 
      }, { status: 500 });
    }

    console.log(`[UPLOAD][${requestId}] Creating report record in database...`);
    const report = await prisma.standaloneReport.create({
      data: {
        patientId: Number(patientId),
        uploadedByUserId: user.id,
        reportType,
        fileName: file.name,
        fileUrl: fileUrl,
        fileSize: file.size,
        mimeType: file.type,
        status: 'PENDING'
      }
    });
    console.log(`[UPLOAD][${requestId}] Report record created with ID: ${report.id}`);

    // Trigger LLM processing based on report type
    if (reportType === 'lab_report') {
      console.log(`[UPLOAD][${requestId}] Creating lab analysis record...`);
      await prisma.standaloneReportAnalysis.create({
        data: {
          reportId: report.id,
          analysisType: 'lab_analysis',
          processingStatus: 'PENDING'
        }
      });

      // Trigger automatic LLM processing for lab reports
      console.log(`[UPLOAD][${requestId}] Triggering LLM processing for lab report ${report.id}...`);
      console.log(`[UPLOAD][${requestId}] Environment check:`, {
        hasGroqKey: !!process.env.GROQ_API_KEY,
        hasGcpProject: !!process.env.GCP_PROJECT_ID,
        hasGcpEmail: !!process.env.GCP_CLIENT_EMAIL,
        hasGcpKey: !!process.env.GCP_PRIVATE_KEY,
        hasGcsBucket: !!process.env.GCS_BUCKET,
        siteUrl: process.env.NEXT_PUBLIC_SITE_URL
      });
      
      try {
        await triggerLLMProcessing(report.id, 'lab_analysis');
        console.log(`[UPLOAD][${requestId}] LLM processing triggered successfully for report ${report.id}`);
      } catch (error) {
        console.error(`[UPLOAD][${requestId}] Failed to trigger LLM processing for report ${report.id}:`, {
          error,
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined
        });
        
        // Update the analysis record with the error
        await prisma.standaloneReportAnalysis.updateMany({
          where: { reportId: report.id, analysisType: 'lab_analysis' },
          data: {
            processingStatus: 'FAILED',
            processingError: `LLM processing trigger failed: ${error instanceof Error ? error.message : 'Unknown error'}`
          }
        });
      }
    } else if (reportType === 'prescription') {
      console.log(`[UPLOAD][${requestId}] Creating prescription analysis record...`);
      await prisma.standaloneReportAnalysis.create({
        data: {
          reportId: report.id,
          analysisType: 'prescription_analysis',
          processingStatus: 'PENDING'
        }
      });

      // Trigger automatic LLM processing for prescriptions
      console.log(`[UPLOAD][${requestId}] Triggering LLM processing for prescription ${report.id}...`);
      try {
        await triggerLLMProcessing(report.id, 'prescription_analysis');
        console.log(`[UPLOAD][${requestId}] LLM processing triggered successfully for prescription ${report.id}`);
      } catch (error) {
        console.error(`[UPLOAD][${requestId}] Failed to trigger LLM processing for prescription ${report.id}:`, error);
      }
    } else {
      console.log(`[UPLOAD][${requestId}] Creating document summary analysis record...`);
      await prisma.standaloneReportAnalysis.create({
        data: {
          reportId: report.id,
          analysisType: 'document_summary',
          processingStatus: 'PENDING'
        }
      });

      // Trigger automatic LLM processing for medical documents
      console.log(`[UPLOAD][${requestId}] Triggering LLM processing for document ${report.id}...`);
      try {
        await triggerLLMProcessing(report.id, 'document_summary');
        console.log(`[UPLOAD][${requestId}] LLM processing triggered successfully for document ${report.id}`);
      } catch (error) {
        console.error(`[UPLOAD][${requestId}] Failed to trigger LLM processing for document ${report.id}:`, error);
      }
    }

    console.log(`[UPLOAD][${requestId}] Upload process completed successfully for report ${report.id}`);
    return NextResponse.json({ 
      success: true, 
      report,
      message: 'Report uploaded successfully. Processing will begin shortly.' 
    });

  } catch (error: any) {
    console.error(`[UPLOAD][${requestId}] Report upload error:`, error);
    return NextResponse.json({ 
      success: false, 
      error: error?.message || 'Failed to upload report' 
    }, { status: 500 });
  }
}

// Get reports for a patient
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patientId');

    if (!patientId) {
      return NextResponse.json({ success: false, error: 'Patient ID required' }, { status: 400 });
    }

    // Check permissions
    const isPatient = user.id === Number(patientId);
    const isDoctor = user.role === 'DOCTOR' || user.role === 'DIETICIAN';
    const isAdmin = user.role === 'ADMIN';
    
    if (!isPatient && !isDoctor && !isAdmin) {
      return NextResponse.json({ 
        success: false, 
        error: 'You do not have permission to view reports for this patient' 
      }, { status: 403 });
    }

    const reports = await prisma.standaloneReport.findMany({
      where: {
        patientId: Number(patientId),
        deletedAt: null
      },
      include: {
        reportAnalyses: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'desc' }
        },
        uploadedBy: {
          select: { id: true, name: true, role: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ success: true, reports });

  } catch (error: any) {
    console.error('Get reports error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error?.message || 'Failed to fetch reports' 
    }, { status: 500 });
  }
}
