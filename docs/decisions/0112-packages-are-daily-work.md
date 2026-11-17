# 0112 – Packages (order templates) are daily work with their own permission

- **Date:** 2026-11-17
- **Status:** Accepted (the user, 2026-11-17)
- **Amends:** 0050 (the `template` feature covered both order templates and run sheet definitions)
- **Related:** 0034, 0036, 0089

## Context
- A package (`OrderTemplate`, "Packages" / "Mallar" in the UI) is a ready-made set of lines for a small meeting. Sales staff make one when they notice they keep selling the same thing.
- Today it shares the `template` feature with run sheet definitions. Only the `admin` preset writes `template`, and the page sits in the administration area (`/admin/order-templates`).
- So a manager who sells every day can use packages but must ask an admin to create or change one. A run sheet definition, in contrast, decides what the kitchen receives and is organization setup.

## Decision
1. A new feature `orderTemplate` (permission group `catalog`, next to items and price lists; actions `read`, `write`, `delete`) owns packages. `template` keeps only run sheet definitions, and stays admin-written.
2. Presets: `member` reads, `manager` and `admin` read, write and delete. Admins can fine-tune it per member like any feature (not locked).
3. `orderTemplate:read` is always visible (shared vocabulary): the order intake shows packages to everyone who creates orders.
4. Packages leave the administration area. They get their own page in the main app under Catalog (`/packages`, create at `/new/order-template` as today), and `/admin/order-templates` redirects there.
5. The migration copies each existing `template:*` allow or deny override to the same action on `orderTemplate`, so nobody gains or loses access to packages on the day it ships.

## Rejected
- Grant managers `template:write`: they could then also change run sheet definitions, which is organization setup.
- Keep packages in administration and only widen the permission: managers would open an area built for admins to do daily sales work, and the admin menu would show to people who may change nothing else there.

## Consequences
- Package operations, GraphQL, REST and MCP tools move from `template:*` to `orderTemplate:*`; the parity test and the permission grid follow.
- The admin section `orderTemplates` is removed from `ADMIN_SECTIONS`; the Catalog sidebar group gains Packages for members who may read them.
- The permissions spec, the demo seed and the support texts on packages are updated in the same change.
