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
3. Settings is one link to a hub of every configuration page, shown only to members who may change configuration. The pages enforce their own permissions; hiding the link is navigation only.
4. Theme, language, organization switching and personal skills live in the user menu.
5. Payments and invoices get no entry of their own. The one exception is Financials, shown to callers with `finance:read` (ADR 0077).
6. Menu entries are data, grouped by zone. A new entity adds its entry to the right group.

## Rejected
- A flat list ordered by build time.

## Consequences
- Organization skills move under Settings and personal skills under the user menu.
- The shell shows Settings from a single ability boolean, the same check that hides create buttons.
