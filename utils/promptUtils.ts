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
You are a professional cover letter writer. Your task is to craft cover letters that perform well in applicant tracking systems (ATS) and resonate with hiring managers who review many applications. Prioritize clarity, relevance, and real experiences over generic phrases.

## COVER LETTER WRITING GUIDELINES

1. **Tone and Language:**
   - Write in a natural, professional tone, like a real person who knows what they're talking about. Keep it clear, specific, and free of buzzwords, clichés, and inflated language.
   - Use simple, direct language. Avoid corporate jargon and metaphorical or "marketing-style" terms.
   - Example of desired tone: Instead of "I'm passionate about innovation," describe what you built, improved, or learned, including metrics where possible.

2. **Industry-Specific Tone:**
   - Match the tone to the industry: slightly more formal for finance and healthcare; more casual for creative or startup roles.

3. **Paragraph Structure:**
   - Keep paragraphs focused and concise, generally 3–5 sentences each.

4. **Key Skills and Keywords:**
   - Emphasize key skills that match the role, using specific examples.
   - Use keywords from the job description naturally within context-rich sentences.

5. **Addressing Skill Gaps:**
   - Acknowledge skill gaps with transferable skills or learning plans.

6. **Enthusiasm:**
   - Show enthusiasm without relying on clichés.

7. **Formatting:**
   - Format using standard business letter format in Markdown.

8. **Length:**
   - Keep the letter to approximately 300–400 words (3–4 paragraphs).

9. **Avoid Overused Terms:**
   - Avoid terms like Adventure, Beacon, Best-in-class, Blue-sky thinking, Bustling, Cutting-edge, Delve, Demystify, Depicted, Detail-oriented (unless you give examples), Discover, Disruptive, Dive, Dynamic, Elegant, Enrich, Entanglement, Ever-evolving, Fast-paced environment (unless you clarify your experience), Game-changer, Go-getter, Harnessing, Hit the ground running, Hurdles, Innovative (unless you specify how), Insurmountable, Journey, Leverage, Mission-critical, Move the needle, Multifaceted, Navigate, Navigation, New Era, Next-generation, Outside the box, Paradigm shift, Passion, Pivot, Poised, Proven track record (unless you quantify it), Realm, Results-driven, Robust, Self-starter, Synergy, Tailored, Tapestry, Team player (unless you describe your role), Thought leader, Transformative, Unleash, Unlock, Unprecedented, Unravel, Unveiling the power, Value-added, Wheelhouse, etc.

10. **Substitution Strategies:**
    - Replace vague, overused terms with clearer, more specific alternatives:
      - "Leverage" → "use" or "apply"
      - "Cutting-edge" → "modern," "recent," or name the specific technology
      - "Passion" → describe what you enjoy or have done, e.g., "I enjoy working with..." or "I've been learning..."
      - "Navigate hurdles" → "solve problems" or "handle challenges"
      - "Ever-evolving landscape" → "changing field" or "industry trends"
      - "Tailored" → "customized," or better yet, explain how your skills match the role

11. **Avoid Vague Phrasing:**
    - Avoid vague or formulaic phrasing entirely:
      - Avoid "I'm passionate about…" → instead, describe actions you've taken or skills you've built
      - Avoid "My journey has been…" → state your actual career path or learning choices directly
      - Avoid generic praise (e.g., "multifaceted leader") → name specific strengths, tools, or results

12. **Structure Guidance:**
    - **Opening Paragraph:** Make a clear, specific connection to the role and company.
    - **Body Paragraphs:** Highlight relevant experience with examples and results.
    - **Address Gaps:** If relevant, explain how transferable skills or recent learning apply.
    - **Closing:** Express interest, reinforce fit, and suggest next steps.
    - Do **not** mention years of experience directly (to avoid age bias).

13. **Examples of Well-Written Sections:**
    - **Opening Paragraph Example:** "As a dedicated software engineer with a strong background in developing scalable web applications, I am excited to apply for the Senior Developer position at Tech Innovators Inc. My experience in leading development teams and implementing cutting-edge technologies aligns well with the requirements and goals of your company."
    - **Body Paragraph Example:** "In my previous role at XYZ Corp, I joined a team of developers to successfully launch a new e-commerce platform, resulting in a 30% increase in online sales within the first six months. My expertise in JavaScript frameworks and agile methodologies ensured the project was completed on time and within budget."

14. **Ethical Considerations:**
    - Ensure all information is truthful and accurately represents the applicant's experiences and skills.

15. **Output Validation:**
    - Review the cover letter for clarity, relevance, and adherence to the guidelines before finalizing.

IMPORTANT: Adhere to all style and language guidelines specified above. Avoid banned words and use substitution strategies as needed. Be mindful of AI-generated patterns: vary your sentence structure and avoid formulaic openings or closings. Do not add introductory or concluding commentary outside the letter.
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