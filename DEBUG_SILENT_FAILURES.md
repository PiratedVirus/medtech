# Debugging Silent Text Extraction Failures

## 🚨 **Problem**: Text extraction fails silently on live server with no logs

## 🔍 **Debugging Steps**

### **Step 1: Check Environment Variables**
Run this on your live server to verify all required environment variables are set:

```bash
# On your live server, run:
node debug-environment.js
```

**Required Environment Variables:**
- `GCP_PROJECT_ID` - Google Cloud Project ID
- `GCP_CLIENT_EMAIL` - Service account email
- `GCP_PRIVATE_KEY` - Service account private key
- `GCS_BUCKET` - Google Cloud Storage bucket name
- `GROQ_API_KEY` - For LLM processing
- `NEXT_PUBLIC_SITE_URL` - Your site URL
- `NEXT_PUBLIC_BLOB_READ_WRITE_TOKEN` - Vercel Blob storage token

### **Step 2: Test Health Check Endpoint**
Visit this URL on your live server:
```
https://your-domain.com/api/debug/text-extraction
```

This will show you:
- Environment variable status
- API endpoint reachability
- GCP credentials validation
- Overall system health

### **Step 3: Check Database for Processing Status**
Query your database to see what's happening:

```sql
-- Check recent report uploads
SELECT 
  id, 
  reportType, 
  status, 
  createdAt,
  fileUrl
FROM StandaloneReport 
WHERE createdAt > NOW() - INTERVAL 1 HOUR
ORDER BY createdAt DESC;

-- Check analysis processing status
SELECT 
  sra.id,
  sra.reportId,
  sra.analysisType,
  sra.processingStatus,
  sra.processingError,
  sra.createdAt,
  sra.processedAt,
  sr.fileUrl
FROM StandaloneReportAnalysis sra
JOIN StandaloneReport sr ON sra.reportId = sr.id
WHERE sra.createdAt > NOW() - INTERVAL 1 HOUR
ORDER BY sra.createdAt DESC;
```

### **Step 4: Check Server Logs**
Look for these specific log patterns in your server logs:

**Upload Process:**
```
[UPLOAD][requestId] Starting report upload process
[UPLOAD][requestId] User authenticated: {name} ({role})
[UPLOAD][requestId] File uploaded successfully: {url}
[UPLOAD][requestId] LLM processing triggered successfully for report {id}
```

**Text Extraction:**
```
[PARSE-TEXT][requestId] Starting text extraction process
[PARSE-TEXT][requestId] OCR extraction completed in {duration}ms
[OCR][requestId] Starting OCR text extraction from URL: {url}...
[OCR][requestId] OCR job completed in {duration}ms
```

**LLM Processing:**
```
[LLM-PROCESSING][requestId] Starting LLM processing for report {id}
[LLM-PROCESSING][requestId] Stage 1: Starting text extraction
[LLM-PROCESSING][requestId] Stage 2: Generating summary
```

### **Step 5: Common Failure Points**

#### **A. Environment Variables Missing**
**Symptoms:** No logs appear at all
**Solution:** Set all required environment variables in your deployment platform

#### **B. GCP Credentials Invalid**
**Symptoms:** OCR service fails to initialize
**Logs to look for:**
```
[OCR] Missing GCP credentials: [GCP_PROJECT_ID, GCP_CLIENT_EMAIL, ...]
[ERROR-HANDLER] GCP credential error
```

#### **C. Network/API Issues**
**Symptoms:** Parse-text API calls fail
**Logs to look for:**
```
[LLM-PROCESSING] Parse-text API failed: 500 Internal Server Error
[ERROR-HANDLER] Network error: timeout
```

#### **D. Database Connection Issues**
**Symptoms:** Processing status not updated
**Logs to look for:**
```
[ERROR-HANDLER] Database error: connection failed
```

### **Step 6: Manual Testing**

#### **Test 1: Direct API Call**
```bash
curl -X POST https://your-domain.com/api/llm-process/parse-text \
  -H "Content-Type: application/json" \
  -d '{"pdfUrl": "https://example.com/test.pdf"}'
```

#### **Test 2: Check File Upload**
Upload a test PDF and check if:
1. File appears in Vercel Blob storage
2. Database record is created
3. Analysis record is created with PENDING status

### **Step 7: Monitoring Dashboard**

Create a simple monitoring query:
```sql
-- Processing status summary
SELECT 
  processingStatus,
  COUNT(*) as count,
  MAX(createdAt) as latest
FROM StandaloneReportAnalysis 
WHERE createdAt > NOW() - INTERVAL 24 HOURS
GROUP BY processingStatus;
```

## 🛠️ **Quick Fixes**

### **Fix 1: Add Timeout Handling**
The text extraction might be timing out. Check if your server has timeout limits.

### **Fix 2: Check Memory Limits**
OCR processing is memory-intensive. Ensure your server has sufficient memory.

### **Fix 3: Verify File URLs**
Ensure the uploaded files are accessible via the URLs stored in the database.

### **Fix 4: Check CORS/Network Policies**
Ensure your live server can make outbound requests to Google Cloud APIs.

## 📊 **Expected Log Flow**

When working correctly, you should see this sequence:

1. **Upload**: `[UPLOAD][requestId] Starting report upload process`
2. **File Storage**: `[UPLOAD][requestId] File uploaded successfully`
3. **Database**: `[UPLOAD][requestId] Report record created with ID`
4. **LLM Trigger**: `[UPLOAD][requestId] LLM processing triggered successfully`
5. **Text Extraction**: `[PARSE-TEXT][requestId] Starting text extraction process`
6. **OCR Processing**: `[OCR][requestId] Starting OCR text extraction`
7. **Completion**: `[LLM-PROCESSING][requestId] Analysis completed successfully`

## 🚨 **Emergency Debugging**

If you still can't see any logs:

1. **Check if the upload API is even being called**
2. **Verify the file is actually being uploaded to storage**
3. **Check if the database records are being created**
4. **Test with a simple console.log in the upload route**

## 📞 **Next Steps**

1. Run the health check endpoint
2. Check your environment variables
3. Look at the database processing status
4. Share the results so we can identify the exact failure point

The enhanced logging should now show you exactly where the process is failing!
