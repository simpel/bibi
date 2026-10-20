---
name: refactor
description: Change structure without changing behaviour. Existing tests pass unmodified and nothing new is added. Use for tickets of Kind Tech debt and for cleanups.
---

# Refactor

1. **Pin the behaviour first.** The area you touch needs tests. If it has none, add characterization tests as the first step; they are the only new tests this change may contain.
2. **Do not change what tests assert.** Existing tests must pass unmodified. If one has to change, say which and why in `notes`: the change is then not a pure refactor and belongs in a feature or bugfix ticket.
3. **Keep every public surface:** operation names, GraphQL, REST and MCP shapes, i18n keys (parity, ADR 0003). No new dependencies, no new features.
4. **Small steps.** Run the targeted tests after each one.
5. **Follow the code rules** (`pnpm check:structure`: 150 lines per file, 40 per function, one object parameter, named exports) and reuse existing patterns. Extract shared code at the second duplicate.
6. The commit and PR title is `refactor: <summary>` (ADR 0060).
