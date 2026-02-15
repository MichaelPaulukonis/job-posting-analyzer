import type { UseFetchOptions } from '#app';

/**
 * API client composable for making authenticated requests to backend
 * Automatically includes Firebase authentication token in requests
 */
export function useApi() {
  const { $firebase } = useNuxtApp();
  
  /**
   * Get authentication headers with Firebase JWT token
   */
  const getAuthHeaders = async () => {
    const user = $firebase.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    const token = await user.getIdToken();
    return {
      Authorization: `Bearer ${token}`
    };
  };

  /**
   * Make an authenticated API request
   */
  const authenticatedFetch = async <T>(
    url: string,
    options: UseFetchOptions<T> = {}
  ) => {
    const headers = await getAuthHeaders();
    
    return useFetch<T>(url, {
      ...options,
      headers: {
        ...headers,
        ...options.headers
      }
    });
  };

  return {
    /**
     * Profile API
     */
    profile: {
      /**
       * Get current user profile
       */
      async get() {
        return authenticatedFetch('/api/auth/profile', {
          method: 'GET'
        });
      },

      /**
       * Update user profile
       */
      async update(name: string) {
        return authenticatedFetch('/api/auth/profile', {
          method: 'POST',
          body: { name }
        });
      }
    },

    /**
     * Resume API
     */
    resumes: {
      /**
       * List all resumes
       */
      async list(params?: { limit?: number; offset?: number; name?: string }) {
        const query = new URLSearchParams();
        if (params?.limit) query.append('limit', params.limit.toString());
        if (params?.offset) query.append('offset', params.offset.toString());
        if (params?.name) query.append('name', params.name);

        const queryString = query.toString();
        const url = queryString ? `/api/resumes?${queryString}` : '/api/resumes';

        return authenticatedFetch(url, {
          method: 'GET'
        });
      },

      /**
       * Get a specific resume by ID
       */
      async get(id: string) {
        return authenticatedFetch(`/api/resumes/${id}`, {
          method: 'GET'
        });
      },

      /**
       * Create a new resume
       */
      async create(data: { name: string; content: string; metadata?: any }) {
        return authenticatedFetch('/api/resumes', {
          method: 'POST',
          body: data
        });
      },

      /**
       * Delete a resume
       */
      async delete(id: string) {
        return authenticatedFetch(`/api/resumes/${id}`, {
          method: 'DELETE'
        });
      }
    },

    /**
     * Job Posting API
     */
    jobPostings: {
      /**
       * List all job postings
       */
      async list(params?: { limit?: number; offset?: number; company?: string }) {
        const query = new URLSearchParams();
        if (params?.limit) query.append('limit', params.limit.toString());
        if (params?.offset) query.append('offset', params.offset.toString());
        if (params?.company) query.append('company', params.company);

        const queryString = query.toString();
        const url = queryString ? `/api/job-postings?${queryString}` : '/api/job-postings';

        return authenticatedFetch(url, {
          method: 'GET'
        });
      },

      /**
       * Create a new job posting
       */
      async create(data: {
        title: string;
        company?: string;
        content: string;
        url?: string;
        location?: string;
        salaryRange?: string;
        metadata?: any;
      }) {
        return authenticatedFetch('/api/job-postings', {
          method: 'POST',
          body: data
        });
      }
    },

    /**
     * Analysis API
     */
    analysis: {
      /**
       * List all analysis results
       */
      async list(params?: {
        limit?: number;
        offset?: number;
        resumeId?: string;
        jobPostingId?: string;
      }) {
        const query = new URLSearchParams();
        if (params?.limit) query.append('limit', params.limit.toString());
        if (params?.offset) query.append('offset', params.offset.toString());
        if (params?.resumeId) query.append('resumeId', params.resumeId);
        if (params?.jobPostingId) query.append('jobPostingId', params.jobPostingId);

        const queryString = query.toString();
        const url = queryString ? `/api/analysis?${queryString}` : '/api/analysis';

        return authenticatedFetch(url, {
          method: 'GET'
        });
      },

      /**
       * Get a specific analysis result by ID
       */
      async get(id: string) {
        return authenticatedFetch(`/api/analysis/${id}`, {
          method: 'GET'
        });
      },

      /**
       * Create a new analysis result
       */
      async create(data: {
        resumeId: string;
        jobPostingId: string;
        matches?: string[];
        gaps?: string[];
        suggestions?: string[];
        similarityScore?: number;
        analysisMetadata?: any;
      }) {
        return authenticatedFetch('/api/analysis', {
          method: 'POST',
          body: data
        });
      }
    },

    /**
     * S3 File Upload API
     */
    files: {
      /**
       * Get pre-signed URL for file upload
       */
      async getUploadUrl(fileName: string, fileType: string) {
        return authenticatedFetch('/api/files/upload-url', {
          method: 'POST',
          body: {
            fileName,
            fileType
          }
        });
      },

      /**
       * Upload file directly to S3 using pre-signed URL
       */
      async uploadToS3(presignedUrl: string, file: File) {
        return fetch(presignedUrl, {
          method: 'PUT',
          body: file,
          headers: {
            'Content-Type': file.type
          }
        });
      },

      /**
       * Get pre-signed URL for file download
       */
      async getDownloadUrl(key: string) {
        return authenticatedFetch('/api/files/download-url', {
          method: 'POST',
          body: { key }
        });
      },

      /**
       * List all files
       */
      async list() {
        return authenticatedFetch('/api/files/list', {
          method: 'GET'
        });
      },

      /**
       * Delete a file
       */
      async delete(key: string) {
        return authenticatedFetch(`/api/files/${key}`, {
          method: 'DELETE'
        });
      }
    }
  };
}
