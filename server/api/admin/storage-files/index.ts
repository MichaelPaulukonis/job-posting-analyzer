import { FileStorageService } from '../../../services/FileStorageService';
import { join } from 'node:path';
import { readdirSync } from 'node:fs';
import { requireAuth } from '~/server/utils/verifyToken';

export default defineEventHandler(async (event) => {
  try {
    await requireAuth(event);
    // Use the .data directory from FileStorageService
    const dataDir = join(process.cwd(), '.data');
    
    // Just get the list of JSON files in the data directory
    const files = readdirSync(dataDir);
    const jsonFiles = files.filter(file => file.endsWith('.json'));
    
    return jsonFiles;
  } catch (error) {
    console.error('Error reading storage directory:', error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to read storage directory',
    });
  }
});
