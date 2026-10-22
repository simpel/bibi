#!/usr/bin/env bash
# Smoke test for ship.sh, ci.sh, arm.sh, park.sh and residue.sh in a sandbox: a bare "origin", a main checkout, a
# worktree per ticket, and fake gh, pnpm and docker commands. Nothing touches GitHub or the real repo.
# Run: bash tools/backlog/scripts-smoke.sh
set -uo pipefail
SRC="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
ROOT="$(mktemp -d)"
trap 'rm -rf "$ROOT"' EXIT
FAILED=0
pass() { echo "PASS  $1"; }
fail() { echo "FAIL  $1  -> $2"; FAILED=$((FAILED + 1)); }
eq() { if [ "$2" = "$3" ]; then pass "$1"; else fail "$1" "expected [$3] got [$2]"; fi; }
has() { if grep -qF -- "$3" <<<"$2"; then pass "$1"; else fail "$1" "missing [$3] in [$2]"; fi; }

# ---- sandbox --------------------------------------------------------------
git init -q --bare -b main "$ROOT/origin.git"
git clone -q "$ROOT/origin.git" "$ROOT/bibi" 2>/dev/null
cd "$ROOT/bibi" || exit 1
git config user.email t@t; git config user.name t
mkdir -p tools/backlog && cp "$SRC"/tools/backlog/*.sh tools/backlog/; mkdir -p tools/ci && cp "$SRC"/tools/ci/checks.json "$SRC"/tools/ci/verify.mjs tools/ci/
echo base > a.txt; echo base > b.txt; echo "old name here" > c.txt
git add -A && git commit -qm "base" && git push -q origin HEAD:main
mkdir -p "$ROOT/bibi-worktrees/.locks"
STATE="$ROOT/state"; mkdir -p "$STATE" "$ROOT/bin"

cat >"$ROOT/bin/pnpm" <<EOF
#!/usr/bin/env bash
# fake pnpm: wt:rm removes the worktree and branch; everything else succeeds
if [ "\$1" = "wt:rm" ]; then
  git -C "$ROOT/bibi" worktree remove --force "$ROOT/bibi-worktrees/\$2" 2>/dev/null
  git -C "$ROOT/bibi" branch -D "ticket/\${2#t-}" >/dev/null 2>&1
  exit 0
fi
echo "\$@" >>"$STATE/pnpm.log"; exit \${PNPM_FAIL:-0}
EOF
printf '#!/usr/bin/env bash\nexit 0\n' >"$ROOT/bin/docker"
cat >"$ROOT/bin/gh" <<EOF
#!/usr/bin/env bash
# fake gh for the sandbox
echo "gh \$*" >>"$STATE/gh.log"
case "\$1 \$2" in
  "pr list") all="\$*"; n="\${all##*ticket/}"; n="\${n%% *}"; [ -f "$STATE/pr-\$n" ] && cat "$STATE/pr-\$n" ;;
  "pr create") args=("\$@"); for i in "\${!args[@]}"; do case "\${args[\$i]}" in --title) echo "\${args[\$((i+1))]}" >"$STATE/pr-title";; --head) h="\${args[\$((i+1))]}";; esac; done
               echo 101 >"$STATE/pr-\${h#ticket/}"; echo https://github.com/x/y/pull/101 ;;
  "pr checks") cat "$STATE/checks.json" ;;
  "pr merge") echo "\$*" >"$STATE/pr-merge-args" ;;
  "pr view") if [[ "\$*" == *mergeable* ]]; then cat "$STATE/mergeable" 2>/dev/null || echo MERGEABLE; else git -C "$ROOT/origin.git" rev-parse main; fi ;;
  "pr close") rm -f "$STATE/pr-1" ;;
  "run list") if [[ "\$*" == *--workflow* ]]; then cat "$STATE/main-run.json"; else echo 77; fi ;;
  "run view") echo "FAIL packages/core test: boom" ;;
esac
exit 0
EOF
chmod +x "$ROOT/bin/"*
export PATH="$ROOT/bin:$PATH"

new_ticket() { # new_ticket <N> : a worktree with one changed file
  git -C "$ROOT/bibi" fetch -q origin
  git -C "$ROOT/bibi" worktree add -q -b "ticket/$1" "$ROOT/bibi-worktrees/t-$1" origin/main
  mkdir -p "$ROOT/bibi-worktrees/.locks/t-$1"
  echo "work for $1" >"$ROOT/bibi-worktrees/t-$1/work-$1.txt"
}
run() { (cd "$ROOT/bibi" && "$@"); }
main_commit() { # main_commit <file> <content> <message>
  (cd "$ROOT/bibi" && git pull -q --rebase origin main && echo "$2" >"$1" && git commit -qam "$3" && git push -q origin HEAD:main)
}
S="$ROOT/bibi/tools/backlog"

# ---- ship: commit, conventional title, PR ------------------------------------
new_ticket 1
OUT="$(run env KIND=Bugfix CO_AUTHOR='Co-Authored-By: Test <t@t>' "$S/ship.sh" 1 --title "Fix the thing" <<<"What changed")"
eq "ship opens a PR" "$(jq -r .state <<<"$OUT")" opened
eq "PR title carries the conventional type" "$(cat "$STATE/pr-title")" "fix: Fix the thing"
MSG="$(git -C "$ROOT/bibi-worktrees/t-1" log -1 --format=%B)"
has "commit says Closes" "$MSG" "Closes #1"
has "commit is conventional" "$MSG" "fix: Fix the thing"
eq "branch is pushed" "$(git -C "$ROOT/origin.git" rev-parse --verify -q ticket/1 >/dev/null && echo yes)" yes

# ---- ci ------------------------------------------------------------------------
echo '[{"name":"check","bucket":"pass"},{"name":"storybook","bucket":"skipping"}]' >"$STATE/checks.json"
eq "ci green" "$(jq -r .state <<<"$(run "$S/ci.sh" 1 --timeout 1)")" green
echo '[{"name":"check","bucket":"fail"}]' >"$STATE/checks.json"
OUT="$(run "$S/ci.sh" 1 --timeout 1)"
eq "ci red with the failed check" "$(jq -r .failed <<<"$OUT")" check
has "ci red carries the log" "$(jq -r .log <<<"$OUT")" "boom"
echo '[{"name":"check","bucket":"pending"}]' >"$STATE/checks.json"
eq "ci pending when the budget runs out" "$(jq -r .state <<<"$(CI_POLL_SECONDS=1 run "$S/ci.sh" 1 --timeout 1)")" pending

# ---- arm: auto-merge is enabled, nothing is merged by the run ------------------------------------
main_commit b.txt other "other work"
OUT="$(run env KIND=Bugfix CO_AUTHOR='Co-Authored-By: Test <t@t>' "$S/arm.sh" 1 --title "Fix the thing" <<<"What changed")"
eq "arm succeeds" "$(jq -r .state <<<"$OUT")" armed
ARGS="$(cat "$STATE/pr-merge-args")"
has "auto-merge is requested" "$ARGS" "--auto"
has "as a squash with the conventional subject" "$ARGS" "fix: Fix the thing (#101)"
has "the body closes the issue" "$ARGS" "Closes #1"
eq "main is untouched by the run" "$(git -C "$ROOT/origin.git" log --format=%s main | head -1)" "other work"
eq "a branch that is only behind main is not rebased" "$(git -C "$ROOT/origin.git" merge-base ticket/1 main | cut -c1-7)" "$(git -C "$ROOT/origin.git" rev-parse ticket/1~1 | cut -c1-7)"
eq "worktree is removed" "$([ -d "$ROOT/bibi-worktrees/t-1" ] && echo yes || echo no)" no
eq "lock is released" "$([ -d "$ROOT/bibi-worktrees/.locks/t-1" ] && echo yes || echo no)" no

# ---- ship conflict ---------------------------------------------------------------
new_ticket 1
echo "ticket edit" >"$ROOT/bibi-worktrees/t-1/a.txt"
main_commit a.txt "main edit" "main edits a"
OUT="$(run env KIND=Feature "$S/ship.sh" 1 --title "Edit a" <<<"s")"
eq "ship reports a rebase conflict" "$(jq -r .state <<<"$OUT")" conflict
has "conflict names the file" "$(jq -r .files <<<"$OUT")" "a.txt"
git -C "$ROOT/bibi-worktrees/t-1" rebase --abort >/dev/null 2>&1
run env PNPM_FAIL=0 "$ROOT/bin/pnpm" wt:rm t-1 >/dev/null; rm -rf "$ROOT/bibi-worktrees/.locks/t-1"

# ---- red checks block the PR ------------------------------------------------------
new_ticket 1
echo "x" >"$ROOT/bibi-worktrees/t-1/new.txt"
main_commit b.txt moved "move main"
OUT="$(run env KIND=Feature PNPM_FAIL=1 "$S/ship.sh" 1 --title "Red" <<<"s")"
eq "red checks after a rebase are reported" "$(jq -r .state <<<"$OUT")" red

# ---- review only, light checks, other kinds -----------------------------------------
run env PNPM_FAIL=0 "$ROOT/bin/pnpm" wt:rm t-1 >/dev/null; rm -rf "$ROOT/bibi-worktrees/.locks/t-1"; rm -f "$STATE/pr-1"
new_ticket 1
OUT="$(run env KIND=Docs REVIEW_ONLY=1 CHECKS_ARGS=--light "$S/ship.sh" 1 --title "Docs ADR" <<<"s")"
eq "review-only ticket is opened" "$(jq -r .state <<<"$OUT")" opened
eq "PR title for docs" "$(cat "$STATE/pr-title")" "docs: Docs ADR"
eq "review-only removes the worktree" "$([ -d "$ROOT/bibi-worktrees/t-1" ] && echo yes || echo no)" no
rm -f "$STATE/pr-1"
new_ticket 1
run env KIND="Tech debt" "$S/ship.sh" 1 --title "Tidy" <<<"s" >/dev/null
eq "tech debt becomes refactor" "$(cat "$STATE/pr-title")" "refactor: Tidy"
rm -f "$STATE/pr-1"; run env "$ROOT/bin/pnpm" wt:rm t-1 >/dev/null; rm -rf "$ROOT/bibi-worktrees/.locks/t-1"

# ---- park closes the PR -----------------------------------------------------------------
new_ticket 1
run env KIND=Feature "$S/ship.sh" 1 --title "Parked one" <<<"s" >/dev/null
OUT="$(run "$S/park.sh" 1 "Parked one" <<<"checks stayed red")"
eq "park reports parked" "$(jq -r .state <<<"$OUT")" parked
has "park closed the PR" "$(cat "$STATE/gh.log")" "pr close 101"

# ---- main-ci: CI of main after the merges -----------------------------------------------------
git -C "$ROOT/bibi" fetch -q origin
MAIN_SHA="$(git -C "$ROOT/bibi" rev-parse origin/main)"
echo "[{\"headSha\":\"$MAIN_SHA\",\"status\":\"completed\",\"conclusion\":\"success\",\"url\":\"https://x/run/1\"}]" >"$STATE/main-run.json"
eq "main-ci green" "$(jq -r .state <<<"$(run "$S/main-ci.sh" --timeout 1)")" green
echo "[{\"headSha\":\"$MAIN_SHA\",\"status\":\"completed\",\"conclusion\":\"failure\",\"url\":\"https://x/run/2\"}]" >"$STATE/main-run.json"
OUT="$(run "$S/main-ci.sh" --timeout 1)"
eq "main-ci red with the run url" "$(jq -r .state <<<"$OUT"):$(jq -r .url <<<"$OUT")" "red:https://x/run/2"
echo "[{\"headSha\":\"$MAIN_SHA\",\"status\":\"in_progress\",\"conclusion\":null,\"url\":\"u\"}]" >"$STATE/main-run.json"
eq "main-ci pending while the run is in progress" "$(jq -r .state <<<"$(CI_POLL_SECONDS=1 run "$S/main-ci.sh" --timeout 1)")" pending
echo '[{"headSha":"someone-elses-sha","status":"completed","conclusion":"failure","url":"u"}]' >"$STATE/main-run.json"
eq "main-ci ignores runs of other commits" "$(jq -r .state <<<"$(CI_POLL_SECONDS=1 run "$S/main-ci.sh" --timeout 1)")" pending
echo "[{\"headSha\":\"$MAIN_SHA\",\"status\":\"completed\",\"conclusion\":\"cancelled\",\"url\":\"u\"}]" >"$STATE/main-run.json"
eq "main-ci treats a cancelled run as pending" "$(jq -r .state <<<"$(CI_POLL_SECONDS=1 run "$S/main-ci.sh" --timeout 1)")" pending

# ---- residue ---------------------------------------------------------------------------------
mkdir -p "$ROOT/res/docs/decisions" && cd "$ROOT/res" || exit 1
echo "uses ItemComponent and behaviour" >one.ts; echo "ItemComponent history" >docs/decisions/0001-x.md
OUT="$("$S/residue.sh" "$ROOT/res" ItemComponent behaviour CleanName)"
eq "residue finds identifiers outside ADR history" "$(jq -r '[.matches[].name]|join(",")' <<<"$OUT")" "ItemComponent,behaviour"
eq "residue counts per name" "$(jq -r '.matches[0].count' <<<"$OUT")" 1

echo
if [ "$FAILED" = 0 ]; then echo "all passed"; else echo "$FAILED FAILED"; fi
exit "$FAILED"
