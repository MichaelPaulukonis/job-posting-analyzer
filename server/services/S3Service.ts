/**
 * S3 Service
 * 
 * Handles all S3 operations for file storage including:
 * - File uploads (direct and pre-signed URLs)
 * - File downloads (direct and pre-signed URLs)
 * - File deletion
 * - Folder structure management
 * 
 * Uses AWS SDK v3 for S3 operations
 */

import { 
  S3Client, 
  PutObjectCommand, 
  GetObjectCommand, 
  DeleteObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { randomUUID } from 'crypto'

export interface UploadOptions {
  folder?: string
  fileName?: string
  contentType?: string
  metadata?: Record<string, string>
}

export interface PresignedUrlOptions {
  expiresIn?: number // seconds, default 3600 (1 hour)
  contentType?: string
  metadata?: Record<string, string>
}

export interface FileInfo {
  key: string
  size?: number
  lastModified?: Date
  contentType?: string
  metadata?: Record<string, string>
}

export class S3Service {
  private client: S3Client
  private bucketName: string
  private region: string

  constructor() {
    this.region = process.env.AWS_REGION || 'us-east-1'
    this.bucketName = process.env.S3_BUCKET_NAME || ''
    
    if (!this.bucketName) {
      console.error('[S3Service] S3_BUCKET_NAME environment variable not set')
      throw new Error('S3_BUCKET_NAME environment variable is required')
    }

    this.client = new S3Client({ 
      region: this.region,
      // Credentials are automatically loaded from environment or IAM role
    })

    console.log(`[S3Service] Initialized with bucket: ${this.bucketName}, region: ${this.region}`)
  }

  /**
   * Generate a unique file key with optional folder prefix
   */
  private generateKey(options: UploadOptions = {}): string {
    const { folder, fileName } = options
    const uniqueId = randomUUID()
    const name = fileName || uniqueId
    
    return folder ? `${folder}/${name}` : name
  }

  /**
   * Upload a file directly to S3
   * @param file - File buffer to upload
   * @param options - Upload options (folder, fileName, contentType, metadata)
   * @returns The S3 key of the uploaded file
   */
  async uploadFile(file: Buffer, options: UploadOptions = {}): Promise<string> {
    const key = this.generateKey(options)
    
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: file,
      ContentType: options.contentType || 'application/octet-stream',
      Metadata: options.metadata
    })
    
    try {
      await this.client.send(command)
      console.log(`[S3Service] File uploaded successfully: ${key}`)
      return key
    } catch (error) {
      console.error(`[S3Service] Error uploading file:`, error)
      throw new Error(`Failed to upload file: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Create a pre-signed URL for direct upload from client
   * @param options - Upload options (folder, fileName, contentType, metadata, expiresIn)
   * @returns Object containing the pre-signed URL and the file key
   */
  async createPresignedUploadUrl(options: PresignedUrlOptions & Pick<UploadOptions, 'folder' | 'fileName'> = {}): Promise<{ url: string, key: string }> {
    const key = this.generateKey(options)
    const expiresIn = options.expiresIn || 3600 // 1 hour default
    
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      ContentType: options.contentType || 'application/octet-stream',
      Metadata: options.metadata
    })
    
    try {
      const url = await getSignedUrl(this.client, command, { expiresIn })
      console.log(`[S3Service] Pre-signed upload URL created for: ${key}`)
      return { url, key }
    } catch (error) {
      console.error(`[S3Service] Error creating pre-signed upload URL:`, error)
      throw new Error(`Failed to create pre-signed upload URL: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Create a pre-signed URL for file download
   * @param key - S3 key of the file
   * @param expiresIn - URL expiration time in seconds (default 3600)
   * @returns Pre-signed download URL
   */
  async createPresignedDownloadUrl(key: string, expiresIn: number = 3600): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    })
    
    try {
      const url = await getSignedUrl(this.client, command, { expiresIn })
      console.log(`[S3Service] Pre-signed download URL created for: ${key}`)
      return url
    } catch (error) {
      console.error(`[S3Service] Error creating pre-signed download URL:`, error)
      throw new Error(`Failed to create pre-signed download URL: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Get the public URL for a file (if bucket allows public access)
   * Note: Our bucket blocks public access, so this is mainly for reference
   * @param key - S3 key of the file
   * @returns Public URL
   */
  getPublicUrl(key: string): string {
    return `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${key}`
  }

  /**
   * Download a file from S3
   * @param key - S3 key of the file
   * @returns File buffer
   */
  async downloadFile(key: string): Promise<Buffer> {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    })
    
    try {
      const response = await this.client.send(command)
      
      if (!response.Body) {
        throw new Error('No file content received')
      }
      
      // Convert stream to buffer
      const chunks: Uint8Array[] = []
      for await (const chunk of response.Body as any) {
        chunks.push(chunk)
      }
      
      const buffer = Buffer.concat(chunks)
      console.log(`[S3Service] File downloaded successfully: ${key}`)
      return buffer
    } catch (error) {
      console.error(`[S3Service] Error downloading file:`, error)
      throw new Error(`Failed to download file: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Delete a file from S3
   * @param key - S3 key of the file to delete
   */
  async deleteFile(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    })
    
    try {
      await this.client.send(command)
      console.log(`[S3Service] File deleted successfully: ${key}`)
    } catch (error) {
      console.error(`[S3Service] Error deleting file:`, error)
      throw new Error(`Failed to delete file: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Check if a file exists in S3
   * @param key - S3 key of the file
   * @returns true if file exists, false otherwise
   */
  async fileExists(key: string): Promise<boolean> {
    const command = new HeadObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    })
    
    try {
      await this.client.send(command)
      return true
    } catch (error: any) {
      if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
        return false
      }
      console.error(`[S3Service] Error checking file existence:`, error)
      throw new Error(`Failed to check file existence: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Get file metadata
   * @param key - S3 key of the file
   * @returns File information
   */
  async getFileInfo(key: string): Promise<FileInfo> {
    const command = new HeadObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    })
    
    try {
      const response = await this.client.send(command)
      return {
        key,
        size: response.ContentLength,
        lastModified: response.LastModified,
        contentType: response.ContentType,
        metadata: response.Metadata
      }
    } catch (error) {
      console.error(`[S3Service] Error getting file info:`, error)
      throw new Error(`Failed to get file info: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * List files in a folder
   * @param folder - Folder prefix (optional, lists all files if not provided)
   * @param maxKeys - Maximum number of keys to return (default 1000)
   * @returns Array of file keys
   */
  async listFiles(folder?: string, maxKeys: number = 1000): Promise<string[]> {
    const command = new ListObjectsV2Command({
      Bucket: this.bucketName,
      Prefix: folder,
      MaxKeys: maxKeys
    })
    
    try {
      const response = await this.client.send(command)
      const keys = response.Contents?.map(obj => obj.Key!).filter(Boolean) || []
      console.log(`[S3Service] Listed ${keys.length} files in folder: ${folder || 'root'}`)
      return keys
    } catch (error) {
      console.error(`[S3Service] Error listing files:`, error)
      throw new Error(`Failed to list files: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Delete multiple files
   * @param keys - Array of S3 keys to delete
   */
  async deleteFiles(keys: string[]): Promise<void> {
    const deletePromises = keys.map(key => this.deleteFile(key))
    
    try {
      await Promise.all(deletePromises)
      console.log(`[S3Service] Deleted ${keys.length} files successfully`)
    } catch (error) {
      console.error(`[S3Service] Error deleting multiple files:`, error)
      throw new Error(`Failed to delete files: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
}

// Export as singleton
const s3Service = new S3Service()
export default s3Service
