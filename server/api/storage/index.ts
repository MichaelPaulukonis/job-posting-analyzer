import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// Get the directory name in ESM context
const __dirname = dirname(fileURLToPath(import.meta.url));

// Path to storage file
const storagePath = join(process.cwd(), '.data');
const storageFile = join(storagePath, 'analysis-history.json');

// Ensure storage directory exists
if (!existsSync(storagePath)) {
  mkdirSync(storagePath, { recursive: true });
}

// Initialize empty storage if file doesn't exist
if (!existsSync(storageFile)) {
  writeFileSync(storageFile, JSON.stringify([], null, 2), 'utf8');
}

export default defineEventHandler(async (event) => {
  const method = event.method;
  
  // GET request to retrieve all analyses
  if (method === 'GET') {
    try {
      const data = readFileSync(storageFile, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error reading storage file:', error);
      throw createError({
        statusCode: 500,
        message: 'Error reading storage data'
      });
    }
  }
  
  // POST request to save data
  if (method === 'POST') {
    try {
      const body = await readBody(event);
      writeFileSync(storageFile, JSON.stringify(body, null, 2), 'utf8');
      return { success: true };
    } catch (error) {
      console.error('Error saving storage file:', error);
      throw createError({
        statusCode: 500,
        message: 'Error saving storage data'
      });
    }
  }
  
  // DELETE request to clear all data
  if (method === 'DELETE') {
    try {
      writeFileSync(storageFile, JSON.stringify([], null, 2), 'utf8');
      return { success: true };
    } catch (error) {
      console.error('Error clearing storage file:', error);
      throw createError({
        statusCode: 500,
        message: 'Error clearing storage data'
      });
    }
  }
  
  throw createError({
    statusCode: 405,
    message: 'Method not allowed'
  });
});
