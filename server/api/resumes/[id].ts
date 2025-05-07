import { readFileSync, writeFileSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

// Get the directory name in ESM context
const __dirname = dirname(fileURLToPath(import.meta.url));

// Path to storage file
const storagePath = join(__dirname, '../../../.data');
const storageFile = join(storagePath, 'resumes.json');

export default defineEventHandler(async (event) => {
  if (!existsSync(storageFile)) {
    throw createError({
      statusCode: 404,
      message: 'Resumes storage file not found'
    });
  }

  const id = getRouterParam(event, 'id');
  const method = event.method;
  
  // DELETE request to remove a specific resume
  if (method === 'DELETE') {
    try {
      const data = JSON.parse(readFileSync(storageFile, 'utf8'));
      const updatedData = data.filter((item: any) => item.id !== id);
      writeFileSync(storageFile, JSON.stringify(updatedData, null, 2), 'utf8');
      return { success: true };
    } catch (error) {
      console.error(`Error deleting resume with ID ${id}:`, error);
      throw createError({
        statusCode: 500,
        message: 'Error deleting resume'
      });
    }
  }
  
  throw createError({
    statusCode: 405,
    message: 'Method not allowed'
  });
}); 