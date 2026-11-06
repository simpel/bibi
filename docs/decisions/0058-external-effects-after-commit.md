# 0058 – External effects run after the commit

- **Date:** 2026-10-19
- **Status:** Accepted
- **Related:** 0007 (AI-first UX and approval), 0028 (payments with Stripe), 0029 (invoicing via Stripe), 0030 (indexing after commit), 0049 (conversational change layer, change preview)

## Context
- The approval card shows what a command would change by running its handler in a transaction that is always rolled back. Dry runs do the same.
- A rollback only undoes database writes. A handler that called Stripe made a mere proposal create a real checkout or send a real invoice to a customer.
- In a normal run the Stripe call also happened inside the transaction. A failed commit left a Stripe object with no row, and a fresh id per attempt made the idempotency key useless.

## Decision
1. An operation declares calls to the outside world as `external`, next to `handler`. Anything that charges, emails a customer or acts outside Bibi's database goes there, never in `handler`.
2. Only `execute` runs it, right after the command committed and before `afterCommit` hooks. Previews, dry runs and nested runs call only `handler`, so they cannot reach it. `runNested` refuses an operation with `external`.
3. `external` runs outside the handler's transaction. Changes it records are audited like the handler's, also on failure.
4. A failure never undoes the commit. The record is left in a failure state and the error is returned.
5. `payment.create` inserts a `PENDING` row first, then `external` calls Stripe with the row id as idempotency key and stores the reference. A refusal makes the row `FAILED`. A new attempt is a new `payment.create`.
6. `paymentAccount.startOnboarding` follows the same pattern. The row is inserted first and `external` creates the connected account under a per-organization key, so a retry resumes it. `paymentAccount.sync` only reads and stays in its handler.

## Rejected
- Checking for previews inside each handler: it relies on every feature remembering.
- Calling the provider inside the transaction: a failed commit leaves an orphan.

## Consequences
- Proposing `payment.create` through MCP makes zero provider calls.
- A crash between commit and call leaves a harmless `PENDING` row. No retry operation exists yet.
- New customer mail belongs in `external`, or in an `afterCommit` hook when its outcome does not change the output.
