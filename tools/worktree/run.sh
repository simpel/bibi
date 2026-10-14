#!/usr/bin/env bash
# Start Postgres + Mailpit, migrate, and run the dev servers of the checkout in the current directory.
set -euo pipefail
source "$(dirname "$0")/lib.sh"
require_docker
cd "$ROOT"

load_env
compose up -d --wait postgres mailpit
pnpm db:migrate
exec pnpm dev
