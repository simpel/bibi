# 0093 – VAT on advance payments

- **Date:** 2026-11-03
- **Status:** Accepted
- **Amends:** 0077, 0090
- **Related:** 0051, 0052, 0057, 0059
- **Spec:** `docs/specs/payments.md`

## Context
- A paid deposit was booked as a customer advance (BAS 2420) without VAT, and all VAT appeared when the final invoice was sent.
- Swedish VAT is normally due when an advance payment is received for a known supply. An order's priced lines give exactly that.
- ADR 0090's deposit rule makes advances common, since small orders are paid in full up front, so VAT was reported late.
- A deposit has no lines, and orders mix rates (food 12 %, rooms 25 %).

## Decision
1. A deposit snapshots its VAT split at create (`Deposit.vatRows`), scaled pro rata from the order's live priced lines to the deposit's amount. Later order changes do not move it. An order with no priced lines gives an empty split and no VAT is due.
2. The deposit's payment voucher carries output VAT per rate. A refund is its negation.
3. The final invoice voucher reverses it per deducted deposit, so only the VAT not already reported is reported and 2420 clears to zero.
4. Fortnox rows follow the same split: one negative row per VAT rate on the customer advances account.
5. Existing deposits keep an empty split, because their vouchers may already be in the books.
6. An accountant must confirm the treatment before it is relied on. This ADR is accepted for building, not as tax advice.

## Rejected
- The order's VAT mix at payment time. The same payment could be booked differently in two exports.
- One rate per deposit. Wrong for the common 12 % and 25 % mix, and a staff choice would be a tax judgement.
- VAT on the invoice only. VAT is reported late for every advance.
- Book deposits as revenue at payment. Revenue before delivery breaks the accrual basis (ADR 0077).

## Consequences
- `Deposit.vatRows` is an owned snapshot written only by `deposit.create`.
- Not covered: an advance invoice or receipt showing VAT to the customer, and the öre left on 2420 from rounding, under one krona per deposit.
