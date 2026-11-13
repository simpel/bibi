# Visma eEkonomi runbook

Decision: `docs/decisions/0100-payment-providers-as-ports.md`. Code: `packages/core/src/providers/visma/`.

## What it does
- An admin connects the venue's Visma eEkonomi (eAccounting) company in Settings → Integrations (OAuth with PKCE, scopes `ea:api ea:sales offline_access`). Tokens are sealed under `INTEGRATION_SECRET_KEY` and refreshed through the shared lease (`providers/oauth/`).
- Sending an invoice routed to Visma finds the customer (by email, then name) or creates it, and raises a booked customer invoice from Bibi's frozen rows. Each VAT rate uses one Bibi revenue article (`BIBI-VAT25`, `BIBI-VAT12`, ...) that Bibi creates on first use with the company's account coding for that rate that books to revenue. Prepayment invoices and deducted deposits use one advances article per rate (`BIBI-ADV25`, ...) on the coding at that rate that books sales to the advances account (2420): the venue creates that coding in Visma (Settings → Account codings) once per VAT rate it sells at. Deducted deposits are rows of quantity −1 per VAT rate.
- A booked Visma invoice cannot be voided; credit it in Bibi (a credit invoice referencing the original, scaled per row for a partial credit).
- Visma pushes nothing: the worker's `provider.poll` job runs every 15 minutes and syncs every SENT Visma invoice. What has been paid is derived from the invoice's total and remaining amount, less Bibi's issued credit notes on it (a credit invoice lowers the remaining amount too, and is not a payment).

## Environment
- `VISMA_CLIENT_ID`, `VISMA_CLIENT_SECRET`, `VISMA_IDENTITY_BASE_URL` (`https://identity.vismaonline.com`) and `VISMA_API_BASE_URL` (`https://eaccountingapi.vismaonline.com`): id and secret together, both hosts required with them, no defaults in code. Unset: Visma is not offered. The sandbox uses the same hosts: a sandbox client reaches only sandbox companies.
- `INTEGRATION_SECRET_KEY`: required.

## Getting credentials (Spiris Partner Programme)
The eAccounting API is not in the Visma Developer Portal (`oauth.developers.visma.com`, which serves Visma.net, Business NXT and Dinero). Credentials come from the Spiris Partner Programme.
1. Sign up at `https://selfservice.developer.vismaonline.com/`, region Sweden (it cannot be changed later; one sandbox company per email address). Visma emails a sandbox client id, client secret and a sandbox company (log in at `https://www.vismaonline.com`).
2. Ask `api@spiris.se` to register the redirect URIs, exact match, HTTPS only, no fragments: `<WEB_ORIGIN>/api/providers/visma/callback` for each environment (production and `https://localhost:3330`). Give the client id, never the secret. Locally, run `pnpm dev:https` to connect Visma.
3. Bibi requests `ea:api ea:sales offline_access`.
4. When the sandbox checks below pass, ask `api@spiris.se` for production access.
Docs: `https://developer.vismaonline.com/docs/authentication`.

## Before going live (check in the sandbox)
- Required fields for customers (Bibi sends `-` as invoice city and postal code) and customer invoices.
- That `/articleaccountcodings` reports `VatRatePercent` as a fraction (0.25) that it names a coding's sales accounts in `DomesticSalesSubjectToVatAccountNumber` and `DomesticSalesVatExemptAccountNumber`, that a venue can create a coding that books to 2420, and that an invoice row on `BIBI-ADV25` books to 2420 with output VAT.
- Whether a credit invoice lowers the original's `RemainingAmount`: Bibi assumes it does and subtracts its issued credit notes; if it does not, a credited invoice would show less paid than it is.
- Sending the invoice by email (`SentType`), not done yet: staff send it from Visma.
- PKCE (`code_challenge`, S256): checked in the sandbox (2026-11-13), the identity server accepts it.
- A new company must finish Spiris's startup guide first: until then the company lookup answers 403 (`ForbiddenRequestException`) and connecting fails.
- Refresh tokens: the docs give two years; Bibi assumes 30 days and refreshes early, which is harmless.
