# Prescription AI Processing System

## Overview

This system automatically processes prescription PDFs uploaded by doctors, extracts text content, and generates AI-powered patient summaries. The system works in real-time without requiring any background jobs or cron tasks.

## Architecture

### Database Models

#### PrescriptionText
Stores extracted text from prescription PDFs:
- `prescriptionId`: Links to the prescription
- `appointmentId`: Links to the appointment
- `patientId`: Links to the patient
- `extractedText`: The parsed text content
- `processingStatus`: Current processing state (PENDING, COMPLETED, FAILED)
- `processingError`: Error details if processing failed

#### PatientAISummary
Stores comprehensive AI summaries for patients:
- `patientId`: Links to the patient
- `summaryText`: AI-generated summary
- `keyFindings`: Array of key medical findings
- `recommendations`: Array of medical recommendations
- `urgency`: Urgency level (ROUTINE, SOON, URGENT)
- `prescriptionCount`: Number of prescriptions used for summary

### API Endpoints

#### POST /api/prescription/process
Processes a single prescription PDF:
- Extracts text from PDF
- Stores extracted text in database
- Generates/updates patient AI summary
- Called automatically when prescription is uploaded

#### GET /api/prescription/ai-summary/[patientId]
Retrieves the AI summary for a specific patient.

#### POST /api/prescription/ai-summary/[patientId]
Regenerates the AI summary for a specific patient using all available prescription texts.

## Setup

### Environment Variables

```bash
# LLM API Keys (choose one)
OPENROUTER_API_KEY=your_openrouter_key
GROQ_API_KEY=your_groq_key

# Site URLs
NEXT_PUBLIC_SITE_URL=https://yoursite.com
NEXT_PUBLIC_APP_URL=https://yoursite.com
```

### Database Migration

Run the Prisma migration to create the new tables:

```bash
npx prisma migrate dev --name add-prescription-ai-processing
```

## Usage

### Automatic Processing

The system processes prescriptions automatically when they are uploaded:

1. **Doctor uploads prescription PDF** through the UI
2. **System automatically triggers** background processing
3. **PDF text is extracted** and stored in database
4. **AI summary is generated** using all patient prescriptions
5. **Patient summary is updated** in real-time

### Manual Summary Regeneration

To regenerate a patient's AI summary manually:

```bash
curl -X POST http://localhost:3000/api/prescription/ai-summary/123
```

### Frontend Integration

The `PatientAISummaryRow` component automatically fetches and displays AI summaries:

```tsx
<PatientAISummaryRow patientId={patientId} />
```

## Processing Status

### Status Types
- `PENDING`: Processing has started
- `COMPLETED`: Successfully processed
- `FAILED`: Processing failed with error

### Error Handling
- Failed processing attempts are logged with error details
- The system continues to work for other prescriptions
- Manual retry is available through the regenerate endpoint

## Urgency Levels

### ROUTINE
- Standard follow-up required
- No immediate action needed

### SOON
- Follow-up needed within weeks
- Monitor symptoms

### URGENT
- Immediate medical attention required
- Contact doctor immediately

## Monitoring

### Console Logs
The system provides detailed logging for monitoring:

```
[PRESCRIPTION-PROC-API] Processing prescription for appointment X
[PRESCRIPTION-PROC-API] Text stored successfully for prescription X
[PRESCRIPTION-PROC-API] Patient summary updated successfully for patient X
```

### Database Queries
Monitor processing status:

```sql
-- Check processing status
SELECT processingStatus, COUNT(*) FROM PrescriptionText GROUP BY processingStatus;

-- Check patient summaries
SELECT patientId, lastUpdated, prescriptionCount FROM PatientAISummary;
```

## Security

- API endpoints are protected by Next.js middleware
- No sensitive data is logged
- Processing errors don't expose internal system details

## Performance

- Processing happens asynchronously
- No impact on UI responsiveness
- Database operations are optimized with proper indexing

## Troubleshooting

### Common Issues

1. **Processing Status Stuck on PENDING**
   - Check console logs for errors
   - Verify API keys are configured
   - Check PDF URL accessibility

2. **AI Summary Not Generated**
   - Ensure prescription text extraction succeeded
   - Check LLM API key configuration
   - Verify site URL configuration

3. **Database Errors**
   - Run Prisma migrations
   - Check database connection
   - Verify schema matches code

### Debug Mode

Enable detailed logging by checking console output during prescription upload.

## Future Enhancements

- Batch processing for multiple prescriptions
- Advanced error recovery mechanisms
- Performance optimization for large PDFs
- Integration with external medical databases

## Support

For issues or questions:
1. Check console logs for error details
2. Verify environment variable configuration
3. Test API endpoints individually
4. Check database schema and data integrity
