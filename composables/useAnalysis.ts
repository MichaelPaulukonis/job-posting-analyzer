import { ref, reactive, onMounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import type { JobPosting, Resume, AnalysisResult, SavedAnalysis, ResumeEntry, ServiceName } from '../types';
import { StorageService } from '../services/StorageService';
import { LLMServiceFactory } from '~/services/LLMServiceFactory';
import { nextTick } from 'vue';

const SELECTED_SERVICE_STORAGE_KEY = 'selected-llm-service';
const FALLBACK_SERVICE: ServiceName = 'gemini';

export function useAnalysis() {
  const jobPosting = reactive<JobPosting>({ title: '', content: '' });
  const resume = reactive<Resume>({ content: '' });
  const errors = reactive({ jobPosting: '', jobPostingFile: '', resume: '', resumeFile: '' });
  const isAnalyzing = ref(false);
  const error = ref('');
  const analysisResults = ref<AnalysisResult | null>(null);
  const savedAnalyses = ref<SavedAnalysis[]>([]);
  const selectedService = ref<ServiceName>(FALLBACK_SERVICE);
  const currentAnalysisId = ref<string | null>(null);
  const selectedResumeId = ref<string | null>(null);
  const savedResumes = ref<ResumeEntry[]>([]);

  const showResumeNameDialog = ref(false);

  // Refs for InputContainer components
  const jobPostingContainer = ref<any>(null); // Use 'any' or a more specific type if available
  const resumeContainer = ref<any>(null);
  const settingsContainer = ref<any>(null);

  const router = useRouter();
  const route = useRoute();

  async function loadResumes() {
    savedResumes.value = await StorageService.getResumes();
  }

  function getStoredService(): ServiceName | null {
    if (typeof window === 'undefined') {
      return null;
    }

    const storedService = localStorage.getItem(SELECTED_SERVICE_STORAGE_KEY);
    if (storedService && ['gemini', 'anthropic', 'openai', 'mock'].includes(storedService)) {
      return storedService as ServiceName;
    }

    return null;
  }

  watch(selectedService, (newService) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(SELECTED_SERVICE_STORAGE_KEY, newService);
    }
  });

  const handleJobFileUpload = ({ content }: { content: string }) => {
    jobPosting.content = content;
    errors.jobPosting = '';
    errors.jobPostingFile = '';
  };

  const handleResumeFileUpload = ({ content }: { content: string }) => {
    resume.content = content;
    errors.resume = '';
    errors.resumeFile = '';
  };

  const handleResumeSelect = (resumeEntry: ResumeEntry) => {
    if (resumeEntry) {
      resume.content = resumeEntry.content;
      selectedResumeId.value = resumeEntry.id;
      errors.resume = ''; // Clear resume error when a resume is selected
    }
  };

  const saveResume = () => {
    if (resume.content && resume.content.trim().length >= 10) {
      showResumeNameDialog.value = true;
    }
  };

  const handleResumeNameSave = async (name: string) => {
    if (name && resume.content) {
      const newResume: ResumeEntry = {
        id: `resume-${Date.now()}`,
        name,
        content: resume.content,
        timestamp: new Date().toISOString(),
      };
      await StorageService.saveResume(newResume);
      selectedResumeId.value = newResume.id; // Auto-select the newly saved resume
      showResumeNameDialog.value = false;
      await loadResumes();
    }
  };

  const deleteResume = async (id: string) => {
    await StorageService.deleteResume(id);
    await loadResumes();
    if (selectedResumeId.value === id) {
      selectedResumeId.value = null;
      resume.content = '';
    }
  };

  const validateField = (field: 'jobPosting' | 'resume') => {
    if (field === 'jobPosting') {
      if (!jobPosting.content || jobPosting.content.trim().length < 10) {
        errors.jobPosting = 'Job posting content is too short.';
      } else {
        errors.jobPosting = '';
      }
    }
    if (field === 'resume') {
      if (!resume.content || resume.content.trim().length < 10) {
        errors.resume = 'Resume content is too short.';
      } else {
        errors.resume = '';
      }
    }
  };

  const validateAndAnalyze = async () => {
    validateField('jobPosting');
    validateField('resume');

    if (errors.jobPosting || errors.resume) {
      error.value = 'Please fill in all required fields.';
      return;
    }

    isAnalyzing.value = true;
    error.value = '';
    analysisResults.value = null;

    try {
      // Correctly cast selectedService.value to the type expected by createService
      const service = LLMServiceFactory.createService(selectedService.value as 'mock' | 'gemini' | 'openai');
      const result = await service.analyzeJobPosting(jobPosting, resume);
      analysisResults.value = result;

      const savedAnalysis = await StorageService.saveAnalysis(result, jobPosting, resume);
      currentAnalysisId.value = savedAnalysis.id;
      await loadAnalyses({ syncRouteAnalysis: false });

      // Navigate to the analysis page with the new ID
      router.push(`/analyze/${savedAnalysis.id}`);

    } catch (err) {
      console.error('Error during analysis:', err);
      error.value = err instanceof Error ? err.message : 'Failed to analyze. Please try again.';
    } finally {
      isAnalyzing.value = false;
    }
  };

  const clearResults = () => {
    analysisResults.value = null;
    currentAnalysisId.value = null;
    // Do not clear jobPosting.title here as it might be useful
  };

  const clearFormFields = () => {
    jobPosting.title = '';
    jobPosting.content = '';
    resume.content = '';
    errors.jobPosting = '';
    errors.jobPostingFile = '';
    errors.resume = '';
    errors.resumeFile = '';
    error.value = '';
    analysisResults.value = null;
    currentAnalysisId.value = null;
    selectedResumeId.value = null;
    // Reset file input visual states if possible (might need direct component refs or events)
    // This is a placeholder for clearing file inputs, actual implementation depends on FileUpload component
    const jobFileInput = document.getElementById('job-file-upload') as HTMLInputElement;
    if (jobFileInput) jobFileInput.value = '';
    const resumeFileInput = document.getElementById('resume-file-upload') as HTMLInputElement;
    if (resumeFileInput) resumeFileInput.value = '';

    // Collapse all input containers
    jobPostingContainer.value?.collapse();
    resumeContainer.value?.collapse();
    settingsContainer.value?.collapse();
  };

  const loadSavedAnalysis = async (analysis?: SavedAnalysis) => {
    if (!analysis) {
      error.value = 'Analysis not found.';
      return;
    }

    const jobContent = analysis.jobPosting?.content ?? '';
    const resumeContent = analysis.resume?.content ?? '';
    const hasJobContent = jobContent.trim().length > 0;
    const hasResumeContent = resumeContent.trim().length > 0;

    if (!hasJobContent && !hasResumeContent) {
      const message = 'This saved analysis is missing the original job posting and resume data.';
      console.warn('useAnalysis.loadSavedAnalysis: No payload available for analysis', analysis.id);
      error.value = message;
      return;
    }

    if (!hasJobContent || !hasResumeContent) {
      console.warn('useAnalysis.loadSavedAnalysis: Partial payload for analysis', analysis.id, {
        missingJobPosting: !hasJobContent,
        missingResume: !hasResumeContent,
      });
      error.value = !hasJobContent
        ? 'Job posting text is missing for this saved analysis. The form has been partially restored.'
        : 'Resume text is missing for this saved analysis. The form has been partially restored.';
    } else {
      error.value = '';
    }

    jobPosting.title = analysis.jobTitle || analysis.jobPosting?.title || '';
    jobPosting.content = jobContent;
    resume.content = resumeContent;
    analysisResults.value = {
      matches: analysis.matches,
      maybes: analysis.maybes,
      gaps: analysis.gaps,
      suggestions: analysis.suggestions,
      timestamp: analysis.timestamp,
    };
    currentAnalysisId.value = analysis.id;
    selectedService.value = getStoredService() ?? FALLBACK_SERVICE;

    jobPostingContainer.value?.expand();
    resumeContainer.value?.expand();
    settingsContainer.value?.expand();
    await nextTick();
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    if (route.path !== `/analyze/${analysis.id}`) {
      router.push(`/analyze/${analysis.id}`);
    }
  };

  const deleteSavedAnalysis = async (id: string) => {
    await StorageService.deleteAnalysis(id);
    await loadAnalyses({ syncRouteAnalysis: false });
    if (currentAnalysisId.value === id) {
      clearResults(); // Clear current results if they were from the deleted analysis
      router.push('/analyze'); // Navigate to base analyze page
    }
  };

  const loadAnalyses = async (options: { syncRouteAnalysis?: boolean } = {}) => {
    const { syncRouteAnalysis = true } = options;

    try {
      const analyses = await StorageService.getAnalyses();
      const { sanitizedAnalyses, missingPayloadCount } = prepareAnalyses(analyses);
      savedAnalyses.value = sanitizedAnalyses;
      error.value = '';

      if (missingPayloadCount) {
        console.warn(
          `useAnalysis: ${missingPayloadCount} saved analyses are missing original job postings or resumes.`,
        );
      }

      if (syncRouteAnalysis) {
        const analysisIdFromRoute = getAnalysisId(route);
        if (analysisIdFromRoute) {
          await loadAnalysisById(analysisIdFromRoute);
        }
      }
    } catch (err) {
      console.error('Failed to load analyses:', err);
      savedAnalyses.value = [];
      error.value = 'Unable to load saved analyses. Please try again later.';
    }
  };

  const loadAnalysisById = async (id: string | null, options: { reloadIfMissing?: boolean } = {}) => {
    if (!id) {
      return;
    }

    const analysis = savedAnalyses.value.find(item => item.id === id);
    if (analysis) {
      await loadSavedAnalysis(analysis);
      return;
    }

    if (options.reloadIfMissing) {
      await loadAnalyses({ syncRouteAnalysis: false });
      const refreshedAnalysis = savedAnalyses.value.find(item => item.id === id);
      if (refreshedAnalysis) {
        await loadSavedAnalysis(refreshedAnalysis);
      } else {
        console.warn('useAnalysis.loadAnalysisById: Analysis not found after refresh', id);
      }
    }
  };

  onMounted(async () => {
    selectedService.value = getStoredService() ?? FALLBACK_SERVICE;
    await loadAnalyses();
    await loadResumes();
  });

  // Watch for route changes to load analysis if ID is present
  watch(() => route.params.id, async (newId) => {
    const id = Array.isArray(newId) ? newId[0] : newId;
    await loadAnalysisById(id ?? null, { reloadIfMissing: true });
  });

  watch(() => route.query.analysisId, async (newId) => {
    const id = Array.isArray(newId) ? newId[0] : newId;
    await loadAnalysisById(id ?? null, { reloadIfMissing: true });
  });

  function getAnalysisId(currentRoute: typeof route): string | null {
    let id: string | null = null;
    if (currentRoute.params.id) {
      id = Array.isArray(currentRoute.params.id) ? currentRoute.params.id[0] : currentRoute.params.id;
    }
    // The query.analysisId was from a previous version, params.id is the current way
    // else if (currentRoute.query.analysisId) {
    //   id = Array.isArray(currentRoute.query.analysisId) ? currentRoute.query.analysisId[0] : currentRoute.query.analysisId;
    // }
    return id;
  }

  function prepareAnalyses(analyses: SavedAnalysis[]): { sanitizedAnalyses: SavedAnalysis[]; missingPayloadCount: number } {
    if (!Array.isArray(analyses) || !analyses.length) {
      return { sanitizedAnalyses: [], missingPayloadCount: 0 };
    }

    let missingPayloadCount = 0;

    const sanitizedAnalyses = analyses.reduce<SavedAnalysis[]>((acc, analysis) => {
      if (!analysis?.id) {
        return acc;
      }

      const jobTitle = analysis.jobPosting?.title ?? analysis.jobTitle ?? '';
      const jobContent = analysis.jobPosting?.content ?? '';
      const resumeContent = analysis.resume?.content ?? analysis.resumeSnippet ?? '';
      const hasJobContent = jobContent.trim().length > 0;
      const hasResumeContent = resumeContent.trim().length > 0;

      if (!hasJobContent || !hasResumeContent) {
        missingPayloadCount += 1;
      }

      acc.push({
        ...analysis,
        jobPosting: {
          title: jobTitle,
          content: jobContent,
        },
        resume: {
          content: resumeContent,
        },
      });

      return acc;
    }, []);

    return { sanitizedAnalyses, missingPayloadCount };
  }

  return {
    jobPosting,
    resume,
    errors,
    isAnalyzing,
    error,
    analysisResults,
    savedAnalyses,
    savedResumes,
    selectedService,
    currentAnalysisId,
    selectedResumeId,
    showResumeNameDialog,
    jobPostingContainer,
    resumeContainer,
    settingsContainer,
    handleJobFileUpload,
    handleResumeFileUpload,
    handleResumeSelect,
    saveResume,
    handleResumeNameSave,
    deleteResume,
    validateField,
    validateAndAnalyze,
    clearResults,
    clearFormFields,
    loadSavedAnalysis,
    deleteSavedAnalysis,
    loadAnalyses,
    loadAnalysisById,
    getAnalysisId,
  };
}
