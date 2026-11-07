# 0036 – Sidebar information architecture

- **Date:** 2026-10-17
- **Status:** Accepted
- **Related:** 0015 (superadmin), 0034 (fixed access roles), 0035 (chat-first navigation)

## Context
- The sidebar was a flat list of 16 links in build order. Configuration, used by a few admins a few times a month, pushed daily work down.
- User menu, theme, language and organization switcher were scattered.

## Decision
1. Three zones, ordered by how often staff use them: Assistant at the top, Work and Catalog in the middle, and Settings, Superadmin and the user menu at the bottom.
2. Catalog (items, venues) is operational data, so it stays out of Settings.
3. Administration is one link to an area of its own under `/admin`: inside it the sidebar swaps to a back link and four groups (Organization, Catalog, Orders, Money & connections), and close kin share a page as tabs. The link shows to members who may view at least one page; `/admin` opens the first one they may view. The pages enforce their own permissions; hiding a link is navigation only. (Changed 2026-11-07: the two hubs, `/admin` and `/settings`, are gone.)
4. Theme, language, organization switching and personal skills live in the user menu.
5. Payments and invoices get no entry of their own. The one exception is Financials, shown to callers with `finance:read` (ADR 0077).
6. Menu entries are data, grouped by zone. A new entity adds its entry to the right group.

## Rejected
- A flat list ordered by build time.
- A hub page of cards in front of the settings pages: two clicks to any setting, and no way to move between them.

## Consequences
- Personal skills live in the user menu only.
- The shell shows Administration from a single ability boolean; `ADMIN_GROUPS` decides the area's own sidebar.
