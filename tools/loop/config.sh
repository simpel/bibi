#!/usr/bin/env bash
# Settings and helpers for the ticket loop (sourced, not run). Values already in the environment win.
LOOP_HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=../backlog/lib.sh
. "$LOOP_HERE/../backlog/lib.sh"

: "${LOOP_DIR:=$(dirname "$MAIN")/bibi-worktrees/.loop}"
: "${IDLE_SECONDS:=1800}"         # sleep when no ticket is ready
: "${RATE_LIMIT_SECONDS:=900}"    # back off after a rate-limit error; it is not a failed ticket
: "${MAX_PARKED_IN_A_ROW:=3}"     # stop the slot after this many parked tickets in a row
: "${REVIEW_BUDGET_USD:=3}"       # the tenancy review session
: "${REVIEW_MODEL:=opus}"
# Changes under these paths get a tenancy review (the tenancy-review skill).
: "${REVIEW_PATHS:=^(packages/(core|db|auth)|apps/mcp)/}"

# The tools a session gets. A short list keeps every turn's context small (about 18k tokens against 39k for
# the default set). Sessions never commit, push, merge or call gh: only ship.sh and park.sh do. A compound command
# runs only when every part is allowed, so the allowlist covers the usual shell helpers; the deny list wins over it.
LOOP_TOOLS="Bash,Read,Edit,Write,Glob,Grep"
LOOP_ALLOWED=(
  "Read" "Edit" "Write" "Glob" "Grep"
  "Bash(pnpm:*)" "Bash(node:*)" "Bash(npx prisma:*)" "Bash($LOOP_HERE/verify.sh)"
  "Bash(git status:*)" "Bash(git diff:*)" "Bash(git log:*)" "Bash(git show:*)" "Bash(git add:*)" "Bash(git mv:*)"
  "Bash(ls:*)" "Bash(cat:*)" "Bash(head:*)" "Bash(tail:*)" "Bash(wc:*)" "Bash(grep:*)" "Bash(find:*)" "Bash(mkdir:*)"
  "Bash(cd:*)" "Bash(sed:*)" "Bash(python3:*)" "Bash(npx:*)" "Bash(echo:*)" "Bash(printf:*)" "Bash(jq:*)" "Bash(sort:*)"
  "Bash(mv:*)" "Bash(cp:*)" "Bash(rm:*)" "Bash(touch:*)" "Bash(diff:*)" "Bash(test:*)"
)
LOOP_DENIED=(
  "Bash(git push:*)" "Bash(git commit:*)" "Bash(git reset:*)" "Bash(git checkout:*)" "Bash(git rebase:*)" "Bash(git branch:*)"
  "Bash(gh:*)" "Bash(curl:*)" "Bash(rm -rf /:*)" "Bash(rm -rf ~:*)"
)

slot_dir() { echo "$(dirname "$MAIN")/bibi-worktrees/slot-$1"; }
log() { printf '%s [slot %s] %s\n' "$(date +%H:%M:%S)" "${SLOT:-?}" "$*" >&2; }

# One headless session: run_claude <out.json> <model> <effort> <budget> [extra claude args...] (prompt on stdin).
# MCP servers, plugins and user settings are left out; only the project's settings and CLAUDE.md files load.
run_claude() {
  local out="$1" model="$2" effort="$3" budget="$4"
  shift 4
  claude -p --model "$model" --effort "$effort" --max-budget-usd "$budget" \
    --strict-mcp-config --mcp-config "$LOOP_HERE/empty-mcp.json" --setting-sources project --permission-mode acceptEdits \
    --tools "$LOOP_TOOLS" --allowedTools "${LOOP_ALLOWED[@]}" \
    --disallowedTools "${LOOP_DENIED[@]}" --output-format json "$@" >"$out" 2>"$out.err"
}

# Sum cost and tokens over the session result files given: prints {costUsd,inputTokens,cacheReadTokens}.
session_cost() {
  jq -sc '{costUsd: (map(.total_cost_usd // 0) | add * 100 | round / 100),
    inputTokens: (map(.usage | (.input_tokens + .cache_creation_input_tokens + .cache_read_input_tokens)) | add),
    cacheReadTokens: (map(.usage.cache_read_input_tokens) | add)}' "$@" 2>/dev/null || echo '{}'
}

# True when a session result says it hit a rate or usage limit (not a failure of the ticket).
rate_limited() { grep -qiE 'rate.?limit|usage limit|overloaded' "$1" "$1.err" 2>/dev/null; }
