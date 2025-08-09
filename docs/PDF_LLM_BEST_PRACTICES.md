# PDF Processing with LLM: Best Practices & Solutions

## Overview
This guide provides optimal solutions for PDF analysis using LLM services, specifically addressing common issues like 413 errors and model limitations.

## Current Issues & Solutions

### 1. **413 Payload Too Large Error**

**Root Causes:**
- Vercel function body size limits (6MB for Hobby, 50MB for Pro)
- OpenRouter API limits for file uploads
- Incorrect request format for PDF processing

**Solutions (in order of preference):**

#### ✅ **Solution 1: Text Extraction First (Recommended)**
```typescript
// Extract text from PDF server-side, then send text to LLM
// Advantages: Most reliable, works with all models, no size limits
// Implementation: Already included in updated route.ts
```

#### ✅ **Solution 2: Direct PDF Upload (Base64)**
```typescript
// Convert PDF to base64 and upload directly
// Advantages: Preserves visual elements, works for smaller files
// Limitations: 5MB practical limit
```

#### ⚠️ **Solution 3: URL-Based Processing**
```typescript
// Send PDF URL to LLM for processing
// Advantages: No server processing required
// Limitations: Model-dependent, unreliable
```

## Free LLM Services Comparison

### **OpenRouter (Recommended)**
- **Best Free Models:**
  - `meta-llama/llama-3.2-3b-instruct:free` ⭐ **RECOMMENDED**
  - `microsoft/phi-3-mini-128k-instruct:free`
  - `meta-llama/llama-3.2-1b-instruct:free`
  
- **Pros:**
  - High-quality models
  - Reliable API
  - Good documentation
  - Multiple model options

- **Cons:**
  - Rate limits on free tier
  - PDF processing inconsistent

### **Groq (Alternative)**
- **Free Models:**
  - `llama-3.1-70b-versatile`
  - `llama-3.1-8b-instant`
  - `mixtral-8x7b-32768`

- **Pros:**
  - Very fast inference
  - Good free tier limits
  - Excellent for text processing

### **Ollama (Local - Completely Free)**
- **Best Models for Medical Text:**
  - `llama3.2:3b`
  - `phi3:medium`
  - `mistral:7b`

- **Pros:**
  - Completely free
  - No API limits
  - Full control
  
- **Cons:**
  - Requires local setup
  - Resource intensive

### **Hugging Face Inference API**
- **Free Models:**
  - `microsoft/DialoGPT-medium`
  - `microsoft/BioBERT`
  - `dmis-lab/biobert-base-cased-v1.2`

- **Pros:**
  - Specialized medical models
  - Good free tier
  
- **Cons:**
  - More complex setup
  - Rate limits

## Implementation Strategy

### **Multi-Tier Approach (Current Implementation)**
```typescript
1. Text Extraction → LLM Processing (Primary)
2. Direct PDF Upload (Fallback for small files)
3. URL-based Processing (Last resort)
```

### **Model Fallback Chain**
```typescript
const FALLBACK_MODELS = [
  'meta-llama/llama-3.2-3b-instruct:free',    // Best balance
  'microsoft/phi-3-mini-128k-instruct:free',   // Fast processing
  'openai/gpt-oss-20b:free'                   // Original choice
];
```

## Environment Configuration

### **Required Environment Variables**
```bash
# OpenRouter Configuration
OPENROUTER_API_KEY="your_api_key_here"
OPENROUTER_MODEL="meta-llama/llama-3.2-3b-instruct:free"
OPENROUTER_MAX_PDF_MB="10"

# Site Configuration
NEXT_PUBLIC_SITE_URL="http://localhost:3000"

# Optional: Alternative Services
GROQ_API_KEY="your_groq_key"
HUGGINGFACE_API_KEY="your_hf_key"

# Local Models (if using Ollama)
USE_OLLAMA="false"
OLLAMA_URL="http://localhost:11434"
```

## PDF Size Optimization

### **Server Configuration**
```typescript
// next.config.ts
export default {
  api: {
    bodyParser: {
      sizeLimit: '50mb', // Adjust based on your Vercel plan
    },
  },
  experimental: {
    isrMemoryCacheSize: 0, // Disable ISR cache for large files
  },
}
```

### **File Size Limits**
- **Text Extraction**: Up to 50MB PDF
- **Direct Upload**: Up to 5MB PDF
- **URL Processing**: Depends on model

## Error Handling Best Practices

### **Retry Logic**
```typescript
async function processWithRetry(analysisId: number, attempts = 3) {
  for (let i = 0; i < attempts; i++) {
    try {
      // Try primary method
      return await processWithTextExtraction(...);
    } catch (error) {
      if (i === attempts - 1) throw error;
      
      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
    }
  }
}
```

### **Graceful Degradation**
```typescript
1. OpenRouter Text Processing
2. OpenRouter Direct PDF
3. Groq Text Processing
4. Local Ollama Processing
5. Sample/Fallback Response
```

## Performance Optimization

### **Text Processing**
- Limit extracted text to 8000 characters
- Pre-process text to remove noise
- Chunk large documents

### **Caching Strategy**
- Cache extracted PDF text
- Store LLM responses
- Implement response deduplication

### **Monitoring**
- Log file sizes and processing times
- Track API usage and costs
- Monitor error rates by strategy

## Testing Recommendations

### **Test Cases**
1. **Small PDF (< 1MB)**: Should use direct upload
2. **Medium PDF (1-10MB)**: Should use text extraction
3. **Large PDF (> 10MB)**: Should return appropriate error
4. **Corrupted PDF**: Should handle gracefully
5. **Text-heavy PDF**: Should extract successfully
6. **Image-heavy PDF**: Should fallback appropriately

### **API Testing**
```bash
# Test text extraction approach
curl -X POST http://localhost:3000/api/llm-process \
  -H "Content-Type: application/json" \
  -d '{"reportId": 123, "patientId": 456}'
```

## Troubleshooting

### **Common Issues**

#### **413 Payload Too Large**
- Check PDF file size
- Verify Vercel plan limits
- Use text extraction instead of direct upload

#### **Model Not Responding**
- Check API key validity
- Try fallback models
- Verify rate limits

#### **Poor Analysis Quality**
- Improve prompt engineering
- Try different models
- Enhance text preprocessing

#### **Timeout Errors**
- Implement background processing
- Add retry mechanisms
- Use faster models

## Cost Optimization

### **Free Tier Maximization**
1. **OpenRouter**: 
   - Use free models exclusively
   - Monitor monthly usage
   - Implement client-side caching

2. **Groq**:
   - Leverage fast inference
   - Use for text-only processing
   
3. **Local Processing**:
   - Set up Ollama for development
   - Use for testing and prototyping

### **Usage Monitoring**
```typescript
// Track API usage
const usageTracker = {
  requests: 0,
  tokens: 0,
  cost: 0,
  resetDaily: true
};
```

## Conclusion

The multi-strategy approach implemented in the updated `route.ts` provides:
1. **Reliability**: Multiple fallback options
2. **Performance**: Optimized for different file sizes
3. **Cost-effectiveness**: Prioritizes free solutions
4. **Scalability**: Can adapt to changing requirements

**Recommended Setup:**
- Primary: OpenRouter with `meta-llama/llama-3.2-3b-instruct:free`
- Fallback: Text extraction + Groq
- Development: Local Ollama setup

This approach should resolve your 413 errors while providing robust PDF analysis capabilities.
