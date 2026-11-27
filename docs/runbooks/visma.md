# Visma eEkonomi runbook

Decision: `docs/decisions/0100-payment-providers-as-ports.md`. Code: `packages/core/src/providers/visma/`.

## What it does
- An admin connects the venue's Visma eEkonomi (eAccounting) company in Settings → Integrations (OAuth with PKCE, scopes `ea:api ea:sales offline_access`). Tokens are sealed under `INTEGRATION_SECRET_KEY` and refreshed through the shared lease (`providers/oauth/`).
- Sending an invoice routed to Visma finds the customer (by email, then name) or creates it, and raises a booked customer invoice from Bibi's frozen rows. A revenue row uses one Bibi article per VAT rate and mapped account, created on first use (ADR 0108, 0123): `BIBI-VAT25-Tjanster` coded to the coding family the row's item type is mapped to (Spiris settings page in Bibi) at that rate (`BIBI-VAT25-3010` for a mapping migrated from an account number), else `BIBI-VAT25` on the first coding at that rate that books to revenue, so a family without a coding at that rate still invoices. Prepayment invoices and deducted deposits use one advances article per rate (`BIBI-ADV25`, ...) on the coding at that rate that books sales to the advances account (2420): the venue creates that coding in Visma (Settings → Account codings) once per VAT rate it sells at. Deducted deposits are rows of quantity −1 per VAT rate.
- A booked Visma invoice cannot be voided; credit it in Bibi (a credit invoice referencing the original, scaled per row for a partial credit).
- Visma pushes nothing: the worker's `provider.poll` job runs every 15 minutes and syncs every SENT Visma invoice. What has been paid is derived from the invoice's total and remaining amount, less Bibi's issued credit notes on it (a credit invoice lowers the remaining amount too, and is not a payment).

## Environment
- `VISMA_CLIENT_ID`, `VISMA_CLIENT_SECRET`, `VISMA_IDENTITY_BASE_URL` (`https://identity.vismaonline.com`) and `VISMA_API_BASE_URL` (`https://eaccountingapi.vismaonline.com`): id and secret together, both hosts required with them, no defaults in code. Unset: Visma is not offered. The sandbox uses the same hosts: a sandbox client reaches only sandbox companies.
- `INTEGRATION_SECRET_KEY`: required.

## Getting credentials (Spiris Partner Programme)
The eAccounting API is not in the Visma Developer Portal (`oauth.developers.visma.com`, which serves Visma.net, Business NXT and Dinero). Credentials come from the Spiris Partner Programme.
1. Sign up at `https://selfservice.developer.vismaonline.com/`, region Sweden (it cannot be changed later; one sandbox company per email address). Visma emails a sandbox client id, client secret and a sandbox company (log in at `https://www.vismaonline.com`).
2. Ask `api@spiris.se` to register the redirect URIs, exact match, HTTPS only, no fragments: `<WEB_ORIGIN>/api/providers/visma/callback` for each environment (production and `https://localhost:3330`). Give the client id, never the secret. Locally, connect Visma with `WEB_ORIGIN=https://localhost:3330` in `.env` (`pnpm dev` then serves https).
3. Bibi requests `ea:api ea:sales offline_access`.
4. When the sandbox checks below pass, ask `api@spiris.se` for production access. Granted 2026-11-14: set the production client id and secret in Coolify (`VISMA_CLIENT_ID`, `VISMA_CLIENT_SECRET`); the hosts are the same.
Docs: `https://developer.vismaonline.com/docs/authentication`.

## Account check
One accounting system at a time (ADR 0108). When Spiris connects, and on **Refresh accounts from Spiris** on its settings page (`integration.syncAccounts`, ADR 0123), Bibi reads `/articleaccountcodings` (all pages, `$page` and `$pagesize`, verified in the sandbox 2026-11-27) and stores the snapshot on the connection: one entry per coding family (the coding name without its VAT part, e.g. "Tjänster") with the VAT rates it has a coding for and the sales accounts under it. Purposes are mapped to families on that page; at invoice time the coding at the row's VAT rate is used. Problems are derived on read (a family with no coding at a VAT rate in use, no coding for Deposits). `/accounts` needs scope `ea:accounting_readonly` and is not used. Codings cannot be created through the API: the venue creates them in Spiris. Reading only; nothing is created.

## Before going live (check in the sandbox)
- Required fields for customers (Bibi sends `-` as invoice city and postal code) and customer invoices.
- [x] `/articleaccountcodings` reports `VatRatePercent` as a fraction (0.25) and names a coding's sales accounts in `DomesticSalesSubjectToVatAccountNumber` and `DomesticSalesVatExemptAccountNumber`, with a `Name` (sandbox read 2026-11-27).
- That a venue can create a coding that books to 2420 (codings cannot be created through the API), and that an invoice row on `BIBI-ADV25` books to 2420 with output VAT.
- Whether a credit invoice lowers the original's `RemainingAmount`: Bibi assumes it does and subtracts its issued credit notes; if it does not, a credited invoice would show less paid than it is.
- Sending the invoice by email (`SentType`), not done yet: staff send it from Visma.
- PKCE (`code_challenge`, S256): checked in the sandbox (2026-11-13), the identity server accepts it.
- A new company must finish Spiris's startup guide first: until then the company lookup answers 403 (`ForbiddenRequestException`) and connecting fails.
- Refresh tokens: the docs give two years; Bibi assumes 30 days and refreshes early, which is harmless.
