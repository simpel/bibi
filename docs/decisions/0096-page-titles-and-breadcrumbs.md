# 0096 – Page titles and breadcrumbs

- **Date:** 2026-11-04
- **Status:** Accepted (approved by the user on 2026-11-04)
- **Related:** 0015 (platform admin), 0028 (payment), 0050 (members and api keys), 0061 (onboarding), 0062 (welcome), 0081 (order intake), 0085 (inbox), 0094 (notifications), 0095 (billing)

## Context
- Browser tabs, bookmarks, and assistive technologies rely on meaningful, localized `<title>` tags for every route. Several areas across the application (Canvas, Contained, Settings, Admin, Mothership, Docs, Welcome, Billing, Auth, and Public) either lacked `generateMetadata`, had untranslated titles, or fell back to the root default "Bibi".
- Breadcrumbs were only integrated into the main application top bar; other shell surfaces (`AdminShell` for the Mothership platform administration and `DocsShell` for documentation) had no breadcrumbs.
- Several breadcrumb paths produced intermediate links that resulted in 404 errors when clicked (e.g., settings routes like `/settings/price-lists/[id]` where only `/settings/price-lists/[id]/update` exists, or `/quotes` where quotes are subordinate to orders).
- Entity detail and update views could not display the human-readable entity name in breadcrumbs without dynamic registration.

## Decision
1. **Root layout title template.** In `apps/web/src/app/[locale]/layout.tsx`, root metadata is configured with `title: { default: appName, template: "%s · " + appName }`. Every route sets a concise localized title (e.g. "Pipeline", "Edit Acme Corp"), and Next.js formats it consistently as `[Title] · Bibi`.
2. **Standardized metadata helpers.** `pageTitle(namespace, key, values?)` and `entityTitle({ name, fallback, prefix? })` in `apps/web/src/lib/page-metadata.ts` provide uniform, localized titles across both static and dynamic routes. Layout-level `generateMetadata` fallbacks in `(mothership)`, `settings`, `(docs)`, `(welcome)`, `[org]/welcome`, `[org]/billing`, and `(auth)` prevent unhandled leaf routes from showing the bare application name.
3. **Universal breadcrumb presence across all shells.** `Breadcrumb` and `CrumbNamesProvider` are embedded in `TopBar` (app shell), `AdminShell` (platform administration), and `DocsShell` (documentation).
4. **Normalized breadcrumb model (`buildCrumbs`).**
   - Routes without a standalone detail page (`settings/(pipeline|price-lists|run-sheets|order-templates|responsibilities|item-states)/[id]/update`) collapse from 4 crumbs into 3 (`Settings > [Collection] > [Name/Edit]`), skipping non-existent intermediate routes.
   - Quote views (`/quotes/[id]`) set their parent crumb to `/orders`.
   - Docs views (`/docs/*`) collapse intermediate category segments into `Docs > [Document Title]`.
   - Creation pages (`/new/*`) resolve their parent crumbs back to their primary collections.
5. **Fallback and redirect pages.** For URLs that have no standalone detail page (`settings/[collection]/[id]/page.tsx` and `/quotes/page.tsx`), lightweight redirect pages are added so that manual address-bar entry or external links cleanly redirect to the edit form or parent collection instead of returning 404.
6. **Dynamic breadcrumb naming.** Leaf components mount `<CrumbName href={...} name={...} />`, dynamically updating the breadcrumb label in the shell header with the actual record name (customer name, order title, item name, venue name, member name, API key name, etc.) once loaded.

## Rejected
- **Generating breadcrumb entity names inside layouts.** Next.js layout components do not have access to data fetched inside child page components; moving all data fetching into layouts would introduce duplicate queries or waterfall requests.
- **Manual title concatenation per page.** Writing `${title} · Bibi` manually in every page causes template drift, inconsistent punctuation, and breaks Next.js metadata inheritance.
- **Hiding breadcrumbs in Admin and Docs shells.** Platform administrators and readers of documentation need orientation and navigation context just as much as app users.
