/**
 * Generate pre-signed URL for file download
 * 
 * POST /api/files/download-url
 * 
 * Body:
 * {
 *   key: string (S3 key of the file)
 *   expiresIn?: number (seconds, default: 3600)
 * }
 * 
 * Returns:
 * {
 *   url: string (pre-signed download URL)
 * }
 */

import s3Service from '~/server/services/S3Service'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    
    const { key, expiresIn } = body
    
    if (!key) {
      throw createError({
        statusCode: 400,
        message: 'File key is required'
      })
    }
    
    // Validate key (prevent path traversal)
    if (key.includes('..')) {
      throw createError({
        statusCode: 400,
        message: 'Invalid file key'
      })
    }
    
    const url = await s3Service.createPresignedDownloadUrl(key, expiresIn)
    
    return {
      success: true,
      data: { url }
    }
  } catch (error) {
    console.error('[API] Error generating download URL:', error)
    throw createError({
      statusCode: 500,
      message: error instanceof Error ? error.message : 'Failed to generate download URL'
    })
  }
})
