---
name: implement-ticket
description: Implement one ticket from the bibi board (project 8) and commit it straight to main. Use for any ticket, of any Kind, when the user says "do #N", "implement #N" or "take the next ticket". Why: ADR 0070.
---

# Implement a ticket

One ticket, one commit, pushed to `main`. No branch, no pull request. You are the only gate before main, so run the checks.

## 1. Pick and start
- The user names `#N`, or take the next one: `node tools/backlog/select.mjs` lists open `Todo` tickets with `openBlockers`. Take the first with no open blockers, by Priority (P0 first), then smaller Size, then lower number.
- `git switch main && git pull --ff-only origin main`. The tree must be clean; if it is not, stop and ask.
- `node tools/backlog/ticket.mjs set <N> --status "In progress"`.

## 2. Understand before you build
- Read the issue (`gh issue view <N> -R simpel/bibi`): "To do", "Seed data", "Done when", "Depends on". Read the ADR and the `docs/specs/` file it names, and the `CLAUDE.md` of every package you will touch.
- If the ticket needs a human decision (an open question, a Proposed ADR, unclear scope) or an open blocker, stop and ask. Never guess a rule.
- Reuse first: search for an existing helper, schema or pattern before writing one. Extract shared code at the second duplicate.

## 3. Build by Kind
- **Feature:** core first, adapters in the same change (ADR 0003). Order: Prisma schema and migration → core operation(s) → GraphQL, REST, MCP → web (`web-surfaces.ts`) and generative UI (`tool-ui-registry.ts`) → i18n (sv and en) → seed data → docs.
- **Bugfix:** write the smallest failing test first and see it fail for the reported reason. Fix the root cause minimally, then show the same test passes.
- **Tech debt:** no behaviour change. Existing tests pass unmodified.
- **Test:** tests only, no production code.
- **Docs:** documentation only. Check every claim against the code.
- **Codemod:** do renames with a script, not by hand, then search for every old name until none is left.
- **`type:decision` label:** write the ADR (`docs/decisions/NNNN-title.md`, next free number) as Proposed and ask the user to accept it.

## 4. Rules that were follow-up bugs before
- **New entity:** `pnpm gen entity <PascalName>` makes the skeleton; export from `packages/core/src/index.ts`, add to `core-operations.ts` and `schemas.ts`.
- **Operation:** `defineOperation` with Zod in and out, `permission: "<feature>:<action>"` (ADR 0050), `context.db` only, `context.recordChange` on every command, errors as `err(AppError)`, never `throw`. A command needs an approval label in `approval-labels.ts`.
- **Database** (`packages/db/CLAUDE.md`): cuid2 `id`, `organizationId`, `status`, timestamps, `createdBy`; composite FKs `[fkId, organizationId]`; org-scoped models in `ORG_SCOPED_MODELS`. Every column is owned, derived, projection or snapshot (ADR 0051), written in the model comment. A projection registers a reconciliation check (`reconcile-checks.ts`). Run `pnpm --filter @bibi/db migrate:dev --name <name>`; never edit a migration that ran.
- **Tenancy:** every new operation gets a step in `apps/mcp/test/isolation-<area>.test.ts` (organization B gets `NOT_FOUND` with A's ids). Every referenced input id is checked for organization and `<feature>:read`. Output carries only the operation's own feature's data, other features as ids.
- **Lifecycle and races:** say what happens on archive, rename and removal, and test it. Count-then-write returns `CONFLICT`, never `INTERNAL`.
- **Lists:** paginate or search server-side, no N+1.
- **UI text:** through next-intl, the same keys in `sv.json` and `en.json`. No domain words in code: behaviour comes from org data (ADR 0021).
- **Docs:** a domain change updates `docs/domain-model.md` and `docs/artifacts/domain-model.html` together.
- **Seed data:** do what the ticket's "Seed data" section says (`packages/core/src/seed/demo/`, `docs/demo-seed.md`).
- **Out of scope:** never fix it here. Create a ticket with the `new-ticket` skill.

## 5. Verify
- `node tools/ci/verify.mjs` runs the CI checks scoped to your changes (lint, structure, typecheck, migrate, test, build). Docs only: `--light`. All green before you commit.
- Seed or schema changed: `pnpm --filter @bibi/core seed:demo` from an empty database, checks green.
- Change in core, db, auth or MCP: reread the diff for scoping, permissions, audit and isolation (the tenancy rules above) and fix what you find.
- A test that fails only under load and passes alone is flaky: rerun it once, and file a ticket if it stays flaky.

## 6. Commit and push
- One commit: `<type>: <summary>`. The type comes from Kind: Feature `feat`, Bugfix `fix`, Tech debt and Codemod `refactor`, Docs `docs`, Test `test` (ADR 0060). Drop a type the issue title already has. Body: what changed and why in a few lines, `Closes #<N>`, then the Co-Authored-By line.
- `git pull --rebase origin main`. After a rebase that brought in changes, run `node tools/ci/verify.mjs` again.
- `git push origin main`, then `node tools/backlog/ticket.mjs set <N> --status Done`.
- Check CI on main: `gh run list -R simpel/bibi --branch main -L 1`. If it goes red, fixing it comes before the next ticket.

## 7. Report
In a few lines, tell the user: the commit, what changed, what was verified, and any tickets you created.
