/**
 * S3 Service Tests
 * 
 * Tests for S3 file operations
 * Note: These tests use mocks to avoid actual AWS calls
 */

import { S3Service } from '~/server/services/S3Service'

// Mock AWS SDK
jest.mock('@aws-sdk/client-s3', () => {
  return {
    S3Client: jest.fn().mockImplementation(() => ({
      send: jest.fn()
    })),
    PutObjectCommand: jest.fn(),
    GetObjectCommand: jest.fn(),
    DeleteObjectCommand: jest.fn(),
    HeadObjectCommand: jest.fn(),
    ListObjectsV2Command: jest.fn()
  }
})

jest.mock('@aws-sdk/s3-request-presigner', () => {
  return {
    getSignedUrl: jest.fn().mockResolvedValue('https://signed-url.example.com')
  }
})

describe('S3Service', () => {
  let s3Service: S3Service
  
  beforeEach(() => {
    // Set required environment variables
    process.env.S3_BUCKET_NAME = 'test-bucket'
    process.env.AWS_REGION = 'us-east-1'
    
    // Clear console mocks
    jest.spyOn(console, 'log').mockImplementation()
    jest.spyOn(console, 'error').mockImplementation()
    
    // Create new instance for each test
    s3Service = new S3Service()
  })
  
  afterEach(() => {
    jest.restoreAllMocks()
  })
  
  describe('constructor', () => {
    it('should initialize with bucket name and region from environment', () => {
      expect(s3Service).toBeDefined()
    })
    
    it('should throw error if S3_BUCKET_NAME is not set', () => {
      delete process.env.S3_BUCKET_NAME
      
      expect(() => new S3Service()).toThrow('S3_BUCKET_NAME environment variable is required')
      
      // Restore for other tests
      process.env.S3_BUCKET_NAME = 'test-bucket'
    })
  })
  
  describe('uploadFile', () => {
    it('should upload a file and return the key', async () => {
      const mockSend = jest.fn().mockResolvedValue({})
      s3Service['client'].send = mockSend
      
      const buffer = Buffer.from('test content')
      const key = await s3Service.uploadFile(buffer, {
        folder: 'resumes',
        fileName: 'test.pdf',
        contentType: 'application/pdf'
      })
      
      expect(key).toBe('resumes/test.pdf')
      expect(mockSend).toHaveBeenCalled()
    })
    
    it('should generate UUID if fileName not provided', async () => {
      const mockSend = jest.fn().mockResolvedValue({})
      s3Service['client'].send = mockSend
      
      const buffer = Buffer.from('test content')
      const key = await s3Service.uploadFile(buffer, {
        folder: 'resumes'
      })
      
      expect(key).toMatch(/^resumes\/[0-9a-f-]{36}$/)
      expect(mockSend).toHaveBeenCalled()
    })
    
    it('should handle upload errors', async () => {
      const mockSend = jest.fn().mockRejectedValue(new Error('Upload failed'))
      s3Service['client'].send = mockSend
      
      const buffer = Buffer.from('test content')
      
      await expect(s3Service.uploadFile(buffer)).rejects.toThrow('Failed to upload file')
    })
  })
  
  describe('createPresignedUploadUrl', () => {
    it('should create a pre-signed upload URL', async () => {
      const result = await s3Service.createPresignedUploadUrl({
        folder: 'resumes',
        fileName: 'test.pdf',
        contentType: 'application/pdf',
        expiresIn: 3600
      })
      
      expect(result).toHaveProperty('url')
      expect(result).toHaveProperty('key')
      expect(result.url).toBe('https://signed-url.example.com')
      expect(result.key).toBe('resumes/test.pdf')
    })
  })
  
  describe('createPresignedDownloadUrl', () => {
    it('should create a pre-signed download URL', async () => {
      const url = await s3Service.createPresignedDownloadUrl('resumes/test.pdf')
      
      expect(url).toBe('https://signed-url.example.com')
    })
    
    it('should accept custom expiration time', async () => {
      const url = await s3Service.createPresignedDownloadUrl('resumes/test.pdf', 7200)
      
      expect(url).toBe('https://signed-url.example.com')
    })
  })
  
  describe('getPublicUrl', () => {
    it('should return the public URL for a file', () => {
      const url = s3Service.getPublicUrl('resumes/test.pdf')
      
      expect(url).toBe('https://test-bucket.s3.us-east-1.amazonaws.com/resumes/test.pdf')
    })
  })
  
  describe('deleteFile', () => {
    it('should delete a file', async () => {
      const mockSend = jest.fn().mockResolvedValue({})
      s3Service['client'].send = mockSend
      
      await s3Service.deleteFile('resumes/test.pdf')
      
      expect(mockSend).toHaveBeenCalled()
    })
    
    it('should handle deletion errors', async () => {
      const mockSend = jest.fn().mockRejectedValue(new Error('Delete failed'))
      s3Service['client'].send = mockSend
      
      await expect(s3Service.deleteFile('resumes/test.pdf')).rejects.toThrow('Failed to delete file')
    })
  })
  
  describe('fileExists', () => {
    it('should return true if file exists', async () => {
      const mockSend = jest.fn().mockResolvedValue({})
      s3Service['client'].send = mockSend
      
      const exists = await s3Service.fileExists('resumes/test.pdf')
      
      expect(exists).toBe(true)
      expect(mockSend).toHaveBeenCalled()
    })
    
    it('should return false if file does not exist', async () => {
      const mockSend = jest.fn().mockRejectedValue({ name: 'NotFound' })
      s3Service['client'].send = mockSend
      
      const exists = await s3Service.fileExists('resumes/nonexistent.pdf')
      
      expect(exists).toBe(false)
    })
    
    it('should return false for 404 status code', async () => {
      const mockSend = jest.fn().mockRejectedValue({ $metadata: { httpStatusCode: 404 } })
      s3Service['client'].send = mockSend
      
      const exists = await s3Service.fileExists('resumes/nonexistent.pdf')
      
      expect(exists).toBe(false)
    })
  })
  
  describe('getFileInfo', () => {
    it('should return file metadata', async () => {
      const mockSend = jest.fn().mockResolvedValue({
        ContentLength: 1024,
        LastModified: new Date('2024-01-01'),
        ContentType: 'application/pdf',
        Metadata: { author: 'test' }
      })
      s3Service['client'].send = mockSend
      
      const info = await s3Service.getFileInfo('resumes/test.pdf')
      
      expect(info).toEqual({
        key: 'resumes/test.pdf',
        size: 1024,
        lastModified: new Date('2024-01-01'),
        contentType: 'application/pdf',
        metadata: { author: 'test' }
      })
    })
  })
  
  describe('listFiles', () => {
    it('should list files in a folder', async () => {
      const mockSend = jest.fn().mockResolvedValue({
        Contents: [
          { Key: 'resumes/file1.pdf' },
          { Key: 'resumes/file2.pdf' }
        ]
      })
      s3Service['client'].send = mockSend
      
      const files = await s3Service.listFiles('resumes')
      
      expect(files).toEqual(['resumes/file1.pdf', 'resumes/file2.pdf'])
      expect(mockSend).toHaveBeenCalled()
    })
    
    it('should handle empty folder', async () => {
      const mockSend = jest.fn().mockResolvedValue({
        Contents: []
      })
      s3Service['client'].send = mockSend
      
      const files = await s3Service.listFiles('empty-folder')
      
      expect(files).toEqual([])
    })
  })
  
  describe('deleteFiles', () => {
    it('should delete multiple files', async () => {
      const mockSend = jest.fn().mockResolvedValue({})
      s3Service['client'].send = mockSend
      
      await s3Service.deleteFiles(['file1.pdf', 'file2.pdf', 'file3.pdf'])
      
      expect(mockSend).toHaveBeenCalledTimes(3)
    })
  })
})
