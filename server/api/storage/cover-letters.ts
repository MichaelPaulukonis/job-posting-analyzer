import { requireAuth } from '~/server/utils/verifyToken';
import prisma from '~/server/utils/prisma';

export default defineEventHandler(async (event) => {
  await requireAuth(event);
  const method = getMethod(event);
  
  switch (method) {
    case 'GET':
      try {
        const query = getQuery(event);
        const { analysisId } = query;
        
        if (analysisId && typeof analysisId === 'string') {
          // Get cover letters for a specific analysis
          console.log(`[API] Fetching cover letters for analysisId: ${analysisId}`);
          const coverLetters = await prisma.coverLetter.findMany({
            where: {
              analysisResultId: analysisId
            },
            orderBy: {
              createdAt: 'desc'
            }
          });
          console.log(`[API] Found ${coverLetters.length} cover letters for analysisId: ${analysisId}`);
          return coverLetters;
        } else {
          // Get all cover letters
          console.log('[API] Fetching all cover letters');
          const coverLetters = await prisma.coverLetter.findMany({
            orderBy: {
              createdAt: 'desc'
            }
          });
          console.log(`[API] Found ${coverLetters.length} total cover letters`);
          return coverLetters;
        }
      } catch (error) {
        console.error('[API] Error retrieving cover letters:', error);
        console.error('[API] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
        throw createError({
          statusCode: 500,
          statusMessage: 'Failed to retrieve cover letters'
        });
      }
      
    case 'POST':
      try {
        const body = await readBody(event);
        const { analysisId, content, timestamp, sampleContent, history, editedSections } = body;
        
        // Validate required fields
        if (!analysisId || typeof analysisId !== 'string') {
          throw createError({
            statusCode: 400,
            statusMessage: 'Invalid cover letter data - missing or invalid analysisId'
          });
        }
        
        if (!content || typeof content !== 'string' || content.trim().length === 0) {
          throw createError({
            statusCode: 400,
            statusMessage: 'Invalid cover letter data - missing or empty content'
          });
        }
        
        // Look up analysis result to get resumeId and jobPostingId
        console.log(`[API] Looking up analysis result: ${analysisId}`);
        const analysisResult = await prisma.analysisResult.findUnique({
          where: {
            id: analysisId
          },
          select: {
            id: true,
            resumeId: true,
            jobPostingId: true
          }
        });
        
        if (!analysisResult) {
          throw createError({
            statusCode: 400,
            statusMessage: `Analysis result not found for ID: ${analysisId}`
          });
        }
        
        // Build metadata object
        const metadata: Record<string, any> = {};
        if (timestamp) metadata.timestamp = timestamp;
        if (sampleContent) metadata.sampleContent = sampleContent;
        if (history) metadata.history = history;
        if (editedSections) metadata.editedSections = editedSections;
        
        // Create cover letter record
        console.log(`[API] Creating cover letter for analysis: ${analysisId}`);
        const coverLetter = await prisma.coverLetter.create({
          data: {
            analysisResultId: analysisResult.id,
            resumeId: analysisResult.resumeId,
            jobPostingId: analysisResult.jobPostingId,
            content: content.trim(),
            metadata: metadata
          }
        });
        
        console.log(`[API] Cover letter created with ID: ${coverLetter.id}`);
        
        return {
          success: true,
          id: coverLetter.id,
          coverLetter
        };
      } catch (error) {
        console.error('[API] Error saving cover letter:', error);
        
        // Re-throw createError instances
        if (error && typeof error === 'object' && 'statusCode' in error) {
          throw error;
        }
        
        // Handle database errors
        throw createError({
          statusCode: 500,
          statusMessage: 'Failed to save cover letter'
        });
      }
      
    default:
      throw createError({
        statusCode: 405,
        statusMessage: 'Method Not Allowed'
      });
  }
});
