import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import * as jose from 'jose';

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

// Function to generate summary for standalone reports
async function generateStandaloneSummary(text: string): Promise<{ summary: string; keyFindings: any[]; recommendations: any[]; urgency: string }> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error('GROQ_API_KEY not configured');
  }

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-4-scout-17b-16e-instruct',
        messages: [
          {
            role: 'system',
            content: 'You are a medical lab report analyzer. Analyze the provided lab report and return a JSON response with the following structure: { "summary": "clinical summary in 200-250 words", "keyFindings": ["finding1", "finding2"], "recommendations": ["recommendation1", "recommendation2"], "urgency": "ROUTINE|SOON|URGENT" }'
          },
          {
            role: 'user',
            content: `Analyze this lab report and return JSON only:\n\n${text}`
          }
        ],
        max_tokens: 1000,
        temperature: 0.1,
        response_format: { type: 'json_object' }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Groq API error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error('No content received from Groq API');
    }

    try {
      const parsed = JSON.parse(content);
      return {
        summary: parsed.summary || 'Analysis completed successfully.',
        keyFindings: Array.isArray(parsed.keyFindings) ? parsed.keyFindings : [],
        recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
        urgency: parsed.urgency || 'ROUTINE'
      };
    } catch (parseError) {
      // Fallback if JSON parsing fails
      return {
        summary: content.substring(0, 500),
        keyFindings: [],
        recommendations: [],
        urgency: 'ROUTINE'
      };
    }
  } catch (error) {
    console.error('Standalone summary generation failed:', error);
    throw error;
  }
}

// Function to extract values for standalone reports
async function extractStandaloneValues(text: string): Promise<{ allValues: any[]; criticalValues: any[] }> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error('GROQ_API_KEY not configured');
  }

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-4-scout-17b-16e-instruct',
        messages: [
          {
            role: 'system',
            content: 'You are a medical lab report analyzer. Extract ONLY the test parameters and values that are explicitly mentioned in the provided lab report text. DO NOT generate, invent, or hallucinate any values not present in the text. Return ONLY valid JSON with this exact structure: {"allValues": [{"parameter": "name", "value": "value", "unit": "unit", "normalRange": "range", "isAbnormal": true/false, "severity": "LOW|NORMAL|HIGH|CRITICAL", "category": "CBC|LFT|KFT|LIPID|DIABETES"}], "criticalValues": [same structure for abnormal values only]}. Use only double quotes, no trailing commas, and ensure all values are properly formatted.'
          },
          {
            role: 'user',
            content: `Extract ONLY the test parameters and values that are explicitly mentioned in this lab report. DO NOT generate, invent, or hallucinate any values not present in the text. Return ONLY the JSON object:\n\n${text}`
          }
        ],
        max_tokens: 2000,
        temperature: 0.1,
        response_format: { type: 'json_object' }
      })
    });

    let content = '';
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[UPLOAD] Groq API returned ${response.status}: ${errorText}`);
      
      // Check if the error response contains valid JSON data
      try {
        const errorData = JSON.parse(errorText);
        if (errorData.error && errorData.error.failed_generation) {
          // Groq sometimes returns valid JSON in failed_generation field
          content = errorData.error.failed_generation;
          console.log(`[UPLOAD] Found valid JSON in failed_generation field`);
        } else {
          throw new Error(`Groq API error: ${response.status} ${errorText}`);
        }
      } catch (parseError) {
        throw new Error(`Groq API error: ${response.status} ${errorText}`);
      }
    } else {
      const data = await response.json();
      content = data.choices[0]?.message?.content;
      
      if (!content) {
        throw new Error('No content received from Groq API response');
      }
    }
    
    if (!content) {
      throw new Error('No content received from Groq API');
    }

    try {
      const parsed = JSON.parse(content);
      return {
        allValues: Array.isArray(parsed.allValues) ? parsed.allValues : [],
        criticalValues: Array.isArray(parsed.criticalValues) ? parsed.criticalValues : []
      };
    } catch (parseError) {
      console.error('Failed to parse JSON content:', parseError);
      console.log('Raw content:', content);
      
      // Try to repair the JSON before giving up
      try {
        console.log('[UPLOAD] Attempting JSON repair...');
        const repairedContent = repairJsonString(content);
        const parsed = JSON.parse(repairedContent);
        
        console.log('[UPLOAD] JSON repair successful, extracted data:', {
          allValuesCount: Array.isArray(parsed.allValues) ? parsed.allValues.length : 0,
          criticalValuesCount: Array.isArray(parsed.criticalValues) ? parsed.criticalValues.length : 0
        });
        
        return {
          allValues: Array.isArray(parsed.allValues) ? parsed.allValues : [],
          criticalValues: Array.isArray(parsed.criticalValues) ? parsed.criticalValues : []
        };
      } catch (repairError) {
        console.error('JSON repair also failed:', repairError);
        
        // Fallback if JSON parsing fails
        return {
          allValues: [],
          criticalValues: []
        };
      }
    }
  } catch (error) {
    console.error('Standalone values extraction failed:', error);
    throw error;
  }
}

// Function to repair common JSON syntax errors
function repairJsonString(jsonString: string): string {
  try {
    // First try to parse as-is
    JSON.parse(jsonString);
    return jsonString;
  } catch (error) {
    console.log('[UPLOAD] JSON parsing failed, attempting to repair...');
    
    let repaired = jsonString;
    
    // Fix missing closing brackets for arrays
    if (repaired.includes('"allValues":[') && !repaired.includes('"allValues":[]')) {
      // Count opening brackets after "allValues":[
      const allValuesStart = repaired.indexOf('"allValues":[');
      let bracketCount = 0;
      let inString = false;
      let escapeNext = false;
      
      for (let i = allValuesStart + 13; i < repaired.length; i++) {
        const char = repaired[i];
        
        if (escapeNext) {
          escapeNext = false;
          continue;
        }
        
        if (char === '\\') {
          escapeNext = true;
          continue;
        }
        
        if (char === '"' && !escapeNext) {
          inString = !inString;
          continue;
        }
        
        if (!inString) {
          if (char === '[') bracketCount++;
          if (char === ']') bracketCount--;
          
          // If we hit a closing brace and have unmatched brackets, add missing array close
          if (char === '}' && bracketCount > 0) {
            repaired = repaired.slice(0, i) + ']' + repaired.slice(i);
            break;
          }
        }
      }
      
      // If we still have unmatched brackets, add them at the end
      if (bracketCount > 0) {
        repaired = repaired.replace(/}}$/, ']}');
      }
    }
    
    // Fix missing closing brackets for criticalValues array
    if (repaired.includes('"criticalValues":[') && !repaired.includes('"criticalValues":[]')) {
      const criticalValuesStart = repaired.indexOf('"criticalValues":[');
      let bracketCount = 0;
      let inString = false;
      let escapeNext = false;
      
      for (let i = criticalValuesStart + 18; i < repaired.length; i++) {
        const char = repaired[i];
        
        if (escapeNext) {
          escapeNext = false;
          continue;
        }
        
        if (char === '\\') {
          escapeNext = true;
          continue;
        }
        
        if (char === '"' && !escapeNext) {
          inString = !inString;
          continue;
        }
        
        if (!inString) {
          if (char === '[') bracketCount++;
          if (char === ']') bracketCount--;
          
          if (char === '}' && bracketCount > 0) {
            repaired = repaired.slice(0, i) + ']' + repaired.slice(i);
            break;
          }
        }
      }
      
      if (bracketCount > 0) {
        repaired = repaired.replace(/}}$/, ']}');
      }
    }
    
    // Try to parse the repaired JSON
    try {
      JSON.parse(repaired);
      console.log('[UPLOAD] JSON repair successful');
      return repaired;
    } catch (repairError) {
      console.log('[UPLOAD] JSON repair failed, attempting manual extraction...');
      
      // Last resort: try to extract arrays manually using regex
      const allValuesMatch = repaired.match(/"allValues":\s*\[([\s\S]*?)(?=\s*,\s*"criticalValues"|$)/);
      const criticalValuesMatch = repaired.match(/"criticalValues":\s*\[([\s\S]*?)(?=\s*}$|$)/);
      
      if (allValuesMatch || criticalValuesMatch) {
        const manualJson = {
          allValues: allValuesMatch ? parseArrayFromString(allValuesMatch[1]) : [],
          criticalValues: criticalValuesMatch ? parseArrayFromString(criticalValuesMatch[1]) : []
        };
        
        console.log('[UPLOAD] Manual extraction successful');
        return JSON.stringify(manualJson);
      }
      
      throw repairError;
    }
  }
}

// Helper function to parse array elements from string
function parseArrayFromString(arrayString: string): any[] {
  try {
    // Try to parse as JSON first
    return JSON.parse('[' + arrayString + ']');
  } catch {
    // If that fails, try to extract individual objects
    const objects: any[] = [];
    let currentObject = '';
    let braceCount = 0;
    let inString = false;
    let escapeNext = false;
    
    for (let i = 0; i < arrayString.length; i++) {
      const char = arrayString[i];
      
      if (escapeNext) {
        escapeNext = false;
        currentObject += char;
        continue;
      }
      
      if (char === '\\') {
        escapeNext = true;
        currentObject += char;
        continue;
      }
      
      if (char === '"' && !escapeNext) {
        inString = !inString;
        currentObject += char;
        continue;
      }
      
      if (!inString) {
        if (char === '{') braceCount++;
        if (char === '}') braceCount--;
      }
      
      currentObject += char;
      
      if (braceCount === 0 && char === '}' && currentObject.trim()) {
        try {
          const obj = JSON.parse(currentObject.trim());
          objects.push(obj);
        } catch {
          // Skip malformed objects
        }
        currentObject = '';
      }
    }
    
    return objects;
  }
}

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
        const parseResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/llm-process/parse-text`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pdfUrl: report.fileUrl }),
          signal: AbortSignal.timeout(60000) // 60 second timeout
        });

        if (parseResponse.ok) {
          const parseData = await parseResponse.json();
          extractedText = parseData.text;
          
          console.log(`[UPLOAD][${reportId}] Stage 1: Text extraction completed (${extractedText.length} chars)`);
          
          // Update database with extracted text and progress
          await prisma.standaloneReportAnalysis.updateMany({
            where: { reportId, analysisType },
            data: { 
              extractedText,
              processingError: 'Stage 2: Generating summary...'
            }
          });
        } else {
          const errorText = await parseResponse.text();
          console.error(`[UPLOAD][${reportId}] Parse-text API failed: ${parseResponse.status} ${errorText}`);
          throw new Error(`Failed to parse file: ${parseResponse.status} ${errorText}`);
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
        const summaryResult = await generateStandaloneSummary(extractedText);
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
        const valuesResult = await extractStandaloneValues(extractedText);
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
                      ? String(value.severity).toUpperCase()
                      : null,
                    reportDate: report.createdAt,
                    labBookingId: firstLabBooking.id, // Use existing lab booking for standalone reports
                    sourceReportId: null // Standalone reports don't have sourceReportId
                  }
                });
              } catch (trendError) {
                console.log(`[UPLOAD][${reportId}] Error creating trend data for ${value.parameter}: ${trendError.message}`);
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
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const patientId = formData.get('patientId') as string;
    const reportType = formData.get('reportType') as string;
    const file = formData.get('file') as File;

    if (!patientId || !reportType || !file) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing required fields: patientId, reportType, file' 
      }, { status: 400 });
    }

    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid file type. Only PDF and image files are allowed.' 
      }, { status: 400 });
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json({ 
        success: false, 
        error: 'File size too large. Maximum size is 10MB.' 
      }, { status: 400 });
    }

    const isPatient = user.id === Number(patientId);
    const isDoctor = user.role === 'DOCTOR' || user.role === 'DIETICIAN';
    
    if (!isPatient && !isDoctor) {
      return NextResponse.json({ 
        success: false, 
        error: 'You do not have permission to upload reports for this patient' 
      }, { status: 403 });
    }

    // Upload file to Vercel Blob
    let fileUrl = '';
    try {
      const { put } = await import('@vercel/blob');
      const arrayBuffer = await file.arrayBuffer();
      const fileName = `standalone-report-${Date.now()}-${file.name}`;
      
      const { url } = await put(fileName, arrayBuffer, {
        access: 'public',
        token: process.env.NEXT_PUBLIC_BLOB_READ_WRITE_TOKEN,
      });
      
      fileUrl = url;
    } catch (uploadError) {
      console.error('File upload failed:', uploadError);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to upload file to storage' 
      }, { status: 500 });
    }

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

    // Trigger LLM processing based on report type
    if (reportType === 'lab_report') {
      await prisma.standaloneReportAnalysis.create({
        data: {
          reportId: report.id,
          analysisType: 'lab_analysis',
          processingStatus: 'PENDING'
        }
      });

      // Trigger automatic LLM processing for lab reports
      try {
        await triggerLLMProcessing(report.id, 'lab_analysis');
      } catch (error) {
        console.error('Failed to trigger LLM processing:', error);
        // Don't fail the upload, just log the error
      }
    } else if (reportType === 'prescription') {
      await prisma.standaloneReportAnalysis.create({
        data: {
          reportId: report.id,
          analysisType: 'prescription_analysis',
          processingStatus: 'PENDING'
        }
      });

      // Trigger automatic LLM processing for prescriptions
      try {
        await triggerLLMProcessing(report.id, 'prescription_analysis');
      } catch (error) {
        console.error('Failed to trigger LLM processing:', error);
      }
    } else {
      await prisma.standaloneReportAnalysis.create({
        data: {
          reportId: report.id,
          analysisType: 'document_summary',
          processingStatus: 'PENDING'
        }
      });

      // Trigger automatic LLM processing for medical documents
      try {
        await triggerLLMProcessing(report.id, 'document_summary');
      } catch (error) {
        console.error('Failed to trigger LLM processing:', error);
      }
    }

    return NextResponse.json({ 
      success: true, 
      report,
      message: 'Report uploaded successfully. Processing will begin shortly.' 
    });

  } catch (error: any) {
    console.error('Report upload error:', error);
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
    
    if (!isPatient && !isDoctor) {
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
