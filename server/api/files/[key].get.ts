/**
 * Get file information
 * 
 * GET /api/files/:key
 * 
 * Params:
 *   key: string (S3 key of the file, URL-encoded)
 * 
 * Returns:
 * {
 *   key: string
 *   size: number
 *   lastModified: Date
 *   contentType: string
 *   metadata: Record<string, string>
 * }
 */

import s3Service from '~/server/services/S3Service'

export default defineEventHandler(async (event) => {
  try {
    const key = getRouterParam(event, 'key')
    
    if (!key) {
      throw createError({
        statusCode: 400,
        message: 'File key is required'
      })
    }
    
    // Decode the key (it may be URL-encoded)
    const decodedKey = decodeURIComponent(key)
    
    // Validate key (prevent path traversal)
    if (decodedKey.includes('..')) {
      throw createError({
        statusCode: 400,
        message: 'Invalid file key'
      })
    }
    
    const fileInfo = await s3Service.getFileInfo(decodedKey)
    
    return {
      success: true,
      data: fileInfo
    }
  } catch (error) {
    console.error('[API] Error getting file info:', error)
    throw createError({
      statusCode: 404,
      message: error instanceof Error ? error.message : 'File not found'
    })
  }
})
