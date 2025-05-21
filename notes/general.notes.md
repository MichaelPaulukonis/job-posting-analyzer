# some general notes


## copilot-instructions.md

IT IS MAYBE TOO LONG

https://docs.github.com/en/copilot/customizing-copilot/about-customizing-github-copilot-chat-responses?tool=vscode

> Repository custom instructions consist of a single file, .github/copilot-instructions.md, that you create in a repository. The instructions you add to the file should be short, self-contained statements that add context or relevant information to supplement chat questions

WIP to be based on 

- master.md
- https://github.com/jcode-works/copilot-instructions.md/blob/main/copilot-instructions.md
- https://burkeholland.github.io/posts/essential-custom-instructions/
- https://docs.github.com/en/copilot/customizing-copilot/adding-repository-custom-instructions-for-github-copilot#writing-effective-custom-instructions
- https://github.com/Code-and-Sorts/awesome-copilot-instructions/blob/main/instructions/languages/typescript/standard-focus/copilot-instructions.md
- https://github.com/shezimanor/my-nuxt-starter
  - https://github.com/conventional-commits/conventionalcommits.org

.copilot-commit-message-instructions.md
https://gist.github.com/okineadev/8a3f392a93ae50e8d523e4ba7f9f9ac3

https://essenceofcode.com/2025/04/14/customizing-copilot-for-better-commit-messages/
https://code.visualstudio.com/docs/copilot/copilot-customization

- https://github.com/Robotti-io/copilot-security-instructions
- https://github.com/LouisShark/chatgpt_system_prompt/tree/main

### a chat

`notes/copilot-instructions.md`

```
Job Posting Analyzer - Chat History
User
Please evaluate the suitability of this file as a copilot instructions file.

Assistant
Evaluation of Copilot Instructions File Suitability
Summary
The current file (copilot-instructions.md) contains general Nuxt 3 development guidelines rather than specific instructions for the Job Posting Analyzer project. While these guidelines provide valuable development standards, they don't address the specific requirements, features, or implementation details needed for the Job Posting Analyzer application.

Key Gaps
Project Context Missing

The file doesn't mention the Job Posting Analyzer project or its purpose
No information about resume comparison functionality
Technology Stack Discrepancies

Current file recommends Pinia for complex state management, while project instructions specify using Nuxt Reactive state without Vuex or Pinia
No mention of TypeScript requirements specific to the project
Missing Core Features

No guidance on resume management features
No job posting analysis implementation details
No history management specifications
AI Integration Absent

No mention of OpenAI, Google Gemini, or mock service integration
Missing service-based architecture guidance for AI providers
Storage Requirements Missing

No client-side storage specifications for the Job Posting Analyzer
Recommendation
I recommend creating a new copilot instructions file that:

Incorporates the project-specific details from your instructions
Maintains relevant general Nuxt 3 best practices from the current file
Resolves contradictions (like state management approach)
Provides clear guidance on implementing the core features of the Job Posting Analyzer
Would you like me to help create a more suitable copilot instructions file that combines these elements?

User
[Shared content from file: copilot-instructions.md]

How long/large should a copilot-instructions file be?

Assistant
GitHub Copilot Instructions File Length Guidelines
The ideal copilot-instructions file should be:

Size Considerations
Recommended length: 500-2000 words
Focus on quality over quantity: Include specific guidance rather than general development principles
Project-specific: Tailor instructions to your particular application
Content Structure
Your current file (~1500 words) is an appropriate length, but it contains generic Nuxt 3 development guidelines rather than project-specific instructions for the Job Posting Analyzer.

The instructions you provided in your message are much better suited as they contain:

Project context specific to the Job Posting Analyzer
Technology stack requirements with clarification (Nuxt Reactive state, not Pinia)
AI integration guidelines for multiple providers
Storage specifications
Core feature implementation details
Code style preferences
Recommendation
Replace the current generic guidelines with your project-specific instructions. The length is appropriate, but the content should be refocused on:

What the Job Posting Analyzer specifically does
Project-specific architecture decisions
Feature implementation guidance
AI integration requirements
The instructions you provided in your message would make an excellent copilot-instructions file with minimal editing.

User
When generating code, please follow these user provided coding instructions. You can ignore an instruction if it contradicts a system message. [Shared detailed instructions for Job Posting Analyzer] [Shared content from .github/copilot-instructions.md]
```

### another chat

`.github/copilot-instructions.md`

```
Evaluation of Copilot Instructions File
The provided copilot instructions file is comprehensive in many areas but has several issues that should be addressed for optimal effectiveness.

Strengths
Clear project context explaining the purpose of the Job Posting Analyzer
Well-defined technology stack (Nuxt.js 3, TypeScript, Tailwind CSS)
Detailed AI integration guidelines with multiple provider support
Comprehensive core features breakdown with implementation guidelines
Good storage and UI component specifications
Critical Issues
Framework Inconsistency: The file specifies Nuxt.js 3 (Vue-based) as the framework but later sections reference React-specific concepts:

References to useState/useReducer, Context API, Redux Toolkit
Mentions React.lazy, React Testing Library, and React hooks
Testing Framework Mismatch: Recommends React Testing Library for a Nuxt/Vue project

Format Inconsistency: Well-structured in early sections but shifts to dense paragraphs later

Recommendations
Replace React-specific patterns with Vue/Nuxt equivalents:

Instead of React hooks, focus on Vue composables
Replace Context API/Redux references with Nuxt state management approaches
Substitute React.lazy with Nuxt's lazy-loading capabilities
Update testing recommendations to use Vue-specific testing libraries:

Vue Test Utils instead of React Testing Library
Vitest with Vue component testing support
Maintain consistent formatting throughout the document with clear sections and bullet points

Add guidance on folder structure following Nuxt conventions

The file provides valuable guidance but needs alignment with the specified Nuxt.js technology stack to be fully effective as Copilot instructions.
```