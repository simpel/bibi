---
name: add-tests
description: Add tests only, with no production change. Use for tickets of Kind Test and for closing a coverage gap.
---

# Add tests

1. **Tests only.** Change no production code. If a test needs a production change (an export, a seam), stop and return `status=blocked` with the reason. The run sends a Test ticket back when a production file is in the change.
2. **Use the existing patterns:**
   - core tests: real Postgres, `testContext()` and `testOrg()`, no mocks (`packages/core/test`),
   - isolation tests for every operation that reads or writes by id: a second organization must not see or change the record (`apps/mcp/test/isolation-*.test.ts`),
   - the parity test covers web, GraphQL, REST and MCP,
   - Playwright with the scripted model for browser flows.
3. **A test must fail when the code is wrong.** Before you finish, check at least one new assertion against a deliberately broken path (temporarily, and revert it, so the change stays tests only).
4. **Names and messages in English.** Swedish only as test input that exercises Swedish text.
5. The commit and PR title is `test: <summary>` (ADR 0060).
