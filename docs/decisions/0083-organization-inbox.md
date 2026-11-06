# 0083 – An organization inbox for mail that is not yet an order

- **Date:** 2026-11-01
- **Status:** Superseded by 0085 (never built)
- **Amends:** 0012
- **Related:** 0081, 0084, 0085

Decided that every organization gets one inbox address, `<slug>@<MAIL_INBOUND_DOMAIN>`, and that inbound mail to it is stored without an order and later attached to one or dismissed, behind a new `inbox` permission feature. It was accepted but never built. ADR 0085 generalised it to every channel (mail, web form, SMS, API) in one `InboundMessage` model and kept its decisions: the slug address, the stored inbox, attach once, the `inbox` permissions and the reserved `order-` slug prefix.
