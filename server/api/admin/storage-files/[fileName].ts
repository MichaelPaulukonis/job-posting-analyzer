import { FileStorageService, StorageItem } from '../../../services/FileStorageService';
import { requireAuth } from '~/server/utils/verifyToken';

export default defineEventHandler(async (event) => {
  try {
    await requireAuth(event);
    const fileName = getRouterParam(event, 'fileName');
    
    if (!fileName) {
      throw createError({
        statusCode: 400,
        statusMessage: 'File name is required',
      });
    }
    
    // Basic security check to prevent directory traversal
    if (fileName.includes('..') || !fileName.endsWith('.json')) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid file name',
      });
    }
    
    // Create a FileStorageService instance with the specified filename
    const storageService = new FileStorageService<StorageItem>(fileName);
    
    // Get all items from this storage file
    const items = storageService.getAll();
    
    return items;
  } catch (error) {
    console.error('Error reading file:', error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to read file',
    });
  }
});
