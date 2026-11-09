# Visma eEkonomi runbook

Decision: `docs/decisions/0100-payment-providers-as-ports.md`. Code: `packages/core/src/providers/visma/`.

## What it does
- An admin connects the venue's Visma eEkonomi (eAccounting) company in Settings → Integrations (OAuth with PKCE, scopes `ea:api ea:sales offline_access`). Tokens are sealed under `INTEGRATION_SECRET_KEY` and refreshed through the shared lease (`providers/oauth/`).
- Sending an invoice routed to Visma finds the customer (by email, then name) or creates it, and raises a booked customer invoice from Bibi's frozen rows. Each VAT rate uses one Bibi article (`BIBI-VAT25`, `BIBI-VAT12`, ...) that Bibi creates on first use with the company's account coding for that rate. Deducted deposits are negative rows per VAT rate.
- A booked Visma invoice cannot be voided; credit it in Bibi (a credit invoice referencing the original, scaled per row for a partial credit).
- Visma pushes nothing: the worker's `provider.poll` job runs every 15 minutes and syncs every SENT Visma invoice. What has been paid is derived from the invoice's total and remaining amount.

## Environment
- `VISMA_CLIENT_ID`, `VISMA_CLIENT_SECRET`: both or neither. Unset: Visma is not offered.
- `VISMA_IDENTITY_URL` (default `https://identity.vismaonline.com`) and `VISMA_API_URL` (default `https://eaccountingapi.vismaonline.com`). Sandbox: `https://identity-sandbox.test.vismaonline.com` and `https://eaccountingapi-sandbox.test.vismaonline.com`.
- `INTEGRATION_SECRET_KEY`: required.

## Developer portal
1. Register an app at the Visma Developer Portal with the eAccounting API, scopes `ea:api`, `ea:sales` and `offline_access`.
2. Redirect URI: `<WEB_URL>/api/providers/visma/callback` (one per environment, exact match).
3. Ask Visma for a sandbox company to test against, and set the sandbox URLs above.

## Before going live (check in the sandbox)
- Required fields for customers (Bibi sends `-` as invoice city and postal code) and customer invoices.
- That `/articleaccountcodings` reports `VatRatePercent` as a fraction (0.25) and that the article coding books revenue on the expected accounts; deposit rows land on the coding's account, not 2420.
- Whether a credit invoice lowers the original's `RemainingAmount` (it would then read as a payment).
- Sending the invoice by email (`SentType`), not done yet: staff send it from Visma.
- The real refresh-token lifetime (Bibi assumes 30 days and refreshes early).
