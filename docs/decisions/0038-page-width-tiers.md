# 0038 – Page width tiers

- **Date:** 2026-10-17
- **Status:** Accepted
- **Related:** 0035, 0036

## Context
- Every page sat in one `max-w-5xl` container. That suits lists and forms but squeezes the calendar grid and wastes the screen on the assistant home.
- There was no rule for which pages are contained, so each new page would decide alone.

## Decision
1. A page is either contained or a canvas, chosen by its route group and not by the page.
2. Contained pages (lists, details, forms, settings) build themselves from shared sections with width variants default, narrow and wide.
3. Canvas pages (calendar, assistant, pipeline board) fill the viewport below the top bar, add no padding and own their scrolling.
4. Read or scanned rows and fields are contained. A time grid or a stream is a canvas.

## Rejected
- One container for every page.
- Each page choosing its own width.

## Consequences
- Moving a page between tiers means moving its folder.
- A page that only wants a coloured band stays contained.
- Phones keep a 16px gutter on contained pages and on canvas toolbars.
