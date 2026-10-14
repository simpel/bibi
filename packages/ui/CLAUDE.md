# @okazi/ui – designsystem

Delat komponentpaket för all UI i Okazi. Appar importerar **bara** härifrån (`@okazi/ui`); inga råa färger, radier eller typsnitt i appar.

## Struktur
- `src/styles/tokens.css` – ENDA platsen för designtokens (färger, radie, spacing, typsnitt, skuggor; ljus + `.dark`).
- `src/styles/base.css` – basstilar (body, rubriker) via token-utilities.
- `src/styles/index.css` – `@import "tailwindcss"` + tokens + base. Exporteras som `@okazi/ui/styles.css`.
- `src/components/<namn>/<namn>.tsx` – en komponentfamilj per fil (≤150 rader, funktioner ≤40 rader), plus `<namn>.stories.tsx`.
- `src/lib/cn.ts` – `cn()` (clsx + tailwind-merge).
- `src/index.ts` – enda barrel-filen. Lägg till varje ny komponent här.

## Konsumera i en app
Källexport (inget byggsteg): lägg `@okazi/ui` i `transpilePackages` (Next) och importera CSS en gång i appens globala CSS:
```css
@import "@okazi/ui/styles.css";
```
`index.css` har `@source "../"` så Tailwind hittar klasserna i paketet.

## Byta tokens (Claude Design-export)
1. Ersätt värdena i `:root` och `.dark` i `tokens.css` (samma variabelnamn: `--background`, `--primary`, ...).
2. Byt `--font-sans`/`--font-serif`/`--font-mono`, `--radius`, `--shadow-*` i `@theme` vid behov.
3. Ladda webbtypsnitt i appen (t.ex. `next/font`) – inte i paketet.
4. Ny semantisk token: lägg både `:root`/`.dark`-värde OCH `--color-*`-mappning i `@theme inline`.
5. Kör `pnpm --filter @okazi/ui build-storybook` och granska Foundations/Tokens i ljust och mörkt läge.

Inget utanför `tokens.css` får innehålla hårdkodade färger (hex/rgb/oklch), radier eller typsnitt.

## Lägga till en komponent
1. Skapa `src/components/<namn>/<namn>.tsx`. Radix via `import { X as XPrimitive } from "radix-ui"`.
2. Endast namngivna exporter. Props-typ med namn: `export type FooProps = ComponentProps<"div"> & VariantProps<typeof fooVariants>`. Komponenten tar ETT props-objekt.
3. Varianter med `cva` (`fooVariants`, exporteras), alltid `defaultVariants`. Slutlig klass via `cn(fooVariants({ variant }), className)`.
4. Sätt `data-slot="foo"` på rotelementet; tillåt `className` och spread av `...props`.
5. Endast token-utilities (`bg-primary`, `text-muted-foreground`, `rounded-md`, `border-input`); aldrig `bg-[#...]`, `text-red-500` o.d.
6. Skapa `<namn>.stories.tsx` (default-export av `meta` är tillåtet i stories) med `title: "Components/<Namn>"`.
7. Exportera från `src/index.ts`.
8. Hjälpfunktioner (icke-komponenter) tar ett enda typat objekt: `fn({ a, b }: FnInput)`. Enda undantaget är `cn(...inputs)`.

## Kommandon
- `pnpm --filter @okazi/ui typecheck` (`build` kör samma typecheck)
- `pnpm --filter @okazi/ui storybook` / `build-storybook` – mörkt läge växlas i verktygsfältet.
