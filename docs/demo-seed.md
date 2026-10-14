# Demodata

Specifikation för `pnpm --filter @okazi/core seed:demo` (ADR 0019). Två fiktiva organisationer som är uppsatta helt olika med samma kod, för att visa den konfigurerbara domänen (ADR 0015).

- **Lindholmen Upplevelsecenter**: konferens, utställning och restaurang. Använder allt: listor med allergener, blad till köket, paket och serier.
- **Vingaleden Skärgårdsturer**: båtturer i Göteborgs skärgård. Ingen mat, inga allergener, andra statusar och andra behov.

Alla datum anges relativt körningsdagen: `D` = idag, `D+3` = om tre dagar. Tider är lokal tid (Europe/Stockholm).

## Kontroller efter seed (CI)

Skriptet avslutas med kontroller som får CI att fallera om demot inte visar det det ska:

1. Antal rader per entitet och organisation stämmer med tabellerna nedan.
2. Vingaleden har ingen lista som heter "Allergener", och inget av dess blad tar med mat.
3. Lindholmens köksorder för bokning L5 är **blockerad**: anafylaxi mot kräftdjur mot en obligatorisk rätt.
4. Lindholmens köksorder för bokning L3 är **inte** blockerad: nötallergin har ett alternativ i valgruppen.
5. Option O1 har rang 1 och O2 rang 2 på samma rum och tid.
6. I serien S1 är tillfälle 4 flaggat för krock och flyttat till ett annat rum.
7. Varje skrivning har en rad i `AuditLog` med aktör `SYSTEM`.

Del 1 (roller) kontrollerar i dag: roller och medlemmar per organisation, att varje användare har sin roll enligt tabellerna, och punkt 7.

## Undantag och inloggning

- Organisationen, användarna och medlemskapen är Better Auths tabeller. De skrivs direkt (`seed/demo/users.ts`), på samma sätt som registrering och `addMember` gör. Allt annat går via `execute` som `SYSTEM`. Ägaren får `owner` direkt, övriga får sin roll via `member.assignRole`.
- Användarnas e-post är `förnamn.efternamn@<slug>.okazi.test`, t.ex. `anna.berg@lindholmen-demo.okazi.test`. Logga in med magisk länk eller engångskod; mejlet hamnar i Mailpit.
- Roller som ska skriva kunder, bokningar eller blad får de behörigheterna när resurserna finns (del 2–6). Tills dess läser de anläggningar och rum.

---

# Lindholmen Upplevelsecenter

Slug `lindholmen-demo`. Anläggning: Lindholmspiren 1, 417 56 Göteborg.

## Konfiguration

### Roller
Importerade från mallen "Konferensgård" (ADR 0014), plus en egen roll Vaktmästare.

| Användare | Roll |
|---|---|
| Anna Berg | owner |
| Erik Lund | Säljare |
| Sara Nilsson | Säljare |
| Johan Ek | Koordinator |
| Maria Holm | Koordinator |
| Ali Karimi | Kök |
| Peter Sjö | Vaktmästare |
| Lena Ström | Ekonomi |

### Listor
| Lista | Värden |
|---|---|
| Allergener | Importerad mall "EU:s 14 allergener": Gluten, Kräftdjur, Ägg, Fisk, Jordnötter, Soja, Mjölk, Nötter, Selleri, Senap, Sesam, Svaveldioxid/sulfiter, Lupin, Blötdjur |
| Kost | Vegetarisk, Vegansk, Halal, Fläskfri |
| Allvarlighetsgrad | Intolerans, Allergi, Anafylaxi |
| Tillgänglighet | Rullstol, Hörselslinga, Ledarhund |
| Utsikt | Älven, Innergården, Ingen |
| Dresscode | Vardag, Kavaj, Mörk kostym |

### Uppställningar
Bio (15 min), Klassrum (30), U-bord (30), Styrelse (20), Ö-sittning (40), Bankett (60), Mingel (15).

### Artikeltyper
| Typ | Beteenden | Egna fält |
|---|---|---|
| Konferensrum | `BOOKABLE`, `SETUPS`, `PRICED` | Våning (tal), Yta m² (tal), Takhöjd m (tal), Dagsljus (ja/nej), Utsikt (val: Utsikt) |
| Rätt | – | Allergener (flerval: Allergener), Kost (flerval: Kost) |
| Dryck | `PRICED` | Allergener (flerval), Alkoholhaltig (ja/nej) |
| Måltid | `PRICED`, `COMPOSABLE`, `CHOICES` | Serveringsform (val: Buffé, Serverad, Plockmat) |
| Visning | `PRICED`, `COMPOSABLE`, `CHOICES`, `BOOKABLE` | Språk (flerval: Svenska, Engelska, Tyska) |
| Guide | `BOOKABLE` | Språk (flerval) |
| Utrustning | `BOOKABLE`, `PRICED` | Inventarienummer (text) |
| Paket | `PRICED`, `COMPOSABLE`, `CHOICES` | Minsta antal (tal) |

### Övriga typer
| Grundentitet | Typer och fält |
|---|---|
| Kund | Företag (Orgnr, Ramavtal ja/nej) · Offentlig (Orgnr, Peppol-ID, Kräver diarienummer ja/nej) · Förening (Orgnr) |
| Bokning | Konferens (Syfte) · Event (Dresscode: val Dresscode, Talare/underhållning) · Visning (Skolklass ja/nej) |
| Behov | Kostbehov (lista Allergener eller Kost, fält Allvarlighetsgrad) · Tillgänglighet (lista Tillgänglighet) |

### Bokningsstatusar
| Status | Fas |
|---|---|
| Preliminär | `TENTATIVE` |
| Väntar på förskott | `TENTATIVE` |
| Bekräftad | `CONFIRMED` |
| Slutligt antal låst | `CONFIRMED` |
| Genomförd | `COMPLETED` |
| Avbokad | `CANCELLED` |

### Blad
| Blad | Artikeltyper | Behov | Till roll |
|---|---|---|---|
| Köksorder | Rätt, Dryck, Måltid | Allergener, Kost | Kök |
| Möbleringsorder | Konferensrum, Utrustning | Tillgänglighet | Vaktmästare |
| Guidebrief | Visning, Guide | Tillgänglighet | Koordinator |

## Katalog

### Konferensrum (10)
Pris per timme exkl. moms. Kapacitet per uppställning.

| Rum | Vån | m² | Dagsljus | Utsikt | Kapacitet | kr/h |
|---|---|---|---|---|---|---|
| Vinga (aula) | 1 | 260 | ja | Älven | Bio 220, Klassrum 120, Bankett 160, Mingel 250 | 4 500 |
| Hönö | 2 | 90 | ja | Älven | Bio 70, Klassrum 40, U-bord 28, Ö-sittning 48, Bankett 56 | 1 900 |
| Öckerö | 2 | 70 | ja | Innergården | Bio 50, Klassrum 30, U-bord 22, Ö-sittning 36 | 1 500 |
| Styrsö | 3 | 45 | ja | Älven | Styrelse 16, U-bord 14 | 950 |
| Vrångö | 3 | 45 | ja | Innergården | Styrelse 14, U-bord 12 | 900 |
| Donsö | 3 | 32 | ja | Älven | Styrelse 10 | 700 |
| Brännö | 3 | 32 | ja | Innergården | Styrelse 10 | 650 |
| Asperö | 3 | 20 | nej | Ingen | Styrelse 6 | 450 |
| Knippla (verkstad) | 1 | 120 | ja | Innergården | Klassrum 50, Ö-sittning 60, Mingel 100 | 2 200 |
| Utsikten (takterrass) | 5 | 150 | ja | Älven | Bankett 90, Mingel 150 | 3 800 |

### Rätter (24)
| Rätt | Allergener | Kost |
|---|---|---|
| Surdegsbröd med smör | Gluten, Mjölk | Vegetarisk |
| Yoghurt med granola | Mjölk, Gluten, Nötter | Vegetarisk |
| Äggröra | Ägg, Mjölk | Vegetarisk |
| Färsk frukt | – | Vegansk |
| Kanelbulle | Gluten, Mjölk, Ägg | Vegetarisk |
| Morotskaka | Gluten, Ägg, Mjölk, Nötter | Vegetarisk |
| Havreboll | Gluten | Vegansk |
| Ugnsbakad torskrygg, brynt smör | Fisk, Mjölk | Fläskfri |
| Kalvstek med rödvinssås | Mjölk, Selleri, Svaveldioxid/sulfiter | Fläskfri |
| Svamprisotto | Mjölk | Vegetarisk |
| Linsgryta med kokosris | Selleri | Vegansk |
| Grönsallad och bröd | Gluten | Vegansk |
| Skagenröra på rågbröd | Kräftdjur, Ägg, Gluten, Senap | – |
| Rödbetscarpaccio med chèvre | Mjölk, Nötter | Vegetarisk |
| Hjortytterfilé, rotselleripuré | Mjölk, Selleri, Svaveldioxid/sulfiter | Fläskfri |
| Halstrad gös, musselsås | Fisk, Blötdjur, Mjölk, Svaveldioxid/sulfiter | Fläskfri |
| Rotselleristeak, senapsvinägrett | Selleri, Senap | Vegansk |
| Chokladfondant med hasselnöt | Nötter, Ägg, Mjölk, Gluten | Vegetarisk |
| Hjortronparfait | Ägg, Mjölk | Vegetarisk |
| Citronsorbet | – | Vegansk |
| Toast Skagen | Kräftdjur, Gluten, Ägg | – |
| Chark och ost | Mjölk, Senap, Svaveldioxid/sulfiter | – |
| Hummus med grönsaksstavar | Sesam | Vegansk |
| Kryddade nötter | Nötter, Jordnötter | Vegansk |

### Drycker (6)
| Dryck | Pris | Allergener | Alkohol |
|---|---|---|---|
| Kaffe och te | 35 kr/pp | – | nej |
| Mineralvatten | 25 kr/st | – | nej |
| Mousserande välkomstdrink | 95 kr/pp | Svaveldioxid/sulfiter | ja |
| Alkoholfri bubbel | 65 kr/pp | – | nej |
| Lager från Göteborg | 85 kr/st | Gluten | ja |
| Vinpaket (2 glas) | 225 kr/pp | Svaveldioxid/sulfiter | ja |

### Måltider (6)
Delar utan valgrupp är obligatoriska.

| Måltid | Pris/pp | Delar |
|---|---|---|
| Konferensfrukost | 125 | Surdegsbröd, Yoghurt med granola, Äggröra, Färsk frukt, Kaffe och te |
| Förmiddagsfika | 65 | Kaffe och te + **välj 1:** Kanelbulle, Havreboll, Färsk frukt |
| Eftermiddagsfika | 65 | Kaffe och te + **välj 1:** Morotskaka, Havreboll, Färsk frukt |
| Konferenslunch | 245 | Grönsallad och bröd, Mineralvatten + **huvudrätt, välj 1:** Torskrygg, Kalvstek, Svamprisotto, Linsgryta |
| Trerättersmiddag | 595 | **Förrätt, välj 1:** Skagenröra, Rödbetscarpaccio · **Huvudrätt, välj 1:** Hjortytterfilé, Gös, Rotselleristeak · **Dessert, välj 1:** Chokladfondant, Hjortronparfait, Citronsorbet |
| Mingelbuffé | 245 | Toast Skagen, Chark och ost, Hummus med grönsaksstavar, Kryddade nötter (alla obligatoriska) |

### Guider och visningar
- Guider (`BOOKABLE`): Emma Lind (svenska, engelska), Oskar Ahl (svenska, tyska), Nora Falk (svenska, engelska).
- Utställningsvisning: 60 min, max 25 personer, 1 450 kr per grupp. **Välj 1 guide.**
- Kvällsvisning: 90 min, max 25 personer, 2 200 kr per grupp. **Välj 1 guide.** Visar att något bokningsbart kan ligga i en valgrupp.
- Designverkstad: 120 min i Knippla, 395 kr/pp. Innehåller rummet Knippla i uppställningen Ö-sittning.

### Utrustning
Projektor (450 kr), Mobil ljudanläggning (900 kr), Extra whiteboard (150 kr), Hörselslinga (0 kr).

### Paket (4 i katalogen + 1 kundspecifikt)
| Paket | Pris/pp | Innehåll (offset från start) |
|---|---|---|
| Halvdagskonferens | 545 | **Rum, välj 1:** Hönö, Öckerö, Styrsö, Vrångö (+0:00, 4 h) · Förmiddagsfika (+1:30) · Konferenslunch (+3:30) |
| Heldagskonferens | 795 | **Rum, välj 1:** Hönö, Öckerö, Styrsö, Vrångö (+0:00, 8 h) · Förmiddagsfika (+1:30) · Konferenslunch (+3:30) · Eftermiddagsfika (+6:00) |
| Dag + kväll | 1 016 | Mousserande välkomstdrink (+0:00) · **Rum, välj 1:** Hönö, Öckerö (+0:15, 7 h) · Förmiddagsfika (+1:30) · Konferenslunch (+3:00) · Kvällsvisning (+8:00) · Mingelbuffé (+9:30) |
| Kvällsevent | 1 290 | Kvällsvisning (+0:00) · Mousserande välkomstdrink (+1:30) · Utsikten, Bankett (+1:30, 5 h) · Trerättersmiddag (+2:00) · Vinpaket (+2:00) |
| Nordkust ledningsgrupp *(kund: Nordkust Logistik)* | 595 | Styrsö, Styrelse (+0:00, 4 h) · Förmiddagsfika (+0:30) · Konferenslunch (+3:00) |

## Kunder

| Kund | Typ | Kontaktpersoner | Prislista |
|---|---|---|---|
| Nordkust Logistik AB | Företag (ramavtal) | Karin Wallin (beställare), Fakturor Nordkust (fakturamottagare) | Nordkust ramavtal: −15 % på allt |
| Hisingen Energi AB | Företag | Mats Olsson | – |
| Västra Sjukvårdsregionen | Offentlig (Peppol, diarienummer) | Eva Sund, Ekonomienheten | – |
| Kvarnby Design AB | Företag | Linnea Kvist | – |
| Göta Advokatbyrå KB | Företag | Henrik Strand | – |
| Älvstrand Tech AB | Företag | Amir Haddad | – |
| Göteborgs Seglarsällskap | Förening | Ulla Berg | – |

## Säljflöde och bokningar

Säljare (S) och koordinator (K) anges med förnamn.

### Förfrågningar, optioner och offerter
| # | Kund | Vad | Status | Visar |
|---|---|---|---|---|
| F1 | Göteborgs Seglarsällskap | Jubileumsfest, 150 pers, D+60 | Förfrågan `NEW`, ingen säljare än | inkorgen |
| F2 | Hisingen Energi | Kickoff, 100 pers, D+45 i Vinga | `QUALIFIED`, S Erik. **Option O1, rang 1** på Vinga D+45 09–17, förfaller D+5 | optionskö |
| F3 | Kvarnby Design | Produktlansering, 80 pers, D+45 i Vinga | `QUALIFIED`, S Sara. **Option O2, rang 2** på samma tid | optionskö |
| F4 | Västra Sjukvårdsregionen | Workshop, 30 pers, D+40 | `QUOTED`. Offert v1 (40 pers) ersatt av **v2 (30 pers) `SENT`**, giltig till D+10 | offertversioner |
| F5 | Göta Advokatbyrå | Kvällsevent, 40 pers, D+20 | `LOST`, orsak "Pris". Offert v1 `DECLINED` | förlustorsak |
| F6 | Älvstrand Tech | Teamdag, 20 pers, D+12 | `QUALIFIED`. Option O3 förföll D−1 (`ACTIVE` tills `option.expireDue` körs) | förfall |

### Bokningar
| # | Kund · typ | När | Antal | Innehåll | Status | S / K | Visar |
|---|---|---|---|---|---|---|---|
| L1 | Hisingen Energi · Konferens | D−21 | 40 | Heldagskonferens i Hönö (U-bord) | Genomförd | Erik / Johan | historik |
| L2 | Kvarnby Design · Event | D−10 | 80 | Kvällsevent | Genomförd | Sara / Maria | historik |
| L3 | Västra Sjukvårdsregionen · Konferens | D+3 | 60 | Dag + kväll i Hönö (Bio) + Projektor. På kvällen är Mingelbuffé utbytt mot Trerättersmiddag. | Slutligt antal låst | Erik / Johan | **Behov:** Gluten × 4 (Allergi), Nötter × 1 (Anafylaxi), Vegetarisk × 8, Rullstol × 1. Nötterna ger "kan innehålla" utan blockering. Se not nedan. |
| L4 | Göta Advokatbyrå · Konferens | D+5 | 12 | Halvdagskonferens, Styrsö (Styrelse) | Bekräftad | Sara / Maria | enkel bokning |
| L5 | Älvstrand Tech · Event | D+14 | 120 | Vinga (Mingel) + Mingelbuffé + Vinpaket | Väntar på förskott | Erik / Maria | **Blockerad köksorder:** Kräftdjur × 2 (Anafylaxi) mot Toast Skagen, som är obligatorisk |
| L6 | Hisingen Energi · Konferens | D+30 | 25 | Heldagskonferens | Avbokad, orsak "Budget" | Erik / – | avbokning |
| L7 | Göta Advokatbyrå · Konferens | D+1 10–12 | 4 | Asperö (Styrelse) + Kaffe och te | Preliminär, Swish-länk skickad | Sara / – | snabbokning med betallänk |
| L10 | Hisingen Energi · Konferens | D+4 13–16 | 6 | Donsö (Styrelse) + Eftermiddagsfika | Bekräftad, mot faktura | Erik / Johan | snabbokning mot faktura |
| L8 | Göteborgs Seglarsällskap · Visning | D+2 14:00 | 22 | Utställningsvisning med guide Oskar (tyska) | Bekräftad | Sara / Johan | Visning-typ, bokningsbar guide |
| L9 | Kvarnby Design · Konferens | D+8 | 18 | Designverkstad + Konferenslunch | Bekräftad | Sara / Maria | aktivitet som innehåller ett rum |

**Not om L3:** nötallergin träffar Chokladfondant, som har alternativen Hjortronparfait och Citronsorbet. Resultatet är "kan innehålla" och ingen blockering (kontroll 4). Utbytet görs på bokningens kopia av paketet, så katalogpaketet ändras inte (snapshot, ADR 0015). L3 visar alltså också att ett paket kan anpassas för ett enskilt tillfälle.

### Serie
| # | Kund | Regel | Innehåll | Visar |
|---|---|---|---|---|
| S1 | Nordkust Logistik | `FREQ=MONTHLY;BYDAY=1TU;COUNT=10`, start första tisdagen för 2 månader sedan, 09–13 | Paketet Nordkust ledningsgrupp, 12 pers, prislista −15 % | Tillfälle 1–2 Genomförd, 3 Bekräftad, 4–10 Preliminär. **Tillfälle 4 krockar** med en internt blockerad tid i Styrsö och flyttas till Vrångö. |

---

# Vingaleden Skärgårdsturer

Slug `vingaleden-demo`. Anläggning: Saltholmen, 426 76 Västra Frölunda. Ingen mat och inga allergener. Samma kod, annan värld.

## Konfiguration

### Roller
Inga mallar. Egna roller: Admin, Bokning (skriver kund, förfrågan, bokning) och Skeppare (läser bokning och blad).

| Användare | Roll |
|---|---|
| Per Vinga | owner |
| Stina Holm | Bokning |
| Kalle Ek | Skeppare |
| Jonna Sand | Skeppare |

### Listor
| Lista | Värden |
|---|---|
| Hamn | Saltholmen, Lilla Bommen, Styrsö Bratten, Vrångö |
| Tillgänglighet | Rullstol, Rollator, Barnvagn |
| Flytväst | Barn under 15 kg, Barn 15–40 kg |
| Behörighet | Fartygsbefäl klass VIII, Förarbevis |

### Uppställningar
Sittande (10 min), Stående (5 min), Mingel på däck (20 min).

### Artikeltyper
| Typ | Beteenden | Egna fält |
|---|---|---|
| Båt | `BOOKABLE`, `SETUPS`, `PRICED` | Registreringsnummer (text), Toalett ombord (ja/nej), Max knop (tal) |
| Skeppare | `BOOKABLE` | Behörighet (val: Behörighet) |
| Tur | `PRICED`, `COMPOSABLE`, `CHOICES` | Avgångshamn (val: Hamn), Sträcka nm (tal) |
| Tillägg | `PRICED` | – |

### Övriga typer, statusar och blad
- Kund: Företag (Orgnr) · Privat (inga fält).
- Bokning: Charter · Rundtur.
- Behov: Tillgänglighet (lista Tillgänglighet) · Flytväst (lista Flytväst).
- Statusar: Förfrågan (`TENTATIVE`), Väderreservation (`TENTATIVE`), Bekräftad (`CONFIRMED`), Väder-OK (`CONFIRMED`), Genomförd (`COMPLETED`), Inställd – väder (`CANCELLED`), Avbokad (`CANCELLED`).
- Blad: **Bryggorder** till Skeppare med artikeltyperna Båt, Skeppare och Tillägg samt behoven Tillgänglighet och Flytväst.

## Katalog
| Artikel | Typ | Detaljer | Pris |
|---|---|---|---|
| M/S Kajan | Båt | Sittande 48, Stående 80, Mingel på däck 60, toalett | 3 200 kr/h |
| M/S Tärnan | Båt | Sittande 24, Stående 40, toalett | 2 100 kr/h |
| RIB Snabben | Båt | Sittande 12, 40 knop | 2 600 kr/h |
| Kalle Ek | Skeppare | Fartygsbefäl klass VIII | – |
| Jonna Sand | Skeppare | Förarbevis | – |
| Solnedgångstur | Tur | Saltholmen, 18 nm. **Båt, välj 1:** Kajan, Tärnan · **Skeppare, välj 1** · 2,5 h | 495 kr/pp |
| Fyrtur till Vinga | Tur | Saltholmen, 14 nm. RIB Snabben + skeppare Jonna · 1,5 h | 650 kr/pp |
| Filtar och regnställ | Tillägg | – | 40 kr/pp |
| Kaffe ombord | Tillägg | Visar att mat kan finnas utan allergilistor | 35 kr/pp |

## Kunder och bokningar
Kunder: Hisingen Energi AB (Företag, samma namn som hos Lindholmen men en helt separat rad i en annan organisation), Familjen Rask (Privat), Kvarnby Design AB (Företag).

| # | Kund · typ | När | Antal | Innehåll | Status | Visar |
|---|---|---|---|---|---|---|
| V1 | Hisingen Energi · Charter | D−7 | 40 | Solnedgångstur med Kajan, Stående | Genomförd | historik |
| V2 | Kvarnby Design · Charter | D−2 | 20 | Solnedgångstur med Tärnan | Inställd – väder | egen status i fasen `CANCELLED` |
| V3 | Familjen Rask · Rundtur | D+2 | 9 | Fyrtur till Vinga + Filtar | Väder-OK | **Behov:** Rullstol × 1, Flytväst barn under 15 kg × 2 → Bryggorder |
| V4 | Hisingen Energi · Charter | D+10 | 60 | Solnedgångstur med Kajan, Mingel på däck + Kaffe ombord | Väderreservation | egen status i fasen `TENTATIVE` |
| S2 | Familjen Rask · Rundtur | `FREQ=WEEKLY;BYDAY=TH;COUNT=6`, från D+7 | 6 | Solnedgångstur med Tärnan | Bekräftad | serie i en annan bransch |

---

## Uppbyggnad i koden

- `packages/core/src/seed/demo/` med en mapp per organisation (`lindholmen/`, `vingaleden/`). Filerna är rena data, uppdelade så att ingen fil går över 150 rader: `config.ts`, `rooms.ts`, `dishes.ts`, `meals.ts`, `packages.ts`, `customers.ts`, `pipeline.ts` och `bookings.ts`.
- `run-demo-seed.ts` läser datat och kör allt via `execute` med core-operationer. Referenser mellan raderna görs med nycklar (`ref: "room.vinga"`), som löses till id under körningen.
- `check-demo-seed.ts` innehåller kontrollerna ovan.
- Seeden byggs ut i samma takt som delarna i ADR 0019. En del som saknar operationer hoppas över med en tydlig logg, så att demot alltid går att köra.
