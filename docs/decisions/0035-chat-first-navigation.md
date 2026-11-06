# 0035 – Chat-first navigation

- **Date:** 2026-10-17
- **Status:** Accepted
- **Amends:** 0007 (the assistant becomes the home of the app, not only a side panel)

## Context
- ADR 0007 makes the assistant the primary way to work, but the app landed on the venue list and the assistant was a panel behind a toggle.
- Most staff tasks (create an order, answer a request, check today) are things the assistant does through the app's own MCP server.
- Lists and detail pages are still needed to scan and correct, and the assistant is more useful when it knows which entity the user is viewing.

## Decision
1. `/` is the assistant. The authenticated home renders the chat full width, and every post-sign-in redirect goes there.
2. There is one chat session per shell, so the same conversation is never shown twice.
3. The sidebar lists the latest conversations. Opening one goes to `/` with it loaded.
4. The docked panel on other pages was dropped (2026-10-18). The assistant exists only on `/`. "Ask about this" starts a conversation and navigates to `/`, and the page context still reaches the assistant.

## Rejected
- Keeping the venue list as landing page: contradicts AI-first.
- A contextual dock on every page: removed as redundant with `/`.

## Consequences
- The venue list is no longer the landing page, and e2e steps expect `/` after sign-up.
- The home page is a thin server page plus a client island for the session.
