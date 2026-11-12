---
name: implement
description: Implement a piece of work in bibi and push it straight to main behind the pre-push hook, alone or with parallel subagents for larger work. Use for any feature, bugfix, tech debt, test, docs or codemod request. Specs describe behaviour; ADRs gate only costly-to-reverse decisions. Why: ADR 0070, 0075, 0107.
---

# Implement

One piece of work, one commit, pushed straight to `main` (ADR 0107). No order is needed. The pre-push hook gates the push; CI runs build and e2e after it, and a red `main` is yours to fix first.

Every run works in its own worktree with its own environment: a fresh `.env`, database (`bibi_<name>`, test database `bibi_<name>_test`) and port block. Never build in the main checkout; it may hold the user's own work.

## 1. Start
- The user describes the work. Pick a short `<name>` for it.
- From the main checkout: `git fetch origin main && pnpm wt:new <name> --base origin/main`. It creates `../bibi-worktrees/<name>` on branch `wt/<name>`, then installs, migrates and provisions its environment (`tools/worktree/`). Docker must be running.
- If `<name>` already exists (`pnpm wt:list`), another run owns it or left it behind: stop and ask. Never reuse or remove it yourself.
- From here on, run every command inside the worktree (`cd ../bibi-worktrees/<name>`), and give every subagent that path as its only place to work.

## 2. Understand before you build
- Find the `docs/specs/` file and any accepted ADR that govern the area, and read the `CLAUDE.md` of every package you will touch. Build what they say; update the spec when behaviour changes.
- Only a decision that is costly to reverse (schema, auth, money, tenancy, parity, infrastructure) with a real rejected alternative needs an ADR first: one page, Proposed (`docs/decisions/NNNN-title.md`, next free number), accepted by the user before you build. Features need none.
- If the work contradicts an ADR, or needs a human decision (an open question, a Proposed ADR, unclear scope), stop and ask. Never guess a rule.
- Reuse first: search for an existing helper, schema or pattern before writing one. Extract shared code at the second duplicate.

## 3. Alone or with subagents
Decide before you build. The test is how many independent pieces there are, not how big it feels.
- **Do it alone** when it is small, touches one package, or each step needs the previous one's result (a migration, then the operation that uses it). This is the default: a subagent knows only its brief, and you pay for every handoff.
- **Use subagents** when it is large, or spans packages that can be built at the same time once the core is in place (GraphQL, REST, MCP, web, i18n, seed). Build the shared core yourself first (schema, migration, core operation), then start one subagent per independent package, all in one message so they run in parallel.
- **Pick the model per piece** (root `CLAUDE.md`, "Working with subagents"): Sonnet by default; Opus for auth, tenancy scoping, `packages/core` operations, MCP auth and the approval flow; Haiku for mechanical work (i18n strings, boilerplate, doc sync).
- **Brief each one fully:** the worktree path it works in, the part it owns and the ADR behind it, the files and package `CLAUDE.md` to read, the core API you built, and what done looks like. A subagent edits only its own package, never commits or pushes, and reports the files it changed and anything left open.
- **For a second opinion** on a change in core, db, auth or MCP, start one Opus subagent with the diff and the tenancy rules in section 5. Give it the diff, not your conclusions.
- **You own the rest:** integration, the parity and isolation tests, `pnpm check`, the commit and the push.

## 4. Build by kind of work
- **Feature:** core first, adapters in the same change (ADR 0003). Order: Prisma schema and migration → core operation(s) → GraphQL, REST, MCP → web (`web-surfaces.ts`) and generative UI (`tool-ui-registry.ts`) → i18n (sv and en) → seed data → docs.
- **Bugfix:** write the smallest failing test first and see it fail for the reported reason. Fix the root cause minimally, then show the same test passes.
- **Tech debt:** no behaviour change. Existing tests pass unmodified.
- **Test:** tests only, no production code.
- **Docs:** documentation only. Check every claim against the code.
- **Codemod:** do renames with a script, not by hand, then search for every old name until none is left.

## 5. Rules that were follow-up bugs before
- **New entity:** `pnpm gen entity <PascalName>` makes the skeleton; export from `packages/core/src/index.ts`, add to `core-operations.ts` and `schemas.ts`.
- **Operation:** `defineOperation` with Zod in and out, `permission: "<feature>:<action>"` (ADR 0050), `context.db` only, `context.recordChange` on every command, errors as `err(AppError)`, never `throw`. A command needs an approval label in `approval-labels.ts`.
- **Database** (`packages/db/CLAUDE.md`): cuid2 `id`, `organizationId`, `status`, timestamps, `createdBy`; composite FKs `[fkId, organizationId]`; org-scoped models in `ORG_SCOPED_MODELS`. Every column is owned, derived, projection or snapshot (ADR 0051), written in the model comment. A projection registers a reconciliation check (`reconcile-checks.ts`). Run `pnpm --filter @bibi/db migrate:dev --name <name>`; never edit a migration that ran.
- **Tenancy:** every new operation gets a step in `apps/mcp/test/isolation-<area>.test.ts` (organization B gets `NOT_FOUND` with A's ids). Every referenced input id is checked for organization and `<feature>:read`. Output carries only the operation's own feature's data, other features as ids.
- **Lifecycle and races:** say what happens on archive, rename and removal, and test it. Count-then-write returns `CONFLICT`, never `INTERNAL`.
- **Lists:** paginate or search server-side, no N+1.
- **UI text:** through next-intl, the same keys in `sv.json` and `en.json`. No domain words in code: behaviour comes from org data (ADR 0021).
- **Docs:** a domain change updates `docs/domain-model.md` and `docs/artifacts/domain-model.html` together.
- **Seed data:** work that adds or changes data or behaviour updates the demo seed (`packages/core/src/seed/demo/`, `docs/demo-seed.md`), or has a reason for no seed change.
- **Out of scope:** never fix it here. Tell the user in the report.

## 6. Verify
- `pnpm check` runs lint and structure, then typecheck, test, build and Storybook for the packages your branch changed (Turborepo `--affected`, uncommitted files included). All green before you commit.
- Seed or schema changed: `pnpm --filter @bibi/core seed:demo` from an empty database, checks green.
- Change in core, db, auth or MCP: reread the diff for scoping, permissions, audit and isolation (the tenancy rules above), or have an Opus subagent do it (section 3), and fix what you find.
- A test that fails only under load and passes alone is flaky: rerun it once, and tell the user if it stays flaky.

## 7. Commit and push
- One commit: `<type>: <summary>`. The type comes from the kind of work: Feature `feat`, Bugfix `fix`, Tech debt and Codemod `refactor`, Docs `docs`, Test `test` (ADR 0060). Body: what changed and why in a few lines, then the Co-Authored-By line.
- Push: `git pull --rebase --autostash origin main && git push origin HEAD:main`. The pre-push hook runs lint, structure, typecheck and the affected tests; never skip it with `--no-verify`. The commit-msg hook rejects a title that is not a Conventional Commit.
- The hook checks the shared working tree, so another session's uncommitted file can fail it. Fix what is yours; for theirs, tell the user rather than skipping the hook.
- Don't wait for CI. Check `main` once at the start of your next piece of work: `gh run list -R simpel/bibi -w CI -b main -L 1`. A red `main` is fixed before anything else, whoever broke it.
- Remove the worktree from the main checkout: `pnpm wt:rm <name> --delete-branch`. It drops both databases and frees the port block. When you stop without pushing, keep the worktree and tell the user its path.

## 8. Report
In a few lines, tell the user: the commit and its PR link, what changed, whether the worktree was removed, what was verified, which subagents you used for what.
