import { ref, reactive, watch } from 'vue'
import type { JobPosting, Resume, AnalysisResult, SavedAnalysis } from '../types'
import { StorageService } from '../services/StorageService'
import { AnalysisService } from '../services/AnalysisService'
import { useRouter, useRoute } from 'vue-router'

export function useAnalysis() {
  // State
  const router = useRouter()
  const route = useRoute()
  const jobPosting = reactive<JobPosting>({
    title: '',
    content: ''
  })

  const resume = reactive<Resume>({
    content: ''
  })

  const errors = reactive({
    jobPosting: '',
    jobPostingFile: '',
    resume: '',
    resumeFile: ''
  })

  const isAnalyzing = ref(false)
  const error = ref('')
  const analysisResults = ref<AnalysisResult | null>(null)
  const savedAnalyses = ref<SavedAnalysis[]>([])
  const selectedService = ref<'mock' | 'gemini' | 'openai'>('gemini')
  const currentAnalysisId = ref<string | undefined>(undefined)
  const selectedResumeId = ref('')
  const showResumeNameDialog = ref(false)

  // Container refs for UI interactions
  const jobPostingContainer = ref(null)
  const resumeContainer = ref(null)
  const settingsContainer = ref(null)

  // Methods
  const handleJobFileUpload = ({ content }: { content: string }) => {
    jobPosting.content = content
    errors.jobPosting = ''
    errors.jobPostingFile = ''
  }

  const handleResumeFileUpload = ({ content }: { content: string }) => {
    resume.content = content
    errors.resume = ''
    errors.resumeFile = ''
  }

  const handleResumeSelect = (selectedResume: { content: string }) => {
    resume.content = selectedResume.content
    errors.resume = ''
  }

  const saveResume = async () => {
    if (!resume.content || resume.content.trim().length < 10) {
      errors.resume = 'Please enter a valid resume with sufficient information'
      return
    }

    showResumeNameDialog.value = true
  }

  const handleResumeNameSave = async (name: string) => {
    try {
      await StorageService.saveResume(resume, name)
      // Refresh the resume selector
      const resumeSelector = document.querySelector('resume-selector')
      if (resumeSelector) {
        (resumeSelector as any).refresh()
      }
    } catch (err) {
      console.error('Error saving resume:', err)
      error.value = err instanceof Error ? err.message : 'Failed to save resume'
    }
  }

  const validateField = (field: 'jobPosting' | 'resume') => {
    if (field === 'jobPosting') {
      if (!jobPosting.content || jobPosting.content.trim().length < 10) {
        errors.jobPosting = 'Please enter a valid job posting with sufficient information'
      } else {
        errors.jobPosting = ''
      }
    } else if (field === 'resume') {
      if (!resume.content || resume.content.trim().length < 10) {
        errors.resume = 'Please enter a valid resume with sufficient information'
      } else {
        errors.resume = ''
      }
    }
  }

  const validateAndAnalyze = async () => {
    // Reset errors and results
    errors.jobPosting = ''
    errors.resume = ''
    error.value = ''
    let isValid = true

    // Validate job posting
    if (!jobPosting.content || jobPosting.content.trim().length < 10) {
      errors.jobPosting = 'Please enter a valid job posting with sufficient information'
      isValid = false
    }

    // Validate resume
    if (!resume.content || resume.content.trim().length < 10) {
      errors.resume = 'Please enter a valid resume with sufficient information'
      isValid = false
    }

    if (isValid) {
      // Proceed with analysis
      isAnalyzing.value = true
      try {
        // Check if service is available
        const isAvailable = await AnalysisService.isServiceAvailable(selectedService.value)
        if (!isAvailable) {
          const serviceName = AnalysisService.getServiceName(selectedService.value)
          throw new Error(`${serviceName} is currently unavailable. Please check your API key or try the mock service.`)
        }

        // Call the analysis service
        const results = await AnalysisService.analyzeJobPosting(
          jobPosting,
          resume,
          selectedService.value
        )

        // Save results to storage and update UI
        const savedAnalysis = await StorageService.saveAnalysis(results, jobPosting, resume)
        analysisResults.value = results
        savedAnalyses.value = await StorageService.getAnalyses()
        currentAnalysisId.value = savedAnalysis.id

        // Update the URL to include the analysis ID
        router.replace({
          path: `/analyze/${savedAnalysis.id}`,
          query: {}
        })

        // Auto-collapse input sections after results are ready
        collapseInputSections()
      } catch (err) {
        console.error('Analysis error:', err)
        error.value = err instanceof Error ? err.message : 'An unknown error occurred'
      } finally {
        isAnalyzing.value = false
      }
    }
  }

  const clearResults = () => {
    analysisResults.value = null
    currentAnalysisId.value = undefined
    // Navigate back to the base analyze page
    router.replace({
      path: '/analyze',
      query: {}
    })
    // Expand input sections when results are cleared
    expandInputSections()
  }

  const clearFormFields = () => {
    // Clear job posting data
    jobPosting.title = ''
    jobPosting.content = ''

    // Clear resume data
    resume.content = ''

    // Reset error messages
    errors.jobPosting = ''
    errors.jobPostingFile = ''
    errors.resume = ''
    errors.resumeFile = ''
    error.value = ''

    // Clear analysis results and ID
    analysisResults.value = null
    currentAnalysisId.value = undefined

    // Navigate back to the base analyze page
    router.replace({
      path: '/analyze',
      query: {}
    })

    // Expand all input sections in case they were collapsed
    expandInputSections()
  }

  const loadSavedAnalysis = (analysis: SavedAnalysis) => {
    // First, reset all fields
    jobPosting.title = ''
    jobPosting.content = ''
    resume.content = ''

    // Then populate the analysis results
    analysisResults.value = {
      matches: analysis.matches,
      maybes: analysis.maybes || [],
      gaps: analysis.gaps,
      suggestions: analysis.suggestions,
      timestamp: analysis.timestamp
    }

    // Finally, load the job posting and resume if available
    if (analysis.jobPosting) {
      jobPosting.title = analysis.jobPosting.title || ''
      jobPosting.content = analysis.jobPosting.content
    } else if (analysis.jobTitle) {
      // Fallback for older saved analyses
      jobPosting.title = analysis.jobTitle
    }

    if (analysis.resume && analysis.resume.content) {
      resume.content = analysis.resume.content
    }

    // Store the analysis ID
    currentAnalysisId.value = analysis.id

    router.replace({
      path: `/analyze/${analysis.id}`,
      query: {} // No need for query params anymore
    })

    // Auto-collapse input sections
    collapseInputSections()
  }

  const deleteSavedAnalysis = async (id: string) => {
    await StorageService.deleteAnalysis(id)
    savedAnalyses.value = await StorageService.getAnalyses()
    
    // If we just deleted the current analysis, clear the results
    if (currentAnalysisId.value === id) {
      clearResults()
    }
  }

  // Helper functions for collapsing/expanding input sections
  const collapseInputSections = () => {
    jobPostingContainer.value?.collapse()
    resumeContainer.value?.collapse()
    settingsContainer.value?.collapse()
  }

  const expandInputSections = () => {
    jobPostingContainer.value?.expand()
    resumeContainer.value?.expand()
    settingsContainer.value?.expand()
  }

  // Setup watchers for real-time validation
  watch(() => jobPosting.content, (newContent) => {
    if (newContent && newContent.trim().length >= 10) {
      errors.jobPosting = ''
    }
  })

  watch(() => resume.content, (newContent) => {
    if (newContent && newContent.trim().length >= 10) {
      errors.resume = ''
    }
  })

  // Helper to get analysis ID from route
  const getAnalysisId = () => {
    if (route.params.id) {
      return route.params.id
    }

    if (route.query.analysisId) {
      return route.query.analysisId
    }

    return null
  }

  // Load analyses initially and when route changes
  const loadAnalyses = async () => {
    savedAnalyses.value = await StorageService.getAnalyses()
    
    const analysisId = getAnalysisId()
    if (analysisId) {
      const analysis = savedAnalyses.value.find(a => a.id === analysisId)
      if (analysis) {
        loadSavedAnalysis(analysis)
      }
    }
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
    collapseInputSections,
    expandInputSections,
    loadAnalyses,
    getAnalysisId
  }
}
