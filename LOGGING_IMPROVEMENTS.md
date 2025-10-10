# Text Extraction Logging Improvements

## Overview
Comprehensive logging has been added to debug text extraction failures in the live server environment. The logging covers the entire text extraction pipeline from file upload to final processing.

## Files Modified

### 1. Main Upload Route (`app/api/reports/upload/route.ts`)
**Enhanced logging for:**
- Request initiation with unique request IDs
- User authentication and permission checks
- File validation (type, size, format)
- Vercel Blob upload process
- Database operations (report creation, analysis records)
- LLM processing trigger with success/failure tracking

**Key log patterns:**
```
[UPLOAD][requestId] Starting report upload process
[UPLOAD][requestId] User authenticated: {name} ({role})
[UPLOAD][requestId] File validation passed: {fileName} ({size} bytes, {type})
[UPLOAD][requestId] File uploaded successfully: {url}
[UPLOAD][requestId] Report record created with ID: {id}
[UPLOAD][requestId] LLM processing triggered successfully for report {id}
```

### 2. Parse-Text API (`app/api/llm-process/parse-text/route.ts`)
**Enhanced logging for:**
- PDF URL validation and format checking
- OCR extraction process with timing
- Text extraction results and validation
- Error categorization and specific handling

**Key log patterns:**
```
[PARSE-TEXT][requestId] Starting text extraction process
[PARSE-TEXT][requestId] PDF URL validation passed: {url}
[PARSE-TEXT][requestId] OCR extraction completed in {duration}ms, extracted {length} characters
[PARSE-TEXT][requestId] Text extraction successful: {length} characters extracted
```

### 3. OCR Service (`lib/ocr/google-vision.ts`)
**Enhanced logging for:**
- GCP credential validation
- Client initialization
- PDF upload to GCS bucket
- OCR job submission and completion
- JSON result processing
- Error categorization with specific handlers

**Key log patterns:**
```
[OCR] Checking GCP credentials...
[OCR] GCP credentials validated successfully
[OCR][requestId] Starting OCR text extraction from URL: {url}...
[OCR][requestId] Step 1: Uploading PDF to GCS bucket...
[OCR][requestId] Step 2: Submitting OCR job to Google Vision API...
[OCR][requestId] OCR job completed in {duration}ms
[OCR][requestId] Text extraction successful: {length} characters
```

### 4. LLM Processing (`app/api/reports/upload/llm-processing.ts`)
**Enhanced logging for:**
- Processing initiation with request tracking
- Text extraction API calls with response validation
- Summary generation with Groq API
- Lab values extraction via standalone API
- Database updates with detailed status tracking

**Key log patterns:**
```
[LLM-PROCESSING][requestId] Starting LLM processing for report {id}, type: {type}
[LLM-PROCESSING][requestId] Stage 1: Starting text extraction from {url}...
[LLM-PROCESSING][requestId] Stage 2: Generating summary for lab analysis
[LLM-PROCESSING][requestId] Stage 3: Extracting lab values via standalone API
[LLM-PROCESSING][requestId] Analysis completed successfully for report {id}
```

### 5. Error Handling Utility (`lib/error-handling.ts`)
**New comprehensive error handling system:**
- Error categorization (Network, GCP Credentials, File Format, OCR, LLM API, Database)
- Specific error handlers for different failure scenarios
- Enhanced error logging with context and categorization
- Pattern matching for common error types

**Error categories:**
- `NETWORK_TIMEOUT` - Connection timeouts
- `CONNECTION_REFUSED` - Service unavailable
- `DNS_ERROR` - Domain resolution failures
- `GCP_CREDENTIALS` - Google Cloud authentication issues
- `FILE_FORMAT` - Invalid file types or corruption
- `OCR_FAILURE` - Vision API processing errors
- `LLM_API_ERROR` - Language model API failures
- `DATABASE_ERROR` - Database operation failures

## Debugging Workflow

### 1. Upload Process Debugging
When a report upload fails, check logs for:
```
[UPLOAD][requestId] Starting report upload process
[UPLOAD][requestId] User authenticated: ...
[UPLOAD][requestId] File validation passed: ...
[UPLOAD][requestId] File uploaded successfully: ...
[UPLOAD][requestId] LLM processing triggered successfully...
```

### 2. Text Extraction Debugging
For text extraction failures, look for:
```
[PARSE-TEXT][requestId] Starting text extraction process
[PARSE-TEXT][requestId] OCR extraction completed in {duration}ms
[OCR][requestId] Step 1: Uploading PDF to GCS bucket...
[OCR][requestId] Step 2: Submitting OCR job to Google Vision API...
[OCR][requestId] OCR job completed in {duration}ms
```

### 3. Error Analysis
Check for specific error patterns:
- **GCP Issues**: Look for `GCP_CREDENTIAL_ERROR` or credential validation failures
- **Network Issues**: Look for `NETWORK_TIMEOUT`, `CONNECTION_REFUSED`, or `DNS_ERROR`
- **OCR Issues**: Look for `OCR_PROCESSING_ERROR` or Vision API failures
- **Text Validation**: Look for `TEXT_EXTRACTION_VALIDATION_ERROR`

## Common Failure Scenarios

### 1. GCP Credential Issues
**Symptoms**: OCR service fails to initialize
**Debug**: Check logs for credential validation
**Solution**: Verify environment variables (GCP_PROJECT_ID, GCP_CLIENT_EMAIL, GCP_PRIVATE_KEY, GCS_BUCKET)

### 2. Network Timeouts
**Symptoms**: API calls timeout or fail
**Debug**: Look for timeout errors in network operations
**Solution**: Check server connectivity and API endpoint availability

### 3. File Format Issues
**Symptoms**: Text extraction returns empty results
**Debug**: Check file validation and OCR processing logs
**Solution**: Verify PDF file integrity and format

### 4. OCR Processing Failures
**Symptoms**: Vision API returns errors
**Debug**: Check OCR job submission and completion logs
**Solution**: Verify GCP Vision API quotas and permissions

## Monitoring Recommendations

1. **Set up log aggregation** to collect all logs in one place
2. **Create alerts** for specific error patterns
3. **Monitor performance metrics** like extraction duration
4. **Track success rates** for different file types
5. **Set up dashboards** for real-time monitoring

## Next Steps

1. Deploy the enhanced logging to the live server
2. Monitor logs during report uploads to identify the specific failure point
3. Use the categorized error information to implement targeted fixes
4. Consider adding metrics collection for performance monitoring
5. Set up automated alerting for critical failures

The comprehensive logging system will help identify exactly where the text extraction process is failing in the live environment, making it much easier to debug and resolve the issue.
