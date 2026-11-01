#!/usr/bin/env bash
# Opens an SSH tunnel to Coolify (its port is not public, ADR 0013).
# COOLIFY_HOST (server IP) is read from the root .env; COOLIFY_PORT is the local port (default 8000).
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
echo "Coolify: http://localhost:${COOLIFY_PORT:-8000}"
exec ssh -N \
  -L "${COOLIFY_PORT:-8000}:localhost:8000" \
  -L 6001:localhost:6001 \
  -L 6002:localhost:6002 \
  "root@${COOLIFY_HOST}"
