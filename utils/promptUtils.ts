import type { JobPosting, Resume } from '../types';

/**
 * Template for analyzing job postings against resumes
 */
export const createAnalysisPrompt = (jobPosting: JobPosting, resume: Resume): string => {
  return `
Please analyze the following job posting and resume to identify matches, gaps, and provide suggestions. Compare the hard and soft skills listed in both documents. Identify both direct keyword matches and instances where my resume describes a skill or experience required in the job posting but uses different terminology. Present the findings in a clear format, similar to a job scan match report, highlighting the matching skills and potential matches with different phrasing for ATS consideration.


JOB POSTING ${jobPosting.title ? `(${jobPosting.title})` : ''}:
---
${jobPosting.content}
---

RESUME:
---
${resume.content}
---

Please provide your response in the following format:

1. Skills and qualifications that match between the job posting and resume.
- List each matching skill or qualification as a bullet point
- Be specific about the exact skills that match

2. Skills and qualifications mentioned in the job posting but missing from the resume.
- List each missing skill or qualification as a bullet point
- Be specific about what requirements are not covered by the resume

3. Specific suggestions to improve the resume for this job posting.
- Provide actionable suggestions to enhance the resume
- Include recommendations for highlighting existing skills or adding missing ones
  `;
};
