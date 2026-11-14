# My work (the start page)

Current behaviour. Why: ADR 0110. Operation: `myWork.view` (`self:read`, a view read model, ADR 0071).

## Page
- `/:org` is today; `/my-work/{from}/{to}` is any other range of at most 14 days (inclusive, ADR 0064). A range that is not two valid days in order goes to today; a longer one is cut to 14 days.
- Header: title, then **Ask Bibi** as the page's lead (a large question box and three suggestions that open the assistant on `/assistant` with the question sent), then a switch for Today, Tomorrow and This week (today and the next six days).
- **My run sheets** (the main section, needs `runSheet:read`): one row per item row of every current run sheet version that concerns the member, by time, a heading per day in the organization's zone. A row shows the time (a line without a time shows "All day" at the order's start), quantity × the line's name, the order and customer, the counts on the line and on the whole order (a blocking match in red), the run sheet, its status and why it concerns the member. A row changed or added since the last sent version is marked. Rows come 25 per page (`?page=`, operation `page` and `limit`, `rowsTotal` counts all) with Previous and Next under the list.
- **To do** beside it, soonest first: run sheets not sent, changed since sent or blocked (orders with a line from today until the end of the period or a week ahead, whichever is later); holds on the member's orders that run out within 7 days; sent quotes on the member's orders (`quote:read`); unread customer messages on the member's orders (`inbox:read`). Each part lists at most five (`totals` counts all); a part with more links to its full, paged list (run sheets, orders, quotes, inbox).
- **What changed** below: the six latest unread notifications (ADR 0094), opened like in the bell.
- The sidebar's first entry is My work. The assistant's `myWork_view` tool renders the run sheet rows and To do as a card.

## Concerns me
Defined in `docs/specs/assignments-and-responsibilities.md` ("Concerns me"). A run sheet's rows show when the run sheet concerns the member (order, responsibility, recipient); a single row also shows when its line does (staffed, the member's item). To do counts only main assignee, responsibility assignee and staffed: a follower is told, not asked.

## Not built
- Prep lead times (a row shows at the line's start, not when to start preparing), a verb per run sheet, ticking rows off, a location column, unassigned responsibilities in To do.
