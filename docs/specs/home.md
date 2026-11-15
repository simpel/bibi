# My work (the start page)

Current behaviour. Why: ADR 0110. Operation: `myWork.view` (`self:read`, a view read model, ADR 0071).

## Page
- A timeline of every order that concerns the member (below), today and ahead, nothing else. `/:org` is the 14 days from today; `/my-work/{from}/{to}` is any other window of at most 14 days (inclusive, ADR 0064). **Later** opens the next window; a window that does not start today links back to today.
- A heading per day in the organization's zone, the day's cards under it by start.
- The assistant's `myWork_view` tool renders the same cards.

## Card
- One card per order per day it has timed lines that concern the member. An order concerned as a whole shows all its lines that day; one concerned only through a line (staffed, an item they own) shows just those lines.
- Same layout as the pinned calendar card (`OrderView` bare, `OrderDayCard` in `@bibi/ui`): order name and reference, customer · why it concerns the member, the status badge always top right (`pipeline:read`); then Guests, When (the day's first start to last end, "Day N of M" above it for an order over several days) and Where (the day's bookable items, `item:read`). No money.
- The bottom row shows only when there is something: the most urgent flag as a chip linking to what to act on, "+N" for the rest, and "Live" while it is happening.
- Flags, most urgent first: another order's hard hold or a block overlapping a soft-held line (the order's reference); then, only for a member who acts on the order: a run sheet not sent, changed since sent or blocked (`runSheet:read`, assignee of the order or of its responsibility); holds running out within 7 days, a quote waiting on the customer (`quote:read`) and unread customer messages (`inbox:read`), on orders the member is the main assignee of. Order-wide flags sit on the order's first card in the window only.

## Tone
- Every booking and order card carries its state as its outline (`bookingToneVariants` in `@bibi/ui`), the same on My work, the pinned calendar card and the calendar hover card.
- Strongest first: **conflict** (red: a hard-hold clash or a blocked run sheet), **action** (amber: the member acts and a flag is open), **live** (now inside the span), **done** (over, dimmed), **following** (need-to-know only: no fill or shadow), **tentative** (soft holds only: dashed and hatched, as on the calendar), **confirmed**. The calendar cards use the hold alone (tentative or confirmed).

## Concerns me
Defined in `docs/specs/assignments-and-responsibilities.md` ("Concerns me"). A member acts on `ASSIGNEE`, `RESPONSIBILITY` and `STAFFED`; a follower is told, not asked, so their cards carry no action flags.

## Not built
- Untimed lines (no place on a timeline), orders without lines, prep lead times, the responsibility's own name on the card, a hard-hold clash on the calendar's hover and pinned cards.
