# LLM API Fixes Documentation

## Overview
This document outlines the fixes applied to resolve two critical errors in the LLM processing system:

1. **Foreign Key Constraint Violation** in `generate-summary` API
2. **Context Length Exceeded** error in `extract-values` API

## Issues Identified

### 1. Foreign Key Constraint Violation
**Error**: `LabReportAnalysis_labBookingId_fkey` constraint violation
**Location**: `app/api/llm-process/generate-summary/route.ts:54`
**Root Cause**: The API was trying to create/update `LabReportAnalysis` records without verifying that the referenced `LabBooking` exists.

### 2. Context Length Exceeded
**Error**: Groq API error: 400 - "Please reduce the length of the messages or completion"
**Location**: `lib/llm/processing.ts:213`
**Root Cause**: Lab report texts were exceeding the Groq API's context length limits.

## Fixes Applied

### 1. Foreign Key Validation

#### `app/api/llm-process/generate-summary/route.ts`
- Added validation to check if `LabBooking` exists before processing
- Returns 404 error if lab booking is not found
- Prevents foreign key constraint violations

```typescript
// Verify that the lab booking exists
const labBooking = await prisma.labBooking.findFirst({
  where: { 
    id: labBookingId,
    deletedAt: null
  }
});

if (!labBooking) {
  return NextResponse.json({ success: false, error: 'Lab booking not found' }, { status: 404 });
}
```

#### `app/api/llm-process/extract-values/route.ts`
- Added similar validation for lab booking existence
- Prevents foreign key constraint violations

### 2. Context Length Management

#### Text Length Validation
Both APIs now validate text length before processing:
- **extract-values**: Maximum 32,000 characters
- **generate-summary**: Maximum 32,000 characters

```typescript
const maxTextLength = 32000; // Conservative limit for Groq API
if (text.length > maxTextLength) {
  return NextResponse.json({ 
    success: false, 
    error: `Text too long (${text.length} chars). Maximum allowed: ${maxTextLength} characters.` 
  }, { status: 400 });
}
```

#### Text Preprocessing
Added `preprocessText()` function in `lib/llm/processing.ts`:
- Normalizes line breaks and whitespace
- Removes redundant lab report patterns
- Reduces context length without losing critical information

```typescript
function preprocessText(text: string): string {
  let processed = text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]+/g, ' ')
    .trim();
  
  // Remove common redundant patterns
  processed = processed
    .replace(/Page \d+ of \d+/gi, '')
    .replace(/Report Date:.*?\n/gi, '')
    .replace(/Generated on:.*?\n/gi, '')
    .replace(/Lab ID:.*?\n/gi, '')
    .replace(/Patient ID:.*?\n/gi, '')
    .replace(/Reference Range:/gi, 'Ref:')
    .replace(/Normal Range:/gi, 'Ref:');
  
  return processed;
}
```

#### Text Chunking
Implemented automatic text chunking for very long texts:
- Splits text into 25,000 character chunks
- Processes each chunk separately
- Merges results and removes duplicates
- Handles chunks gracefully with error recovery

```typescript
function chunkText(text: string, maxChunkSize: number = 25000): string[] {
  if (text.length <= maxChunkSize) {
    return [text];
  }
  
  const chunks: string[] = [];
  let start = 0;
  
  while (start < text.length) {
    let end = start + maxChunkSize;
    
    // Try to find a good break point (newline, period, or space)
    if (end < text.length) {
      const lastNewline = text.lastIndexOf('\n', end);
      const lastPeriod = text.lastIndexOf('.', end);
      const lastSpace = text.lastIndexOf(' ', end);
      
      if (lastNewline > start + maxChunkSize * 0.8) {
        end = lastNewline + 1;
      } else if (lastPeriod > start + maxChunkSize * 0.8) {
        end = lastPeriod + 1;
      } else if (lastSpace > start + maxChunkSize * 0.8) {
        end = lastSpace + 1;
      }
    }
    
    chunks.push(text.slice(start, end));
    start = end;
  }
  
  return chunks;
}
```

#### Fallback Mechanisms
Added graceful fallbacks for context length issues:
- **extract-values**: Truncates text to 20,000 characters if chunking fails
- **generate-summary**: Truncates text to 25,000 characters
- Both APIs log warnings when truncation occurs

### 3. Enhanced Error Handling

#### Context Length Error Detection
Added specific handling for context length exceeded errors:

```typescript
if (response.status === 400 && errorText.includes('context_length_exceeded')) {
  throw new Error('CONTEXT_LENGTH_EXCEEDED: Text too long for this model. Please use text chunking.');
}
```

#### Graceful Degradation
- APIs continue processing even if some chunks fail
- Results are merged and deduplicated
- Processing errors are logged but don't crash the entire operation

## Testing

### Test Script
Created `scripts/test-llm-fixes.js` to verify fixes:
- Tests lab booking validation
- Tests text length validation
- Tests chunking with long texts
- Tests error handling

### Manual Testing
To test the fixes:

1. **Start the development server**:
   ```bash
   npm run dev
   ```

2. **Run the test script**:
   ```bash
   node scripts/test-llm-fixes.js
   ```

3. **Test with real lab reports**:
   - Use the extract-values API with various text lengths
   - Use the generate-summary API with long medical texts
   - Verify that foreign key errors are prevented
   - Verify that context length errors are handled gracefully

## Configuration

### Environment Variables
The following environment variables can be adjusted:

```bash
# Maximum text length before chunking
GROQ_MAX_TEXT_LENGTH=32000

# Maximum output tokens for Groq API
GROQ_MAX_OUTPUT_TOKENS=1200

# Fallback models for rate limiting
GROQ_FALLBACK_MODELS=llama-3.1-8b-instant,llama-3.3-70b-versatile
```

## Monitoring

### Logging
Enhanced logging for debugging:
- Text length before/after preprocessing
- Chunking information for long texts
- Processing status for each chunk
- Warning messages for truncation

### Metrics
Track the following metrics:
- Text length distribution
- Chunking frequency
- Processing success rates
- Error types and frequencies

## Future Improvements

### 1. Adaptive Chunking
- Implement smarter chunking based on content structure
- Preserve medical context boundaries
- Optimize chunk sizes based on model performance

### 2. Caching
- Cache processed chunks to avoid reprocessing
- Implement incremental processing for updates
- Store intermediate results for long texts

### 3. Model Selection
- Automatically select models based on text length
- Use smaller models for short texts
- Implement model fallback chains

## Conclusion

These fixes resolve the immediate issues while providing a robust foundation for handling various text lengths and edge cases. The system now:

- ✅ Prevents foreign key constraint violations
- ✅ Handles context length exceeded errors gracefully
- ✅ Processes long texts efficiently through chunking
- ✅ Provides meaningful error messages
- ✅ Maintains data integrity
- ✅ Scales to handle large lab reports

The improvements ensure that the LLM processing system is more reliable and can handle real-world lab report variations without crashing.
