# 0036 – Sidebar information architecture

- **Date:** 2026-10-17
- **Status:** Accepted
- **Related:** 0015 (superadmin), 0034 (fixed access roles), 0035 (chat-first navigation)

## Context
- The sidebar listed every entity and every configuration page in one flat list of 16 links, in the order they were built.
- Configuration (types, lists, phases, price lists, members, payments) is used by a few admins a few times a month. It pushed daily work down the list.
- The user menu, theme, language and organization switcher were spread over the top bar and the top of the sidebar.

## Decision
The sidebar has three zones, ordered by how often staff use them.

1. **Assistant** (top): the home link (ADR 0035), "New chat" and the latest conversations.
2. **Work and Catalog** (middle):
   - **Work:** Tickets, Customers. Later, in this order at the top of the group: My work (assigned and following, ADR 0034), Calendar, Sheets.
   - **Catalog:** Items, Venues. Read often and changed rarely, but they are operational data, not configuration, so they stay out of Settings.
3. **Bottom-left zone:**
   - **Settings:** one link to the `/settings` hub, which lists every configuration page (types, lists, setups, sheet definitions, price lists, ticket phases, item states, members, payments, skills). Shown only to members who can change configuration (`configuration:write`, admins by default; ADR 0050). The pages enforce their own permissions; hiding the link is navigation only.
   - **Superadmin:** link to `/admin`, shown only to superadmins (ADR 0015).
   - **User menu:** avatar and name. It opens: theme (light, dark, system), language (sv, en), organization (switch or create), my skills, sign out. A profile page is added when one exists.
- The top bar keeps the mobile menu button, a breadcrumb and the command bar (⌘K); the assistant toggle is gone (ADR 0035 addendum).
- Payments and invoices get no menu entry of their own: they are reached from the ticket and from Settings → Payments.
- Menu entries are data (`nav-items.ts`), grouped by zone. A new entity adds its entry to the right group, not to the end of a flat list.

## Consequences
- Skills move out of the main menu: organization skills are under Settings and personal skills under the user menu. Both open `/skills`.
- The shell decides whether to show Settings from `configurationWrite` in the web app's `getCallerAbilities`, the same check that hides create buttons today. Only two booleans reach the client.
- Theme and language move into the user menu. E2E steps that clicked the top-bar "Theme" and "Language" buttons open the user menu first.
