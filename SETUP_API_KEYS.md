# 🔑 API Keys Setup Guide

## Required API Key: OpenRouter

To enable real LLM processing for PDF analysis, you need to set up an OpenRouter API key.

### Step 1: Get OpenRouter API Key (FREE)

1. **Sign up at OpenRouter**: https://openrouter.ai/
2. **Get API Key**: Go to Keys section and create a new API key
3. **Free Credits**: You get free credits to start with

### Step 2: Set Environment Variable

Add this to your `.env.local` file (create it if it doesn't exist):

```bash
# OpenRouter Configuration (Required for LLM processing)
OPENROUTER_API_KEY="your_actual_api_key_here"

# Optional: Choose your preferred model (default is provided)
OPENROUTER_MODEL="meta-llama/llama-3.2-3b-instruct:free"

# Site configuration
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
```

### Step 3: Restart Development Server

```bash
# Stop current server (Ctrl+C)
# Then restart:
npm run dev
```

### Free Models Available

Your API will automatically use the best free models:

1. **meta-llama/llama-3.2-3b-instruct:free** (Recommended)
2. **microsoft/phi-3-mini-128k-instruct:free** 
3. **openai/gpt-oss-20b:free** (Your original choice)

### Alternative: Completely Free Local Option

If you prefer not to use any external API:

```bash
# Install Ollama (completely free, runs locally)
brew install ollama  # On macOS
# or visit: https://ollama.ai

# Pull a model
ollama pull llama3.2:3b

# Add to .env.local:
USE_OLLAMA=true
OLLAMA_URL=http://localhost:11434
```

### Verification

Test your setup:

```bash
curl -X POST "http://localhost:3000/api/llm-process" \
  -H "Content-Type: application/json" \
  -d '{"reportId": 1, "patientId": 8, "forceReprocess": true}'
```

Should return real LLM analysis instead of mock data.

## Troubleshooting

### Common Issues:

1. **"Simple mock analysis"** → API key not set
2. **413 errors** → Fixed with new multi-strategy approach
3. **404 errors** → Fixed with new API structure
4. **Import errors** → Fixed with dynamic imports

### Check API Key Status:

```bash
echo $OPENROUTER_API_KEY  # Should show your key
```

### Current Model Usage:

The system automatically tries these models in order:
1. Primary model (configurable)
2. Fallback models (if primary fails)
3. Text extraction + simple model (if all else fails)

This ensures maximum reliability while staying on the free tier!
