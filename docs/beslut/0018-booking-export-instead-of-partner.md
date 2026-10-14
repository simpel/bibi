# 0018 – Export av bokning i stället för partnerentitet

- **Datum:** 2026-10-14
- **Status:** Accepterat

## Kontext
- Partner (extern restaurangoperatör som tar emot köksorder över bolagsgräns) kom från World of Volvos upplägg. Det är ett specialfall och inget generellt behov.
- Det generella behovet är att kunna lämna över en bokning eller ett blad (ADR 0015) till någon utanför systemet: extern kock, AV-leverantör, rederi eller transportör.

## Beslut
- Partner stryks ur MVP. Blad går till en roll i organisationen (ADR 0014, 0015).
- Operationen `booking.export` (`booking:read`) ger en bokning i formaten:
  - `json`: versionerat, stabilt schema för integrationer. Organisationens fält ingår med sina definitioner.
  - `pdf`: program, uppställningar, artiklar med gjorda val och behov.
  - `csv`: program och orderrader.
- `sheet.export` ger ett enskilt blad i samma format, t.ex. köksordern till en extern kock.
- Behov exporteras som antal per listvärde, aldrig kopplade till en person. Varje export loggas i `AuditLog`.
- Blad är versionerade med ändringsmarkering (★). Exporten tar alltid med den senaste versionen och vilken version det är.

## Konsekvenser
- ADR 0004 får ett tillägg: partneråtkomst över bolagsgräns är inte längre planerad.
- Entiteten Partner tas bort ur domänmodellen.
- CLAUDE.md uppdateras: blad går till egna roller, och export finns för överlämning.
