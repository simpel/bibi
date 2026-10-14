---
name: i18n-strings
description: Add or change UI text in sv and en with next-intl. Use for every new or changed user-visible string.
---

# i18n strings

- UI text goes into both languages. Messages: `packages/i18n/messages/sv.json` and `en.json`. Add the same key to both, in the same order. Swedish is allowed only in these translation files.
- No hardcoded strings in components. Use `useTranslations`/`getTranslations`.
- Error keys: AppError code → `errors.*` (`apps/web/src/lib/error-key.ts`), Zod errors via `lib/issue-message-key.ts`.
- Word choice follows the glossary in `docs/domain-model.md` (sv↔en).
- Verify: `pnpm --filter @okazi/i18n test` (`check-messages` compares the key sets). Then run `pnpm typecheck`.
