export const meta = {
  name: 'work-backlog',
  description: 'Work unblocked tickets from project 8, one isolated worktree per ticket, landing each on main',
  whenToUse: 'Run to let agents implement ready tickets from the okazi board until none are left. Args: { batchSize?: 3, maxBatches?: unlimited (safety cap 50), includeBacklog?: false, only?: [issueNumbers], adopt?: [issueNumbers] }',
  phases: [
    { title: 'Select', detail: 'read board + blockers, pick a batch' },
    { title: 'Implement', detail: 'one agent per ticket: creates its worktree, implements, runs the full checks' },
    { title: 'Verify', detail: 'fix loop with escalation when the implementer reports red checks' },
    { title: 'Review', detail: 'tenancy review for core/db/auth/mcp changes (Opus; Sonnet for codemod tickets)' },
    { title: 'Land', detail: 'one at a time: commit, rebase (resolving conflicts), full checks, push, board to Done' },
    { title: 'Park', detail: 'push a failed ticket to parked/<N>, comment, card to Parked' },
    { title: 'Follow-ups', detail: 'file out-of-scope findings as source:agent issues in Backlog' },
  ],
}

// ---- Config ---------------------------------------------------------------
const REPO = '/Users/joelsanden/Code/okazi'
const BATCH_SIZE = (args && args.batchSize) || 3
const SAFETY_CAP = 50 // hard stop against runaway loops
const MAX_BATCHES = Math.min((args && args.maxBatches) || SAFETY_CAP, SAFETY_CAP)
const STATUSES = args && args.includeBacklog ? ['Todo', 'Backlog'] : ['Todo']
const ONLY = (args && args.only) || null
// Tickets whose earlier run died with work in the worktree: continue that work instead of starting over.
const ADOPT = (args && args.adopt) || []
if (ADOPT.length) STATUSES.push('In progress')
const adopting = (t) => ADOPT.includes(t.number)
const BASE_FIX_ROUNDS = 2 // XL and codemod tickets get 3, see fixRounds
const TIERS = ['haiku', 'sonnet', 'opus'] // fable is never used
// Board ids are fixed: agents never run gh project field-list / item-list to find them (GraphQL rate limit).
const PROJECT_ID = 'PVT_kwHOAAOKWM4BnFHj'
const STATUS_FIELD = 'PVTSSF_lAHOAAOKWM4BnFHjzhlrXtM'
const STATUS_OPTION = { Backlog: 'f75ad846', Todo: '61e4505c', Parked: 'a84a90a0', 'In progress': '47fc9ee4', Done: '98236657' }
const SIZE_FIELD = 'PVTSSF_lAHOAAOKWM4BnFHjzhlrX6s'
const SIZE_OPTION = { XS: '6c6483d2', S: 'f784b110', M: '7515a9f1', L: '817d0097', XL: 'db339eb2' }
const EDIT = (itemId, field, option) => `gh project item-edit --id ${itemId} --project-id ${PROJECT_ID} --field-id ${field} --single-select-option-id ${option}`
// One GraphQL call per move. The item id comes from the select step, so no lookup is needed.
const moveCard = (t, status) => `Move the issue's board card to "${status}" with exactly this one command (no item-list, no field-list): ${EDIT(t.itemId, STATUS_FIELD, STATUS_OPTION[status])}`
const MODEL_NAME = { opus: 'Claude Opus 5.5', sonnet: 'Claude Sonnet 5.5', haiku: 'Claude Haiku 5.5' }
const coAuthor = (model) => `Co-Authored-By: ${MODEL_NAME[model] || MODEL_NAME.sonnet} <noreply@anthropic.com>`
const wtName = (t) => `t-${t.number}`
const wtDir = (t) => `${REPO}-worktrees/${wtName(t)}` // where pnpm wt:new puts it

// ---- Model choice (deterministic, from the board's fields) -----------------
// The ticket creator decides: the board fields Kind (Feature, Bugfix, Codemod, Tech debt, Docs, Test) and
// Model (Auto, Sonnet, Opus) are set when the ticket is created (new-ticket skill). The workflow follows them,
// falls back to labels when they are empty, and challenges contradictions in the log.
// 1. Model = Sonnet or Opus wins.
// 2. Kind = Codemod is scripted work: Sonnet. The judgment is small and the checks plus the review catch a bad script.
// 3. Opus where a mistake is expensive: Size L or XL, area:auth, area:db.
// 4. Sonnet otherwise. The Opus tenancy review and the fix-loop escalation catch what it misses.
// No Haiku for implementation: measured ~93 turns per ticket against Sonnet's ~19, so it cost more in total.
// Fallback while Kind is empty (older tickets): a title that starts with "Rename" counts as a codemod.
const kindOf = (t) => (t.kind || '').toLowerCase()
const isCodemod = (t) => kindOf(t) === 'codemod' || (!kindOf(t) && /^rename\b/i.test(t.title))
const isBig = (t) => ['L', 'XL'].includes(t.size)
const riskyArea = (t) => t.labels.includes('area:auth') || t.labels.includes('area:db')
// A codemod or an XL ticket rewrites much of the repo: it runs alone, with nothing in flight and nothing to rebase on.
const isExclusive = (t) => isCodemod(t) || t.size === 'XL'
function pickModel(t) {
  const m = (t.model || '').toLowerCase()
  if (m === 'opus' || m === 'sonnet') return m
  if (isCodemod(t)) return 'sonnet'
  if (isBig(t) || riskyArea(t)) return 'opus'
  return 'sonnet'
}
// The workflow follows the creator's fields but says so when they look contradictory.
function challenges(t) {
  const out = []
  const m = (t.model || '').toLowerCase()
  if (m === 'sonnet' && !isCodemod(t) && (isBig(t) || riskyArea(t))) out.push('Model=Sonnet on a large or risky ticket')
  if (m === 'opus' && isCodemod(t)) out.push('Model=Opus on a codemod')
  if (!kindOf(t) && isCodemod(t)) out.push('Kind empty, treated as codemod from the title')
  return out
}
// Large or scripted tickets fail checks more often on the first pass.
const fixRounds = (t) => (isCodemod(t) || t.size === 'XL' ? BASE_FIX_ROUNDS + 1 : BASE_FIX_ROUNDS)
const reviewModel = (t) => (isCodemod(t) ? 'sonnet' : 'opus')
function escalate(m) {
  const i = TIERS.indexOf(m)
  return TIERS[Math.min(i + 1, TIERS.length - 1)]
}
function assertModel(m) {
  if (!TIERS.includes(m)) throw new Error(`model not allowed: ${m}`)
  return m
}
const needsTenancyReview = (t) =>
  t.labels.some((l) => ['area:core', 'area:db', 'area:auth', 'area:mcp'].includes(l))

// ---- Schemas ---------------------------------------------------------------
// Out-of-scope work an agent noticed. Filed as issues labelled source:agent, never fixed in place.
const FOLLOW_UPS = {
  type: 'array',
  items: {
    type: 'object',
    properties: {
      title: { type: 'string' },
      problem: { type: 'string' },
      where: { type: 'string' },
      suggestedFix: { type: 'string' },
      kind: { type: 'string', enum: ['bug', 'tech-debt', 'security', 'docs', 'test-gap', 'feature'] },
    },
    required: ['title', 'problem', 'where', 'kind'],
  },
}
const TICKETS = {
  type: 'object',
  properties: {
    ok: { type: 'boolean' },
    problem: { type: 'string' },
    tickets: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          number: { type: 'number' },
          title: { type: 'string' },
          labels: { type: 'array', items: { type: 'string' } },
          itemId: { type: 'string' },
          priority: { type: 'string' },
          size: { type: 'string' },
          kind: { type: 'string' },
          model: { type: 'string' },
          status: { type: 'string' },
          openBlockers: { type: 'array', items: { type: 'number' } },
        },
        required: ['number', 'title', 'labels', 'itemId', 'priority', 'status', 'openBlockers'],
      },
    },
  },
  required: ['ok', 'tickets'],
}
const VERIFY = {
  type: 'object',
  properties: {
    green: { type: 'boolean' },
    failures: {
      type: 'array',
      items: {
        type: 'object',
        properties: { check: { type: 'string' }, output: { type: 'string' } },
        required: ['check', 'output'],
      },
    },
  },
  required: ['green', 'failures'],
}
// The implementer (and each fix round) runs the full checks itself and reports them; the land step re-runs
// them independently before pushing, so a false green never reaches main.
const IMPL = {
  type: 'object',
  properties: {
    status: { type: 'string', enum: ['done', 'blocked', 'prep_failed'] },
    summary: { type: 'string' },
    files: { type: 'array', items: { type: 'string' } },
    checks: VERIFY,
    notes: { type: 'string' },
    followUps: FOLLOW_UPS,
  },
  required: ['status', 'summary', 'files', 'checks'],
}
const REVIEW = {
  type: 'object',
  properties: { ok: { type: 'boolean' }, findings: { type: 'array', items: { type: 'string' } }, followUps: FOLLOW_UPS },
  required: ['ok', 'findings'],
}
const LAND = {
  type: 'object',
  properties: {
    state: { type: 'string', enum: ['landed', 'conflict', 'red', 'failed'] },
    sha: { type: 'string' },
    files: { type: 'string' },
    reason: { type: 'string' },
    checks: VERIFY,
  },
  required: ['state'],
}
const FILED = {
  type: 'object',
  properties: {
    created: { type: 'array', items: { type: 'number' } },
    duplicates: { type: 'array', items: { type: 'string' } },
  },
  required: ['created'],
}
const PARK = {
  type: 'object',
  properties: { state: { type: 'string' }, branch: { type: 'string' } },
  required: ['state'],
}

// ---- Prompts ---------------------------------------------------------------
const FOLLOW_UP_RULE = `If you notice a real problem outside this ticket's scope (a bug, security or tenancy gap, missing test, stale doc, tech debt), do NOT fix it here. Report it in followUps with where = file:line, so it becomes its own ticket. Only concrete, verifiable problems; no style nits, no wishes, nothing this ticket already covers.`

// Every turn re-reads the whole context, so file dumps cost on every later turn too.
const READING_RULES = `Keep your context small: find code with grep -n or rg, then read only the lines you need (sed -n 'A,Bp' or Read with offset/limit). Never cat whole files you only need part of. Look up library APIs with context7, never by reading node_modules.`

const inWorktree = (dir) => `Your checkout is the git worktree ${dir}: its own branch, its own Postgres database and its own .env (loaded automatically by Vitest, Prisma and the dev servers). Run every command with cwd ${dir} and edit only files under it. Never touch the main checkout ${REPO}.`

// Selection and worktree setup are deterministic scripts; the agent only runs them and relays the JSON.
const selectPrompt = (exclude) => {
  const flags = [`--statuses ${STATUSES.join(',')}`, ONLY ? `--only ${ONLY.join(',')}` : '', exclude.length ? `--exclude ${exclude.join(',')}` : '']
  return `Run exactly this one command from ${REPO} and nothing else: node tools/backlog/select.mjs ${flags.filter(Boolean).join(' ')}
It prints one JSON object { ok, problem?, tickets }. Return it unchanged. If the command prints no JSON, return ok=false with the last 20 lines as problem.`
}

// The final checks run inside the implementing agent: a separate verify agent re-paid the whole base context
// just to run commands. checks.sh is the single definition (order, Postgres, JSON report) shared with the land step.
const RUN_CHECKS = `Run the full checks with exactly this command from the worktree: tools/backlog/checks.sh. It starts Postgres, runs lint, check:structure and typecheck (all reported), then db:migrate and the tests only when those are green, and prints one JSON line {green, failures:[{check, output}]}. Copy it into checks unchanged.`

// The scratch directory is outside the git tree, so the script is never committed.
const scratchDir = (t) => `${REPO}-worktrees/.scratch/${wtName(t)}`
const codemodRules = (t) => `This ticket is a mechanical rename. Do it with scripts in layers, not by editing files one at a time. A text replace is wrong for code symbols (it hits strings, comments and unrelated scopes), so symbols go through the TypeScript compiler:
1. Inventory first. From the ticket, list every old name and its new name: identifiers (variables, functions, types, properties, enum values), Prisma models and columns, file and directory names, strings (i18n keys, GraphQL and REST field names, MCP tool names, enum values stored as text), SQL under packages/db/sql, docs. Count matches per old name with rg -c (skip node_modules and generated code).
2. Work in ${scratchDir(t)} (outside the git tree, never committed). Layer 1, database: edit schema.prisma, run pnpm db:generate, write the new migration (an in-place rename, no data migration). Never edit an applied migration.
3. Layer 2, TypeScript symbols: install ts-morph in the scratch directory (npm i ts-morph there; it brings its own TypeScript, so the repo's stays untouched) and write a script that opens each tsconfig and renames each symbol with the language service (identifier.rename()), and moves files with sourceFile.move() so imports update. This handles shadowing, shorthand properties, imports and exports. Give it a dry run that prints what would change per file, check it, then run it. Properties that come from the regenerated Prisma client follow the schema, not the script.
4. Layer 3, text: for strings and non-TypeScript files (i18n JSON, SQL functions, Markdown skills, docs, templates) use a script with word boundaries and every case variant (camelCase, PascalCase, UPPER_SNAKE, kebab-case, i18n keys). Rename more specific names first. Rename directories and the remaining files with plain mv (no git commands).
5. Let the compiler find the rest: run pnpm typecheck, fix what it lists, and repeat. Never edit node_modules, generated code, lockfiles or docs/decisions history (ADR addenda keep the old names).
6. By hand, only what scripts cannot do: SQL functions and triggers (packages/db/sql, and the test that applies them verbatim), name collisions with existing names, and wording of user-facing strings in sv and en.
7. Finish with rg for every old name, case-insensitively. Only existing migrations and ADR history may still match. Put the final match counts and any exception in notes.`
const implPrompt = (t, dir) => `Implement GitHub issue #${t.number} ("${t.title}").
Setup (run exactly these two commands first):
1. From ${REPO}: tools/backlog/prep.sh ${adopting(t) ? '--adopt ' : ''}${t.number}
   It prints WORKTREE_DIR=<path> on success (expected: ${dir}). If it prints PROBLEM=<reason> instead, stop and return status=prep_failed with that output in notes, files=[], checks={green:false,failures:[]}.
2. ${moveCard(t, 'In progress')}
Then work only in the worktree:
${inWorktree(dir)}
${adopting(t) ? `- ADOPTED TICKET: an earlier run died and left its work, uncommitted, in this worktree. Do not start over and do not reset anything. First run git status --short | wc -l and git diff --stat | tail -5, compare what exists with the issue's "To do", and continue from there. ${isCodemod(t) ? `The codemod script may still be in ${scratchDir(t)}; reuse it if it is there. ` : ''}Run the full checks early to see where it stands.\n` : ''}- Read the issue: gh issue view ${t.number} -R simpel/okazi. Its "To do" and "Done when" sections are the spec. Read the linked ADR in docs/decisions/.
- Start with the new-feature skill: it fixes the order of work and the gates (isolation test, referenced-id checks, read permission, lifecycle, concurrency, approval labels) that belong to this ticket. Then use the skill it names for each step (new-entity, new-core-operation, db-migration, i18n-strings, new-ui-component, structure-fix). Migrations are fine: your database is yours alone.
- While working, run the cheap checks after every coherent group of edits: pnpm lint and pnpm check:structure (seconds), pnpm --filter <package> typecheck for the package you touched, and the targeted pnpm test for it. A structure or type error found now costs one edit; found at the end it costs a whole fix round. Pipe long output through tail or grep.
- ${READING_RULES}
- Do NOT run git add/commit/push/rebase/stash/checkout/reset. The landing step commits.
- If the spec needs a human decision or is blocked by missing work, stop and return status=blocked with the reason in notes.
- ${FOLLOW_UP_RULE}
${isCodemod(t) ? `- ${codemodRules(t)}\n` : ''}- If the ticket adds or changes data or behaviour, also run seed:demo against an empty database in your worktree as docs/demo-seed.md describes and report the result in notes.
- When done: ${RUN_CHECKS} If something fails and the fix is obvious, fix it and run the checks again; otherwise report it.
Return files = every path you created, changed or deleted (relative to the worktree).`

const fixPrompt = (t, dir, failures) => `Checks failed after work on issue #${t.number} ("${t.title}").
${inWorktree(dir)}
Failures:
${failures.map((f) => `### ${f.check}\n${f.output}`).join('\n\n')}
Fix the cause. ${READING_RULES} No git commands that change state. ${FOLLOW_UP_RULE}
Then ${RUN_CHECKS}
Return the full list of files this ticket has touched so far (including earlier ones).`

const reviewPrompt = (t, dir) => `Use the tenancy-review skill on the uncommitted changes for issue #${t.number} (git diff plus untracked files in the worktree).
${inWorktree(dir)}
Check org scoping, permissions, AuditLog, and AI approval, plus the new-feature gates: referenced ids checked for org and read permission, read permission on search and UI, archive/rename/removal lifecycle, races returning CONFLICT. Do not edit files. ok=false only for a real tenancy/permission/audit defect in this ticket's changes; list each with file:line. Defects in code this ticket did not touch go in followUps instead (they must not block the ticket).${isCodemod(t) ? '\nThis ticket is a mechanical rename done by a script. Review the hand-written parts (the migration, SQL functions and triggers, anything that is not a pure identifier substitution) and skip the substituted lines.' : ''}`

// Landing and parking are scripts (tools/backlog/land.sh, park.sh, tested in a sandbox repo): commit, rebase, the
// skip-checks-when-main-did-not-move rule, push retries, board move and cleanup are deterministic. The agent that
// runs them is a one-command runner; a model only works where judgment is needed (conflicts, red checks).
const sh = (v) => `'${String(v).replace(/'/g, `'\\''`)}'`
const boardEnv = (t, model) => `ITEM_ID=${t.itemId} PROJECT_ID=${PROJECT_ID} STATUS_FIELD=${STATUS_FIELD} DONE_OPTION=${STATUS_OPTION.Done} PARKED_OPTION=${STATUS_OPTION.Parked} CO_AUTHOR=${sh(coAuthor(model))}`
const withStdin = (cmd, text) => `${cmd} <<'OKAZI_EOF'\n${text}\nOKAZI_EOF`
const runnerPrompt = (cmd) => `Run exactly this one command from ${REPO} and nothing else. Its last line of output is one JSON object; return that object unchanged. If it prints no JSON, return state="failed" with the last 20 lines as reason.\n${cmd}`
const landCmd = (t, summary, model) => withStdin(`${boardEnv(t, model)} tools/backlog/land.sh ${t.number} --title ${sh(t.title)}`, summary)
const resumeCmd = (t, model) => `${boardEnv(t, model)} tools/backlog/land.sh ${t.number} --resume`

const resolvePrompt = (t, dir, files, model) => `Rebasing issue #${t.number} ("${t.title}") onto origin/main stopped on conflicts in: ${files}. Tickets in a batch often touch the same registries, index files, i18n messages or role templates.
${inWorktree(dir)}
- For each conflicted file, read both sides (git diff, git log -p origin/main -3 -- <file>) and keep the intent of BOTH: main's change and this ticket's. Never drop main's lines to make the conflict go away.
- git add each resolved file. Do not run git rebase --continue, commit or push: the script does that.
- Only if a conflict is a real semantic clash you cannot reconcile with confidence: git rebase --abort and return state="failed", reason "rebase conflict: <files>: <why>".
- Then run exactly this from ${REPO} and return its JSON unchanged: ${resumeCmd(t, model)}`

const landFixPrompt = (t, dir, checks, model) => `After rebasing issue #${t.number} ("${t.title}") onto a moved origin/main the checks are red. The cause is most likely a clash between this ticket and what landed on main meanwhile.
${inWorktree(dir)}
${checks.failures.map((f) => `### ${f.check}\n${f.output}`).join('\n\n')}
Fix the cause in the worktree. ${READING_RULES} Do not run git add, commit, amend or push: the script amends the ticket's commit. Then run exactly this from ${REPO} and return its JSON unchanged: ${resumeCmd(t, model)}`

const parkCmd = (t, reason, model) => withStdin(`${boardEnv(t, model)} tools/backlog/park.sh ${t.number} ${sh(t.title)}`, reason)

const followUpPrompt = (items) => `File follow-up issues on simpel/okazi for problems agents found outside their ticket's scope. Work in ${REPO}; do not edit files.
Findings (JSON): ${JSON.stringify(items)}
1. Merge findings that describe the same problem.
2. Drop a finding if an open issue already covers it: search with gh issue list -R simpel/okazi --state open --search "<keywords>" (try 2-3 keyword sets). Add its number to duplicates as "#N: <title>".
3. Verify each remaining finding by reading the code at "where". Drop it if it is not real.
4. Create each one with the helper, never with bare gh. Write a JSON spec { title, body, labels, size, kind } to a temp file and run: node tools/backlog/ticket.mjs create --spec <file>. It creates the issue, adds it to the board and sets Status Backlog (a human triages agent findings), Size and Kind. Leave priority unset. Labels: "source:agent" plus a type label (type:tech-debt, type:feature, type:docs; bug and security use the "bug" label) and area:* label(s) from the path. kind: bug or security -> "Bugfix", tech-debt -> "Tech debt", docs -> "Docs", test-gap -> "Test", feature -> "Feature". size: your estimate (XS, S, M, L, XL). The body is in English with the sections "### Background" (start with "Found by an agent while working on #<from>."), "### Current state" (with file:line), "### To do" (checkboxes), "### Seed data" ("No seed change expected" unless the fix touches data) and "### Done when". The helper prints {ok, number} or {ok:false, errors}: fix the errors and run it again.
Return the created issue numbers.`

// ---- Ticket pipeline ---------------------------------------------------------
// Landing is serialised: each ticket rebases on what the previous one pushed.
let landingQueue = Promise.resolve()
function serially(fn) {
  const run = landingQueue.then(fn)
  landingQueue = run.catch(() => {})
  return run
}

async function park(t, dir, reason, model) {
  const p = await agent(runnerPrompt(parkCmd(t, reason, model)), { label: `park #${t.number}`, phase: 'Park', schema: PARK, model: 'haiku', effort: 'low' })
  log(`#${t.number} parked${p && p.branch ? ` on ${p.branch}` : ''}: ${reason.split('\n')[0]}`)
  return { t, outcome: 'parked', branch: p ? p.branch : null, reason: reason.split('\n')[0] }
}

// Landing is serialised as a whole, resolve and fix rounds included: main must not move under a half-landed ticket.
async function landTicket(t, dir, summary, model) {
  const step = (prompt, model, label) => agent(prompt, { label: `${label} #${t.number}`, phase: 'Land', schema: LAND, model, ...(model === 'haiku' ? { effort: 'low' } : {}) })
  let r = await step(runnerPrompt(landCmd(t, summary, model)), 'haiku', 'land')
  for (let round = 1; r && r.state !== 'landed' && round <= 2; round++) {
    if (r.state === 'conflict') r = await step(resolvePrompt(t, dir, r.files, model), 'sonnet', `resolve r${round}`)
    else if (r.state === 'red' && r.checks) r = await step(landFixPrompt(t, dir, r.checks, model), 'sonnet', `land-fix r${round}`)
    else break
  }
  return r
}

const landFailure = (r) => {
  if (!r) return 'land agent failed'
  if (r.state === 'conflict') return `rebase conflict: ${r.files}`
  if (r.state === 'red') return `red before push\n${(r.checks ? r.checks.failures : []).map((f) => `${f.check}:\n${f.output}`).join('\n\n')}`
  return r.reason || `land ${r.state}`
}

// Each fix round reports its own checks, so no separate verify agent is needed between rounds.
// Stops early when a round leaves the failures exactly as they were: more rounds would repeat the same work.
const failureKey = (v) => v.failures.map((f) => `${f.check}:${f.output}`).join('\n')
async function fixLoop(t, dir, state, collect, checks) {
  const rounds = fixRounds(t)
  let v = checks
  let before = null
  for (let round = 1; v && !v.green && round <= rounds; round++) {
    if (before !== null && failureKey(v) === before) break
    before = failureKey(v)
    if (round === rounds) state.model = assertModel(escalate(state.model))
    const r = await agent(fixPrompt(t, dir, v.failures), { label: `fix #${t.number} r${round} ${state.model}`, phase: 'Verify', schema: IMPL, model: state.model })
    collect(r)
    if (r && r.files.length) state.files = [...new Set([...state.files, ...r.files])]
    v = r ? r.checks : null
  }
  return v
}

async function runTicket(t) {
  const dir = wtDir(t)
  const state = { model: assertModel(pickModel(t)), files: [] }
  const collect = (r) => r && r.followUps && r.followUps.forEach((f) => followUps.push({ ...f, from: t.number }))
  const impl = await agent(implPrompt(t, dir), { label: `#${t.number} ${state.model}`, phase: 'Implement', schema: IMPL, model: state.model })
  if (!impl) return park(t, dir, 'implement agent failed', state.model)
  // prep.sh refuses closed issues and locked tickets (another run or agent owns the worktree): never park those,
  // parking would touch the other run's worktree.
  if (impl.status === 'prep_failed') return { t, outcome: 'failed', reason: `worktree setup failed: ${impl.notes || impl.summary}` }
  collect(impl)
  if (impl.status === 'blocked') return park(t, dir, `blocked: ${impl.notes || impl.summary}`, state.model)
  if (!impl.files.length) return park(t, dir, 'implement agent reported no changes', state.model)
  state.files = impl.files

  const v = await fixLoop(t, dir, state, collect, impl.checks)
  if (!v || !v.green) {
    const why = v ? v.failures.map((f) => `${f.check}:\n${f.output}`).join('\n\n') : 'fix agent failed'
    return park(t, dir, `checks still red after the fix rounds\n${why}`, state.model)
  }

  if (needsTenancyReview(t)) {
    const r = await agent(reviewPrompt(t, dir), { label: `tenancy #${t.number}`, phase: 'Review', schema: REVIEW, model: reviewModel(t) })
    if (!r) return park(t, dir, 'tenancy review agent failed', state.model)
    collect(r)
    if (!r.ok) return park(t, dir, `tenancy review rejected\n${r.findings.join('\n')}`, state.model)
  }

  const land = await serially(() => landTicket(t, dir, impl.summary, state.model))
  if (!land || land.state !== 'landed') return park(t, dir, landFailure(land), state.model)
  log(`#${t.number} landed ${land.sha || ''} (${state.model})`)
  return { t, outcome: 'landed', sha: land.sha, model: state.model }
}

// ---- Main loop -------------------------------------------------------------
// Tickets under the same ADR tend to edit the same files and collide on rebase, so a batch takes at most
// one per ADR. The others stay unselected and come up in a later batch.
const adrs = (t) => t.labels.filter((l) => l.startsWith('adr:'))
function packBatch(tickets) {
  const ready = tickets
    .filter((t) => t.openBlockers.length === 0)
    // Defence in depth: select.mjs already limits to the wanted statuses, so a card being worked on is never dispatched twice.
    .filter((t) => STATUSES.includes(t.status))
    // A card in progress is only picked up when it is explicitly adopted.
    .filter((t) => t.status !== 'In progress' || adopting(t))
    .filter((t) => !t.labels.includes('type:decision'))
    // Agent findings wait in Backlog until a human moves them to Todo; otherwise a run could feed itself.
    .filter((t) => !(t.labels.includes('source:agent') && t.status === 'Backlog'))
    .sort((a, b) => (a.priority || 'P9').localeCompare(b.priority || 'P9') || a.number - b.number)
  const alone = ready.find(isExclusive)
  if (alone) return [alone]
  const batch = []
  const taken = new Set()
  for (const t of ready) {
    if (batch.length === BATCH_SIZE) break
    if (adrs(t).some((a) => taken.has(a))) continue
    adrs(t).forEach((a) => taken.add(a))
    batch.push(t)
  }
  return batch
}

const results = []
const followUps = []
const filed = []
const tried = [] // every ticket attempted this run; never reselected, so the loop always ends
for (let n = 1; n <= MAX_BATCHES; n++) {
  phase('Select')
  const sel = await agent(selectPrompt(tried), { label: `select #${n}`, schema: TICKETS, model: 'haiku', effort: 'low' })
  if (!sel || !sel.ok) {
    log(`Stopped: ${sel ? sel.problem : 'select agent failed'}`)
    break
  }
  const batch = packBatch(sel.tickets)
  const blocked = sel.tickets.filter((t) => t.openBlockers.length).length
  if (!batch.length) {
    log(`Board drained: no unblocked non-decision tickets left (${blocked} blocked).`)
    break
  }
  log(`Batch ${n}: ${batch.map((t) => `#${t.number} (${pickModel(t)}${isCodemod(t) ? ', codemod' : ''}${isExclusive(t) ? ', alone' : ''}${challenges(t).length ? `; challenge: ${challenges(t).join('; ')}` : ''})`).join(', ')}; ${blocked} still blocked`)
  if (n === MAX_BATCHES) log(`Last batch allowed by maxBatches/safety cap (${MAX_BATCHES}).`)
  batch.forEach((t) => tried.push(t.number))

  const out = await parallel(batch.map((t) => () => runTicket(t)))
  out.forEach((r, i) => results.push(r || { t: batch[i], outcome: 'failed', reason: 'pipeline error' }))

  // Barrier on purpose: dedup needs every finding of the batch.
  if (followUps.length) {
    phase('Follow-ups')
    const items = followUps.splice(0)
    const f = await agent(followUpPrompt(items), { label: `follow-ups #${n}`, phase: 'Follow-ups', schema: FILED, model: 'sonnet' })
    if (f) filed.push(...f.created)
    log(`Follow-ups: ${items.length} found, ${f ? f.created.length : 0} filed (source:agent, Backlog)${f && f.duplicates && f.duplicates.length ? `, ${f.duplicates.length} already tracked` : ''}`)
  }
}

const pick = (o) => results.filter((r) => r.outcome === o).map((r) => ({ number: r.t.number, title: r.t.title, sha: r.sha, branch: r.branch, reason: r.reason, model: r.model }))
return { landed: pick('landed'), parked: pick('parked'), failed: pick('failed'), followUpIssues: filed }
