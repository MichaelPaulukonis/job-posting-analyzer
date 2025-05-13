import { FileStorageService, StorageItem } from '../../../services/FileStorageService';

interface SampleItem extends StorageItem {
  name: string;
  createdAt: string;
  items: Array<{
    id: number;
    name: string;
    value: string;
  }>;
}

export default defineEventHandler(async (event) => {
  try {
    // Create a FileStorageService instance for the sample file
    const storageService = new FileStorageService<SampleItem>('sample-data.json');
    
    // Create a sample item
    const sampleItem: SampleItem = {
      id: 'sample-data',
      name: 'Sample Data',
      createdAt: new Date().toISOString(),
      items: [
        { id: 1, name: 'Item 1', value: 'Value 1' },
        { id: 2, name: 'Item 2', value: 'Value 2' },
        { id: 3, name: 'Item 3', value: 'Value 3' }
      ]
    };
    
    // Save the item to storage
    storageService.save(sampleItem);
    
    return { 
      success: true, 
      message: 'Sample file created successfully', 
      fileName: 'sample-data.json' 
    };
  } catch (error) {
    console.error('Error creating sample file:', error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to create sample file',
    });
  }
});
