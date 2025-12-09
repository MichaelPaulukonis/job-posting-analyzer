# Gemini Context

This file provides context for the Gemini CLI.

For project-specific instructions, coding standards, and architectural guidelines, please refer to the single source of truth:

[.github/copilot-instructions.md](../.github/copilot-instructions.md)

All instructions applicable to GitHub Copilot in this project should also be followed by Gemini.

## Mitigating High Token Usage

High token usage can be a result of large tool outputs and a long, iterative debugging process. To mitigate this, we can try the following:

*   **More Targeted Testing:** Instead of running the entire test suite, we can run only the specific test file that is being worked on. This significantly reduces the size of the test output.
*   **Redirecting Output:** For commands that produce a lot of output, we can redirect the output to a file and then use other tools to inspect only the relevant parts of the file.
