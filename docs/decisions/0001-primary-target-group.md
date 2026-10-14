# 0001 – Primary target group: venues that sell conferences with food and drink

- **Date:** 2026-10-13
- **Status:** Decided

## Context
The pre-study showed two separate markets for booking systems:
- **B2B conferences and venue rental** (Lega's segment): fragmented, low entry barriers, short sales cycles.
- **Municipal facility booking and association grants:** concentrated (Pinea, Rbok, Multisoft), public procurement (LOU), long sales cycles. Adda's framework agreement ends 2027-08-27.

Within B2B, the hotel chains are already served (Event Temple/Strawberry, Proposales/Elite, MeetingPackage/Scandic). Venues without a hotel have Lega or generic slot tools.

## Decision
The primary target group is companies that sell conferences with coffee breaks, meals and rooms, for example World of Volvo.

## Consequences
- The municipal segment is deprioritized for now.
- The domain model is built around quote, program item, requirement, sheet and configurable items (ADR 0021).
- Hotel PMS integration (Mews, Opera) is not part of the MVP.
