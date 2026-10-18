# 0035 – Chat-first navigation

- **Date:** 2026-10-17
- **Status:** Accepted
- **Amends:** 0007 (the assistant becomes the home of the app, not only a side panel)

## Context
- ADR 0007 makes the assistant the primary way to work, but the web app still lands on the venue list and the assistant is a panel you open from the top bar.
- Most staff do a handful of things: create a ticket from a template, answer a request, check what is on today. The assistant does all of these through the app's own MCP server.
- Lists and detail pages are still needed for scanning, checking and correcting, and the assistant is more useful on them when it knows which entity the user is looking at.

## Decision
- **`/` is the assistant.** The authenticated home page renders the chat full width. It shows the conversation the shell is already in (a fresh one after sign-in), with "New chat" to start over. Every post-sign-in redirect (login, sign-up, select organization, accept invitation) goes to `/`.
- **One chat session per shell.** The full-page chat on `/` and the docked panel share the same `AssistantProvider` session. The dock and its top-bar toggle are hidden on `/`, so the same conversation is never shown twice.
- **Contextual dock on every other page.** On lists and detail pages the assistant stays the resizable dock (⌘J / Ctrl+J). It already receives the page context (ADR 0007), so "move this ticket to the next phase" works on a ticket page.
- **Recent conversations in the sidebar.** The sidebar lists the user's latest conversations under "Assistant". Opening one goes to `/` with that conversation loaded.
- **Mobile keeps the drawer.** Below `md` the sidebar is a sheet from the top bar. A bottom tab bar is left for later.

## Consequences
- The venue list is no longer the landing page. E2E steps that expected `/venues` after sign-up now expect `/`.
- The home page renders client state from `AssistantProvider`, so it is a thin server page plus a client island.
- "My work", "Calendar" and operational "Sheets" (ADR 0036) need pages and, for "My work", `assignment.listMine` (ADR 0034). They are tracked as follow-up tickets and are not in the menu until they exist.
