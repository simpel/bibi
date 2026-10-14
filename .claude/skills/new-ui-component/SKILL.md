---
name: new-ui-component
description: Add a component to `@okazi/ui` (cva, tokens, story) or a generative UI component for a tool result. Use for a new UI primitive or a new result card.
---

# New UI component

Full template: `packages/ui/CLAUDE.md` ("Adding a component"). Summary:

1. `packages/ui/src/components/<name>/<name>.tsx`, one family per file, Radix via `import { X as XPrimitive } from "radix-ui"`.
2. Named exports, props type `FooProps`, variants with `cva` (`fooVariants`, always `defaultVariants`), `cn(fooVariants({ variant }), className)`, `data-slot="foo"`, spread `...props`.
3. Token utilities only (`bg-primary`, `rounded-md`). Never `bg-[#...]` or raw colors. New tokens only in `src/styles/tokens.css`.
4. `<name>.stories.tsx` with `title: "Components/<Name>"`. Review in light and dark mode: `pnpm --filter @okazi/ui build-storybook`.
5. Export from `packages/ui/src/index.ts`.
6. Apps build UI only from `@okazi/ui`. Text via next-intl (skill `i18n-strings`).

**Generative UI for a tool result:** wire schema in `packages/ai/src/ui-contract/wire-schemas.ts` (derived from `@okazi/core/schemas`), `uiEntry` and a line in `tool-ui-registry.ts`. Every result type must have a component.
