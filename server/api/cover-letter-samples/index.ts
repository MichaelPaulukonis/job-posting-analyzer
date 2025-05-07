import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

// Get the directory name in ESM context
const __dirname = dirname(fileURLToPath(import.meta.url));

// Path to storage file
const storagePath = join(__dirname, '../../../.data');
const storageFile = join(storagePath, 'cover-letter-samples.json');

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
  
  // GET request to retrieve all samples
  if (method === 'GET') {
    try {
      const data = readFileSync(storageFile, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error reading cover letter samples file:', error);
      throw createError({
        statusCode: 500,
        message: 'Error reading cover letter samples data'
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
      console.error('Error saving cover letter samples file:', error);
      throw createError({
        statusCode: 500,
        message: 'Error saving cover letter samples data'
      });
    }
  }
  
  // DELETE request to clear all data
  if (method === 'DELETE') {
    try {
      writeFileSync(storageFile, JSON.stringify([], null, 2), 'utf8');
      return { success: true };
    } catch (error) {
      console.error('Error clearing cover letter samples file:', error);
      throw createError({
        statusCode: 500,
        message: 'Error clearing cover letter samples data'
      });
    }
  }
  
  throw createError({
    statusCode: 405,
    message: 'Method not allowed'
  });
}); 