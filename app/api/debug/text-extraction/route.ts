import { NextRequest, NextResponse } from 'next/server';
import { createErrorHandler, categorizeError } from '@/lib/error-handling';

export async function GET(request: NextRequest) {
  const requestId = Math.random().toString(36).substring(7);
  console.log(`[DEBUG][${requestId}] Text extraction health check started`);
  
  const healthCheck: {
    timestamp: string;
    requestId: string;
    status: string;
    checks: {
      environment: Record<string, any>;
      apis: Record<string, any>;
      services: Record<string, any>;
    };
    errors: string[];
  } = {
    timestamp: new Date().toISOString(),
    requestId,
    status: 'checking',
    checks: {
      environment: {},
      apis: {},
      services: {}
    },
    errors: []
  };

  try {
    // Check environment variables
    console.log(`[DEBUG][${requestId}] Checking environment variables...`);
    healthCheck.checks.environment = {
      NODE_ENV: process.env.NODE_ENV,
      NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
      GCP_PROJECT_ID: process.env.GCP_PROJECT_ID ? 'SET' : 'MISSING',
      GCP_CLIENT_EMAIL: process.env.GCP_CLIENT_EMAIL ? 'SET' : 'MISSING',
      GCP_PRIVATE_KEY: process.env.GCP_PRIVATE_KEY ? 'SET' : 'MISSING',
      GCS_BUCKET: process.env.GCS_BUCKET ? 'SET' : 'MISSING',
      GROQ_API_KEY: process.env.GROQ_API_KEY ? 'SET' : 'MISSING',
      OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY ? 'SET' : 'MISSING',
      NEXT_PUBLIC_BLOB_READ_WRITE_TOKEN: process.env.NEXT_PUBLIC_BLOB_READ_WRITE_TOKEN ? 'SET' : 'MISSING',
      DATABASE_URL: process.env.DATABASE_URL ? 'SET' : 'MISSING'
    };

    // Check if required environment variables are missing
    const missingVars = [];
    if (!process.env.GCP_PROJECT_ID) missingVars.push('GCP_PROJECT_ID');
    if (!process.env.GCP_CLIENT_EMAIL) missingVars.push('GCP_CLIENT_EMAIL');
    if (!process.env.GCP_PRIVATE_KEY) missingVars.push('GCP_PRIVATE_KEY');
    if (!process.env.GCS_BUCKET) missingVars.push('GCS_BUCKET');
    if (!process.env.GROQ_API_KEY) missingVars.push('GROQ_API_KEY');

    if (missingVars.length > 0) {
      healthCheck.errors.push(`Missing environment variables: ${missingVars.join(', ')}`);
    }

    // Test parse-text API endpoint
    console.log(`[DEBUG][${requestId}] Testing parse-text API endpoint...`);
    try {
      const parseTextUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/llm-process/parse-text`;
      console.log(`[DEBUG][${requestId}] Testing parse-text API at: ${parseTextUrl}`);
      
      // Test with a dummy URL (this will fail but we can see if the endpoint is reachable)
      const testResponse = await fetch(parseTextUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pdfUrl: 'https://example.com/test.pdf' }),
        signal: AbortSignal.timeout(10000) // 10 second timeout
      });

      healthCheck.checks.apis.parseText = {
        reachable: true,
        status: testResponse.status,
        statusText: testResponse.statusText
      };

      console.log(`[DEBUG][${requestId}] Parse-text API test response: ${testResponse.status} ${testResponse.statusText}`);
    } catch (apiError) {
      console.error(`[DEBUG][${requestId}] Parse-text API test failed:`, apiError);
      healthCheck.checks.apis.parseText = {
        reachable: false,
        error: apiError instanceof Error ? apiError.message : 'Unknown error'
      };
      healthCheck.errors.push(`Parse-text API not reachable: ${apiError instanceof Error ? apiError.message : 'Unknown error'}`);
    }

    // Test GCP credentials (without making actual API calls)
    console.log(`[DEBUG][${requestId}] Testing GCP credentials...`);
    try {
      // Test GCP credentials by checking environment variables
      const gcpProjectId = process.env.GCP_PROJECT_ID;
      const gcpClientEmail = process.env.GCP_CLIENT_EMAIL;
      const gcpPrivateKey = process.env.GCP_PRIVATE_KEY;
      const gcsBucket = process.env.GCS_BUCKET;
      
      if (!gcpProjectId || !gcpClientEmail || !gcpPrivateKey || !gcsBucket) {
        throw new Error('Missing GCP environment variables');
      }
      
      healthCheck.checks.services.gcp = {
        credentialsValid: true,
        projectId: gcpProjectId,
        bucketName: gcsBucket
      };
      console.log(`[DEBUG][${requestId}] GCP credentials validation passed`);
    } catch (gcpError) {
      console.error(`[DEBUG][${requestId}] GCP credentials validation failed:`, gcpError);
      healthCheck.checks.services.gcp = {
        credentialsValid: false,
        error: gcpError instanceof Error ? gcpError.message : 'Unknown error'
      };
      healthCheck.errors.push(`GCP credentials invalid: ${gcpError instanceof Error ? gcpError.message : 'Unknown error'}`);
    }

    // Determine overall status
    if (healthCheck.errors.length === 0) {
      healthCheck.status = 'healthy';
    } else {
      healthCheck.status = 'unhealthy';
    }

    console.log(`[DEBUG][${requestId}] Health check completed: ${healthCheck.status}`);
    console.log(`[DEBUG][${requestId}] Errors found: ${healthCheck.errors.length}`);

    return NextResponse.json(healthCheck, { 
      status: healthCheck.status === 'healthy' ? 200 : 500 
    });

  } catch (error) {
    console.error(`[DEBUG][${requestId}] Health check failed:`, error);
    healthCheck.status = 'error';
    healthCheck.errors.push(`Health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    
    return NextResponse.json(healthCheck, { status: 500 });
  }
}
