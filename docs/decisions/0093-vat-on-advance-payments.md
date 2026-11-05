# 0093 – VAT on advance payments

- **Date:** 2026-11-03
- **Status:** Accepted (approved by the user on 2026-11-03)
- **Amends:** 0077 (financials and SIE export), 0090 (order money through the venue's own providers)
- **Related:** 0051, 0052, 0057, 0059

## Context
- A paid deposit is booked today as a customer advance (BAS 2420) without VAT, and all VAT appears when the final invoice is sent (`accounting/sie4/vouchers.ts`). ADR 0077 lists "VAT on advance payments for deposits" as not covered.
- Swedish VAT is normally due when an advance payment is received, when the supply it pays for is known: the services, the rate and the date (förskottsbetalning, ML 2023:200; EU case C-419/02 BUPA). An order's priced lines give exactly that.
- ADR 0090's deposit rule makes advances common: an order below the minimum is paid in full up front, so the whole sale's VAT is reported one or more periods late.
- A deposit has no lines. It is a fixed amount with a description (ADR 0057), so it carries no VAT split today. Orders mix rates: food 12 %, rooms and activities 25 %, sometimes 6 %.
- The Fortnox invoice deducts each paid deposit as one negative row on 2420 at 0 % VAT (`features/invoice/fortnox-rows.ts`), which matches today's SIE treatment and would double-count VAT once deposits carry it.

## Decision
1. **A deposit snapshots its VAT split at create.** `Deposit.vatRows` (JSON, the `OrderLine` shape: per rate, excl. VAT and VAT) is written once by `deposit.create` (and `deposit.request`, which creates through it): the order's live priced lines incl. VAT, the same basis `deposit.suggest` uses, scaled to the deposit's amount with the existing pro rata split (`scaleParts`). The rows always sum to the amount. It is a snapshot (ADR 0051, 0057): later changes to the order do not move it, as the customer was told what the deposit covers when it was sent. An order with no priced lines gives `[]`: the supply is not known, so no VAT is due on that advance.
2. **The payment voucher of a deposit carries output VAT.** Debit clearing (gross); credit customer advances with the amount excl. VAT and output VAT per rate, split pro rata from the deposit's `vatRows`. A part payment splits the same way. A refund is the negation, on its own date, as today.
3. **The final invoice reverses it.** The invoice voucher keeps the full sale (receivables incl. VAT against revenue and VAT per rate) and, per deducted deposit, debits customer advances (excl. VAT) and the output VAT per rate, against receivables for the deducted amount. The deducted amount is split with the same `scaleParts` on `InvoiceDeposit.amountMinor`. Net, the invoice reports only the VAT not already reported at payment, and 2420 clears to zero. A void negates the whole voucher, as today.
4. **Fortnox rows follow the same split.** Each deducted deposit becomes one negative row per VAT rate on the customer advances account, priced excl. VAT with that rate's `vatPercent`. Fortnox then books the invoice with VAT net of what was reported at payment, matching the SIE voucher. A deposit with `[]` stays one 0 % row.
5. **Existing deposits keep `[]`.** Their payment vouchers were exported without VAT and may already be in the books; giving them a split now would make re-exported periods disagree with what was imported. The migration adds the column with default `[]`; the demo seed creates deposits through `deposit.create`, so its deposits get a split.
6. **An accountant must confirm the treatment** before it is relied on, in particular: the pro rata split for mixed rates, booking the advance excl. VAT on 2420, and that no VAT is due on a deposit for an order without priced lines. This ADR is accepted for building, not as tax advice.

## Consequences
- Data: `Deposit.vatRows Json @default("[]")`, owned snapshot, written only by `deposit.create`.
- Core: `deposit.create` derives the split; `DepositSchema` exposes `vatRows` (read, every surface, ADR 0003). `Settles` of kind `DEPOSIT` carries the deposit's parts; the invoice event carries one split per deduction; `missingVatRates` counts both, so an unmapped rate still refuses the export.
- Fortnox: `fortnoxRows` takes each deduction's split.
- Tests: `accounting-export.test.ts` covers a deposit payment with VAT, a mixed-rate deposit, a refund and the invoice reversal netting 2420 to zero; the invoice tests cover the Fortnox rows.
- Docs: `docs/specs/payments.md`, `docs/domain-model.md` and its artifact.
- Not covered: an advance-payment invoice or receipt showing VAT to the customer (required for B2B advances under ML ch. 17); a deposit paid after an order's rates changed is still split by its snapshot; the öre left on 2420 when a deposit paid in several payments rounds differently from the deducted total (accepted, below one krona per deposit).

## Alternatives rejected
- **The order's VAT mix at payment time.** Closest to the letter of the rule, but the split would depend on when the export reads the order, so the same payment could be booked differently in two exports, and a snapshot of it would need writing in the payment path. The deposit's own snapshot is fixed when the customer is asked to pay, which is the supply they pay for.
- **One rate per deposit (the highest, or chosen by staff).** Simple, but wrong for the common mix of 12 % food and 25 % rooms, and a staff choice is a tax judgement Bibi should not ask for.
- **Keep VAT on the invoice only.** The current behaviour: VAT reported late for every advance, which the full-up-front rule makes the normal case for small orders.
- **Book deposits as revenue at payment.** Recognises revenue before delivery; the accrual basis (ADR 0077) books revenue when invoiced.
