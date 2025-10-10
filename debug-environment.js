// Environment Variables Debug Script
// Run this on your live server to check if all required env vars are set

console.log('=== ENVIRONMENT VARIABLES DEBUG ===');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('NEXT_PUBLIC_SITE_URL:', process.env.NEXT_PUBLIC_SITE_URL);

// GCP Credentials (Required for OCR)
console.log('\n=== GCP CREDENTIALS ===');
console.log('GCP_PROJECT_ID:', process.env.GCP_PROJECT_ID ? 'SET' : 'MISSING');
console.log('GCP_CLIENT_EMAIL:', process.env.GCP_CLIENT_EMAIL ? 'SET' : 'MISSING');
console.log('GCP_PRIVATE_KEY:', process.env.GCP_PRIVATE_KEY ? 'SET' : 'MISSING');
console.log('GCS_BUCKET:', process.env.GCS_BUCKET ? 'SET' : 'MISSING');

// LLM API Keys
console.log('\n=== LLM API KEYS ===');
console.log('GROQ_API_KEY:', process.env.GROQ_API_KEY ? 'SET' : 'MISSING');
console.log('OPENROUTER_API_KEY:', process.env.OPENROUTER_API_KEY ? 'SET' : 'MISSING');

// Vercel Blob Storage
console.log('\n=== VERCEL BLOB ===');
console.log('NEXT_PUBLIC_BLOB_READ_WRITE_TOKEN:', process.env.NEXT_PUBLIC_BLOB_READ_WRITE_TOKEN ? 'SET' : 'MISSING');

// Database
console.log('\n=== DATABASE ===');
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'SET' : 'MISSING');

console.log('\n=== DEBUG COMPLETE ===');
