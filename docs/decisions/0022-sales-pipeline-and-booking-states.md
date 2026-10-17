# 0022 – Sales pipeline, statuses and owners

- **Date:** 2026-10-14
- **Status:** Accepted

## Context
- The core flow in the domain model is Inquiry → Option → Quote → Booking. Each step has a status, but the transitions and the division of responsibility are not decided.
- Each booking needs a clear owner. Status changes must be reviewable and must not happen through free editing of a status field.

## Decision
- Fixed state machines for the sales steps, defined once per entity in core (`features/<entity>/transitions.ts`):

  | Entity | Statuses |
  |---|---|
  | Inquiry (`Inquiry`) | `NEW → QUALIFIED → QUOTED → WON` or `LOST` (requires a loss reason) |
  | Option | `ACTIVE (rank 1, 2, …) → CONVERTED`, `EXPIRED` or `RELEASED` |
  | Quote (`Quote`) | `DRAFT → SENT → ACCEPTED`, `DECLINED` or `EXPIRED`, versioned |

- The sales steps' transitions are their own commands, for example `inquiry.qualify`, `inquiry.markLost`, `quote.send` and `quote.accept`. Status can never be set through `update`. A disallowed transition gives `CONFLICT`.

### Booking statuses per organization
- Each organization defines its own booking statuses (`BookingStatus`): name, color, order and a **phase**.
- The phase is fixed and controls the system's behavior. The statuses are the organization's own labels within the phases:

  | Phase | The system's rules |
  |---|---|
  | `TENTATIVE` | Bookable items are occupied. Sheets (ADR 0021) cannot be sent. |
  | `CONFIRMED` | Requires a coordinator. Sheets and advance payment can be sent. |
  | `COMPLETED` | Allowed only after the booking has ended. The booking can be invoiced. |
  | `CANCELLED` | Requires a reason. Occupancy is released and the cancellation terms apply. |

- `CANCELLED` is terminal. No transition leaves a status in that phase: `bookingStatus.setTransitions` refuses targets for it and `booking.changeStatus` returns `CONFLICT` for a booking in it. Cancellation releases the occupancy, so reopening could never be guaranteed to succeed; to restore a cancelled booking, create a new one.
- Allowed transitions are defined by the organization (`BookingStatusTransition`, from → to). The phase rules cannot be turned off.
- A single command changes status: `booking.changeStatus({ bookingId, statusId, reason? })`. Statuses are managed with `bookingStatus.list|create|update|archive|reorder` (`bookingStatus:admin`). A status that is in use can be archived but not deleted.
- A new organization gets one status per phase so that bookings work immediately. More statuses and transitions can be added or imported as a template. Example, the "Conference estate" template:
  - Tentative (`TENTATIVE`)
  - Confirmed (`CONFIRMED`)
  - Final count locked (`CONFIRMED`)
  - Completed (`COMPLETED`)
  - Cancelled (`CANCELLED`)

  All transitions forward and to Cancelled are allowed.
- `quote.accept` sets the inquiry to `WON` and converts the options (`CONVERTED`). The booking is created with the organization's default status in the `CONFIRMED` phase. A quick booking (a small meeting without inquiry and quote) is created by staff with the default `TENTATIVE` status. The customer pays through a Swish or card link or against invoice. When paying with a link, the booking moves to `CONFIRMED` once the payment is complete, and with an invoice staff confirm it directly. The customer never uses the app.
- Inquiry and quote keep fixed statuses, because the system's logic builds on them. The same pattern (own statuses with a fixed phase) can be used there later.
- Owners are members of the organization:
  - `Inquiry.salesOwnerId` is required from `QUALIFIED`.
  - `Quote` inherits the salesperson from the inquiry.
  - `Booking.salesOwnerId` and `Booking.coordinatorId`. Coordinator is required from `CONFIRMED`.
  - `ProgramItem.responsibleId` is optional.
  - Changing owner is done with `*.assign` and is logged.
- Options are queued per bookable item and time. The rank is set automatically (number of active overlapping options + 1). When an option is released or expires, those behind it move up.
- Expiry: the command `option.expireDue` expires all options whose date has passed. It runs manually or by the scheduler every 15 minutes (ADR 0027).
- Occupancy (`Occupancy`) is a table with the types `BOOKING`, `OPTION`, `SETUP`, `MAINTENANCE`, `INTERNAL`. All except `OPTION` must not overlap on the same bookable item (`BOOKABLE`, ADR 0021), which is enforced with an exclusion constraint in Postgres (`btree_gist`). Setup time is added as `SETUP` based on the setup's setup time (`Setup`, ADR 0021).
- Signing is postponed. `quote.accept` stores `acceptedBy`, `acceptedAt` and `acceptanceMethod` (`MANUAL` now, later `BANKID` and `LINK`).
- Status history comes from `AuditLog`. The entities also have `statusChangedAt` for lists and sorting.

## Consequences
- New entities: Customer, Contact, Inquiry, Option, Quote, Order line, Booking, Program item, Occupancy and Requirement (ADR 0021). This is the largest step so far and is built in parts (see ADR 0025).
- The state machines are tested as tables: every allowed and every disallowed transition. The booking phase rules are tested separately, so that a custom transition can never bypass them.
- Reports and filters that should work in all organizations group by phase, not by status.
- AI can propose transitions but not perform them without approval (ADR 0007).

## Addendum 2026-10-17 – owners become assignments (ADR 0034)
- The owner fields `Inquiry.salesOwnerId`, `Booking.salesOwnerId`, `Booking.coordinatorId` and `ProgramItem.responsibleId` are replaced by assignments: one main assignee plus followers per inquiry and booking, and one assignment per responsibility on a booking.
- "Requires a coordinator" in `CONFIRMED` (and `COMPLETED`) becomes "requires the booking's main assignee". "`salesOwnerId` required from `QUALIFIED`" becomes "requires the inquiry's main assignee".
- `Quote` uses the inquiry's assignment. `quote.accept` copies the inquiry's main assignee and followers to the new booking.
- `*.assign` commands are replaced by `assignment.assign|follow|unfollow`.
