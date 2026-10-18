export const meta = {
  name: 'work-backlog',
  description: 'Work unblocked tickets from project 8, one isolated worktree per ticket, landing each on main',
  whenToUse: 'Run to let agents implement ready tickets from the okazi board until none are left. Args: { batchSize?: 3, maxBatches?: unlimited (safety cap 50), includeBacklog?: false, only?: [issueNumbers] }',
  phases: [
    { title: 'Select', detail: 'read board + blockers, pick a batch' },
    { title: 'Implement', detail: 'one agent per ticket: creates its worktree, implements, runs the full checks' },
    { title: 'Verify', detail: 'fix loop with escalation when the implementer reports red checks' },
    { title: 'Review', detail: 'tenancy review on Opus for core/db/auth/mcp changes' },
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
const MAX_FIX_ROUNDS = 2
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
const CO_AUTHOR = 'Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>'
const wtName = (t) => `t-${t.number}`
const wtDir = (t) => `${REPO}-worktrees/${wtName(t)}` // where pnpm wt:new puts it
// Cheapest first: a lint, structure or type error is known in seconds, before the slow test run starts.
const CHECKS = 'pnpm lint, pnpm check:structure, pnpm typecheck, pnpm db:migrate, pnpm test'

// ---- Model choice (deterministic, from labels) ----------------------------
function pickModel(t) {
  const L = new Set(t.labels)
  const has = (x) => L.has(x)
  // No Haiku for implementation: measured ~93 turns per ticket against Sonnet's ~19, so it cost more in total.
  // Opus only where a mistake is expensive. Core features go to Sonnet: the Opus tenancy review and the
  // fix-loop escalation catch what it misses (area:core + type:feature on Opus was ~every ticket).
  if (has('size:L') || has('area:auth') || has('area:db')) return 'opus'
  return 'sonnet'
}
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
          status: { type: 'string' },
          openBlockers: { type: 'array', items: { type: 'number' } },
        },
        required: ['number', 'title', 'labels', 'itemId', 'priority', 'openBlockers'],
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
    landed: { type: 'boolean' },
    sha: { type: 'string' },
    reason: { type: 'string' },
  },
  required: ['landed'],
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
  properties: { ok: { type: 'boolean' }, branch: { type: 'string' }, problem: { type: 'string' } },
  required: ['ok'],
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
// just to run commands, and the land step re-runs them anyway.
const RUN_CHECKS = `Run the full checks: first docker compose -p okazi -f ${REPO}/docker-compose.yml up -d --wait postgres, then in order ${CHECKS}, piping long output through tail or grep. Run the first three even if one fails and report every failure; if any of them failed, skip db:migrate and pnpm test (they would only repeat the problem) and report green=false. Report them in checks: green=true only if every command passed; for each failure keep a short excerpt (<60 lines).`

const implPrompt = (t, dir) => `Implement GitHub issue #${t.number} ("${t.title}").
Setup (run exactly these two commands first):
1. From ${REPO}: tools/backlog/prep.sh ${t.number}
   It prints WORKTREE_DIR=<path> on success (expected: ${dir}). If it prints PROBLEM=<reason> instead, stop and return status=prep_failed with that output in notes, files=[], checks={green:false,failures:[]}.
2. ${moveCard(t, 'In progress')}
Then work only in the worktree:
${inWorktree(dir)}
- Read the issue: gh issue view ${t.number} -R simpel/okazi. Its "To do" and "Done when" sections are the spec. Read the linked ADR in docs/decisions/.
- Start with the new-feature skill: it fixes the order of work and the gates (isolation test, referenced-id checks, read permission, lifecycle, concurrency, approval labels) that belong to this ticket. Then use the skill it names for each step (new-entity, new-core-operation, db-migration, i18n-strings, new-ui-component, structure-fix). Migrations are fine: your database is yours alone.
- While working, run the cheap checks after every coherent group of edits: pnpm lint and pnpm check:structure (seconds), pnpm --filter <package> typecheck for the package you touched, and the targeted pnpm test for it. A structure or type error found now costs one edit; found at the end it costs a whole fix round. Pipe long output through tail or grep.
- ${READING_RULES}
- Do NOT run git add/commit/push/rebase/stash/checkout/reset. The landing step commits.
- If the spec needs a human decision or is blocked by missing work, stop and return status=blocked with the reason in notes.
- ${FOLLOW_UP_RULE}
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
Check org scoping, permissions, AuditLog, and AI approval, plus the new-feature gates: referenced ids checked for org and read permission, read permission on search and UI, archive/rename/removal lifecycle, races returning CONFLICT. Do not edit files. ok=false only for a real tenancy/permission/audit defect in this ticket's changes; list each with file:line. Defects in code this ticket did not touch go in followUps instead (they must not block the ticket).`

const landPrompt = (t, dir, summary) => `Land issue #${t.number} on main. Other tickets land one at a time, so origin/main may have moved.
${inWorktree(dir)}
1. If there are uncommitted changes: git add -A, then git commit with subject "${t.title}", a blank line, "Closes #${t.number}", a blank line, a 1-3 line summary (${summary}), a blank line, and:
${CO_AUTHOR}
2. git fetch origin, then git rebase origin/main. On a conflict, resolve it rather than giving up: tickets in a batch often touch the same registries, index files, i18n messages or role templates.
   - For each conflicted file, read both sides (git diff, git log -p origin/main -3 -- <file>) and keep the intent of BOTH: main's change and this ticket's. Never drop main's lines to make the conflict go away.
   - git add the file, then git rebase --continue (GIT_EDITOR=true). Repeat for every conflicting commit.
   - Only if a conflict is a real semantic clash you cannot reconcile with confidence: git rebase --abort and return landed=false, reason "rebase conflict: <files>: <why it could not be resolved>".
3. Ensure Postgres is up (docker compose -p okazi -f ${REPO}/docker-compose.yml up -d --wait postgres). Before the rebase, compare git merge-base HEAD origin/main with git rev-parse origin/main. If they are equal, origin/main has not moved since this branch was cut, the rebase changes nothing and the implementer's green checks ran on this exact tree: skip the checks. If they differ, run ${CHECKS} after the rebase. This is the independent check before main. If a failure comes from a conflict you resolved, fix it, fold it into the ticket's commit (git add -A, git commit --amend --no-edit) and re-run (at most 2 tries). On any remaining failure return landed=false, reason "red before push" plus a short excerpt.
4. git push origin HEAD:main. Never force-push. If rejected because origin moved, go back to step 2 (at most 3 tries in total).
5. ${moveCard(t, 'Done')}
6. From ${REPO}: pnpm wt:rm ${wtName(t)} --delete-branch, then tools/backlog/release.sh ${t.number} (releases the ticket lock).
Return landed=true and the pushed SHA.`

const parkPrompt = (t, dir, reason) => `Issue #${t.number} could not land. Park its work so a human or a later run can pick it up.
${inWorktree(dir)}
Reason: ${reason}
1. If a rebase is in progress: git rebase --abort.
2. If there are uncommitted changes: git add -A, then git commit with subject "WIP (parked): #${t.number} ${t.title}", a blank line, "Refs #${t.number}" (never "Closes"), the reason (max 30 lines), a blank line, and:
${CO_AUTHOR}
3. If the branch has no commits beyond origin/main (git log origin/main..HEAD is empty), skip to step 5 and return branch "".
4. git branch -m parked/${t.number} (append -2, -3, … if taken), then git push -u origin <branch>. Never force-push.
5. gh issue comment ${t.number} -R simpel/okazi with a short English note: the work-backlog run parked it, the branch link (https://github.com/simpel/okazi/tree/<branch>) if any, and the reason (max 30 lines). Then: ${moveCard(t, 'Parked')}
6. From ${REPO}: pnpm wt:rm ${wtName(t)} --force (keeps the branch; drops the worktree database), then tools/backlog/release.sh ${t.number} (releases the ticket lock).
Return ok and the branch name.`

const followUpPrompt = (items) => `File follow-up issues on simpel/okazi for problems agents found outside their ticket's scope. Work in ${REPO}; do not edit files.
Findings (JSON): ${JSON.stringify(items)}
1. Merge findings that describe the same problem.
2. Drop a finding if an open issue already covers it: search with gh issue list -R simpel/okazi --state open --search "<keywords>" (try 2-3 keyword sets). Add its number to duplicates as "#N: <title>".
3. Verify each remaining finding by reading the code at "where". Drop it if it is not real.
4. Create each one with gh issue create -R simpel/okazi, in English, labels "source:agent" plus a matching type label (type:tech-debt, type:feature, type:docs; bug and security use the "bug" label) and area:* label(s) from the path. Body sections, as in other issues: "### Background" (start with "Found by an agent while working on #<from>."), "### Current state" (with file:line), "### To do" (checkboxes), "### Done when".
5. Add each to the board and set Status "Backlog" (never Todo: a human triages agent findings). Never run item-list or field-list; all ids are given here. gh project item-add 8 --owner simpel --url <issue> --format json prints the item id (.id). Then run ${EDIT('<itemId>', STATUS_FIELD, STATUS_OPTION.Backlog)}. Also set Size by your estimate with ${EDIT('<itemId>', SIZE_FIELD, '<option>')}, option ids ${JSON.stringify(SIZE_OPTION)}; leave Priority unset.
Return the created issue numbers.`

// ---- Ticket pipeline ---------------------------------------------------------
// Landing is serialised: each ticket rebases on what the previous one pushed.
let landingQueue = Promise.resolve()
function serially(fn) {
  const run = landingQueue.then(fn)
  landingQueue = run.catch(() => {})
  return run
}

async function park(t, dir, reason) {
  const p = await agent(parkPrompt(t, dir, reason), { label: `park #${t.number}`, phase: 'Park', schema: PARK, model: 'haiku' })
  log(`#${t.number} parked${p && p.branch ? ` on ${p.branch}` : ''}: ${reason.split('\n')[0]}`)
  return { t, outcome: 'parked', branch: p ? p.branch : null, reason: reason.split('\n')[0] }
}

// Each fix round reports its own checks, so no separate verify agent is needed between rounds.
async function fixLoop(t, dir, state, collect, checks) {
  let v = checks
  for (let round = 1; v && !v.green && round <= MAX_FIX_ROUNDS; round++) {
    if (round === MAX_FIX_ROUNDS) state.model = assertModel(escalate(state.model))
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
  if (!impl) return park(t, dir, 'implement agent failed')
  // prep.sh refuses closed issues and locked tickets (another run or agent owns the worktree): never park those,
  // parking would touch the other run's worktree.
  if (impl.status === 'prep_failed') return { t, outcome: 'failed', reason: `worktree setup failed: ${impl.notes || impl.summary}` }
  collect(impl)
  if (impl.status === 'blocked') return park(t, dir, `blocked: ${impl.notes || impl.summary}`)
  if (!impl.files.length) return park(t, dir, 'implement agent reported no changes')
  state.files = impl.files

  const v = await fixLoop(t, dir, state, collect, impl.checks)
  if (!v || !v.green) {
    const why = v ? v.failures.map((f) => `${f.check}:\n${f.output}`).join('\n\n') : 'fix agent failed'
    return park(t, dir, `checks still red after ${MAX_FIX_ROUNDS} fix rounds\n${why}`)
  }

  if (needsTenancyReview(t)) {
    const r = await agent(reviewPrompt(t, dir), { label: `tenancy #${t.number}`, phase: 'Review', schema: REVIEW, model: 'opus' })
    if (!r) return park(t, dir, 'tenancy review agent failed')
    collect(r)
    if (!r.ok) return park(t, dir, `tenancy review rejected\n${r.findings.join('\n')}`)
  }

  const land = await serially(() =>
    agent(landPrompt(t, dir, impl.summary), { label: `land #${t.number}`, phase: 'Land', schema: LAND, model: 'sonnet' }),
  )
  if (!land || !land.landed) return park(t, dir, land ? land.reason : 'land agent failed')
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
    .filter((t) => !t.labels.includes('type:decision'))
    // Agent findings wait in Backlog until a human moves them to Todo; otherwise a run could feed itself.
    .filter((t) => !(t.labels.includes('source:agent') && t.status === 'Backlog'))
    .sort((a, b) => (a.priority || 'P9').localeCompare(b.priority || 'P9') || a.number - b.number)
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
  log(`Batch ${n}: ${batch.map((t) => `#${t.number} (${pickModel(t)})`).join(', ')}; ${blocked} still blocked`)
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
