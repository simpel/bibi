export const meta = {
  name: 'work-backlog',
  description: 'Work unblocked tickets from project 8 in parallel batches and commit each to main',
  whenToUse: 'Run to let agents implement ready tickets from the okazi board. Args: { batchSize?: 3, maxBatches?: 3, only?: [issueNumbers] }',
  phases: [
    { title: 'Select', detail: 'read board + blockers, pick a non-colliding batch' },
    { title: 'Implement', detail: 'one agent per ticket, model by complexity, no commits' },
    { title: 'Verify', detail: 'full checks once per batch, fix loop with escalation' },
    { title: 'Review', detail: 'tenancy review on Opus for core/db/auth/mcp changes' },
    { title: 'Commit', detail: 'one commit per ticket on main, push, board to Done' },
  ],
}

// ---- Config ---------------------------------------------------------------
const BATCH_SIZE = (args && args.batchSize) || 3
const MAX_BATCHES = (args && args.maxBatches) || 3
const ONLY = (args && args.only) || null
const MAX_FIX_ROUNDS = 2
const TIERS = ['haiku', 'sonnet', 'opus'] // fable is never used
const BOARD = `Project board 8 (owner simpel): project id PVT_kwHOAAOKWM4BnFHj, Status field PVTSSF_lAHOAAOKWM4BnFHjzhlrXtM, options Backlog=f75ad846 Todo=61e4505c "In progress"=47fc9ee4 Done=98236657. Item id: gh project item-list 8 --owner simpel --format json -L 300 and match content.number.`

// ---- Model choice (deterministic, from labels) ----------------------------
function pickModel(t) {
  const L = new Set(t.labels)
  const has = (x) => L.has(x)
  if (has('type:docs') || has('area:i18n')) return 'haiku'
  if (has('size:S') && (has('type:tech-debt') || has('type:infra'))) return 'haiku'
  if (has('size:L') || has('area:auth') || has('area:db')) return 'opus'
  if (has('area:core') && has('type:feature')) return 'opus'
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
const TICKETS = {
  type: 'object',
  properties: {
    clean: { type: 'boolean' },
    problem: { type: 'string' },
    tickets: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          number: { type: 'number' },
          title: { type: 'string' },
          labels: { type: 'array', items: { type: 'string' } },
          priority: { type: 'string' },
          openBlockers: { type: 'array', items: { type: 'number' } },
          needsMigration: { type: 'boolean' },
        },
        required: ['number', 'title', 'labels', 'priority', 'openBlockers', 'needsMigration'],
      },
    },
  },
  required: ['clean', 'tickets'],
}
const IMPL = {
  type: 'object',
  properties: {
    status: { type: 'string', enum: ['done', 'blocked'] },
    summary: { type: 'string' },
    files: { type: 'array', items: { type: 'string' } },
    notes: { type: 'string' },
  },
  required: ['status', 'summary', 'files'],
}
const VERIFY = {
  type: 'object',
  properties: {
    green: { type: 'boolean' },
    failures: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          ticket: { type: 'number' },
          check: { type: 'string' },
          output: { type: 'string' },
        },
        required: ['ticket', 'check', 'output'],
      },
    },
  },
  required: ['green', 'failures'],
}
const REVIEW = {
  type: 'object',
  properties: {
    ok: { type: 'boolean' },
    findings: { type: 'array', items: { type: 'string' } },
  },
  required: ['ok', 'findings'],
}
const COMMIT = {
  type: 'object',
  properties: {
    pushed: { type: 'boolean' },
    commits: { type: 'array', items: { type: 'string' } },
    problem: { type: 'string' },
  },
  required: ['pushed', 'commits'],
}

// ---- Prompts ---------------------------------------------------------------
const selectPrompt = (exclude) => `You prepare a batch for autonomous ticket work in /Users/joelsanden/Code/okazi.
1. Run \`git status --porcelain\` and \`git branch --show-current\`. If the tree is dirty or not on main, return clean=false with the reason and no tickets.
2. Run \`git pull --ff-only origin main\`. On failure return clean=false.
3. List board items: gh project item-list 8 --owner simpel --format json -L 300. Keep open issues from simpel/okazi with status "Todo".${ONLY ? ` Only consider issues ${JSON.stringify(ONLY)}.` : ''}${exclude.length ? ` Skip issues ${JSON.stringify(exclude)}.` : ''}
4. For each, read the issue (gh issue view N -R simpel/okazi --json title,labels,body). openBlockers = issue numbers under "Depends on" in the body, plus native blocked-by (gh api repos/simpel/okazi/issues/N/dependencies/blocked_by), that are still OPEN.
5. needsMigration = the To do list requires a Prisma schema change or migration.
6. priority = the board Priority value (P0/P1/P2, "" if unset). labels = label names.
Return every Todo ticket, including blocked ones. Do not change anything.`

const implPrompt = (t) => `Implement GitHub issue #${t.number} ("${t.title}") in /Users/joelsanden/Code/okazi on branch main.
- First move its card to "In progress". ${BOARD}
- Read the issue: gh issue view ${t.number} -R simpel/okazi. Its "To do" and "Done when" sections are the spec. Read the linked ADR in docs/decisions/.
- Follow CLAUDE.md and use the matching repo skill (new-entity, new-core-operation, db-migration, i18n-strings, new-ui-component, structure-fix) where it fits.
- Other agents are editing other tickets in this same working tree right now. Touch only what this ticket needs. If a file changed under you, re-read it and merge; never revert others' edits.
- Do NOT run git add/commit/push/stash/checkout/reset. Do NOT run full-repo \`pnpm test\`; run only checks scoped to your packages (e.g. pnpm --filter <pkg> typecheck / test) and pnpm check:structure.
${t.needsMigration ? '- You own the only migration in this batch. Create it with the db-migration skill.' : '- Do not change packages/db/prisma/schema.prisma.'}
- If the spec needs a human decision or is blocked by missing work, stop and return status=blocked with the reason in notes.
Return files = every path you created, changed or deleted (repo-relative).`

const fixPrompt = (t, failures) => `Checks failed after your work on issue #${t.number} ("${t.title}") in /Users/joelsanden/Code/okazi (branch main).
Failures:
${failures.map((f) => `### ${f.check}\n${f.output}`).join('\n\n')}
Fix the cause. Same rules: no git commands, no full-repo pnpm test, keep other tickets' edits intact. Return the full list of files this ticket has touched so far (including earlier ones).`

const verifyPrompt = (batch) => `Verify the working tree of /Users/joelsanden/Code/okazi after a batch of tickets. Do not edit files and do not run git commands that change state.
Tickets and their files:
${batch.map((b) => `#${b.t.number}: ${b.files.join(', ')}`).join('\n')}
1. Ensure Postgres is up: docker compose up -d (wait until healthy). Run pnpm db:migrate if a migration was added.
2. Run, in order, and collect output: pnpm lint, pnpm typecheck, pnpm check:structure, pnpm test.
3. For each failure, attribute it to the ticket whose files are involved (best guess by path). Keep output excerpts short (<60 lines each).
green=true only if every command passed.`

const reviewPrompt = (b) => `Use the tenancy-review skill on the uncommitted changes for issue #${b.t.number} in /Users/joelsanden/Code/okazi. Files: ${b.files.join(', ')}.
Check org scoping, permissions, AuditLog, and AI approval. Do not edit files. ok=false only for a real tenancy/permission/audit defect; list each with file:line.`

const commitPrompt = (groups) => `Commit and push finished tickets in /Users/joelsanden/Code/okazi on main. Make one commit per group, in this order:
${groups.map((g, i) => `${i + 1}. Files: ${g.files.join(' ')}\n   Message subject: ${g.subject}\n   Body lines: ${g.tickets.map((t) => `Closes #${t.number}`).join(', ')}`).join('\n')}
For each: git add -- <files> (use git add -A -- <file> for deletions), then git commit with the subject, a blank line, the Closes lines, a blank line, and:
Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Never use git add . or -A without paths. If unrelated files are staged, unstage them.
Then: git pull --rebase origin main && git push origin main. Never force-push. If the push or rebase fails, stop and report it in problem.
After a successful push, set each ticket's board card to Done. ${BOARD}
Return the commit SHAs + subjects.`

// ---- Helpers ---------------------------------------------------------------
function packBatch(tickets) {
  const ready = tickets
    .filter((t) => t.openBlockers.length === 0)
    .filter((t) => !t.labels.includes('type:decision'))
    .sort((a, b) => (a.priority || 'P9').localeCompare(b.priority || 'P9') || a.number - b.number)
  const batch = []
  let migrations = 0
  let core = 0
  for (const t of ready) {
    if (batch.length >= BATCH_SIZE) break
    if (t.needsMigration && migrations >= 1) continue
    const isCore = t.labels.includes('area:core')
    if (isCore && core >= 2) continue
    batch.push(t)
    if (t.needsMigration) migrations++
    if (isCore) core++
  }
  return batch
}
// Tickets that share files must land in the same commit.
function commitGroups(done) {
  const groups = []
  for (const b of done) {
    const hit = groups.filter((g) => b.files.some((f) => g.files.has(f)))
    const merged = { tickets: [b.t], files: new Set(b.files), summaries: [b.summary] }
    for (const g of hit) {
      merged.tickets.push(...g.tickets)
      g.files.forEach((f) => merged.files.add(f))
      merged.summaries.push(...g.summaries)
      groups.splice(groups.indexOf(g), 1)
    }
    groups.push(merged)
  }
  return groups.map((g) => ({
    tickets: g.tickets,
    files: [...g.files],
    subject:
      g.tickets.length === 1
        ? g.tickets[0].title
        : g.tickets.map((t) => `#${t.number}`).join(', ') + ': ' + g.tickets.map((t) => t.title).join('; '),
  }))
}

// ---- Main loop -------------------------------------------------------------
const report = []
const skipped = []
for (let n = 1; n <= MAX_BATCHES; n++) {
  phase('Select')
  const sel = await agent(selectPrompt(skipped), { label: `select #${n}`, schema: TICKETS, model: 'haiku', effort: 'low' })
  if (!sel || !sel.clean) {
    log(`Stopped: ${sel ? sel.problem : 'select agent failed'}`)
    report.push({ batch: n, stopped: sel ? sel.problem : 'select failed' })
    break
  }
  const batch = packBatch(sel.tickets)
  const blocked = sel.tickets.filter((t) => t.openBlockers.length).length
  if (!batch.length) {
    log(`No unblocked non-decision tickets left (${blocked} blocked).`)
    break
  }
  log(`Batch ${n}: ${batch.map((t) => `#${t.number} (${pickModel(t)})`).join(', ')}; ${blocked} tickets still blocked`)

  phase('Implement')
  const work = (
    await parallel(
      batch.map((t) => async () => {
        const model = assertModel(pickModel(t))
        const r = await agent(implPrompt(t), { label: `#${t.number} ${model}`, phase: 'Implement', schema: IMPL, model })
        return r ? { t, model, ...r } : null
      }),
    )
  ).filter(Boolean)
  for (const w of work.filter((w) => w.status === 'blocked')) {
    log(`#${w.t.number} blocked: ${w.notes || w.summary}`)
    skipped.push(w.t.number)
  }
  const done = work.filter((w) => w.status === 'done' && w.files.length)
  if (!done.length) continue

  phase('Verify')
  let v = await agent(verifyPrompt(done), { label: `verify #${n}`, schema: VERIFY, model: 'sonnet' })
  for (let round = 1; v && !v.green && round <= MAX_FIX_ROUNDS; round++) {
    const failing = done.filter((d) => v.failures.some((f) => f.ticket === d.t.number))
    const targets = failing.length ? failing : done
    await parallel(
      targets.map((d) => async () => {
        d.model = round === MAX_FIX_ROUNDS ? assertModel(escalate(d.model)) : d.model
        const mine = v.failures.filter((f) => f.ticket === d.t.number)
        const r = await agent(fixPrompt(d.t, mine.length ? mine : v.failures), {
          label: `fix #${d.t.number} r${round} ${d.model}`,
          phase: 'Verify',
          schema: IMPL,
          model: d.model,
        })
        if (r && r.files.length) d.files = [...new Set([...d.files, ...r.files])]
      }),
    )
    v = await agent(verifyPrompt(done), { label: `verify #${n}.${round}`, schema: VERIFY, model: 'sonnet' })
  }
  if (!v || !v.green) {
    log('Checks still red after fixes. Leaving the working tree uncommitted for a human.')
    report.push({ batch: n, red: v ? v.failures : 'verify failed', tickets: done.map((d) => d.t.number) })
    break
  }

  phase('Review')
  const reviews = await parallel(
    done
      .filter((d) => needsTenancyReview(d.t))
      .map((d) => async () => {
        const r = await agent(reviewPrompt(d), { label: `tenancy #${d.t.number}`, phase: 'Review', schema: REVIEW, model: 'opus' })
        return { d, r }
      }),
  )
  const rejected = reviews.filter(Boolean).filter((x) => x.r && !x.r.ok)
  if (rejected.length) {
    log(`Tenancy review rejected ${rejected.map((x) => '#' + x.d.t.number).join(', ')}. Leaving the tree uncommitted.`)
    report.push({ batch: n, tenancy: rejected.map((x) => ({ ticket: x.d.t.number, findings: x.r.findings })) })
    break
  }

  phase('Commit')
  const groups = commitGroups(done)
  const c = await agent(commitPrompt(groups), { label: `commit #${n}`, schema: COMMIT, model: 'haiku' })
  report.push({ batch: n, committed: c ? c.commits : [], pushed: c ? c.pushed : false, models: done.map((d) => `#${d.t.number}:${d.model}`) })
  if (!c || !c.pushed) {
    log(`Push failed: ${c ? c.problem : 'commit agent failed'}`)
    break
  }
}
return { report, skipped }
