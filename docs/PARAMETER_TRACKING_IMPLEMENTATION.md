# Parameter Tracking Visualization System

## Overview

This implementation adds a comprehensive parameter tracking visualization system that allows both patients and doctors to view how lab parameters change over time across multiple reports. The system provides interactive charts showing parameter trends, normal ranges, and trend analysis.

## Features

### 🎯 Core Functionality
- **Parameter Trend Visualization**: Interactive line charts showing parameter values over time
- **Normal Range Indicators**: Visual reference lines showing normal ranges for each parameter
- **Trend Analysis**: Automatic calculation of improving, stable, or worsening trends
- **Multi-Report Support**: Tracks parameters across multiple lab reports and standalone uploads
- **Filtering & Search**: Search parameters and filter by abnormal values only
- **Severity Indicators**: Color-coded severity levels (LOW, NORMAL, HIGH, CRITICAL)

### 📊 Data Sources
- **Lab Report Analyses**: Uses existing `LabReportAnalysis` table with `allValues` and `criticalValues`
- **Trend Data**: Leverages `ReportTrendData` table for historical tracking
- **Standalone Reports**: Includes manually uploaded reports with AI analysis

## Implementation Details

### 🏗️ Architecture

#### 1. **ParameterTrendsModal Component**
- **Location**: `components/patients/labs/ParameterTrendsModal.tsx`
- **Purpose**: Main visualization interface with charts and filters
- **Features**:
  - Interactive line charts using Recharts
  - Parameter search and filtering
  - Trend calculation and display
  - Normal range visualization

#### 2. **API Endpoint**
- **Location**: `app/api/patient/[patientId]/parameter-trends/route.ts`
- **Purpose**: Fetches and processes parameter trend data
- **Features**:
  - Groups parameters by name
  - Calculates trends between consecutive values
  - Handles normal range parsing
  - Returns structured trend data

#### 3. **Navigation Integration**

##### Patient Access
- **Location**: `app/dashboard/labs/page.tsx`
- **Access**: Dashboard → Labs → "Parameter Trends" tab
- **Features**: New tab in existing lab reports interface

##### Doctor Access
- **Location**: `components/doctors/patients/LabReportsSection.tsx`
- **Access**: Patient Details → Lab Reports → "View Parameter Trends" button
- **Features**: Integrated into existing lab reports section

### 📈 Trend Calculation Logic

```typescript
// Trend calculation considers:
1. Severity changes (CRITICAL → HIGH → NORMAL → LOW)
2. Abnormal to normal transitions (IMPROVING)
3. Normal to abnormal transitions (WORSENING)
4. Distance from optimal range center
5. Percentage change between consecutive values
```

### 🎨 Visualization Features

#### Chart Components
- **Line Charts**: Show parameter values over time
- **Reference Lines**: Display normal range boundaries
- **Interactive Tooltips**: Show detailed value information
- **Color Coding**: Severity-based color schemes

#### Filtering Options
- **Search**: Find specific parameters by name
- **Abnormal Filter**: Show only parameters with abnormal values
- **Trend Filter**: Filter by improving/worsening trends

## Database Schema

### Existing Tables Used
- `LabReportAnalysis`: Contains `allValues` and `criticalValues` JSON fields
- `ReportTrendData`: Historical parameter tracking
- `StandaloneReportAnalysis`: Manual report analysis data

### Data Flow
```
Lab Report Upload → AI Analysis → Parameter Extraction → Trend Data Creation
                                                      ↓
Patient/Doctor View → Parameter Trends API → Trend Calculation → Visualization
```

## Usage Guide

### For Patients
1. Navigate to **Dashboard → Labs**
2. Click on **"Parameter Trends"** tab
3. Click **"View Parameter Trends"** button
4. Explore interactive charts and trends

### For Doctors
1. Go to **Patient Details** page
2. Scroll to **Lab Reports** section
3. Click **"View Parameter Trends"** button
4. Analyze patient's parameter trends over time

## Testing & Demo

### Seed Data Enhancement
- **Script**: `scripts/seed-parameter-trends.js`
- **Purpose**: Creates multiple lab reports with varying parameter values
- **Features**:
  - Multiple reports with 30-day intervals
  - Realistic parameter values with trends
  - Both lab-generated and standalone reports
  - Abnormal values for testing severity indicators

### Running the Seed Script
```bash
node scripts/seed-parameter-trends.js
```

### Expected Results
- 5+ lab reports with different dates
- Multiple parameters (HbA1c, Hemoglobin, Cholesterol, etc.)
- Varying severity levels and trends
- Interactive charts showing parameter changes

## Technical Implementation

### Dependencies Added
- **Recharts**: For interactive charts
- **Lucide React**: For icons
- **Existing UI Components**: Dialog, Button, Card, etc.

### Key Functions

#### `fetchParameterTrends()`
- Fetches trend data from API
- Handles loading states and errors
- Updates component state

#### `formatChartData()`
- Converts trend data to chart format
- Sorts by date for proper visualization
- Handles data parsing and formatting

#### `parseNormalRange()`
- Parses normal range strings
- Supports multiple formats (10-20, 10 to 20, etc.)
- Returns min/max values for reference lines

### Error Handling
- API error handling with toast notifications
- Graceful fallbacks for missing data
- Loading states for better UX

## Future Enhancements

### Potential Improvements
1. **Export Functionality**: PDF/Excel export of trend charts
2. **Predictive Analytics**: ML-based trend predictions
3. **Alert System**: Notifications for concerning trends
4. **Comparison Tools**: Compare parameters across patients
5. **Mobile Optimization**: Touch-friendly chart interactions

### Performance Considerations
- **Data Pagination**: For patients with many reports
- **Caching**: API response caching for faster loading
- **Lazy Loading**: Load charts on demand

## Troubleshooting

### Common Issues
1. **No Data Shown**: Ensure lab reports have been analyzed by AI
2. **Charts Not Loading**: Check Recharts dependency installation
3. **API Errors**: Verify patient ID and database connectivity

### Debug Steps
1. Check browser console for errors
2. Verify API endpoint responses
3. Ensure seed data has been run
4. Check database for trend data entries

## Conclusion

The Parameter Tracking Visualization System provides a comprehensive solution for tracking lab parameter trends over time. It integrates seamlessly with the existing lab report system and provides valuable insights for both patients and healthcare providers.

The implementation follows the existing codebase patterns and maintains consistency with the current UI/UX design while adding powerful new visualization capabilities.

