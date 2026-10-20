#!/usr/bin/env bash
# Counts what is left of the old names after a rename ticket, for the work-backlog workflow's codemod gate:
#   tools/backlog/residue.sh <worktree-dir> <old-name>...
# Applied migrations, ADR history, node_modules, generated code and lockfiles may keep old names and are skipped.
# A name with an internal capital, digit, underscore or hyphen (an identifier or file name) matches as a substring;
# a plain lowercase word matches as a whole word. Matching is case-insensitive.
# Uses grep, not rg: rg may only exist as a shell function in an agent's shell, not for a script.
# Prints {"matches":[{"name","count","files":[up to 5]}]}; names with no match are left out. Exit code is always 0.
set -uo pipefail
DIR="${1:-}"
shift || true
cd "$DIR" 2>/dev/null || { jq -nc '{matches:[]}'; exit 0; }
EXCLUDES=(--exclude-dir=node_modules --exclude-dir=generated --exclude-dir=.next --exclude-dir=.git --exclude-dir=migrations --exclude-dir=decisions --exclude=pnpm-lock.yaml)
RESULT='[]'
for NAME in "$@"; do
  MODE=(-F)
  if [[ "$NAME" =~ ^[a-z]+$ ]]; then MODE=(-F -w); fi
  COUNT="$(grep -rIi "${MODE[@]}" -o "${EXCLUDES[@]}" -e "$NAME" . 2>/dev/null | wc -l | tr -d ' ')"
  [ "${COUNT:-0}" -gt 0 ] || continue
  FILES="$(grep -rIil "${MODE[@]}" "${EXCLUDES[@]}" -e "$NAME" . 2>/dev/null | head -5 | jq -R . | jq -sc .)"
  RESULT="$(jq -c --arg name "$NAME" --argjson count "$COUNT" --argjson files "$FILES" '. + [{name:$name,count:$count,files:$files}]' <<<"$RESULT")"
done
jq -nc --argjson matches "$RESULT" '{matches:$matches}'
