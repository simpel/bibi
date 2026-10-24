---
name: fix-bug
description: Fix a bug test-first. Reproduce it with a failing test, find the root cause, fix it, prove the same test passes. Use for any bug fix and for tickets of Kind Bugfix.
---

# Fix a bug

1. **State the failure** as one observable sentence: input, expected, actual. If you cannot, the report is not clear enough: ask or return `status=blocked`.
2. **Reproduce first.** Write the smallest failing test at the right layer:
   - a core operation test against real Postgres with `testContext()` and `testOrg()` (no mocks),
   - an isolation test in `apps/mcp/test/isolation-*.test.ts` for tenancy and permission bugs,
   - a unit test for a pure function,
   - Playwright only for bugs that need a browser.
   Run it and see it **fail for the reason in the report**, not for a typo or a missing setup. Keep that output.
3. **Find the root cause**, not the symptom: trace the data and read the code path. Check whether sibling code has the same defect. If it does, report it as a follow-up with `file:line`; fix it only if the ticket covers it.
4. **Fix minimally.** No unrelated cleanup.
5. **Show the same test passes**, then run the neighbouring tests. Add one edge-case test when the bug class has an obvious twin.
6. **Report the proof:** `repro = { test, failedBefore: true }`. When a test is impossible (a layout, a race you cannot force, a missing environment), return `repro.skippedReason` with why, and add the closest guard you can (a test of the extracted logic, an assertion).
7. The commit and PR title is `fix: <summary>` (ADR 0060).
