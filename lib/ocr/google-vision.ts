import 'server-only';

import { Storage } from '@google-cloud/storage';
import vision from '@google-cloud/vision';
import { randomUUID } from 'crypto';
import { createErrorHandler, categorizeError } from '../error-handling';

type ServiceAccountCreds = {
  projectId: string;
  clientEmail: string;
  privateKey: string;
  bucketName: string;
};

function getCreds(): ServiceAccountCreds {
  console.log('[OCR] Checking GCP credentials...');
  const projectId = process.env.GCP_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT || '';
  const clientEmail = process.env.GCP_CLIENT_EMAIL || '';
  let privateKey = process.env.GCP_PRIVATE_KEY || '';
  const bucketName = process.env.GCS_BUCKET || '';
  
  console.log('[OCR] Credential check:', {
    hasProjectId: !!projectId,
    hasClientEmail: !!clientEmail,
    hasPrivateKey: !!privateKey,
    hasBucketName: !!bucketName,
    projectId: projectId ? `${projectId.substring(0, 8)}...` : 'missing',
    bucketName: bucketName ? `${bucketName.substring(0, 8)}...` : 'missing'
  });
  
  if (privateKey.includes('\\n')) {
    console.log('[OCR] Converting escaped newlines in private key');
    privateKey = privateKey.replace(/\\n/g, '\n');
  }
  
  if (!projectId || !clientEmail || !privateKey || !bucketName) {
    const missing = [];
    if (!projectId) missing.push('GCP_PROJECT_ID');
    if (!clientEmail) missing.push('GCP_CLIENT_EMAIL');
    if (!privateKey) missing.push('GCP_PRIVATE_KEY');
    if (!bucketName) missing.push('GCS_BUCKET');
    
    console.error('[OCR] Missing GCP credentials:', missing);
    throw new Error(`Missing GCP credentials or bucket env. Required: ${missing.join(', ')}`);
  }
  
  console.log('[OCR] GCP credentials validated successfully');
  return { projectId, clientEmail, privateKey, bucketName };
}

function getClients() {
  console.log('[OCR] Initializing GCP clients...');
  const { projectId, clientEmail, privateKey } = getCreds();
  const credentials = { client_email: clientEmail, private_key: privateKey } as any;
  
  try {
    console.log('[OCR] Creating Storage client...');
    const storage = new Storage({ projectId, credentials });
    
    console.log('[OCR] Creating Vision API client...');
    const imageAnnotatorClient = new vision.v1.ImageAnnotatorClient({ projectId, credentials });
    
    console.log('[OCR] GCP clients initialized successfully');
    return { storage, imageAnnotatorClient };
  } catch (error) {
    console.error('[OCR] Failed to initialize GCP clients:', error);
    throw error;
  }
}

async function uploadPdfToBucket(pdfUrl: string, objectPath: string) {
  console.log(`[OCR] Starting PDF upload to bucket:`, {
    pdfUrl: pdfUrl.substring(0, 100) + '...',
    objectPath,
    bucketName: getCreds().bucketName
  });
  
  const { storage } = getClients();
  const bucketName = getCreds().bucketName;
  
  try {
    console.log(`[OCR] Downloading PDF from URL...`);
    const res = await fetch(pdfUrl);
    if (!res.ok) {
      console.error(`[OCR] Failed to download PDF: ${res.status} ${res.statusText}`);
      throw new Error(`Failed to download PDF: ${res.status} ${res.statusText}`);
    }
    
    console.log(`[OCR] PDF download successful, converting to buffer...`);
    const buffer = Buffer.from(await res.arrayBuffer());
    console.log(`[OCR] PDF buffer created: ${buffer.length} bytes`);
    
    console.log(`[OCR] Uploading to GCS bucket: ${bucketName}`);
    const bucket = storage.bucket(bucketName);
    const file = bucket.file(objectPath);
    
    await file.save(buffer, { 
      contentType: 'application/pdf', 
      resumable: false, 
      public: false 
    });
    
    const gcsUrl = `gs://${bucketName}/${objectPath}`;
    console.log(`[OCR] PDF uploaded successfully to: ${gcsUrl}`);
    return gcsUrl;
  } catch (error) {
    console.error(`[OCR] PDF upload failed:`, {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      pdfUrl: pdfUrl.substring(0, 100) + '...',
      objectPath
    });
    throw error;
  }
}

async function listAndDownloadJson(prefix: string): Promise<string[]> {
  console.log(`[OCR] Listing and downloading JSON files with prefix: ${prefix}`);
  
  const { storage } = getClients();
  const bucketName = getCreds().bucketName;
  const bucket = storage.bucket(bucketName);
  
  try {
    console.log(`[OCR] Listing files in bucket with prefix...`);
    const [files] = await bucket.getFiles({ prefix });
    console.log(`[OCR] Found ${files.length} files with prefix ${prefix}`);
    
    const texts: string[] = [];
    let processedFiles = 0;
    let jsonFiles = 0;
    
    for (const f of files) {
      processedFiles++;
      if (!f.name.endsWith('.json')) {
        console.log(`[OCR] Skipping non-JSON file: ${f.name}`);
        continue;
      }
      
      jsonFiles++;
      console.log(`[OCR] Processing JSON file ${jsonFiles}/${files.length}: ${f.name}`);
      
      try {
        const [buf] = await f.download();
        const j = JSON.parse(buf.toString('utf-8'));
        const responses = j.responses || [];
        
        console.log(`[OCR] JSON file ${f.name} contains ${responses.length} responses`);
        
        for (const r of responses) {
          const fullText = r.fullTextAnnotation?.text;
          if (typeof fullText === 'string' && fullText.trim()) {
            texts.push(fullText);
            console.log(`[OCR] Extracted text from response: ${fullText.length} characters`);
          }
        }
      } catch (parseError) {
        console.error(`[OCR] Failed to parse JSON file ${f.name}:`, parseError);
      }
    }
    
    console.log(`[OCR] JSON processing completed:`, {
      totalFiles: files.length,
      processedFiles,
      jsonFiles,
      extractedTexts: texts.length,
      totalCharacters: texts.reduce((sum, text) => sum + text.length, 0)
    });
    
    return texts;
  } catch (error) {
    console.error(`[OCR] Failed to list and download JSON files:`, {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      prefix
    });
    throw error;
  }
}

export async function ocrExtractPdfTextFromUrl(pdfUrl: string): Promise<string> {
  const requestId = Math.random().toString(36).substring(7);
  const errorHandler = createErrorHandler(requestId, 'OCR_SERVICE');
  
  console.log(`[OCR][${requestId}] Starting OCR text extraction from URL: ${pdfUrl.substring(0, 100)}...`);
  
  try {
    const { imageAnnotatorClient } = getClients();
    const { bucketName } = getCreds();
    const id = randomUUID();
    const inputObject = `ocr-inputs/${id}.pdf`;
    const outputPrefix = `ocr-outputs/${id}/`;

    console.log(`[OCR][${requestId}] OCR job configuration:`, {
      id,
      inputObject,
      outputPrefix,
      bucketName
    });

    console.log(`[OCR][${requestId}] Step 1: Uploading PDF to GCS bucket...`);
    const gcsSourceUri = await uploadPdfToBucket(pdfUrl, inputObject);
    console.log(`[OCR][${requestId}] PDF uploaded to: ${gcsSourceUri}`);

    const gcsDestinationUri = `gs://${bucketName}/${outputPrefix}`;
    console.log(`[OCR][${requestId}] Output destination: ${gcsDestinationUri}`);

    const inputConfig = { mimeType: 'application/pdf', gcsSource: { uri: gcsSourceUri } };
    const outputConfig = { gcsDestination: { uri: gcsDestinationUri } };
    const features = [{ type: 'DOCUMENT_TEXT_DETECTION' as const }];

    console.log(`[OCR][${requestId}] Step 2: Submitting OCR job to Google Vision API...`);
    const request = { requests: [{ inputConfig, features, outputConfig }] } as any;
    const [operation] = await imageAnnotatorClient.asyncBatchAnnotateFiles(request);
    
    console.log(`[OCR][${requestId}] OCR job submitted, waiting for completion...`);
    const startTime = Date.now();
    await operation.promise();
    const duration = Date.now() - startTime;
    console.log(`[OCR][${requestId}] OCR job completed in ${duration}ms`);

    console.log(`[OCR][${requestId}] Step 3: Downloading and processing OCR results...`);
    const parts = await listAndDownloadJson(outputPrefix);
    
    console.log(`[OCR][${requestId}] Step 4: Combining extracted text...`);
    const text = parts.join('\n').replace(/\s+$/g, '').trim();
    
    console.log(`[OCR][${requestId}] OCR extraction completed:`, {
      totalParts: parts.length,
      totalCharacters: text.length,
      duration: `${duration}ms`
    });
    
    if (text.length === 0) {
      console.log(`[OCR][${requestId}] No text extracted from PDF`);
      errorHandler.logTextExtractionValidationError(text, 1);
    } else {
      console.log(`[OCR][${requestId}] Text extraction successful: ${text.length} characters`);
    }
    
    return text;
  } catch (error) {
    const errorCategory = categorizeError(error);
    console.error(`[OCR][${requestId}] OCR extraction failed (${errorCategory}):`, {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      pdfUrl: pdfUrl.substring(0, 100) + '...',
      category: errorCategory
    });

    // Use specific error handlers based on error category
    if (errorCategory === 'GCP_CREDENTIALS') {
      errorHandler.logGCPCredentialError(error);
    } else if (errorCategory === 'NETWORK_TIMEOUT' || errorCategory === 'CONNECTION_REFUSED' || errorCategory === 'DNS_ERROR') {
      errorHandler.logNetworkError(error, 'OCR_API_CALL', pdfUrl);
    } else if (errorCategory === 'OCR_FAILURE') {
      errorHandler.logOCRProcessingError(error, pdfUrl, 'VISION_API');
    } else {
      errorHandler.logOCRProcessingError(error, pdfUrl, 'GENERAL');
    }
    
    throw error;
  }
}




