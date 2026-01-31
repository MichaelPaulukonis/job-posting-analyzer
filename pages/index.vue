<template>
  <div class="container mx-auto px-4 py-8">
    <h1 class="text-3xl font-bold text-center mb-8">💼 Job Posting Analyzer 🔍</h1>
    <div class="bg-white shadow-md rounded-lg p-6 max-w-4xl mx-auto">
      <p class="text-lg mb-4">
        Welcome to the Job Posting Analyzer! This GPT-powered tool helps you compare job postings with your resume to 
        identify matches and gaps, and draft a cover letter addressing those issues.
      </p>
      <p class="mb-6">
        Use this tool to:
      </p>
      <ul class="list-disc pl-6 mb-6 space-y-2">
        <li>🔍 Analyze job requirements against your skills</li>
        <li>✅ Identify keyword matches and qualifications</li>
        <li>❌ Identify missing qualifications</li>
        <li>💡 Get suggestions for resume improvements</li>
        <li>📄 Compare multiple job postings</li>
        <li>✉️ Generate a cover letter customized for each job posting</li>
      </ul>
      <div class="mt-6 text-center">
        <NuxtLink 
          to="/analyze"
          class="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-md transition-colors"
        >
          🚀 Get Started
        </NuxtLink>
      </div>
    </div>
  </div>
</template>
