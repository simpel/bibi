# 0011 – Allergi och kostpreferens som separata entiteter

- **Datum:** 2026-10-14
- **Status:** Ersatt av 0015

## Kontext
`Kostavvikelse` blandade allergier (säkerhetskritiskt, knutet till EU:s 14 allergener) med kostval (vegetarisk, halal m.fl.). Det gav en polymorf entitet med nullbar `allergen` som bara gällde för en typ.

## Beslut
- `Kostavvikelse` ersätts av `Allergi` (`Allergy`) och `Kostpreferens` (`DietaryPreference`).
- `Allergi`: obligatorisk FK till `Allergen`, allvarlighetsgrad (intolerans / allergi / anafylaxi), anteckning. Matchas mot `Artikel.allergener`; en krock är en blockerare.
- `Kostpreferens`: enum (vegetarisk / vegansk / halal / kosher / annat) och fritext för annat. Matchas mot `Artikel.kostmärkning`.
- `Allergen` är globalt, skrivskyddat referensdata (seedat), inte per organisation. Undantag från `organizationId`-regeln i ADR 0004 och 0006. `ikon` hör till UI, inte domänen.
- Båda entiteterna är scopade på `organizationId` och får egna feature-mappar med full paritet (ADR 0003).
- Köksordern sammanställer båda, i separata sektioner: allergier först (per allergen och per namn), därefter kostpreferenser (antal och namn).

## Konsekvenser
- Inga nullbara diskriminatorer eller check-constraints. Zod-scheman blir enkla.
- Två matchningsvägar mot `Artikel` som kan utvecklas oberoende.
- Fler tabeller och feature-mappar, men varje är liten och tydlig.
