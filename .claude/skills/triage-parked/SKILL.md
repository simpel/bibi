---
name: triage-parked
description: Pick the most workable ticket from the board's Parked column, analyze why it got stuck, and propose a recovery plan for human approval before implementing it and opening a PR. Use when asked to triage, recover or unstick parked tickets, or when checking what's sitting in Parked.
---

# Triage a parked ticket

Recovery path for tickets `work-backlog` could not land. One ticket per run, picked for workability, with a human-approved plan before any code changes. Never moves a card to Done and never merges — a human closes the PR.

Board ids (fixed, same board as `work-backlog`; never run `gh project field-list`/`item-list` to rediscover them):
- `PROJECT_ID=PVT_kwHOAAOKWM4BnFHj`, `STATUS_FIELD=PVTSSF_lAHOAAOKWM4BnFHjzhlrXtM`
- Status option ids: `Parked=a84a90a0`, `In progress=47fc9ee4`
- Move a card: `gh project item-edit --id <itemId> --project-id PVT_kwHOAAOKWM4BnFHj --field-id PVTSSF_lAHOAAOKWM4BnFHjzhlrXtM --single-select-option-id <optionId>`
- `CHECKS`: `pnpm db:migrate, pnpm lint, pnpm typecheck, pnpm check:structure, pnpm test`

## 1. Select

1. `git fetch origin` in `/Users/joelsanden/Code/okazi`.
2. `gh project item-list 8 --owner simpel --format json -L 300`, keep open issues with Status `Parked`. Note each item's `itemId` (`PVTI_...`), priority, labels.
3. For each, `gh issue view N -R simpel/okazi --json title,body,labels,comments` plus `gh api repos/simpel/okazi/issues/N/dependencies/blocked_by`. `openBlockers` = issues named under "Depends on" in the body, plus native blocked-by, that are still open. Find the parking comment (posted by the `work-backlog` run) for the branch link and reason.
4. Rank candidates: `openBlockers.length === 0` first, then by board Priority (P0 > P1 > P2), then lowest issue number. Read each parking reason — prefer one whose blocker has since landed or whose failure looks narrow (a specific red check, not "needs a human decision"). Skip (don't force-pick) a ticket whose reason is a genuine open design question for the human.
5. If nothing is workable, report why (e.g. "#71 still blocked on #80, open") and stop here.
6. State which ticket you picked and why, in one or two sentences, before moving on.

## 2. Claim

1. `git fetch origin`. If `refs/remotes/origin/parked/<N>` exists, continue from it: in the main checkout, `git show-ref --verify --quiet refs/heads/parked/<N>` — if missing, `git branch parked/<N> origin/parked/<N>` to create the local tracking ref `pnpm wt:new` expects. Then `pnpm wt:new t-<N> --branch parked/<N>`.
2. If no `parked/<N>` branch exists anywhere (the ticket parked with no commits), start fresh: `pnpm wt:new t-<N> --branch ticket/<N> --base origin/main`.
3. It prints `WORKTREE_DIR=<path>`. Every command from here runs with that cwd; never touch the main checkout.
4. Move the card to `In progress` (command above, option id `47fc9ee4`) to claim it.

## 3. Analyze

In the worktree:
1. Read the issue's "To do"/"Done when" spec and any linked ADR in `docs/decisions/` and the spec it names.
2. `git log origin/main..HEAD --stat` and `git diff origin/main..HEAD` to see what already exists.
3. Re-read the parking reason comment from step 1.3 — that's the thing to actually fix.
4. Run `docker compose -p okazi -f /Users/joelsanden/Code/okazi/docker-compose.yml up -d --wait postgres` then `CHECKS`, to see the current red/green state and exactly what's failing now (blockers may have landed since parking, so the picture can have changed).
5. Check whether the matching repo skill applies (`new-entity`, `new-core-operation`, `db-migration`, `i18n-strings`, `new-ui-component`, `structure-fix`) and note it in the plan.

## 4. Plan (human checkpoint)

Call `EnterPlanMode`, then write the recovery plan: what was wrong, what you'll change (file-level), and how you'll verify it. Call `ExitPlanMode` with that plan. Do not write any code before the plan is approved — this is the point of the skill. If the human asks for changes, revise and re-present; don't silently proceed on an unapproved plan.

## 5. Implement (after approval)

1. Make the changes per the approved plan, in the worktree only.
2. Re-run `CHECKS`. Fix until green; this ticket's database is isolated, so migrations are safe to iterate on.
3. If labels include `area:core`, `area:db`, `area:auth` or `area:mcp`, run the `tenancy-review` skill on the diff and fix any real finding before continuing.
4. If you notice a real problem outside this ticket's scope, don't fix it here — mention it to the human at the end instead of filing it yourself (no batch of tickets to dedupe against here).

## 6. Open a PR — stop there

1. `git add -A` and commit. Subject: the ticket title; body: `Closes #<N>`, a short summary, blank line, then this session's commit attribution line (not the workflow's hardcoded one).
2. `git fetch origin`, `git rebase origin/main` (abort and report on conflict, don't force through it). If `origin/main` moved, re-run `CHECKS`.
3. `git push -u origin <branch>`. Never force-push over anyone else's work; force is fine here only if this is the only pusher to that branch (it is, by convention).
4. `gh pr create -R simpel/okazi` with that same summary as the body, `Closes #<N>`, base `main`. Check for a PR template first (`pull_request_template.md` / `.github/PULL_REQUEST_TEMPLATE/`) and follow it if present.
5. Comment on the issue with the PR link.
6. Stop. Do not merge, do not move the card past `In progress`, do not remove the worktree — leave it for review/iteration until the human closes the PR.
