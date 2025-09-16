import { algoliasearch } from 'algoliasearch';

// Initialize Algolia client for search operations
const searchClient = algoliasearch(
  process.env.ALGOLIA_APP_ID!,
  process.env.ALGOLIA_SEARCH_API_KEY!
);

// Initialize Algolia client for admin operations (write operations)
const adminClient = algoliasearch(
  process.env.ALGOLIA_APP_ID!,
  process.env.ALGOLIA_ADMIN_API_KEY!
);

// Search medicines function
export async function searchMedicines(query: string, limit: number = 10) {
  try {
    const response = await searchClient.search({
      requests: [{
        indexName: 'A_Z_medicines_dataset_of_India',
        query: query,
        hitsPerPage: limit,
        attributesToRetrieve: ['name', 'short_composition1', 'short_composition2', 'id'],
      }]
    });

    const hits = response.results[0]?.hits || [];

    return hits.map((hit: any) => ({
      id: hit.objectID || hit.id,
      name: hit.name,
      category: hit.short_composition1 || 'General',
      frequency: [],
      medicineTime: [],
      duration: [],
      price: 0,
      composition: hit.short_composition1,
      composition2: hit.short_composition2,
    }));
  } catch (error) {
    console.error('Algolia search error:', error);
    throw new Error('Failed to search medicines');
  }
}

// Add a new medicine to Algolia
export async function addMedicineToAlgolia(medicine: {
  name: string;
  category?: string;
  frequency?: string[];
  medicineTime?: string[];
  duration?: string[];
  price?: number;
}) {
  try {
    const response = await adminClient.saveObject({
      indexName: 'A_Z_medicines_dataset_of_India',
      body: {
        ...medicine,
        createdAt: new Date().toISOString(),
      }
    });
    return response.objectID;
  } catch (error) {
    console.error('Algolia add medicine error:', error);
    throw new Error('Failed to add medicine to search index');
  }
}

// Update a medicine in Algolia
export async function updateMedicineInAlgolia(objectID: string, medicine: {
  name?: string;
  category?: string;
  frequency?: string[];
  medicineTime?: string[];
  duration?: string[];
  price?: number;
}) {
  try {
    await adminClient.partialUpdateObject({
      indexName: 'A_Z_medicines_dataset_of_India',
      objectID,
      body: {
        ...medicine,
        updatedAt: new Date().toISOString(),
      }
    });
  } catch (error) {
    console.error('Algolia update medicine error:', error);
    throw new Error('Failed to update medicine in search index');
  }
}

// Delete a medicine from Algolia
export async function deleteMedicineFromAlgolia(objectID: string) {
  try {
    await adminClient.deleteObject({
      indexName: 'A_Z_medicines_dataset_of_India',
      objectID
    });
  } catch (error) {
    console.error('Algolia delete medicine error:', error);
    throw new Error('Failed to delete medicine from search index');
  }
}
