import { ref, reactive, onMounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import type { JobPosting, Resume, AnalysisResult, SavedAnalysis, ResumeEntry, ServiceName } from '../types';
import { StorageService } from '../services/StorageService';
import { LLMServiceFactory } from '~/services/LLMServiceFactory';
import { nextTick } from 'vue';

const SELECTED_SERVICE_STORAGE_KEY = 'selected-llm-service';

export function useAnalysis() {
  const jobPosting = reactive<JobPosting>({ title: '', content: '' });
  const resume = reactive<Resume>({ content: '' });
  const errors = reactive({ jobPosting: '', jobPostingFile: '', resume: '', resumeFile: '' });
  const isAnalyzing = ref(false);
  const error = ref('');
  const analysisResults = ref<AnalysisResult | null>(null);
  const savedAnalyses = ref<SavedAnalysis[]>([]);
  const selectedService = ref<ServiceName>(getDefaultService());
  const currentAnalysisId = ref<string | null>(null);
  const selectedResumeId = ref<string | null>(null);
  const showResumeNameDialog = ref(false);

  // Refs for InputContainer components
  const jobPostingContainer = ref<any>(null); // Use 'any' or a more specific type if available
  const resumeContainer = ref<any>(null);
  const settingsContainer = ref<any>(null);

  const router = useRouter();
  const route = useRoute();

  function getDefaultService(): ServiceName {
    if (typeof window !== 'undefined') {
      const storedService = localStorage.getItem(SELECTED_SERVICE_STORAGE_KEY);
      if (storedService && ['gemini', 'anthropic', 'openai', 'mock'].includes(storedService)) {
        return storedService as ServiceName;
      }
    }
    return 'gemini';
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
      // Potentially refresh resume list if displayed elsewhere
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
      savedAnalyses.value = await StorageService.getAnalyses(); // Refresh history

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

  const loadSavedAnalysis = async (analysis: SavedAnalysis) => {
    jobPosting.title = analysis.jobTitle || '';
    jobPosting.content = analysis.jobPosting.content;
    resume.content = analysis.resume.content;
    analysisResults.value = {
      matches: analysis.matches,
      maybes: analysis.maybes,
      gaps: analysis.gaps,
      suggestions: analysis.suggestions,
      timestamp: analysis.timestamp,
    };
    currentAnalysisId.value = analysis.id;
    selectedService.value = getDefaultService(); // Or load service used for that analysis if stored with it

    // Expand containers and scroll to top or results
    jobPostingContainer.value?.expand();
    resumeContainer.value?.expand();
    settingsContainer.value?.expand();
    await nextTick();
    window && window.scrollTo({ top: 0, behavior: 'smooth' });

    // TODO: uh..... we're not scrolling to the results

    // Update router to reflect loaded analysis without triggering full navigation if already on /analyze/[id]
    // Or if on /analyze, navigate to /analyze/[id]
    if (route.path !== `/analyze/${analysis.id}`) {
        router.push(`/analyze/${analysis.id}`);
    }
  };

  const deleteSavedAnalysis = async (id: string) => {
    await StorageService.deleteAnalysis(id);
    savedAnalyses.value = await StorageService.getAnalyses();
    if (currentAnalysisId.value === id) {
      clearResults(); // Clear current results if they were from the deleted analysis
      router.push('/analyze'); // Navigate to base analyze page
    }
  };

  const loadAnalyses = async () => {
    savedAnalyses.value = await StorageService.getAnalyses();
    const analysisIdFromRoute = getAnalysisId(route);
    if (analysisIdFromRoute) {
      const current = savedAnalyses.value.find(a => a.id === analysisIdFromRoute);
      if (current) {
        await loadSavedAnalysis(current);
      }
    }
  };

  onMounted(async () => {
    selectedService.value = getDefaultService();
    await loadAnalyses();
  });

  // Watch for route changes to load analysis if ID is present
  watch(() => route.params.id, async (newId) => {
    await loadAnalyses();
  }, { immediate: true });

  watch(() => route.query.analysisId, async (newId) => {
    await loadAnalyses();
  }, { immediate: true });

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

  return {
    jobPosting,
    resume,
    errors,
    isAnalyzing,
    error,
    analysisResults,
    savedAnalyses,
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
    validateField,
    validateAndAnalyze,
    clearResults,
    clearFormFields,
    loadSavedAnalysis,
    deleteSavedAnalysis,
    loadAnalyses,
    getAnalysisId,
  };
}
