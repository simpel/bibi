# Accounting systems at Swedish venues (Nov 2026)

Which accounting systems Bibi's target venues run, and whether the two ledger adapters (Fortnox, Visma eEkonomi; ADR 0100, 0106) cover them. Desk research from public sources; no venue has been asked yet.

## Summary
- **Fortnox + Visma eEkonomi (now sold as Spiris) cover most small venues.** Both are cloud, both have an OAuth API, and Bibi already has adapters for both. Keep them.
- **Visma Administration (desktop) has no official API.** Venues on it cannot connect today. Do not build for it; it is the legacy product Spiris moves customers off.
- **Mid-size venues often run an ERP** (Visma.net, Business NXT, Dynamics 365 Business Central, Unit4). Not covered. Pick the next adapter from what the first prospects actually run, not from this note.
- **Public museums** most likely run their owner's (municipal, regional or state) ERP through public procurement. Not verified; treat as out of scope until a prospect says otherwise.

## Small businesses: Fortnox and Spiris
- **Fortnox** is the market leader: more than 598,000 customers in Sweden (annual report 2024), +56,000 in 2025. Affärsvärlden estimated a market share of 37 % overall and 34 % among micro companies (0–4 employees), on an addressable market of about 1.5 million customers. The share is Fortnox's own estimate and dates from before 2025.
- **Spiris** (Visma Spcs until the 2025–2026 rename) is the second ecosystem. It reports "several hundred thousand" customers, with no exact figure, and SEK 1.19 billion revenue in 2025. Its cloud product is Bokföring & Fakturering, sold earlier as Visma eEkonomi.
- Chift's 2026 survey of Swedish SaaS vendors: Fortnox and Visma's cloud product "account for the large majority of usage". No percentages.
- **API:** Spiris and Visma eAccounting (NO, NL) are one product on one API, `eaccountingapi.vismaonline.com`. Access needs the Spiris Partner Programme (self-service sandbox at `selfservice.developer.vismaonline.com`, production via `api@spiris.se`). The Visma Developer Portal (`oauth.developers.visma.com`) does not offer it: that portal is for Visma.net, Business NXT and Dinero.

## Visma Administration (desktop 500/1000/2000)
- Separate on-premise product; it does not share the eAccounting API.
- No official Visma/Spiris API found. The only route is the local integration component (ADK) on the customer's machine, e.g. Capremill's RedHorn REST wrapper. A cloud SaaS cannot reach it without an agent installed at the venue.
- Number of users not published. Hospitality ERP vendors describe Visma.net as the usual step for companies that have outgrown "Fortnox or Visma Admin".

## Mid-size venues: ERPs
- Named for Swedish SMEs in hospitality: Visma.net ERP (resold with hotel and restaurant packages by Amesto, Exsitec, Entrion), Visma Business NXT, Microsoft Dynamics 365 Business Central, Monitor, Pyramid, Jeeves; Unit4 and Xledger for the upper mid-market.
- Each has its own API and auth ("there is no single Visma API"). Visma.net and Business NXT are on the Visma Developer Portal.
- Lega Online integrates Fortnox, Visma/Spiris, Unit4, Hogia, Maconomy, Dynamics NAV, Pyramid, SoftOne and BL (see `market-analysis.md`). Their breadth suggests larger venues ask for ERP integrations.

## Open questions (ask in the first sales calls)
1. Which accounting system does the venue run, and who owns it (the venue, a parent group, a municipality)?
2. Does the venue raise its own invoices, or does a parent or an accounting firm do it?
3. World of Volvo: Volvo group ERP or its own system?
4. Would a venue on an unsupported system accept a CSV/SIE handover instead (Bibi dropped the SIE export in ADR 0106)?

## Done after this note
- The UI names the provider "Spiris (Visma eEkonomi)" and "Spiris" in running text.
- `.exampleenv` and `docs/runbooks/visma.md` use the production hosts for the sandbox, and the runbook describes the Spiris Partner Programme signup instead of the Visma Developer Portal.

## Sources
- Fortnox: [annual report 2024](https://storage.mfn.se/caf97770-c4e8-4d00-8c43-7fcea4af7d9e/fortnox-ars-och-hallbarhetsredovisning-2024.pdf), [Realtid](https://www.realtid.se/bors-finans/68-procent-upp-fortnox/), [Affärsvärlden](https://www.affarsvarlden.se/analys/fortnox-mot-nya-mal)
- Spiris: [spiris.se/om-oss](https://www.spiris.se/om-oss), [astartupstory.se](https://astartupstory.se/spiris/)
- Market overview: [Chift 2026 guide](https://www.chift.eu/blog/the-accounting-software-landscape-in-sweden-a-2026-guide-for-saas-vendors), [Apideck Visma API portfolio](https://www.apideck.com/blog/visma-api-portfolio)
- API access: [Visma eAccounting – Let's get started](https://developer.vismaonline.com/docs/spiris-eaccounting-api-documentation.md), [Authentication](https://developer.vismaonline.com/docs/authentication.md), [Environments](https://developer.vismaonline.com/docs/environments.md)
- Visma Administration: [Capremill RedHorn](https://www.spiris.se/integrationer/partner/capremill-system-ab-op), [Apideck Spiris guide](https://www.apideck.com/blog/spiris-visma-eaccounting-api-integration)
- ERPs: [Amesto](https://www.amestosolutions.se/erp/branschlosningar/hotell-och-restaurang), [Exsitec](https://www.exsitec.se/affarssystem/visma-net), [Entrion](https://www.entrion.se/affarssystem-hotell-och-restaurang), [Straviont](https://straviont.com/insikter/vad-ar-ett-affarssystem)
