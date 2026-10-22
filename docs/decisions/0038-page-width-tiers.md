# 0038 – Page width tiers

- **Date:** 2026-10-17
- **Status:** Accepted
- **Related:** 0035 (chat-first navigation), 0036 (sidebar information architecture)

## Context
- Every page was wrapped in one `max-w-5xl` container by the app shell. That suits lists and forms, but it squeezes the calendar grid and wastes the screen on the assistant home.
- There was no rule for which pages are contained and which are not, so each new page would have decided on its own.

## Decision
A page is either **contained** or a **canvas**. The choice is made by the route group, not by each page.

- **Contained** (`app/[locale]/(app)/(contained)/`): lists, detail pages, forms, settings. Its layout wraps the page in `PageContainer` (`@bibi/ui`, cva `width`):
  - `default` (`max-w-5xl`): the normal width, supplied by the layout.
  - `narrow` (`max-w-2xl`): a form or reading page. The page nests `<PageContainer width="narrow" gutter={false}>`.
  - `wide` (`max-w-7xl`): a table with many columns. Nested the same way.
- **Canvas** (`app/[locale]/(app)/(canvas)/`): spatial, time-based or streaming pages. The layout fills the viewport below the top bar (`h-[calc(100dvh-3.5rem)]`) and adds no padding. The page decides which part is capped.
  - **Calendar:** a full-width toolbar row, and the grid scrolls on its own below it.
  - **Assistant home:** the transcript and the message box sit in a centred `max-w-3xl` column, with the message box at the bottom. The header and the scroll area span the full width.

Rule of thumb: rows and fields that are read or scanned are contained. A grid on a time axis or a conversation stream is a canvas. A new page goes into one of the two groups, and the app shell itself adds no container.

## Consequences
- Moving a page between tiers is moving its folder.
- A canvas page owns its own gutter and its own scrolling.
- Phones keep a 16px gutter on contained pages and on canvas toolbars and the message box.
