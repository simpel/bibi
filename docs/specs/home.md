# My work (the start page)

Current behaviour. Why: ADR 0110. Operation: `myWork.view` (`self:read`, a view read model, ADR 0071).

## Page
- A timeline of every order that concerns the member (below), today and ahead, nothing else, in four parts: **Today**, **This week** (the rest of it, weeks start on Monday), **Next week** and **Later**. Today always shows (with a line when empty); another part shows only when it has cards. A heading per day in the organization's zone inside each part, the day's cards under it by start.
- `/:org` reads today to the end of next week in one `myWork.view`. Later reads on as the member scrolls: each time the end of the list comes into view, the next 14 days from `next` (the first later day with a card, within a year) are read and added, until there is none.
- `/my-work/{from}/{to}` is any other window of at most 14 days (inclusive, ADR 0064), in the same parts; it links back to today.
- The assistant's `myWork_view` tool renders the same parts, without reading on.

## Card
- One card per order per day it has timed lines that concern the member. An order concerned as a whole shows all its lines that day; one concerned only through a line (staffed, an item they own) shows just those lines.
- The same card as the pinned and hover calendar cards: the card is the order's day rendered as a booking (`CalendarHoverDetails` detailed inside `OrderDayCard`, `@bibi/ui`), so all three look alike with their own data. Header: order name and reference, customer · why it concerns the member, the status badge always top right, then pin and expand. Stats: Guests, When (the day's span, "Day N of M" above it for an order over several days) and Where (the day's bookable items, `item:read`). No money while collapsed. Pinning puts it in the tray like a calendar booking. Expanding loads the order's facts (customer, contact, assignee, followers, lines, total, balance, issues); the expanded state is kept per card in the viewer's browser, so a reload keeps it, as the tray keeps its pins and shrunk cards.
- The whole card opens the order and hovering it underlines the title; the flag chip stays its own link. The bottom row shows only when there is something: the most urgent flag as a chip linking to what to act on, "+N" for the rest, and "Live" while it is happening.
- Flags, most urgent first: another order's hard hold or a block overlapping a soft-held line (the order's reference); then, only for a member who acts on the order: a run sheet not sent, changed since sent or blocked (`runSheet:read`, assignee of the order or of its responsibility); holds running out within 7 days, a quote waiting on the customer (`quote:read`) and unread customer messages (`inbox:read`), on orders the member is the main assignee of. Order-wide flags sit on the order's first card in the window only.

## Tone
- A search box above the timeline filters it as on the tables (`?q=`): free text over title, customer, number, status and places, and the qualifiers `status:`, `customer:` and `place:`. The server filters the first read; Later filters what it reads on.
- Every booking and order card washes its header, edge to edge, in its status colour (the order's status on My work, the line's state on the calendar cards; `bookingTintVariants` only when it has none). Its outline carries its tone: an issue is never told by the outline: a blocked card (conflict) shows a red error icon before its title and a card with something to fix (any open flag, whether the member acts or follows) an amber warning triangle, and the issue chip at the bottom carries the same icon and says what it is. A soft hold has a dashed outline and a card in a normal state none (a card you only follow keeps a plain outline, since it has no fill). Live, done and following are told by the card itself, not its outline; its parts are split by single rules, with none under the last (`bookingToneVariants` in `@bibi/ui`), the same on My work, the pinned calendar card and the calendar hover card.
- Strongest first: **conflict** (red: a hard-hold clash or a blocked run sheet), **action** (amber: the member acts and a flag is open), **live** (now inside the span), **done** (over, dimmed), **following** (need-to-know only: no fill or shadow), **tentative** (soft holds only: dashed and hatched, as on the calendar), **confirmed**. On the calendar a booking is conflict when a hard hold overlaps its soft hold on the same item (`markBlocked`), else tentative or confirmed by its hold; a pinned card is action while its order has open issues. A hover card is never taller than the room on screen: it scrolls inside.

## Concerns me
Defined in `docs/specs/assignments-and-responsibilities.md` ("Concerns me"). A member acts on `ASSIGNEE`, `RESPONSIBILITY` and `STAFFED`; a follower is told, not asked, so their cards carry no action flags.

## Not built
- Untimed lines (no place on a timeline), orders without lines, prep lead times, the responsibility's own name on the card.
