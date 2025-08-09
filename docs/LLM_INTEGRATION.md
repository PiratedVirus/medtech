# LLM Integration for Lab Report Analysis

This document explains how to set up and use the LLM integration for automated lab report analysis in CareDiabetics.

## Features

- **AI-Powered Lab Report Analysis**: Automatically extract and analyze lab reports using LLMs
- **PDF Text Extraction**: Convert PDF lab reports to text for processing
- **Critical Values Detection**: Identify abnormal values and their severity
- **Trend Analysis**: Compare current results with historical data
- **Full-Screen Analysis Modal**: Rich UI for viewing analysis results

## Setup Options

### Option 1: OpenRouter (Recommended)

OpenRouter provides access to various AI models including free options.

1. Sign up at [OpenRouter.ai](https://openrouter.ai)
2. Get your API key from the dashboard
3. Add to your environment variables:
   ```bash
   OPENROUTER_API_KEY="your_api_key_here"
   NEXT_PUBLIC_SITE_URL="http://localhost:3000"
   ```

**Free Models Available:**
- `meta-llama/llama-3.2-3b-instruct:free`
- `meta-llama/llama-3.2-1b-instruct:free`
- `microsoft/phi-3-mini-128k-instruct:free`

### Option 2: Ollama (Local, Completely Free)

Run AI models locally using Ollama.

1. Install Ollama from [ollama.ai](https://ollama.ai)
2. Pull a model: `ollama pull llama3.2`
3. Start Ollama service: `ollama serve`
4. Add to your environment variables:
   ```bash
   USE_OLLAMA=true
   OLLAMA_URL="http://localhost:11434"
   ```

## Database Schema

The integration adds the following tables:

### LabReportAnalysis
- Stores LLM analysis results for each lab report
- Links to existing LabBooking records
- Tracks processing status and errors

### ReportTrendData
- Stores individual parameter values over time
- Enables trend analysis across reports
- Links to patients and lab bookings

## API Endpoints

### GET `/api/lab-reports/[reportId]/analysis`
Retrieve existing analysis for a lab report.

### POST `/api/lab-reports/[reportId]/process`
Start processing a lab report with LLM analysis.

## Usage

1. **Doctor View**: Navigate to patient details page
2. **Lab Reports**: Click the "Maximize" icon in the Lab Reports row
3. **AI Analysis**: Select a report to view or generate AI analysis
4. **Results**: View summary, critical values, and trends in the modal

## Processing Pipeline

1. **PDF Extraction**: Extract text from uploaded PDF reports
2. **Text Cleaning**: Clean and normalize extracted text
3. **LLM Analysis**: Send to AI model for medical analysis
4. **Data Parsing**: Extract structured data from AI response
5. **Trend Calculation**: Compare with historical patient data
6. **Storage**: Save results to database for future access

## Error Handling

- Processing failures are logged and stored
- Fallback responses for LLM parsing errors
- Polling mechanism for async processing status

## Security Considerations

- All API calls require proper authentication
- Patient data is never sent to external services unnecessarily
- Environment variables should be kept secure
- Consider using Ollama for sensitive data (local processing)

## Performance Tips

- Analysis results are cached in the database
- Large PDFs may take longer to process
- Consider implementing rate limiting for LLM calls
- Use background processing to avoid blocking UI

## Free Alternatives Summary

1. **OpenRouter Free Tier**: 
   - Pros: Easy setup, good models, cloud-based
   - Cons: Rate limits, requires internet

2. **Ollama Local**:
   - Pros: Completely free, private, no rate limits
   - Cons: Requires local setup, uses system resources

Choose based on your requirements for privacy, cost, and infrastructure.