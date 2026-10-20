# @okazi/worker – context for Claude

Job scheduler and queue worker: pg-boss, with queue and cron in Postgres (ADR 0027).

## Rules
- A job is a `JobDefinition` (`src/job-definition.ts`): queue `name` (`<area>.<event>`), `cron` (evaluated in `Europe/Stockholm`), optional `retryLimit`, `handler({ db })`. Schedules live in code, never in Coolify's UI.
- Add the definition to `src/jobs/` and to the list passed to `registerJobs` (`src/register-jobs.ts`, idempotent).
- Jobs call core operations as SYSTEM; they never write tables directly.
- Jobs run in `runWithLogContext` (`src/run-job.ts` does it). Log via `getLogger()` only.

## Commands
- `pnpm --filter @okazi/worker dev | build | start | typecheck | test`
