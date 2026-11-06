# 0096 – Page titles and breadcrumbs

- **Date:** 2026-11-04
- **Status:** Accepted
- **Related:** 0015, 0050, 0061, 0062, 0081, 0085, 0094, 0095

## Context
- Tabs, bookmarks and assistive technology need a localized `<title>` on every route. Several areas had none and fell back to "Bibi".
- Breadcrumbs existed only in the main app bar, and some crumb paths linked to 404s.

## Decision
1. The root layout sets a title template, so every route sets a short localized title and gets the suffix.
2. Shared metadata helpers produce static and entity titles. Layout-level fallbacks cover every group.
3. Breadcrumbs appear in every shell, including platform admin and docs.
4. One crumb builder normalises paths and never links to a route that does not exist.
5. Routes without a detail page get a small redirect page, so a typed address lands on the edit form or the parent list.
6. Leaf pages name the breadcrumb with the record's name once loaded.

## Rejected
- Build crumb names in layouts. Layouts cannot see data fetched by child pages, so it would duplicate queries.
- Concatenate titles by hand per page. The suffix drifts.
- Hide breadcrumbs in Admin and Docs. Those readers need orientation too.

## Consequences
- Candidate to merge into a UI rule in `apps/web/CLAUDE.md`: this is a convention with no costly reversal.
