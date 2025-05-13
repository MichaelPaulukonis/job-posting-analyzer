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
      const data = readFileSync(this.storageFile, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error(`Error reading file ${this.storageFile}:`, error);
      throw new Error(`Failed to read from ${this.storageFile}`);
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
