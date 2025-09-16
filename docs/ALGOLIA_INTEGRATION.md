# Algolia Integration for Medicine Search

This document explains the Algolia integration implemented for medicine search in the doctor panel.

## Overview

The medicine search functionality in the doctor panel has been updated to use Algolia search instead of traditional database queries. This provides faster, more accurate search results with better user experience.

## Files Modified/Created

### New Files
1. **`lib/algolia.ts`** - Algolia service configuration and client setup
2. **`app/api/doctor/prescription/algolia-medicines/route.ts`** - New API endpoint for Algolia medicine search
3. **`scripts/test-algolia-integration.js`** - Test script to verify Algolia integration

### Modified Files
1. **`components/prescription/TypeAheadInput.tsx`** - Updated to use Algolia for medicine search

## Environment Variables Required

Add the following environment variables to your `.env.local` file:

```bash
ALGOLIA_APP_ID=your_algolia_app_id_here
ALGOLIA_SEARCH_API_KEY=your_algolia_search_api_key_here
ALGOLIA_ADMIN_API_KEY=your_algolia_admin_api_key_here
```

**Important Notes:**
- `ALGOLIA_SEARCH_API_KEY`: Used for searching medicines (read-only)
- `ALGOLIA_ADMIN_API_KEY`: Used for adding/updating/deleting medicines (read-write)
- For production, you can use a restricted Admin API Key with only the necessary permissions

## Setup Instructions

1. **Install Dependencies**
   ```bash
   npm install algoliasearch
   ```

2. **Set Environment Variables**
   - Add your Algolia App ID and Search API Key to your environment file
   - Make sure your Algolia index is named `medicines`

3. **Test Integration**
   ```bash
   node scripts/test-algolia-integration.js
   ```

## How It Works

### Search Flow
1. When a user types in the medicine search field (TypeAheadInput with type="medicines")
2. The component calls `/api/doctor/prescription/algolia-medicines` endpoint
3. This endpoint uses the Algolia service to search the medicines index
4. Results are returned and displayed in the dropdown

### Add New Medicine Flow
1. When a user adds a new medicine that doesn't exist
2. The component calls the Algolia API endpoint with POST method
3. The new medicine is added to both the database and Algolia index
4. Success message is shown to the user

## API Endpoints

### GET `/api/doctor/prescription/algolia-medicines`
- **Query Parameters:**
  - `query` (required): Search query string
  - `limit` (optional): Number of results to return (default: 10)

- **Response:**
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "objectID",
        "name": "Medicine Name",
        "category": "Category",
        "frequency": ["1-0-0", "1-1-1"],
        "medicineTime": ["Pre-meal", "Post-meal"],
        "duration": ["7d", "14d"],
        "price": 100
      }
    ]
  }
  ```

### POST `/api/doctor/prescription/algolia-medicines`
- **Body:**
  ```json
  {
    "name": "Medicine Name",
    "category": "Category",
    "frequency": ["1-0-0"],
    "medicineTime": ["Pre-meal"],
    "duration": ["7d"],
    "price": 100
  }
  ```

- **Response:**
  ```json
  {
    "success": true,
    "data": {
      "objectID": "generated_id",
      "name": "Medicine Name",
      "category": "Category",
      "frequency": ["1-0-0"],
      "medicineTime": ["Pre-meal"],
      "duration": ["7d"],
      "price": 100
    }
  }
  ```

## Algolia Index Structure

The medicines index (`A_Z_medicines_dataset_of_India`) has the following structure:

```json
{
  "objectID": "ffd5553af294e_dashboard_generated_id",
  "id": 63902,
  "name": "Dolostat 200mg Tablet SR",
  "short_composition1": "Aceclofenac (200mg)",
  "short_composition2": ""
}
```

**Note:** This index contains 250K+ medicine entries from India's pharmaceutical database.

## Fallback Behavior

If Algolia search fails for any reason, the system will:
1. Log the error to the console
2. Fall back to mock data for immediate functionality
3. Show appropriate error messages to the user

## Benefits

1. **Faster Search**: Algolia provides sub-second search results
2. **Better Relevance**: Advanced search algorithms for better matching
3. **Typo Tolerance**: Handles typos and partial matches
4. **Scalability**: Can handle large datasets efficiently
5. **Analytics**: Built-in search analytics and insights
6. **Rich Composition Display**: Shows medicine compositions in a readable format (e.g., "Aceclofenac (200mg), Paracetamol (325mg)")

## Troubleshooting

### Common Issues

1. **Environment Variables Not Set**
   - Ensure `ALGOLIA_APP_ID` and `ALGOLIA_SEARCH_API_KEY` are set
   - Run the test script to verify: `node scripts/test-algolia-integration.js`

2. **Index Not Found**
   - Verify your Algolia index is named `medicines`
   - Check if the index exists in your Algolia dashboard

3. **API Key Issues**
   - Ensure you're using the Search API Key (not Admin API Key)
   - Check if the API key has proper permissions

4. **Search Not Working**
   - Check browser console for errors
   - Verify network requests in browser dev tools
   - Check server logs for API errors

### Testing

Run the test script to verify everything is working:
```bash
node scripts/test-algolia-integration.js
```

This will test:
- Environment variable configuration
- Algolia client initialization
- Basic search functionality
- Connection to your medicines index

## Future Enhancements

1. **Search Analytics**: Track popular searches and medicine usage
2. **Auto-complete**: Implement more sophisticated auto-complete
3. **Search Filters**: Add category and price filters
4. **Search Suggestions**: Show related medicines
5. **Offline Support**: Cache popular searches for offline use
