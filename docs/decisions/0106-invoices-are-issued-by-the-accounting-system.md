# 0106 – The venue's accounting system issues every money document; orders are business or private

- **Date:** 2026-11-11
- **Status:** Accepted
- **Amends:** 0029, 0077, 0090, 0093, 0100
- **Related:** 0051, 0052, 0057, 0058, 0105

## Context
- Bibi issues and numbers its own invoices and credit notes, books deposits through its own vouchers (customer advances, VAT per rate, ADR 0093) and exports them as SIE (ADR 0077). With Stripe Invoicing, Fortnox or Visma connected it also raises the invoice there, so one invoice has two numbers. That is accounting-system work inside a booking system.
- Swedish VAT (ML 2023:200, Skatteverket): a sale to a business always needs an invoice, whatever the amount, and so does an advance payment from one. VAT on an advance is due when it is paid. A private buyer usually needs no invoice. Up to 4 000 kr incl. VAT a simplified invoice is enough. Public-sector buyers need Peppol e-invoices (lag 2018:1277).
- So a Stripe or Swish link alone does not cover a company's deposit. Fortnox and Visma issue invoices, send them (including Peppol), keep the books and accept payments registered on them (Visma built; Fortnox `POST /3/invoicepayments`).

## Decision
1. **Every order is business or private.** `Customer.buyerKind` (`BUSINESS` | `PRIVATE`; the web forms make staff choose, the API defaults to `BUSINESS`) is the default; `Order.buyerKind` (`null` = inherit the customer's) overrides it for one order. The order's setup shows the effective value. Business customers get an owned `organizationNumber` column, required before anything is invoiced to them.
2. **Money needs a ledger provider.** Payment links, deposits and invoices need a connected provider that keeps books (Fortnox, Visma); without one they are `CONFLICT`, telling staff to connect one. Stripe and Swish only collect.
3. **The ledger provider issues every document.** Bibi sends it the basis: frozen lines (ADR 0052), the buyer kind, the customer's details, the buyer's reference (ADR 0105) and deductions. A deposit is raised as a prepayment invoice; the final invoice deducts it. The provider's number is the number Bibi shows; Bibi numbers nothing.
4. **The buyer kind sets the defaults.** Business: full invoice, org no. required, the buyer's reference when the customer requires it, invoice terms, delivered the way the customer is set up at the provider (email, e-invoice over Peppol, letter). Private: card or Swish up front, the document issued and marked paid, sent as a receipt by email.
5. **Card and Swish pay a provider document.** The pay page settles a prepayment or final invoice; Bibi registers the payment on it at the provider. A payment settles an invoice only; paying a quote directly goes (accepting a quote leads to its deposit).
6. **Bibi mirrors, the provider decides.** Bibi keeps the basis plus the provider's number, status, payments, voids, credits and delivery refusals (ADR 0100's signals), and staff still start voids, credits and refunds in Bibi.

## Rejected
- **Keep Bibi's own invoices and SIE for venues without a ledger.** Two accounting paths, and Bibi stays answerable for number series, invoice content and VAT timing.
- **Card and Swish without a ledger for private customers only (SIE kept).** Saves those venues a connection, but keeps Bibi's vouchers and export for one case.
- **Business or private chosen on every order.** It is a fact about the customer; asking each time invites mistakes. The order can still override it.
- **Bibi as a Peppol sender.** Every ledger provider already sends Peppol.

## Consequences
- A venue must connect Fortnox or Visma to take any money; onboarding and `/support` say so. Other accounting systems need their own adapter. Bibi's own subscription billing (ADR 0095) is not affected.
- Removed: Bibi's invoice and credit note numbers (nullable first, dropped once open Bibi-only invoices are settled), Stripe Invoicing, quote payments, the deposit vouchers of ADR 0093 and the SIE export of ADR 0077 (the financials overview stays, read from the mirror).
- New: `buyerKind` on customer and order, `Customer.organizationNumber`, prepayment invoices at both providers, Fortnox payment registration. Rows pass the providers' e-invoice checks (deposit deductions as quantity −1 with a positive price).
- The demo seed's "Org no." and "Private" customer types become columns and `buyerKind`; both demo organizations connect a ledger provider (the memory adapter in tests).
- For the accountant before building: how the final invoice deducts a prepayment invoice at each provider, and whether a private buyer's document must be a full invoice or may be a receipt.
