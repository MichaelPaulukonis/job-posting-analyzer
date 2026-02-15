---
description: Always verify file and directory paths exist before referencing them
alwaysApply: true
---

# Path Verification Rules

## Core Principle
Never reference, assume, or hallucinate file paths without first verifying they exist in the workspace.

## Required Verification Steps

### Before Referencing Any Path
1. Use `listDirectory`, `readFile`, or `fileSearch` to confirm the path exists
2. If uncertain about a path's location, use `grepSearch` or `fileSearch` to find it
3. Never use paths from conversation history or summaries without verification

### Common Path Mistakes to Avoid
- ❌ Assuming standard directory structures exist (e.g., `docs/user-guide/`)
- ❌ Using paths from previous conversations without checking current state
- ❌ Referencing files mentioned in task descriptions without verification
- ❌ Assuming file locations based on naming conventions

### Correct Approach
```typescript
// ❌ BAD: Assuming path exists
readFile("docs/user-guide/getting-started.md")

// ✅ GOOD: Verify first
listDirectory("docs") // Check what actually exists
// Then use actual paths found
```

## Path Discovery Process

### 1. Start Broad
```bash
listDirectory(".")  # See top-level structure
listDirectory("docs", depth: 2)  # Explore subdirectories
```

### 2. Search When Uncertain
```bash
fileSearch("user-guide")  # Find files matching pattern
grepSearch("getting started")  # Find content references
```

### 3. Verify Before Use
- Always confirm path exists before reading/writing
- Check parent directories exist before creating files
- Use actual paths from tool responses, not assumptions

## Special Cases

### Task Descriptions
Task details may reference files that don't exist yet or use placeholder paths. Always verify:
- Check if referenced files actually exist
- Look for similar files that might be the actual target
- Ask user for clarification if paths are ambiguous

### Conversation Summaries
Summaries may contain outdated or incorrect paths:
- Never trust paths from summaries without verification
- Re-verify all paths at the start of each session
- Use current workspace state as source of truth

### Documentation References
Documentation may reference ideal structure, not actual structure:
- Verify documented paths exist in practice
- Check for alternative locations if documented path missing
- Update documentation if paths have changed

## Error Recovery

### When Path Doesn't Exist
1. Search for similar paths that might be correct
2. Check if parent directory exists
3. Ask user if path should be created or if different path intended
4. Never proceed with hallucinated path

### When Multiple Paths Match
1. List all matching paths for user
2. Ask user to clarify which path is correct
3. Document the chosen path for future reference

## Examples

### ✅ Good Practice
```typescript
// 1. Verify structure
const docsStructure = await listDirectory("docs", depth: 2);

// 2. Check for user documentation
const userDocs = docsStructure.filter(f => f.includes("user"));

// 3. If not found, search
if (userDocs.length === 0) {
  const searchResults = await fileSearch("user-guide");
  // Use actual results or ask user
}
```

### ❌ Bad Practice
```typescript
// Assuming path exists without checking
await readFile("docs/user-guide/getting-started.md");

// Using path from task description without verification
await readFile(task.details.match(/docs\/.*\.md/)[0]);

// Using path from conversation summary
await readFile(summary.mentions.filepath);
```

## Enforcement

### Before Every File Operation
- [ ] Verified path exists using appropriate tool
- [ ] Confirmed parent directory exists (for writes)
- [ ] Used actual path from tool response, not assumption
- [ ] Documented path if creating new file

### When Uncertain
- Ask user for clarification rather than guessing
- Provide list of similar paths found
- Explain what you're looking for and why

## Integration with Other Rules

This rule works with:
- [kiro_rules.md](.kiro/steering/kiro_rules.md) - File reference format
- [dev_workflow.md](.kiro/steering/dev_workflow.md) - Task execution workflow
- [self_improve.md](.kiro/steering/self_improve.md) - Rule improvement process
