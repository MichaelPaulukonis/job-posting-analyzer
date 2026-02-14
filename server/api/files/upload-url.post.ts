/**
 * Generate pre-signed URL for file upload
 * 
 * POST /api/files/upload-url
 * 
 * Body:
 * {
 *   folder?: string (e.g., 'resumes', 'job-postings')
 *   fileName?: string (optional, will generate UUID if not provided)
 *   contentType?: string (default: 'application/octet-stream')
 *   expiresIn?: number (seconds, default: 3600)
 * }
 * 
 * Returns:
 * {
 *   url: string (pre-signed upload URL)
 *   key: string (S3 key for the file)
 * }
 */

import s3Service from '~/server/services/S3Service'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    
    const { folder, fileName, contentType, expiresIn } = body
    
    // Validate folder if provided (prevent path traversal)
    if (folder && (folder.includes('..') || folder.startsWith('/'))) {
      throw createError({
        statusCode: 400,
        message: 'Invalid folder path'
      })
    }
    
    const result = await s3Service.createPresignedUploadUrl({
      folder,
      fileName,
      contentType,
      expiresIn
    })
    
    return {
      success: true,
      data: result
    }
  } catch (error) {
    console.error('[API] Error generating upload URL:', error)
    throw createError({
      statusCode: 500,
      message: error instanceof Error ? error.message : 'Failed to generate upload URL'
    })
  }
})
