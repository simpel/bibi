# 0009 – Språk i kod och UI, samt kodregler

- **Datum:** 2026-10-13
- **Status:** Accepterat

## Kontext
Teamet arbetar på svenska i dokumentation och produkt, men kodbasen ska kunna utvecklas av fler och av AI-verktyg. Entitetsnamn har stor påverkan på API:er och AI-verktyg. Samtidigt är användargränssnittet på svenska för kunder i Sverige och på engelska för internationella användare. Språkvalet för entitetsnamn har varit öppet i CLAUDE.md.

## Beslut
### Språk
- Kod, entitetsnamn, API-fält, verktygsnamn och kommentarer på engelska. Se glossariet i `docs/domanmodell.md` för sv↔en-översättning.
- Dokumentation (`docs/`, ADR och CLAUDE.md) på svenska.
- All UI-text går via next-intl med meddelanden för svenska och engelska. Inga hårdkodade strängar i komponenter.

### Kodregler
- Max 150 rader per fil och max 40 rader per funktion. En idé per fil.
- Endast named exports. `default` endast för Next.js page, layout och route.
- Inga barrel-filer utom paketets `src/index.ts`.
- Funktioner tar ett typat objekt som parameter.
- Strikt TypeScript utan `any`. Zod vid alla gränser.
- Miljövariabler endast via `@okazi/config`.
- Typade `AppError` och `Result`. Inga kastade strängar.
- Feature-mappar med fasta filnamn: `schema.ts`, `operations.ts`, `graphql.ts`, `rest.ts`, `mcp.ts`, `ui/`.
- UI endast via `@okazi/ui`. Varianter med cva. Tokens i en fil.
- Efterlevnad kontrolleras av `pnpm check:structure` och Biome i CI.

## Konsekvenser
- Engelska namn gör API:er och MCP-verktyg konsekventa för internationella integrationer. Svenska termer finns kvar i dokumentationen och i UI:t.
- Varje ny sträng kräver två översättningar. Haiku-subagenter kan sköta det mekaniskt.
- Regeln om 150 rader och en idé per fil ger fler små filer. Det är avsiktligt, eftersom det gör AI-verktygens kontext mindre och granskning enklare.
- Kodregler som kan automatiseras ska det göras. Övriga granskas i kodgranskning.
