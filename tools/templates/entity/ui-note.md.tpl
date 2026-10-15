# {{Pascal}} – UI

Placeholder created by `pnpm gen entity {{Pascal}}`. The UI for {{Pascal}} goes in this folder (`apps/web/src/features/{{kebab}}/ui/`).

- Build with `@okazi/ui` (cva and tokens). No raw colors and no custom primitives in the app.
- All text goes through next-intl (sv and en, both files in `packages/i18n/messages`).
- Data goes through ONE layer: `apps/web/src/server/run-operation.ts` (server components) and server actions in `apps/web/src/features/{{kebab}}/actions.ts` that call `runOperation({ operation, input })` and `toActionResult`. Never `@okazi/db` or a custom `ExecuteContext` (ADR 0010).
- Patterns to copy: `features/venue/ui/` (list with cursor pagination, form with react-hook-form + the core schema, dialog, archive with confirmation) and `features/item/ui/` (sub-list on the detail page).
- Client components must not import `@okazi/core` (values). The schema is reached via `@core-schema/{{kebab}}` (add the alias in `apps/web/tsconfig.json`, `apps/web/vitest.config.ts`).
- Register the operations in `apps/web/src/features/web-surfaces.ts` (`WEB_SURFACES`) or list them in `UI_EXEMPT` (`apps/web/src/features/ui-exempt.ts`) with a reason. The test `web-surfaces.test.ts` and the parity test in `apps/mcp` require it.
- Add a page under `apps/web/src/app/[locale]/(app)/<route>/page.tsx` and an entry in `components/shell/nav-items.ts`.
- Results in the assistant are shown with a generative UI component. Register the result type `{{kebab}}` in `packages/ai` (ADR 0007).
