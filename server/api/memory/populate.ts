/**
 * API endpoint for populating memory data from MCP memory service
 * This endpoint should be called from VS Code context where MCP tools are available
 */

interface MemoryData {
  content: string;
  hash: string;
  relevanceScore: number;
  tags: string[];
  timestamp: string;
}

interface PopulateMemoryRequest {
  memories: MemoryData[];
  category?: string;
}

interface PopulateMemoryResponse {
  success: boolean;
  message: string;
  memoriesStored: number;
}

// Simple in-memory cache for demo - in production, use Redis or database
let memoryCache: Map<string, MemoryData[]> = new Map();

export default defineEventHandler(async (event): Promise<PopulateMemoryResponse> => {
  try {
    const method = getMethod(event);

    if (method === 'POST') {
      // Store memories from MCP service
      const body = await readBody(event) as PopulateMemoryRequest;
      const { memories, category = 'general' } = body;

      if (!Array.isArray(memories)) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Invalid memories data - must be an array'
        });
      }

      // Validate and store memories
      const validMemories = memories.filter(mem => 
        mem.content && typeof mem.content === 'string' && mem.content.trim().length > 0
      );

      memoryCache.set(category, validMemories);
      
      console.log(`Memory API: Stored ${validMemories.length} memories for category "${category}"`);
      
      return {
        success: true,
        message: `Successfully stored ${validMemories.length} memories`,
        memoriesStored: validMemories.length
      };

    } else if (method === 'GET') {
      // Retrieve stored memories
      const query = getQuery(event);
      const category = (query.category as string) || 'general';
      const limit = Math.min(parseInt(query.limit as string) || 10, 50);

      const memories = memoryCache.get(category) || [];
      const limitedMemories = memories.slice(0, limit);

      return {
        success: true,
        message: `Retrieved ${limitedMemories.length} memories`,
        memoriesStored: limitedMemories.length,
        memories: limitedMemories
      } as any;

    } else {
      throw createError({
        statusCode: 405,
        statusMessage: 'Method not allowed'
      });
    }

  } catch (error: any) {
    console.error('Error in memory populate API:', error);
    
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.message || 'Failed to process memory request'
    });
  }
});