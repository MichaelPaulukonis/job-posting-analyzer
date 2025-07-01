import type { JobPosting, Resume, SavedAnalysis } from '../types';

/**
 * Template for analyzing job postings against resumes
 * TODO: optimize for applicant tracking system
 */
export const createAnalysisPrompt = (jobPosting: JobPosting, resume: Resume): string => {
  return `
Please analyze the following job posting and resume to identify matches, gaps, and provide suggestions. Compare the hard and soft skills listed in both documents. Identify both direct keyword matches and instances where my resume describes a skill or experience required in the job posting but uses different terminology.

JOB POSTING ${jobPosting.title ? `(${jobPosting.title})` : ''}:
###
${jobPosting.content}
###

RESUME:
###
${resume.content}
###

Please provide your response in the following 4-part plaintext format:

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

Please ensure your response strictly follows the 4-part format above. Do not include any additional text or explanations outside of the specified format. 
If you cannot find any matches, gaps, or suggestions, please return empty lists for each section.
`;
};

// System instructions that remain consistent across all cover letter generations
const systemInstructionLetter = `
You are a professional cover letter writer. When generating cover letters:

COVER LETTER WRITING GUIDELINES:
1. Use simple, direct language - avoid corporate jargon and flowery phrases
2. Be specific rather than general - include concrete examples and metrics where possible
3. Match tone to the industry (slightly more formal for finance, more casual for creative fields)
4. Keep paragraphs focused and concise
5. Address the most important matching skills with specific examples
6. Acknowledge skill gaps with transferable skills or learning plans
7. Show enthusiasm without using clichéd language
8. Format in standard business letter format with Markdown
9. Keep it around 300-400 words (3-4 paragraphs)

AVOID THESE OVERUSED TERMS:
Adventure, Beacon, Bustling, Cutting-edge, Delve, Demistify, Depicted, Discover, Dive, Elegant, Enrich, Entanglement, Ever-evolving, Harnessing, Hurdles, Insurmountable, Journey, Leverage, Multifaceted, Navigate, Navigation, New Era, Passion, Pivot, Poised, Realm, Tailored, Tapestry, Unleash, Unlock, Unprecedented, Unravel, Unveiling the power

SUBSTITUTION STRATEGIES:
- Replace "passionate about" with specific interest statements
- Replace vague descriptors with specific technologies or methods
- Instead of "journey," describe the actual progression
- Replace "cutting-edge" with the specific innovation
- Instead of "challenges," name the actual problems solved

STRUCTURE GUIDANCE:
- Open with a clear connection to the role and company
- Middle paragraphs: highlight matching experience with examples
- Address skill gaps with transferable skills
- Closing: express interest and suggest next steps
- No specific years of experience to avoid age discrimination
- Do not include any commentary before or after the letter - only the letter should be provided
`;

/**
 * Template for generating a cover letter based on analysis results
 */
export const createCoverLetterPrompt = (
  analysis: SavedAnalysis, 
  sampleLetter?: string,
  instructions?: string,
  referenceContent?: string
): { systemInstruction: string; userPrompt: string; } => {
  const { jobPosting, resume, matches, maybes, gaps } = analysis;
  
  let prompt = `
Generate a AST-friendly professional cover letter for the following job application. The cover letter should be personalized based on the analysis results of the resume against the job posting.

JOB POSTING ${jobPosting.title ? `(${jobPosting.title})` : ''}:
###
${jobPosting.content}
###

RESUME:
###
${resume.content}
###

ANALYSIS RESULTS:
1. Matching Skills and Qualifications:
${matches.map(match => `- ${match}`).join('\n')}

2. Potential Skill Matches (different terminology):
${maybes?.map(maybe => `- ${maybe}`).join('\n')}

3. Missing Skills and Qualifications (skill gaps):
${gaps.map(gap => `- ${gap}`).join('\n')}
`;

  // If there are specific instructions for regeneration, add them
  if (instructions) {
    prompt += `
SPECIFIC INSTRUCTIONS FOR THIS VERSION:
###
${instructions}
###
`;
  }

  // If a reference content is provided (e.g., manually edited version), use it as a reference
  if (referenceContent) {
    prompt += `
REFERENCE VERSION (please maintain any good edits while incorporating the changes requested):
###
${referenceContent}
###
`;
  }

  // If a sample letter is provided, use it as a style reference
  if (sampleLetter) {
    prompt += `
MY SAMPLE COVER LETTER (please use a similar tone and style and use any relevant content from this letter):
###
${sampleLetter}
###
`;
  }
  
  return { systemInstruction: systemInstructionLetter, userPrompt: prompt };
};