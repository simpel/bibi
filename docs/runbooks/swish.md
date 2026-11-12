# Swish runbook

Decision: `docs/decisions/0100-payment-providers-as-ports.md`. Code: `packages/core/src/providers/swish/`.

## What it does
- A venue connects its own Swish Handel agreement in Settings → Integrations: Swish number (123xxxxxxx), client certificate (.p12, base64) and passphrase. Bibi first checks that the certificate was issued to that Swish number (Swish puts the number in the certificate subject's common name; Node's TLS opens the .p12, no extra library), so nobody can claim another venue's number with their own certificate and receive its callbacks. Then it checks the certificate with a harmless read (a payment request that cannot exist must answer 404) and stores the three sealed under `INTEGRATION_SECRET_KEY` on the venue's connection.
- Payment requests are m-commerce (no payer number): the pay page starts one when the customer picks Swish, and shows the QR token on a desktop or the `swish://` app link on a phone. A request lives about three minutes; SEK only.
- Refunds go from the venue's Swish number back to the payer, by the original's payment reference. The refund's instruction id is derived from Bibi's refund id and stored before Swish is called, so a retry never pays out twice and the callback finds the refund. A timeout, outage or 409 keeps it pending until the callback (or a read) settles it; only a 400/422 marks it failed.
- Callbacks are unsigned. Bibi trusts the body only for which request or refund to read, reads it again over mTLS with the venue's certificate, and applies what Swish reports.

## Environment
- `SWISH_API_BASE_URL`: API root up to `/swish-cpcapi`. Default is the Merchant Swish Simulator (`https://mss.cpc.getswish.net/swish-cpcapi`); production is `https://cpc.getswish.net/swish-cpcapi`.
- `INTEGRATION_SECRET_KEY`: required; Swish is not configured without it.
- `WEB_ORIGIN` must be public HTTPS: the callback URL is `<WEB_ORIGIN>/api/providers/swish/webhook`, and Swish refuses a non-HTTPS callback (error RP03).

## Test environment (MSS)
1. Download the MSS test certificates from developer.swish.nu (Merchant Swish Simulator). The test merchant number is `1234679304` and the passphrase is `swish`.
2. Base64 the .p12 (`base64 -w0 Swish_Merchant_TestCertificate_1234679304.p12`) and paste it into the connect form with the number and passphrase.
3. Use a tunnel (e.g. a public HTTPS URL to the dev web app) as `WEB_ORIGIN`, or callbacks never arrive; the pay page then stays processing until the request is read again.
4. MSS simulates outcomes through the `message` field (e.g. `RF07` declines); see the MSS guide.

## Production
1. The venue orders Swish Handel from its bank and creates a certificate in the Swish Certificate Management portal (a CSR, then a .p12). It is valid for two years: renew it there before it expires and connect again with the new file.
2. Set `SWISH_API_BASE_URL=https://cpc.getswish.net/swish-cpcapi`.

## Troubleshooting
- Connect says the certificate was issued to another Swish number: the .p12 belongs to a different Swish number than the one entered. Connect says it could not be opened: wrong passphrase or not a .p12.
- Connect says Swish did not accept the certificate: the test certificate against production, or a revoked certificate.
- A refund stuck pending after an error: Swish may or may not have made it. Check the refund in the Swish portal; the callback completes it. Do not refund again until it is settled.
- `Swish refused the payment request (422: RP03)`: the callback URL is not HTTPS. `ACMT03`: the payee is not enrolled. `AM02`: amount too large.
- A declined, failed or expired request ends only that attempt: the payment stays pending and the customer can start a new Swish request from the pay page.
