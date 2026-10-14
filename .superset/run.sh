#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

./.superset/require-docker.sh
source ./.superset/lib.sh

load_env

compose up -d --wait postgres mailpit
pnpm db:migrate
exec pnpm dev
