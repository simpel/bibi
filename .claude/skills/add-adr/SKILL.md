---
name: add-adr
description: Skriv ett nytt beslut (ADR) i `docs/beslut/NNNN-titel.md` på svenska. Använd när ett arkitektur- eller produktbeslut ska loggas eller ändras.
---

# Ny ADR

1. Nästa nummer: högsta `NNNN` i `docs/beslut/` + 1. Filnamn `NNNN-short-title.md` på engelska (gemener, bindestreck). Innehållet är på svenska.
2. Struktur (se `0010-webbens-dataatkomst.md`):
   ```
   # NNNN – Titel

   - **Datum:** ÅÅÅÅ-MM-DD
   - **Status:** Föreslaget | Accepterat | Ersatt av NNNN

   ## Kontext
   ## Beslut
   ## Konsekvenser
   ```
3. Svenska. Korta punkter. Hänvisa till relaterade ADR:er med nummer.
4. Ändrar beslutet en tidigare ADR: sätt den gamla till "Ersatt av NNNN" eller lägg ett daterat "Tillägg" (som 0010) när beslutet bara utökas.
5. Påverkar beslutet `CLAUDE.md` (stack, principer, öppna frågor), uppdatera den i samma ändring.
