# 0005 – Autentisering

- **Datum:** 2026-10-13
- **Status:** Accepterat

## Kontext
Okazi har flera typer av klienter: personal i webbgränssnittet, REST-integrationer från andra system, AI-assistenten och MCP-klienter som Claude Desktop. Var och en behöver en egen inloggningsväg, men alla ska ge samma behörighetsresultat. Svenska krav som BankID används för signering, inte för vanlig inloggning i MVP.

## Beslut
- Better Auth är autentiseringslösning.
- Webb (personal och kunder): e-post och lösenord, samt magic link eller engångskod (OTP).
- REST: API-nycklar (Better Auth API-key-plugin). Nyckeln är knuten till användare och organisation.
- MCP: OAuth via Better Auth OAuth-plugin. Klienten får en token som representerar den inloggade användaren. Ingen separat servicekonto-väg.
- AI-assistenten i webben använder samma MCP-yta med användarens token. Den får inte högre behörighet än användaren.
- BankID införs senare för signering av avtal (se domänmodellen, Avtal & signering). Den ingår inte i inloggningen i MVP.
- Alla klienter går genom samma sessions- och behörighetsupplösning i `packages/auth`.

## Konsekvenser
- En autentiseringsväg per klienttyp, men en behörighetsmodell. Det minskar risken för avvikelser.
- API-nycklar och OAuth-tokens måste kunna återkallas. Återkallelse ska vara en core-operation och därmed finnas i alla ytor.
- MCP-auth och OAuth-flödet är säkerhetskritiskt och granskas av Opus-nivå.
- BankID-integrationen är ett eget spår. Ingen ADR krävs förrän den påbörjas.
