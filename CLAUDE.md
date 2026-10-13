# Okazi – kontext för Claude

## Produkt
- SaaS-bokningssystem för konferens + mat & dryck hos venues utan hotell-PMS: upplevelsecenter, museer, konferensgårdar, herrgårdar, restauranger med privata rum.
- Referenskund i åtanke: World of Volvo (Göteborg). Maten levereras av extern restaurangoperatör → köksorder måste kunna gå till partner över bolagsgräns.
- Huvudkonkurrent: Lega Online (Multinet Interactive AB). Se `docs/marknad/`.

## Differentierare (styr prioritering)
- Direktbokning med betalning (Swish/kort) för mindre möten, inte bara förfrågan.
- Deltagarlista med kostavvikelser per person kopplade till EU:s 14 allergener, sammanställt i köksorder.
- Versionerad köksorder till eget kök eller extern partner.
- Optioner med kö (1:a/2:a option) och automatiskt förfall.
- Svenska integrationer: Fortnox, Visma, Swish, BankID, Peppol/e-faktura.
- Publicerade priser och självregistrering.

## Domänmodell
- Källa: `docs/domanmodell.md`. Uppdatera den och `docs/artefakter/domanmodell.html` tillsammans.

## Konventioner
- Dokumentation på svenska.
- Beslut loggas som ADR i `docs/beslut/NNNN-titel.md`.

## Öppna frågor
- Teknikstack ej vald.
- Språk för entitetsnamn i kod (svenska/engelska) ej beslutat.
- Prismodell (per venue, per rum, per bokning) ej beslutad.
