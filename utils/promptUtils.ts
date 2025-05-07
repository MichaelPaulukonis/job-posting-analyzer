import type { JobPosting, Resume, SavedAnalysis } from '../types';

/**
 * Template for analyzing job postings against resumes
 */
export const createAnalysisPrompt = (jobPosting: JobPosting, resume: Resume): string => {
  return `
Please analyze the following job posting and resume to identify matches, gaps, and provide suggestions. Compare the hard and soft skills listed in both documents. Identify both direct keyword matches and instances where my resume describes a skill or experience required in the job posting but uses different terminology.

Please provide your response in the following plaintext format:

1. Skills and qualifications that match between the job posting and resume.
- List each matching skill or qualification as a bullet point
- Be specific about the exact skills that match

2. Skills and qualifications that are potential matches but use different terminology.
- List each potentially matching skill or qualification as a bullet point
- Be specific about the exact terminoligy used in the resume and how it relates to the job posting

3. Skills and qualifications mentioned in the job posting but missing from the resume.
- List each missing skill or qualification as a bullet point
- Be specific about what requirements are not covered by the resume

4. Specific suggestions to improve the resume for this job posting.
- Provide actionable suggestions to enhance the resume
- Include recommendations for highlighting existing skills or adding missing ones

Please ensure your response strictly follows the format above. Do not include any additional text or explanations outside of the specified format. 
If you cannot find any matches, gaps, or suggestions, please return empty lists for each section.

JOB POSTING ${jobPosting.title ? `(${jobPosting.title})` : ''}:
---
${jobPosting.content}
---

RESUME:
---
${resume.content}
---`;
};

/**
 * Template for generating a cover letter based on analysis results
 */
export const createCoverLetterPrompt = (
  analysis: SavedAnalysis, 
  sampleLetter?: string,
  instructions?: string,
  referenceContent?: string
): string => {
  const { jobPosting, resume, matches, maybes, gaps } = analysis;
  
  let prompt = `
Generate a professional cover letter for the following job application. The cover letter should be personalized based on the analysis results of my resume against the job posting.

JOB POSTING ${jobPosting.title ? `(${jobPosting.title})` : ''}:
---
${jobPosting.content}
---

MY RESUME:
---
${resume.content}
---

ANALYSIS RESULTS:
1. Matching Skills and Qualifications:
${matches.map(match => `- ${match}`).join('\n')}

2. Potential Skill Matches (different terminology):
${maybes?.map(maybe => `- ${maybe}`).join('\n')}

3. Missing Skills and Qualifications (skill gaps):
${gaps.map(gap => `- ${gap}`).join('\n')}

REQUIREMENTS FOR THE COVER LETTER:
1. Address the most important matching skills and qualifications
2. Acknowledge the skill gaps and explain how I plan to address them or relevant transferable skills I have
3. Address ability to adapt to new domains despite limited direct experience
4. Use simple, direct language - avoid corporate jargon and flowery phrases
5. Do not mention specific years of experience to avoid potential age discrimination
6. Show enthusiasm for the role and company
7. Keep the letter professional, concise, and focused on how I can provide value to the company
8. Include a strong opening and closing paragraph
9. Make it around 300-400 words (3-4 paragraphs)

The tone should be professional but non-dramatic and straightforward, avoiding buzzwords like 'meaningful impact' or 'cross-functional improvement efforts' (unless used in the job posting).
Format the letter in Markdown with appropriate structure and spacing.
The letter should be in standard business letter format without the address blocks. 
`;

  // If there are specific instructions for regeneration, add them
  if (instructions) {
    prompt += `
SPECIFIC INSTRUCTIONS FOR THIS VERSION:
---
${instructions}
---
`;
  }

  // If a reference content is provided (e.g., manually edited version), use it as a reference
  if (referenceContent) {
    prompt += `
REFERENCE VERSION (please maintain any good edits while incorporating the changes requested):
---
${referenceContent}
---
`;
  }

  // If a sample letter is provided, use it as a style reference
  if (sampleLetter) {
    prompt += `
MY SAMPLE COVER LETTER (please use a similar tone and style and use any relevant content from this letter):
---
${sampleLetter}
---
`;
  }
  
  return prompt;
};
