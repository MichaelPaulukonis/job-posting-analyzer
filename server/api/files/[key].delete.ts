/**
 * Delete a file from S3
 * 
 * DELETE /api/files/:key
 * 
 * Params:
 *   key: string (S3 key of the file, URL-encoded)
 * 
 * Returns:
 * {
 *   success: true
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
    
    await s3Service.deleteFile(decodedKey)
    
    return {
      success: true
    }
  } catch (error) {
    console.error('[API] Error deleting file:', error)
    throw createError({
      statusCode: 500,
      message: error instanceof Error ? error.message : 'Failed to delete file'
    })
  }
})
