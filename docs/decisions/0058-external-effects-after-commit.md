# 0058 – External effects run after the commit

- **Date:** 2026-10-19
- **Status:** Accepted
- **Related:** 0007 (AI-first UX and approval), 0028 (payments with Stripe), 0029 (invoicing via Stripe), 0030 (indexing after commit), 0049 (conversational change layer, change preview)

## Context
- The approval card (ADR 0049) shows what a command would change. `previewChange` gets that by running the command's handler in a transaction that is always rolled back. `dryRun` queries do the same.
- A rollback only undoes database writes. `payment.create` called Stripe inside its handler, so the assistant merely *proposing* a payment created a real Checkout Session, or created, finalized and **sent** a real Stripe invoice to the customer, while the payment row was rolled back.
- In a normal `execute` the Stripe call also ran before the row insert, inside the transaction. A failed commit left a Stripe object with no row, and a fresh payment id per attempt made the idempotency key useless.

## Decision
- **An operation declares its calls to the outside world as `external`**, next to `handler`: `external({ input, output, context })` returns the final output. Anything that charges, emails a customer or otherwise acts outside Okazi's database goes there, never in `handler`.
- **Only `execute` runs it, right after the command committed** (before the `afterCommit` hooks, which get its output). A change preview, a dry run and a nested run call only `handler`, so they can never reach it. This is the rule by construction, not a check per feature.
  - `runNested` refuses an operation with `external` (`INTERNAL`): inside a batch the call would run before the batch commits.
- **`external` is outside the handler's transaction.** `context.db` is the plain scoped client; changes it records are audited like the handler's (one more audit row per change, under the same operation), also when it fails.
- **A failure never undoes the commit.** `external` leaves its record in a failure state and returns the error, which `execute` returns to the caller.
- **`payment.create`** now inserts the `PENDING` row first, without a provider reference (`providerReference` is nullable). `external` then asks Stripe for the checkout or invoice with `okazi-payment-<row id>` as the idempotency key and stores the reference and link. If Stripe refuses, the row becomes `FAILED` and the error is returned. A new attempt is a new `payment.create`.

## Consequences
- Proposing `payment.create` through MCP makes zero provider calls; the approval card shows the PENDING row without a reference or link. Tested in `apps/mcp/test/approval-payment.test.ts` and `packages/core/test/payment-after-commit.test.ts`.
- A crash between the commit and the Stripe call leaves a `PENDING` row with no reference and no link. It is harmless (nothing was charged) and visible in the ticket's payment list. Repeating the call for that row would reuse the same idempotency key; no retry operation exists yet.
- Mail: core handlers send no mail today. Invitation mail is an `afterCommit` hook in `packages/auth`, which a preview never runs. New mail to customers belongs in `external` (or an `afterCommit` hook when its outcome does not change the output).
- ~~Open: `paymentAccount.startOnboarding` still calls Stripe inside its handler.~~ Closed, see the addendum.

## Addendum 2026-10-21: `paymentAccount.startOnboarding`
- The handler now only inserts the `PaymentAccount` row (`stripeAccountId` is nullable, one migration). `external` (`onboard-after-commit.ts`) creates the connected account when the row has no account id, stores it, and creates the onboarding link, which is returned with the row. A preview creates no Stripe account and keeps no row.
- The account's idempotency key stays `okazi-connected-account-<organization id>` (one row per organization, so equal to a key per row). If Stripe refuses, or the process dies after the commit, the row stays with a null account id and the next `startOnboarding` resumes it: one connected account per organization, also when called twice.
- `paymentAccount.sync` stays in its handler: it only reads from Stripe, has `approval: false` and creates nothing there, so there is no side effect to defer. With a null account id it returns the row unchanged.
