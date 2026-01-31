import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

export interface StorageItem {
  id: string;
  [key: string]: any;
}

export class FileStorageService<T extends StorageItem> {
  protected storagePath: string;
  protected storageFile: string;

  constructor(fileName: string) {
    this.storagePath = join(process.cwd(), '.data');
    this.storageFile = join(this.storagePath, fileName);
    this.ensureStorageExists();
  }

  /**
   * Ensure storage directory and file exist
   */
  protected ensureStorageExists(): void {
    // Ensure storage directory exists
    if (!existsSync(this.storagePath)) {
      mkdirSync(this.storagePath, { recursive: true });
    }

    // Initialize empty storage if file doesn't exist
    if (!existsSync(this.storageFile)) {
      writeFileSync(this.storageFile, JSON.stringify([], null, 2), 'utf8');
    }
  }

  /**
   * Get all items from storage
   */
  public getAll(): T[] {
    try {
      console.log(`[FileStorage] Reading from: ${this.storageFile}`);
      const data = readFileSync(this.storageFile, 'utf8');
      console.log(`[FileStorage] Raw data length: ${data.length} characters`);
      
      const parsed = JSON.parse(data);
      console.log(`[FileStorage] Parsed data type: ${typeof parsed}, isArray: ${Array.isArray(parsed)}`);
      
      if (!Array.isArray(parsed)) {
        console.error(`[FileStorage] ERROR: Parsed data is not an array! Type: ${typeof parsed}`, parsed);
        console.error(`[FileStorage] Returning empty array as fallback`);
        return [];
      }
      
      console.log(`[FileStorage] Successfully loaded ${parsed.length} items from ${this.storageFile}`);
      return parsed;
    } catch (error) {
      console.error(`[FileStorage] Error reading file ${this.storageFile}:`, error);
      console.error(`[FileStorage] Error type: ${error instanceof Error ? error.constructor.name : typeof error}`);
      console.error(`[FileStorage] Error message: ${error instanceof Error ? error.message : String(error)}`);
      console.error(`[FileStorage] Error stack:`, error instanceof Error ? error.stack : 'No stack trace');
      
      // Return empty array instead of throwing to prevent cascading failures
      console.error(`[FileStorage] Returning empty array due to error`);
      return [];
    }
  }

  /**
   * Save all items to storage
   */
  public saveAll(items: T[]): void {
    try {
      writeFileSync(this.storageFile, JSON.stringify(items, null, 2), 'utf8');
    } catch (error) {
      console.error(`Error writing to file ${this.storageFile}:`, error);
      throw new Error(`Failed to write to ${this.storageFile}`);
    }
  }

  /**
   * Get item by ID
   */
  public getById(id: string): T | undefined {
    const items = this.getAll();
    return items.find(item => item.id === id);
  }

  /**
   * Add or update an item
   */
  public save(item: T): void {
    const items = this.getAll();
    const index = items.findIndex(i => i.id === item.id);
    
    if (index !== -1) {
      items[index] = item;
    } else {
      items.unshift(item);
    }
    
    this.saveAll(items);
  }

  /**
   * Delete an item by ID
   */
  public delete(id: string): void {
    const items = this.getAll();
    const filteredItems = items.filter(item => item.id !== id);
    this.saveAll(filteredItems);
  }

  /**
   * Delete all items
   */
  public clear(): void {
    this.saveAll([]);
  }
}
