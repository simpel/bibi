# 0066 – A lean ticket loop instead of the work-backlog workflow

- **Date:** 2026-10-24
- **Status:** Superseded by 0070
- **Supersedes:** 0065 points 2 (auto-merge) and 3 (the workload gate). Point 1 (main only moves through a PR) and point 4 (metrics) stay.
- **Related:** 0060 (versioning from Conventional Commits)

## Context
- The `work-backlog` workflow burned too many tokens for what it delivered. The 2026-10-22 run (2 tickets) used:
  - 143 model calls,
  - 2.4M cache-write tokens,
  - 12.2M cache-read tokens.
- Every one of its agents started with about 87k tokens of context (system prompt, CLAUDE.md, the skills listing and every MCP tool) before it did anything.
- 34 of those calls were Haiku agents whose only job was to run one script: gate, select, park, metrics, main CI. Those calls alone wrote 1.76M cache tokens.
- Each ticket was split across implement, fix, tenancy and land agents, and each of them learned the code again from zero.
- A headless `claude -p` session with no MCP servers and only the six tools it needs starts at about 18k tokens. The default set starts at about 39k.
- Joel merges pull requests by hand. The run does not need to merge, arm auto-merge or wait for CI.

## Decision
1. **No model around deterministic steps.** Selection, claims, worktree and database resets, checks, shipping, parking and metrics are shell or Node scripts (`tools/loop/`, `tools/backlog/`).
2. **One session per ticket.** `tools/loop/session.sh` runs one headless `claude -p` session that implements and runs `verify.sh` until green in a single context.
   - Red checks or tenancy findings resume that same session (`--resume`) instead of starting a new agent.
   - The tenancy review runs only when the diff touches core, db, auth or MCP. It gets the diff and read-only tools.
3. **Lean sessions.** Each session runs with:
   - `--strict-mcp-config` and an empty MCP config,
   - `--setting-sources project`,
   - `--tools Bash,Read,Edit,Write,Glob,Grep`,
   - an allowlist that does not let it push, merge or call `gh`,
   - a dollar cap per Size (`--max-budget-usd`).
4. **Selection is a sort, not a judgement.**
   - The picker ranks by Priority, then Size, then age.
   - It skips blocked, claimed and `source:agent` tickets, and tickets that share an `area:*` label with work in flight.
   - Only one `area:db` ticket is in flight at a time.
5. **Parallel slots, never merges.**
   - Each slot (`run.sh --slot k`) keeps one worktree and its own databases.
   - Both databases are dropped and rebuilt per ticket, so an unmerged migration from the slot's last ticket never lingers.
   - The loop opens a PR and leaves it. A PR that starts to conflict with main is rebased by the loop (`rescue.sh`).
6. **Safety rails.**
   - The loop pauses while main is red.
   - It backs off on rate limits.
   - It stops after 3 parked tickets in a row.
   - It sleeps while nothing is ready, at no token cost.

## Consequences
- The workflow (`.claude/workflows/work-backlog.js`), the gate (`gate.mjs`) and `arm.sh` are removed. The `work-tickets` skill stays for small inline work.
- Area labels are coarse. Two `area:web` tickets never run at the same time, even when they would not conflict.
- A blocker's dependent becomes ready only after Joel merges the blocker.
- Cost per ticket is recorded (`metrics.mjs`, path `loop`), so this decision can be checked against the 2026-10-22 baseline after a few tickets.

## Rejected
- **Keep the workflow and trim its agents.** Every agent the Workflow tool starts carries the full session context, so the fixed cost per step stays. A Workflow also needs a live Claude session to orchestrate, while a shell loop costs nothing while it waits.
- **A model picks the next ticket.** The board fields already hold the judgement. A sort is free and repeatable.
