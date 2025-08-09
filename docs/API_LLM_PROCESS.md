# LLM Process API Documentation

## Overview
Single unified API endpoint for lab report analysis using OpenRouter LLM integration.

**Endpoint**: `/api/llm-process`

## Features
- ✅ **Robust validation** - Report ID, Patient ID, URL format validation
- ✅ **Smart caching** - Avoids reprocessing existing analyses  
- ✅ **Error handling** - Clear error messages with proper HTTP status codes
- ✅ **Patient ownership validation** - Ensures reports belong to the correct patient
- ✅ **OpenRouter integration** - Direct PDF upload with free `gpt-oss-20b` model
- ✅ **Background processing** - Non-blocking analysis with status polling

## API Endpoints

### GET `/api/llm-process?reportId={id}`
Check status and retrieve existing analysis.

**Query Parameters:**
- `reportId` (required): Lab booking ID

**Response Statuses:**
- `exists` - Analysis found and available
- `not_found` - No analysis exists, ready for processing

**Examples:**
```bash
# Check existing analysis
curl GET "http://localhost:3000/api/llm-process?reportId=2"

# Response: Analysis exists
{
  "success": true,
  "status": "exists", 
  "analysis": { /* full analysis object */ },
  "message": "Analysis found with status: COMPLETED"
}

# Response: No analysis 
{
  "success": true,
  "status": "not_found",
  "labBooking": { /* lab booking details */ },
  "message": "No analysis found. Ready for processing.",
  "canProcess": true
}
```

### POST `/api/llm-process`
Start LLM processing or retrieve existing results.

**Request Body:**
```json
{
  "reportId": 2,
  "patientId": 9,
  "forceReprocess": false  // Optional: force reprocessing
}
```

**Response Statuses:**
- `already_exists` - Analysis completed, returned immediately
- `processing` - Analysis currently being processed
- `sample_created` - No PDF available, sample analysis created
- `processing_started` - New analysis started successfully

**Examples:**
```bash
# Start processing
curl -X POST http://localhost:3000/api/llm-process \
  -H "Content-Type: application/json" \
  -d '{"reportId": 2, "patientId": 9}'

# Response: Processing started
{
  "success": true,
  "status": "processing_started",
  "analysisId": 123,
  "message": "LLM processing started successfully",
  "estimatedTime": "30-60 seconds"
}
```

## Error Responses

### 400 - Bad Request
```json
{
  "success": false,
  "error": "Invalid report ID. Must be a positive number.",
  "reportId": "invalid"
}
```

### 403 - Forbidden  
```json
{
  "success": false,
  "error": "Patient ID mismatch. This report belongs to a different patient.",
  "reportId": 2,
  "patientId": 5,
  "actualPatientId": 9
}
```

### 404 - Not Found
```json
{
  "success": false,
  "error": "Lab booking not found",
  "reportId": 999
}
```

### 500 - Internal Server Error
```json
{
  "success": false,
  "error": "Internal server error",
  "details": "OPENROUTER_API_KEY not configured"  // Development only
}
```

## Frontend Integration

### React Hook Usage
```typescript
// Check status first
const response = await fetch(`/api/llm-process?reportId=${reportId}`);
const data = await response.json();

if (data.status === 'exists') {
  // Display existing analysis
  setAnalysis(data.analysis);
} else if (data.status === 'not_found') {
  // Start processing
  const processResponse = await fetch(`/api/llm-process`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reportId, patientId })
  });
}
```

### Polling for Completion
```typescript
const pollInterval = setInterval(async () => {
  const response = await fetch(`/api/llm-process?reportId=${reportId}`);
  const data = await response.json();
  
  if (data.status === 'exists' && data.analysis.processingStatus === 'COMPLETED') {
    clearInterval(pollInterval);
    setAnalysis(data.analysis);
  }
}, 3000);
```

## Analysis Response Structure

```json
{
  "id": 123,
  "labBookingId": 2,
  "reportUrl": "https://example.com/report.pdf",
  "llmSummary": "Clinical interpretation...",
  "criticalValues": [
    {
      "parameter": "HbA1c",
      "value": "7.2",
      "unit": "%",
      "normalRange": "<7.0%",
      "isAbnormal": true,
      "severity": "HIGH"
    }
  ],
  "trendAnalysis": {
    "trends": "Glucose levels trending upward..."
  },
  "processingStatus": "COMPLETED",
  "processedAt": "2025-08-09T08:07:35.559Z"
}
```

## Environment Variables

```bash
OPENROUTER_API_KEY=your_api_key_here
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## Migration from Old API

**Before:** Two separate endpoints
- `GET /api/lab-reports/[reportId]/analysis` 
- `POST /api/lab-reports/[reportId]/process`

**After:** Single unified endpoint
- `GET /api/llm-process/[reportId]` - Check status
- `POST /api/llm-process/[reportId]` - Process/retrieve

**Benefits:**
- ✅ No more confusing 404 errors
- ✅ Better URL structure
- ✅ Comprehensive validation
- ✅ Single point of truth
- ✅ Clearer response formats