/**
 * List files in a folder
 * 
 * GET /api/files/list?folder=resumes&maxKeys=100
 * 
 * Query params:
 *   folder?: string (folder prefix, optional)
 *   maxKeys?: number (max results, default 1000)
 * 
 * Returns:
 * {
 *   files: string[] (array of S3 keys)
 * }
 */

import s3Service from '~/server/services/S3Service'

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    
    const folder = query.folder as string | undefined
    const maxKeys = query.maxKeys ? parseInt(query.maxKeys as string) : 1000
    
    // Validate folder if provided (prevent path traversal)
    if (folder && (folder.includes('..') || folder.startsWith('/'))) {
      throw createError({
        statusCode: 400,
        message: 'Invalid folder path'
      })
    }
    
    // Validate maxKeys
    if (maxKeys < 1 || maxKeys > 1000) {
      throw createError({
        statusCode: 400,
        message: 'maxKeys must be between 1 and 1000'
      })
    }
    
    const files = await s3Service.listFiles(folder, maxKeys)
    
    return {
      success: true,
      data: { files }
    }
  } catch (error) {
    console.error('[API] Error listing files:', error)
    throw createError({
      statusCode: 500,
      message: error instanceof Error ? error.message : 'Failed to list files'
    })
  }
})
