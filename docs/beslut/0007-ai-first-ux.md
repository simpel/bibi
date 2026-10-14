# 0007 – AI-first UX

- **Datum:** 2026-10-13
- **Status:** Accepterat

## Kontext
Användarna i venues (säljare, koordinatorer, kök) arbetar i många steg mellan förfrågan, offert, bokning och blad. Ett AI-stöd som bara svarar på frågor räcker inte. Assistenten ska kunna utföra handlingar, men aldrig utan att användaren godkänner, och den ska följa samma behörigheter som användaren.

## Beslut
- Vercel AI SDK är UI-drivare för chatt och verktygsanrop. Modeller nås via Vercel AI Gateway. Leverantören är utbytbar, och modell väljs per funktion i konfigurationen. Claude är standard.
- Webben är MCP-klient mot `apps/mcp` över HTTP, som den inloggade användaren. Assistenten använder därmed samma verktyg, behörighet och scoping som externa klienter. Ingen särskild väg in i tjänstelagret.
- v1-UI:
  - Assistentpanel på alla sidor, med sidkontext (aktiv organisation, route och entitet).
  - ⌘K-kommandofält för naturligt språk.
  - Generative UI: ett register mappar resultattyper till `@okazi/ui`-komponenter.
  - Godkännande: mutationer visas som förslag med kort. Användaren bekräftar eller avbryter. Audit loggar `actor=ai` och konversations-id.
- Konversationer och meddelanden lagras per organisation och användare. De är core-operationer och följer paritetsregeln (ADR 0003).
- Modeller och prompter för funktioner konfigureras i `packages/ai`, inte i kod i appen.

## Konsekvenser
- Eftersom assistenten använder MCP-ytan måste MCP-verktygen ha bra beskrivningar och Zod-scheman. Det är en förutsättning för att fungera.
- Varje ny funktion ska gå att använda via MCP och ha en generative UI-komponent för sina resultat. Det blir en del av Definition of Done.
- Godkännandeflödet är säkerhetskritiskt. Det granskas av Opus-nivå och testas i Playwright med mockad modell.
- Konversationer innehåller affärsdata och lagras därför med samma org-scoping och audit som övrig data.
- Vi är beroende av AI Gateway. Kostnad och latens följer leverantörens priser och modeller.
