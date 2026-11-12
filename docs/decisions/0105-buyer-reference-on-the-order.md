# 0105 – The buyer's reference lives on the order, defaulted from the contact

- **Date:** 2026-11-11
- **Status:** Accepted
- **Related:** 0029 (Peppol gap), 0051, 0052, 0056, 0081, 0100, 0106 (the ledger provider issues and delivers the invoice)

## Context
- Swedish public-sector buyers must receive e-invoices (lag 2018:1277), and their systems route or reject an invoice by the buyer's reference (*Er referens*, beställar-ID, case number).
- Fortnox refuses an e-invoice without "Your reference / Your electronic reference" (since 2026-10-19). Fortnox (`/3/invoices-v2/{n}/einvoice`) and Visma (`/v2/customerinvoices/{id}/einvoice`) send e-invoices themselves, so Bibi only has to pass the right reference.
- Today Bibi has nowhere to keep it: Fortnox gets Bibi's own order reference as `YourOrderNumber`, Visma gets it as `YourReference`. Organizations can only add a free-text field, which code cannot read.
- One customer has several buyers over time, each with their own reference, so the customer cannot hold it.

## Decision
1. **`Contact.buyerReference`** (owned, ≤ 50, null = none): the reference this person orders under. Changing it affects only orders that inherit it.
2. **`Order.buyerReference`** (owned, ≤ 50, `null` = inherit the order's contact's). Staff override it per order, e.g. a case number for one event. Core exposes the effective value and where it came from (`ORDER` or `CONTACT`).
3. **`Customer.requiresBuyerReference`** (owned, boolean, default false): a column, not a field value, because core must enforce it.
4. **Enforced when invoicing:** creating or sending an invoice for a customer that requires it, with no effective reference, is `VALIDATION` at `buyerReference`. The order page and the order's checks warn earlier, from the entry status on.
5. **Snapshot on the invoice:** `Invoice.buyerReference` freezes the effective value when the invoice is created (ADR 0052). Providers get it as Fortnox `YourReference` plus `EDIInformation.EDIYourElectronicReference`, and Visma `YourReference`. Bibi's own order reference moves to "Our reference" / order number fields, so it no longer takes the buyer's slot.

## Rejected
- **On the customer only.** Wrong as soon as a second buyer orders; staff would edit the customer before every invoice and break older orders' history.
- **On the order only, typed each time.** Most buyers reuse one reference; inheriting from the contact saves typing and mistakes, and the order can still override it.
- **An organization-defined field (as in the demo seed).** Bibi must check it and send it to providers, so it is a column.
- **Required on every order.** Private persons and Swish-paying companies have no such reference; a requirement per customer fits the real rule.

## Consequences
- Migration: three nullable columns plus one boolean on `Customer`, `Contact` and `Order`, and one on `Invoice`. No backfill.
- Parity: `order.create|createFromTemplate|update`, `contact.create|update` and `customer.create|update` take the new fields in web, GraphQL, REST and MCP; intake and the assistant can fill it from an inbound message.
- The demo seed's "Requires case number" field on Public sector becomes `requiresBuyerReference`; its contacts get references.
- Sending as an e-invoice (the `/einvoice` calls, the customer's org no., positive unit prices on deposit rows) is a follow-up that builds on this.
