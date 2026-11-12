# @bibi/worker – context for Claude

Job scheduler and queue worker: pg-boss, with queue and cron in Postgres (ADR 0027).

## Rules
- A job is a `JobDefinition` (`src/job-definition.ts`): queue `name` (`<area>.<event>`), `cron` (evaluated in `effectiveTimeZone({})`, the zone without an organization; never a zone constant, ADR 0064), optional `retryLimit`, `handler({ db })`. Schedules live in code, never in Coolify's UI.
- Add the definition to `src/jobs/` and to the list passed to `registerJobs` (`src/register-jobs.ts`, idempotent).
- Jobs call core operations as SYSTEM; they never write tables directly.
- Jobs run in `runWithLogContext` (`src/run-job.ts` does it). Log via `getLogger()` only.
- On start, before streams, `provisionAssistant` keeps the assistant's OAuth client in step with `WEB_OAUTH_CLIENT_ID` (`@bibi/auth/provision`); a failure is logged, never fatal.
- Provider streams are not jobs: `src/provider-streams.ts` runs each configured provider's `signals.stream` port (catch-up, then `start`) from core's registry; the stream itself lives in the provider's folder in core. Providers with `signals.poll` run in the `provider.poll` job. Never name a provider here. Why: ADR 0090, 0100.

## Commands
- `pnpm --filter @bibi/worker dev | build | start | typecheck | test`
