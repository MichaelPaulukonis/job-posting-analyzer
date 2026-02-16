---
description: Guidelines for efficiently reading test output to minimize token usage
alwaysApply: true
---

# Efficient Test Output Handling

## Core Principle
Test output can consume 15,000-20,000 tokens per invocation. Use targeted filtering to reduce this to 1,000-2,000 tokens (90% reduction).

## Efficient Test Commands

### Get Test Summary Only
```bash
# Just pass/fail counts
npm test 2>&1 | grep -E "(Test Suites:|Tests:|PASS|FAIL)" | tail -5

# Or use tail to get just the summary
npm test 2>&1 | tail -20
```

### Check for Specific Errors
```bash
# Look for specific error patterns
npm test 2>&1 | grep -E "(SyntaxError|TypeError|ReferenceError)" | head -20

# Find import/module errors
npm test 2>&1 | grep -E "(Cannot find module|import.*not found)" | head -10
```

### Count Failures
```bash
# Quick failure count
npm test 2>&1 | grep -c "FAIL"

# Or get failed test names only
npm test 2>&1 | grep "FAIL" | cut -d' ' -f3-
```

### Silent Mode
```bash
# Suppress verbose output, show only failures
npm test --silent 2>&1 | grep -A 5 "FAIL"

# Or use Jest's built-in silent mode
npm test -- --silent --verbose=false
```

### Structured Output
```bash
# Use JSON output for parsing (requires jq)
npm test -- --json 2>&1 | jq '{
  total: .numTotalTests,
  passed: .numPassedTests,
  failed: .numFailedTests
}'
```

## Integration Test Patterns

### Check Docker Status
```bash
# Verify Docker is running (minimal output)
docker ps --filter "name=postgres-test" --format "{{.Status}}"
```

### Database Connection Test
```bash
# Quick connection check
npm run test:integration 2>&1 | grep -E "(Database|connection|ready)" | head -5
```

### Get Only Failed Tests
```bash
# Show only failed test details
npm run test:integration 2>&1 | grep -A 10 "FAIL"
```

## Git Commit Efficiency

### Skip Pre-commit Hooks
```bash
# Avoid running tests during commit (saves tokens)
git commit --no-verify -m "message"

# Or set environment variable
SKIP_TESTS=1 git commit -m "message"
```

### Suppress Test Output in Commits
```bash
# Redirect test output to /dev/null during commit
npm test > /dev/null 2>&1 && git commit -m "message"
```

## When to Use Full Output

Only read full test output when:
- Initial diagnosis of unknown error
- Debugging complex test failures
- Need to see stack traces

Even then, use `head -50` or `tail -50` to limit output.

## Anti-Patterns to Avoid

❌ **Don't do this:**
```bash
npm test 2>&1  # Full output, 15k+ tokens
npm test 2>&1 | head -100  # Still too verbose
```

✅ **Do this instead:**
```bash
npm test 2>&1 | tail -20  # Just summary
npm test 2>&1 | grep "FAIL"  # Just failures
```

## Token Usage Comparison

| Command | Approximate Tokens | Use Case |
|---------|-------------------|----------|
| `npm test 2>&1` | 15,000-20,000 | ❌ Avoid |
| `npm test 2>&1 \| head -100` | 8,000-12,000 | ⚠️ Still high |
| `npm test 2>&1 \| tail -20` | 500-1,000 | ✅ Good |
| `npm test 2>&1 \| grep "FAIL"` | 200-500 | ✅ Best |
| `npm test -- --json \| jq` | 100-300 | ✅ Optimal |

## Example Workflow

```bash
# 1. Quick check - did tests pass?
npm test 2>&1 | tail -3

# 2. If failed, what failed?
npm test 2>&1 | grep "FAIL"

# 3. If specific error, get details
npm test 2>&1 | grep -A 5 "SyntaxError"

# 4. If still unclear, get more context
npm test 2>&1 | grep -B 2 -A 10 "specific-test-name"
```

## Integration with CI/CD

For automated testing in CI/CD:
```bash
# Use reporters that produce concise output
npm test -- --reporters=jest-summary-reporter

# Or use GitHub Actions summary format
npm test -- --json --outputFile=test-results.json
```

## Related Files
- [dev_workflow.md](.kiro/steering/dev_workflow.md) - General development workflow
- [taskmaster.md](.kiro/steering/taskmaster.md) - Task management workflow
