---
name: work-tickets
description: Do one or more small, unblocked board tickets in this session, all in one branch and one pull request. Use when the work-backlog gate says "inline", or for any 1-2 small tickets, instead of the work-backlog workflow.
---

# Work tickets inline (one session, one PR)

The `work-backlog` workflow pays a fixed cost per ticket (worktree, agents, CI waits). Below its gate (fewer than 3 parallel tickets) this skill does the same work in the current session. Why: ADR 0065.

0. **Start the clock:** `node tools/backlog/metrics.mjs start` prints a timestamp; keep it for step 8.
1. **Pick the tickets.** `node tools/backlog/gate.mjs` prints `path`, `ready` and `bundle` (small Docs and Test tickets that fit one PR). Take `ready`, in order. Skip a ticket with an open `### Depends on` blocker. Each ticket's Kind picks its skill (`new-feature`, `fix-bug`, `refactor`, `add-tests`, `write-docs`, `codemod`); a `type:decision` ticket follows `add-adr` and is left for a person to accept.
2. **One worktree, one branch.** `pnpm wt:new work-<first>-<last>` (branch `work/<first>-<last>`), run everything there. Never edit the main checkout.
3. **One commit per ticket**, in order: `<type>: <issue title>` with `Closes #N` and the Co-Authored-By line. `<type>` follows the ticket's Kind (ADR 0060). Before each commit run `node tools/ci/verify.mjs` (the checks CI runs, scoped to your changes; `--light` for docs). Fix red checks before moving on. A change in core, db, auth or MCP also gets the `tenancy-review` skill.
4. **One pull request.** Push the branch and open it with `gh pr create`:
   - Title `<type>: <summary>`. The squash commit on main takes this title, and release-please reads it, so use the highest-impact type (`feat` over `fix` over `refactor`, `docs`, `test`) and name the tickets.
   - Body: one `Closes #N` line per ticket, then one sentence per ticket.
   - Never push to main.
5. **Arm auto-merge**: `gh pr merge <pr> --auto --squash --delete-branch`. GitHub merges when the required checks are green. Do not wait for `main` CI or the deploy.
6. **If CI goes red**, read `gh run view <run> --log-failed`, fix on the same branch, push. Retry a known flaky e2e once before changing code.
7. **Board:** move each card to `In progress` when you start it. `Closes #N` closes the issue on merge. Out-of-scope findings become `source:agent` tickets (`new-ticket` skill), never scope creep.

8. **Record the run** so the way of working can be evaluated later: `echo '{"tickets":[{"number":N,"size":"S","kind":"Feature","model":"sonnet","outcome":"armed","pr":PR}]}' | node tools/backlog/metrics.mjs record --path inline --since <timestamp>` (one ticket object per ticket, all with the same PR number). Add `--note` for anything unusual (a flaky test, a long wait).

Cost trade-off: the squash merge makes the whole PR one commit on main, so release-please sees one change entry for it. Use the workflow, or one PR per ticket, when separate changelog entries matter.
