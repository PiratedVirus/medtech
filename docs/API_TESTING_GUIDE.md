# LLM Process API Testing Guide

## New API Endpoints

The API has been restructured for better design and reliability:

### ✅ **GET /api/llm-process**
Check status and retrieve existing analysis

**Query Parameters:**
- `reportId` (required): Lab booking ID

**Example:**
```bash
curl "http://localhost:3000/api/llm-process?reportId=1"
```

**Response Examples:**

**Analysis Exists:**
```json
{
  "success": true,
  "status": "exists",
  "analysis": {
    "id": 123,
    "processingStatus": "COMPLETED",
    "llmSummary": "...",
    "criticalValues": [...],
    // ... other fields
  },
  "message": "Analysis found with status: COMPLETED"
}
```

**No Analysis Found:**
```json
{
  "success": true,
  "status": "not_found",
  "labBooking": {
    "id": 1,
    "labResult": ["https://example.com/report.pdf"],
    // ... other fields
  },
  "message": "No analysis found. Ready for processing.",
  "canProcess": true
}
```

### ✅ **POST /api/llm-process**
Start LLM processing or retrieve existing results

**Request Body:**
```json
{
  "reportId": 1,
  "patientId": 9,
  "forceReprocess": false  // Optional: force reprocessing
}
```

**Example:**
```bash
curl -X POST http://localhost:3000/api/llm-process \
  -H "Content-Type: application/json" \
  -d '{
    "reportId": 1,
    "patientId": 9
  }'
```

**Response Examples:**

**Processing Started:**
```json
{
  "success": true,
  "status": "processing_started",
  "analysisId": 123,
  "message": "LLM processing started successfully",
  "estimatedTime": "30-60 seconds"
}
```

**Already Exists:**
```json
{
  "success": true,
  "status": "already_exists",
  "analysis": { /* full analysis object */ },
  "message": "Analysis already completed. Use forceReprocess=true to regenerate."
}
```

**Currently Processing:**
```json
{
  "success": true,
  "status": "processing",
  "analysis": {
    "id": 123,
    "processingStatus": "PROCESSING"
  },
  "message": "Analysis is currently being processed. Please wait."
}
```

## Error Responses

### **400 Bad Request**
```json
{
  "success": false,
  "error": "Missing reportId query parameter",
  "usage": "GET /api/llm-process?reportId=123"
}
```

### **404 Not Found**
```json
{
  "success": false,
  "error": "Lab booking not found",
  "reportId": 1
}
```

### **403 Forbidden**
```json
{
  "success": false,
  "error": "Patient ID mismatch. This report belongs to a different patient.",
  "reportId": 1,
  "patientId": 9,
  "actualPatientId": 5
}
```

## Testing Scenarios

### **Scenario 1: New Analysis**
```bash
# 1. Check if analysis exists
curl "http://localhost:3000/api/llm-process?reportId=1"

# 2. Start processing
curl -X POST http://localhost:3000/api/llm-process \
  -H "Content-Type: application/json" \
  -d '{"reportId": 1, "patientId": 9}'

# 3. Check status periodically
curl "http://localhost:3000/api/llm-process?reportId=1"
```

### **Scenario 2: Existing Analysis**
```bash
# This should return existing analysis
curl -X POST http://localhost:3000/api/llm-process \
  -H "Content-Type: application/json" \
  -d '{"reportId": 1, "patientId": 9}'
```

### **Scenario 3: Force Reprocessing**
```bash
# Force reprocess existing analysis
curl -X POST http://localhost:3000/api/llm-process \
  -H "Content-Type: application/json" \
  -d '{"reportId": 1, "patientId": 9, "forceReprocess": true}'
```

## What Fixed the 404 Error

### **Previous Issues:**
1. **Dynamic route structure**: `/api/llm-process/[reportId]/route.ts`
2. **ID in URL path**: Less secure and not RESTful
3. **Complex routing**: Next.js dynamic routes can have edge cases

### **New Solution:**
1. **Simple route structure**: `/api/llm-process/route.ts`
2. **ID in query/body**: More secure and RESTful
3. **Direct routing**: No dynamic segments to cause issues

### **Benefits:**
- ✅ No more 404 errors
- ✅ Better API design (RESTful)
- ✅ More secure (no IDs in URLs)
- ✅ Easier to test and debug
- ✅ Consistent with REST best practices

## Next.js Route Resolution

The new structure follows Next.js App Router conventions:
```
app/
  api/
    llm-process/
      route.ts  ← Handles /api/llm-process
```

This is much more reliable than:
```
app/
  api/
    llm-process/
      [reportId]/
        route.ts  ← Can cause routing issues
```

## Environment Variables

Make sure these are set:
```bash
OPENROUTER_API_KEY="your_api_key_here"
OPENROUTER_MODEL="meta-llama/llama-3.2-3b-instruct:free"
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
```

## Development Testing

1. **Start your development server:**
   ```bash
   npm run dev
   ```

2. **Test the GET endpoint:**
   ```bash
   curl "http://localhost:3000/api/llm-process?reportId=1"
   ```

3. **Test the POST endpoint:**
   ```bash
   curl -X POST http://localhost:3000/api/llm-process \
     -H "Content-Type: application/json" \
     -d '{"reportId": 1, "patientId": 9}'
   ```

The 404 error should now be completely resolved! 🎉
