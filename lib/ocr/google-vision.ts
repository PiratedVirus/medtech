import 'server-only';

import { Storage } from '@google-cloud/storage';
import vision from '@google-cloud/vision';
import { randomUUID } from 'crypto';

type ServiceAccountCreds = {
  projectId: string;
  clientEmail: string;
  privateKey: string;
  bucketName: string;
};

function getCreds(): ServiceAccountCreds {
  const projectId = process.env.GCP_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT || '';
  const clientEmail = process.env.GCP_CLIENT_EMAIL || '';
  let privateKey = process.env.GCP_PRIVATE_KEY || '';
  const bucketName = process.env.GCS_BUCKET || '';
  if (privateKey.includes('\\n')) privateKey = privateKey.replace(/\\n/g, '\n');
  if (!projectId || !clientEmail || !privateKey || !bucketName) {
    throw new Error('Missing GCP credentials or bucket env. Required: GCP_PROJECT_ID, GCP_CLIENT_EMAIL, GCP_PRIVATE_KEY, GCS_BUCKET');
  }
  return { projectId, clientEmail, privateKey, bucketName };
}

function getClients() {
  const { projectId, clientEmail, privateKey } = getCreds();
  const credentials = { client_email: clientEmail, private_key: privateKey } as any;
  const storage = new Storage({ projectId, credentials });
  const imageAnnotatorClient = new vision.v1.ImageAnnotatorClient({ projectId, credentials });
  return { storage, imageAnnotatorClient };
}

async function uploadPdfToBucket(pdfUrl: string, objectPath: string) {
  const { storage } = getClients();
  const bucketName = getCreds().bucketName;
  const res = await fetch(pdfUrl);
  if (!res.ok) throw new Error(`Failed to download PDF: ${res.status} ${res.statusText}`);
  const buffer = Buffer.from(await res.arrayBuffer());
  const bucket = storage.bucket(bucketName);
  const file = bucket.file(objectPath);
  await file.save(buffer, { contentType: 'application/pdf', resumable: false, public: false });
  return `gs://${bucketName}/${objectPath}`;
}

async function listAndDownloadJson(prefix: string): Promise<string[]> {
  const { storage } = getClients();
  const bucketName = getCreds().bucketName;
  const bucket = storage.bucket(bucketName);
  const [files] = await bucket.getFiles({ prefix });
  const texts: string[] = [];
  for (const f of files) {
    if (!f.name.endsWith('.json')) continue;
    const [buf] = await f.download();
    try {
      const j = JSON.parse(buf.toString('utf-8'));
      const responses = j.responses || [];
      for (const r of responses) {
        const fullText = r.fullTextAnnotation?.text;
        if (typeof fullText === 'string' && fullText.trim()) texts.push(fullText);
      }
    } catch {}
  }
  return texts;
}

export async function ocrExtractPdfTextFromUrl(pdfUrl: string): Promise<string> {
  const { imageAnnotatorClient } = getClients();
  const { bucketName } = getCreds();
  const id = randomUUID();
  const inputObject = `ocr-inputs/${id}.pdf`;
  const outputPrefix = `ocr-outputs/${id}/`;

  const gcsSourceUri = await uploadPdfToBucket(pdfUrl, inputObject);
  const gcsDestinationUri = `gs://${bucketName}/${outputPrefix}`;

  const inputConfig = { mimeType: 'application/pdf', gcsSource: { uri: gcsSourceUri } };
  const outputConfig = { gcsDestination: { uri: gcsDestinationUri } };
  const features = [{ type: 'DOCUMENT_TEXT_DETECTION' as const }];

  const request = { requests: [{ inputConfig, features, outputConfig }] } as any;
  const [operation] = await imageAnnotatorClient.asyncBatchAnnotateFiles(request);
  await operation.promise();

  const parts = await listAndDownloadJson(outputPrefix);
  const text = parts.join('\n').replace(/\s+$/g, '').trim();
  return text;
}




