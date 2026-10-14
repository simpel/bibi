# 0003 – Paritetsarkitektur

- **Datum:** 2026-10-13
- **Status:** Accepterat

## Kontext
Okazi ska kunna användas via webbgränssnittet, GraphQL, REST och MCP. Utan gemensam källa skulle regler för behörighet, validering och audit divergera mellan ytorna. Det gäller särskilt när AI-assistenten ska kunna utföra samma åtgärder som användaren.

## Beslut
- Core-operationer i `packages/core` är enda sanningen. Varje operation har Zod-schema för in- och utdata, behörighetskontroll och handler. Operationer definieras med `defineOperation`.
- Varje kommando finns i alla ytor: web, GraphQL, REST och MCP.
- Läsningar via GraphQL. Schemat genereras från entiteterna och ger full grafåtkomst i den org-scopade kontexten.
- REST under `/api/v1` med OpenAPI, härledd från samma operationer. `POST /graphql` finns även.
- MCP i `apps/mcp` exponerar två typer av verktyg:
  - kurerade verktyg, ett per kommando och per vanlig läsning, med bra beskrivningar och Zod-scheman.
  - generiska `graphql_schema` och `graphql_query` för fri läsning. Endast läsning, med djup- och kostnadsbegränsning.
- Fel mappas från `AppError` till HTTP-status, GraphQL-felextension och MCP `isError` via en enda mapper.
- Ett paritetstest i CI verifierar att varje operation finns i alla ytor och att varje entitet går att läsa via graph, REST och MCP.
- Ny förmåga börjar alltid som core-operation i samma ändring som adaptrarna.

## Konsekvenser
- Affärslogik och behörighet finns på ett enda ställe. Adaptrarna är tunna.
- Nya entiteter kostar mer till en början, eftersom alla ytor ska få dem. Gen-verktyget (`pnpm gen entity`) och feature-mappar med fasta filnamn gör det mekaniskt.
- Paritetstestet blockerar merge när en yta missar ett kommando. Det är avsiktligt.
- Den generiska GraphQL-ytan för MCP gör att AI-assistenten kan läsa mer än de kurerade verktygen visar. Djup- och kostnadsgränser och org-scopning är därför obligatoriska.
- Adaptrarna (`packages/graphql`, `packages/api`, `apps/mcp`) kräver egna CLAUDE.md-noter när de byggs ut.
