---
name: new-ui-component
description: Lägg till en komponent i `@okazi/ui` (cva, tokens, story) eller en generative UI-komponent för ett verktygsresultat. Använd vid ny UI-primitiv eller nytt resultatkort.
---

# Ny UI-komponent

Fullständig mall: `packages/ui/CLAUDE.md` ("Lägga till en komponent"). Sammanfattning:

1. `packages/ui/src/components/<namn>/<namn>.tsx`, en familj per fil, Radix via `import { X as XPrimitive } from "radix-ui"`.
2. Named exports, props-typ `FooProps`, varianter med `cva` (`fooVariants`, alltid `defaultVariants`), `cn(fooVariants({ variant }), className)`, `data-slot="foo"`, spread `...props`.
3. Endast token-utilities (`bg-primary`, `rounded-md`). Aldrig `bg-[#...]` eller råa färger. Nya tokens bara i `src/styles/tokens.css`.
4. `<namn>.stories.tsx` med `title: "Components/<Namn>"`. Granska i ljust och mörkt läge: `pnpm --filter @okazi/ui build-storybook`.
5. Exportera från `packages/ui/src/index.ts`.
6. Appar bygger UI bara från `@okazi/ui`. Texter via next-intl (skill `i18n-strings`).

**Generative UI för ett verktygsresultat:** wire-schema i `packages/ai/src/ui-contract/wire-schemas.ts` (härlett ur `@okazi/core/schemas`), `uiEntry` och rad i `tool-ui-registry.ts`. Varje resultattyp ska ha en komponent.
