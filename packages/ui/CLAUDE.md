# @bibi/ui – design system

Shared component package for all UI in Bibi. Apps import **only** from here (`@bibi/ui`); no raw colors, radii or fonts in apps.

## Structure
- `src/styles/tokens.css` – the ONLY place for design tokens (colors, radius, spacing, fonts, shadows; light + `.dark`).
- `src/styles/base.css` – base styles (body, headings) via token utilities.
- `src/styles/index.css` – `@import "tailwindcss"` + tokens + base. Exported as `@bibi/ui/styles.css`.
- `src/components/<name>/<name>.tsx` – one component family per file (≤150 lines, functions ≤40 lines), plus `<name>.stories.tsx`.
- `src/lib/cn.ts` – `cn()` (clsx + tailwind-merge).
- `src/index.ts` – the only barrel file. Add each new component here.

## Consuming in an app
Source export (no build step): add `@bibi/ui` to `transpilePackages` (Next) and import the CSS once in the app's global CSS:
```css
@import "@bibi/ui/styles.css";
```
`index.css` has `@source "../"` so Tailwind finds the classes in the package.

## Replacing tokens (Claude Design export)
1. Replace the values in `:root` and `.dark` in `tokens.css` (same variable names: `--background`, `--primary`, ...).
2. Change `--font-sans`/`--font-serif` (and purpose aliases), `--radius`, `--shadow-*` in `@theme` if needed.
3. Load web fonts in the app (e.g. `next/font`) – not in the package.
4. New semantic token: add both the `:root`/`.dark` value AND the `--color-*` mapping in `@theme inline`.
5. Run `pnpm --filter @bibi/ui build-storybook` and review Foundations/Tokens in light and dark mode.

Nothing outside `tokens.css` may contain hardcoded colors (hex/rgb/oklch), radii or fonts.

## Adding a component
1. Create `src/components/<name>/<name>.tsx`. Radix via `import { X as XPrimitive } from "radix-ui"`.
2. Named exports only. Props type with a name: `export type FooProps = ComponentProps<"div"> & VariantProps<typeof fooVariants>`. The component takes ONE props object.
3. Variants with `cva` (`fooVariants`, exported), always `defaultVariants`. Final class via `cn(fooVariants({ variant }), className)`.
4. Set `data-slot="foo"` on the root element; allow `className` and spread `...props`.
5. Token utilities only (`bg-primary`, `text-muted-foreground`, `rounded-md`, `border-input`); never `bg-[#...]`, `text-red-500` and the like.
6. Create `<name>.stories.tsx` (a default export of `meta` is allowed in stories) with `title: "Components/<Name>"`.
7. Export from `src/index.ts`.
8. Helper functions (non-components) take a single typed object: `fn({ a, b }: FnInput)`. The only exception is `cn(...inputs)`.

## Commands
- `pnpm --filter @bibi/ui typecheck` (`build` runs the same typecheck)
- `pnpm --filter @bibi/ui storybook` / `build-storybook` – dark mode is toggled in the toolbar.
