---
description: Guidelines for using Taskmaster MCP tools correctly with proper projectRoot
alwaysApply: true
---

# Taskmaster MCP Usage Guidelines

## Core Principle
Always use Taskmaster MCP tools instead of CLI commands, and always use the correct absolute projectRoot path.

## Critical Rules

### 1. Always Use MCP Tools Over CLI
- ✅ Use `mcp_task_master_ai_*` tools
- ❌ Avoid `task-master` CLI commands
- Exception: CLI is acceptable for quick user-facing operations or when MCP fails

### 2. Always Get Real ProjectRoot First
Before ANY Taskmaster MCP operation, get the actual project root:

```bash
# ALWAYS run this first
pwd
```

Then use the EXACT output as projectRoot in all MCP calls.

### 3. Never Hallucinate or Assume ProjectRoot
- ❌ Never use paths from conversation history
- ❌ Never use paths from summaries
- ❌ Never assume `/Users/parker/...` or any other path
- ✅ Always get current directory with `pwd` first
- ✅ Use the exact output from `pwd` as projectRoot

## Correct Usage Pattern

### Step 1: Get ProjectRoot
```typescript
executeBash({ command: "pwd" })
// Output: /Users/michaelpaulukonis/projects/job-posting-analyzer
```

### Step 2: Store and Use Exact Path
```typescript
const projectRoot = "/Users/michaelpaulukonis/projects/job-posting-analyzer";

// Use in all MCP calls
mcp_task_master_ai_get_tasks({ projectRoot })
mcp_task_master_ai_set_task_status({ projectRoot, id: "7", status: "done" })
mcp_task_master_ai_get_task({ projectRoot, id: "5" })
```

## Available MCP Tools

### Task Retrieval
- `mcp_task_master_ai_get_tasks` - List tasks with optional filtering
- `mcp_task_master_ai_next_task` - Get next available task
- `mcp_task_master_ai_get_task` - Get specific task details

### Task Modification
- `mcp_task_master_ai_set_task_status` - Update task status
- `mcp_task_master_ai_update_subtask` - Append info to subtask
- `mcp_task_master_ai_expand_task` - Break down task into subtasks

### Task Creation
- `mcp_task_master_ai_parse_prd` - Generate tasks from PRD

## Common Mistakes to Avoid

### ❌ Wrong: Using Old Path
```typescript
// From conversation summary or memory
mcp_task_master_ai_get_tasks({
  projectRoot: "/Users/parker/Documents/dev/career/job-posting-analyzer"
})
```

### ✅ Correct: Get Current Path
```typescript
// Always get fresh
executeBash({ command: "pwd" })
// Then use exact output
mcp_task_master_ai_get_tasks({
  projectRoot: "/Users/michaelpaulukonis/projects/job-posting-analyzer"
})
```

### ❌ Wrong: Assuming Path
```typescript
// Never assume based on username or structure
const projectRoot = "/Users/someuser/projects/job-posting-analyzer";
```

### ✅ Correct: Verify Path
```typescript
// Get it from system
const result = await executeBash({ command: "pwd" });
const projectRoot = result.trim();
```

## Error Recovery

### When MCP Tool Fails with Path Error
1. Immediately run `pwd` to get correct path
2. Retry with correct projectRoot
3. Document the correct path for session

### When "Failed to initialize TmCore"
- This usually means wrong projectRoot
- Run `pwd` and use exact output
- Verify you're in the project directory

## Session Start Checklist

At the start of every session:
- [ ] Run `pwd` to get current directory
- [ ] Store projectRoot for the session
- [ ] Use this exact path in all MCP calls
- [ ] Never use paths from previous sessions

## Integration with Other Rules

This rule works with:
- [path-verification.md](.kiro/steering/path-verification.md) - General path verification
- [dev_workflow.md](.kiro/steering/dev_workflow.md) - Taskmaster workflow
- [taskmaster.md](.kiro/steering/taskmaster.md) - Taskmaster reference

## Why MCP Over CLI?

### MCP Advantages
- Structured data responses (JSON)
- Better error handling
- Programmatic access
- No output parsing needed
- Consistent interface

### CLI Advantages
- User-friendly output
- Interactive prompts
- Better for manual operations
- Colored output

### When to Use Each
- **MCP**: All automated/agent operations (default)
- **CLI**: User-facing operations, debugging, manual tasks

## Examples

### Good: Complete Task Workflow
```typescript
// 1. Get projectRoot
const pwdResult = await executeBash({ command: "pwd" });
const projectRoot = pwdResult.trim();

// 2. Get task details
const task = await mcp_task_master_ai_get_task({
  projectRoot,
  id: "5"
});

// 3. Update status
await mcp_task_master_ai_set_task_status({
  projectRoot,
  id: "5",
  status: "in-progress"
});

// 4. Do work...

// 5. Mark complete
await mcp_task_master_ai_set_task_status({
  projectRoot,
  id: "5",
  status: "done"
});
```

### Bad: Mixed Approaches
```typescript
// ❌ Don't mix MCP and CLI
await mcp_task_master_ai_get_task({ projectRoot, id: "5" });
await executeBash({ command: "task-master set-status --id=5 --status=done" });
```

## Troubleshooting

### "Operation failed: Failed to initialize TmCore"
**Cause**: Wrong projectRoot path
**Solution**: 
```bash
pwd  # Get correct path
# Use exact output in projectRoot parameter
```

### "Task not found"
**Cause**: Wrong tag context or task doesn't exist
**Solution**:
```typescript
// Check current tag
await executeBash({ command: "task-master tags" });
// Or list all tasks
await mcp_task_master_ai_get_tasks({ projectRoot });
```

### MCP Tool Returns Empty
**Cause**: Might be in wrong tag or no tasks match filter
**Solution**:
```typescript
// Get all tasks without filter
await mcp_task_master_ai_get_tasks({ 
  projectRoot,
  // Don't specify status to see all
});
```
