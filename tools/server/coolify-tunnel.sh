#!/usr/bin/env bash
# Opens an SSH tunnel to Coolify (its port is not public, ADR 0013).
# COOLIFY_HOST (server IP) is read from the root .env; COOLIFY_PORT is the local port (default 8000).
# Prints the Coolify containers' state and the HTTP status through the tunnel, then keeps it open.
set -euo pipefail
cd "$(dirname "$0")/../.."

# .env is not shell syntax, so read only the COOLIFY_* lines instead of sourcing it.
if [ -f .env ]; then
  while IFS='=' read -r key value; do
    value="${value%\"}"
    value="${value#\"}"
    export "$key=$value"
  done < <(grep -E '^COOLIFY_(HOST|PORT)=' .env || true)
fi

: "${COOLIFY_HOST:?set COOLIFY_HOST to the server IP in .env}"
port="${COOLIFY_PORT:-8000}"
target="root@${COOLIFY_HOST}"
url="http://localhost:${port}"
ssh_opts=(-o ConnectTimeout=10 -o ServerAliveInterval=15 -o ServerAliveCountMax=3)

show_logs() {
  echo "  Last lines of 'docker logs coolify':" >&2
  ssh "${ssh_opts[@]}" "$target" "docker logs --tail 20 coolify 2>&1" | sed 's/^/    /' >&2 || true
}

fail() {
  echo "✗ $1" >&2
  exit "${2:-1}"
}

# 1. Reach the server and show the Coolify containers (a 500 usually means one is down or unhealthy).
echo "→ Connecting to ${target}…"
containers="$(ssh "${ssh_opts[@]}" "$target" \
  "docker ps -a --filter name=coolify --format '{{.Names}}\t{{.Status}}'")" ||
  fail "Cannot reach ${target} over SSH." $?
echo "✓ SSH works. Coolify containers:"
if [ -n "$containers" ]; then
  echo "$containers" | sed 's/^/    /'
  if echo "$containers" | grep -qvE '\((healthy)\)|Up [^(]*$'; then
    echo "  ⚠ Not every container is up and healthy: expect errors in the browser." >&2
  fi
else
  echo "    (none found: is Coolify installed on this server?)"
fi

# 2. Open the tunnel in the background; ssh exits if a local port is taken or the link dies.
echo "→ Opening tunnel on ${url} (and 6001, 6002)…"
ssh -N "${ssh_opts[@]}" -o ExitOnForwardFailure=yes \
  -L "${port}:localhost:8000" \
  -L 6001:localhost:6001 \
  -L 6002:localhost:6002 \
  "$target" &
ssh_pid=$!
trap 'kill "$ssh_pid" 2>/dev/null || true' EXIT

# 3. Wait for the forward (curl exit 7 = not listening yet), then report what Coolify answers.
code="000"
for _ in $(seq 1 20); do
  kill -0 "$ssh_pid" 2>/dev/null || { wait "$ssh_pid" || fail "Tunnel closed while starting (is port ${port}, 6001 or 6002 in use?)." $?; }
  curl_status=0
  code="$(curl -s -o /dev/null -w '%{http_code}' --max-time 10 "${url}/")" || curl_status=$?
  [ "$curl_status" -ne 7 ] && break
  sleep 0.5
done

case "$code" in
  000)
    echo "✗ No HTTP answer on ${url} (curl exit ${curl_status}). The tunnel works; Coolify does not respond." >&2
    show_logs
    ;;
  2* | 3*) echo "✓ Coolify answers HTTP ${code}." ;;
  *)
    echo "✗ Coolify answers HTTP ${code}. The tunnel works; the error is on the server." >&2
    show_logs
    ;;
esac

echo "Coolify: ${url}  (Ctrl+C to close)"
status=0
wait "$ssh_pid" || status=$?
[ "$status" -eq 0 ] || fail "SSH tunnel to ${target} closed (exit ${status})." "$status"
