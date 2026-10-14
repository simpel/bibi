---
name: i18n-strings
description: Lägg till eller ändra UI-text i sv och en med next-intl. Använd vid varje ny eller ändrad användarsynlig sträng.
---

# i18n-strängar

- Meddelanden: `packages/i18n/messages/sv.json` och `en.json`. Lägg samma nyckel i båda, samma ordning.
- Inga hårdkodade strängar i komponenter. Använd `useTranslations`/`getTranslations`.
- Felnycklar: AppError-kod → `errors.*` (`apps/web/src/lib/error-key.ts`), Zod-fel via `lib/issue-message-key.ts`.
- Ordval följer glossariet i `docs/domanmodell.md` (sv↔en).
- Verifiera: `pnpm --filter @okazi/i18n test` (`check-messages` jämför nyckeluppsättningarna). Kör sedan `pnpm typecheck`.
