# Changelog

## [4.0.0](https://github.com/simpel/bibi/compare/@bibi/web-v3.0.0...@bibi/web-v4.0.0) (2026-11-12)


### ⚠ BREAKING CHANGES

* invoices and credit notes no longer carry number or voidPending, and accountingSettings no longer has the SIE-only accounts or fiscalYearStartMonth.

### Bug Fixes

* a connection the server cannot use shows Unavailable, not Connected ([b8aae04](https://github.com/simpel/bibi/commit/b8aae04a1bddc1d6735495dea159a58f9a390c94))


### Code Refactoring

* drop Bibi's own document numbers, the void retry and the SIE export tables ([5baa33b](https://github.com/simpel/bibi/commit/5baa33bda035e9db22a75323638da60fa421d94d))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @bibi/ai bumped to 4.0.0
    * @bibi/api bumped to 3.0.1
    * @bibi/auth bumped to 0.6.4
    * @bibi/core bumped to 4.0.0
    * @bibi/db bumped to 3.0.0
    * @bibi/graphql bumped to 3.0.1
    * @bibi/i18n bumped to 4.0.0
    * @bibi/mail bumped to 0.5.4
    * @bibi/mcp bumped to 4.0.0
    * @bibi/storage bumped to 0.2.7

## [3.0.0](https://github.com/simpel/bibi/compare/@bibi/web-v2.0.0...@bibi/web-v3.0.0) (2026-11-12)


### ⚠ BREAKING CHANGES

* accountingExport.* and paying a quote (quoteId) are removed from REST, GraphQL and MCP, and money operations need a connected accounting system.

### Features

* /admin is a start page listing every settings page the caller may view ([6ac2144](https://github.com/simpel/bibi/commit/6ac2144fe37f0cc85f799d9cc44a543364f68c6c))
* /admin is a start page listing every settings page the caller may view ([dad13f9](https://github.com/simpel/bibi/commit/dad13f973497691962f4d5fed96d9940288d8978))
* Bibi numbers nothing, deposits mirror payments booked in the ledger, and unanswered credits are retried ([318826f](https://github.com/simpel/bibi/commit/318826f2be3d48afa8bb54ef8ee587a2e11b0755))
* buyer's reference on contact and order, required per customer, frozen on the invoice ([ce0c178](https://github.com/simpel/bibi/commit/ce0c178032580eb14a5cf0ad8ed0822a3ac9765b))
* customers and orders are business or private, with the org no. as a column ([3ccc5a1](https://github.com/simpel/bibi/commit/3ccc5a1a4d183002a2e306f876a60250a3140bf7))
* customers list shows each customer's billed value ([4668f16](https://github.com/simpel/bibi/commit/4668f1690ca79fb9460d8402b28edc633387b073))
* deposits are prepayment invoices in Fortnox or Visma, and Fortnox books card and Swish payments ([2b6e5d8](https://github.com/simpel/bibi/commit/2b6e5d8b1676704364f152860caf4e622a36a435))
* money needs a connected Fortnox or Visma; quote payments, Stripe Invoicing and the SIE export go ([6c6586e](https://github.com/simpel/bibi/commit/6c6586e127b2be5bb8324985961098a1a46a56bf))
* the order page says to connect Fortnox or Visma before money can be taken ([198c451](https://github.com/simpel/bibi/commit/198c4510c267553c063f2388958341f0107550b7))
* the order page says to connect Fortnox or Visma before money can be taken ([9ce50db](https://github.com/simpel/bibi/commit/9ce50db8e92a665e961c325574c9f50f5e63b521))
* venue items summary with per-type subpages and plural type names ([a1384fc](https://github.com/simpel/bibi/commit/a1384fc1ef3f7056ce8907e0768114faa3ce0fe5))
* venue items summary with per-type subpages and plural type names ([b135d0e](https://github.com/simpel/bibi/commit/b135d0ea8081b17a14b59eec83918ae59c7d2fdd))


### Bug Fixes

* the payments e2e test reads the credit note's number from the accounting system ([e5ef63b](https://github.com/simpel/bibi/commit/e5ef63bd74fb63cfa1f165cb2574a92221a41642))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @bibi/ai bumped to 3.0.0
    * @bibi/api bumped to 3.0.0
    * @bibi/auth bumped to 0.6.3
    * @bibi/core bumped to 3.0.0
    * @bibi/db bumped to 2.1.0
    * @bibi/graphql bumped to 3.0.0
    * @bibi/i18n bumped to 3.0.0
    * @bibi/mail bumped to 0.5.3
    * @bibi/mcp bumped to 3.0.0
    * @bibi/storage bumped to 0.2.6
    * @bibi/ui bumped to 2.1.0

## [2.0.0](https://github.com/simpel/bibi/compare/@bibi/web-v1.5.0...@bibi/web-v2.0.0) (2026-11-11)


### ⚠ BREAKING CHANGES

* setup.* and setupLayout.* are replaced by layout.* on GraphQL, REST and MCP; lines, previews and templates take layoutId instead of setupId; items take maxPeople instead of setups.

### Features

* item type groups, with a tab per group on /items ([e717e88](https://github.com/simpel/bibi/commit/e717e8846deb77faf1166399c3303e784b879fa1))
* rooms have layouts instead of shared setups, with a people limit and emergency exits ([cb33bdf](https://github.com/simpel/bibi/commit/cb33bdf6dbad9ecd6c602781e7dc5b5bde4232b2))
* several layouts per setup, doors and windows on walls, floor plan split from layouts ([1712a9d](https://github.com/simpel/bibi/commit/1712a9d04b2bd12d51b198af3d503007705104db))
* several layouts per setup, doors and windows on walls, floor plan split from layouts ([1273331](https://github.com/simpel/bibi/commit/127333165e43e9e9fb0ef1fbe8722a3255bf0ab7))


### Bug Fixes

* slim production images and cap container memory ([df69148](https://github.com/simpel/bibi/commit/df6914833b27a343763747f4738357557ea2d2e7))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @bibi/ai bumped to 2.0.0
    * @bibi/api bumped to 2.0.0
    * @bibi/auth bumped to 0.6.2
    * @bibi/config bumped to 0.4.0
    * @bibi/core bumped to 2.0.0
    * @bibi/db bumped to 2.0.0
    * @bibi/graphql bumped to 2.0.0
    * @bibi/i18n bumped to 2.0.0
    * @bibi/logger bumped to 0.1.3
    * @bibi/mail bumped to 0.5.2
    * @bibi/storage bumped to 0.2.5
    * @bibi/ui bumped to 2.0.0

## [1.5.0](https://github.com/simpel/bibi/compare/@bibi/web-v1.4.0...@bibi/web-v1.5.0) (2026-11-09)


### Features

* draw rooms of any shape on the floor plan ([#511](https://github.com/simpel/bibi/issues/511)) ([77e9225](https://github.com/simpel/bibi/commit/77e922584a05c33210a516d6a0ec035fbfe183f1))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @bibi/ai bumped to 1.2.1
    * @bibi/api bumped to 1.1.2
    * @bibi/auth bumped to 0.6.1
    * @bibi/core bumped to 1.3.0
    * @bibi/graphql bumped to 1.1.2
    * @bibi/i18n bumped to 1.5.0
    * @bibi/mail bumped to 0.5.1
    * @bibi/storage bumped to 0.2.4
    * @bibi/ui bumped to 1.2.0

## [1.4.0](https://github.com/simpel/bibi/compare/@bibi/web-v1.3.0...@bibi/web-v1.4.0) (2026-11-07)


### Features

* admin lists are full data tables and the admin sidebar searches every setting ([4528c37](https://github.com/simpel/bibi/commit/4528c376fa4663b39db4d916ea41acd3fedc9f1f))
* admin pages are sections with sidebar anchors, no tabs ([0e5dcba](https://github.com/simpel/bibi/commit/0e5dcbae6a1eee4be2504ba0760557b507d7532c))
* administration area with its own sidebar replaces the settings hubs ([caef1fd](https://github.com/simpel/bibi/commit/caef1fdd1589443e6f4597f8312d1ca6fb7e708b))
* the payment operator is stored, and empty admin sections stay off the page ([3645afe](https://github.com/simpel/bibi/commit/3645afe91e52627dedc7202ef7d6ae549cfb28b6))


### Bug Fixes

* admin page titles and breadcrumbs match the sidebar ([64f873d](https://github.com/simpel/bibi/commit/64f873da10185173f5cb5b5d51fe0e55f3993115))
* admin sidebar sub-links and page sections match one to one ([f2f7f20](https://github.com/simpel/bibi/commit/f2f7f208fd9294842e9a33c8e14c7cd344bcbcaa))
* example orders isolation test and pipeline e2e follow the admin sections ([5f9bd79](https://github.com/simpel/bibi/commit/5f9bd791ad108f29e9d49c6598c5bb1fa10018b7))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @bibi/ai bumped to 1.2.0
    * @bibi/api bumped to 1.1.1
    * @bibi/auth bumped to 0.6.0
    * @bibi/core bumped to 1.2.0
    * @bibi/db bumped to 1.1.0
    * @bibi/graphql bumped to 1.1.1
    * @bibi/i18n bumped to 1.4.0
    * @bibi/mail bumped to 0.5.0
    * @bibi/storage bumped to 0.2.3

## [1.3.0](https://github.com/simpel/bibi/compare/@bibi/web-v1.2.0...@bibi/web-v1.3.0) (2026-11-06)


### Features

* create an order from the pipeline board's entry column ([b2bb99d](https://github.com/simpel/bibi/commit/b2bb99d524887bddd2db053e59d5e734cebc09ce))
* magic link is the only sign-in, passwords removed ([105ae06](https://github.com/simpel/bibi/commit/105ae068a0e194cf2bc6afcbe7248e9f4f4ff890))
* new organizations start with example orders and the base types to create orders ([2e9e74b](https://github.com/simpel/bibi/commit/2e9e74b6e5291a5a317be4accdd1fadf722fcb63))
* setup review shows template statuses and states in the user's language ([a0a58c0](https://github.com/simpel/bibi/commit/a0a58c0a2306aa33a33d93762d126ee292948b35))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @bibi/ai bumped to 1.1.0
    * @bibi/api bumped to 1.1.0
    * @bibi/auth bumped to 0.5.0
    * @bibi/core bumped to 1.1.0
    * @bibi/graphql bumped to 1.1.0
    * @bibi/i18n bumped to 1.3.0
    * @bibi/mail bumped to 0.4.0
    * @bibi/storage bumped to 0.2.2
    * @bibi/ui bumped to 1.1.0

## [1.2.0](https://github.com/simpel/bibi/compare/@bibi/web-v1.1.0...@bibi/web-v1.2.0) (2026-11-06)


### Features

* app-version meta tag shows the released web version ([8a7b284](https://github.com/simpel/bibi/commit/8a7b284c4abb7548cf352a5c45fd94db596b22ad))
* public /support help centre and /developers, replacing /docs ([81936c0](https://github.com/simpel/bibi/commit/81936c02ffd771c5944c5a5e348233017d453796))


### Bug Fixes

* e2e sign-in test opens the password tab before filling it ([70cdad8](https://github.com/simpel/bibi/commit/70cdad868bd6fb797a4dd6a39dcc9763d8ecd336))
* sign-up, login and invitations open the app instead of the public front page ([31b1a76](https://github.com/simpel/bibi/commit/31b1a768109280b6a34c7896c2a0f0d1a212843d))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @bibi/ai bumped to 1.0.2
    * @bibi/api bumped to 1.0.1
    * @bibi/auth bumped to 0.4.0
    * @bibi/config bumped to 0.3.0
    * @bibi/core bumped to 1.0.1
    * @bibi/db bumped to 1.0.1
    * @bibi/graphql bumped to 1.0.1
    * @bibi/i18n bumped to 1.2.0
    * @bibi/logger bumped to 0.1.2
    * @bibi/mail bumped to 0.3.1
    * @bibi/storage bumped to 0.2.1
    * @bibi/ui bumped to 1.0.1

## [1.1.0](https://github.com/simpel/bibi/compare/@bibi/web-v1.0.0...@bibi/web-v1.1.0) (2026-11-05)


### Features

* drop the one-time code sign-in, magic link is the default tab ([88d2930](https://github.com/simpel/bibi/commit/88d29303159b97e12c83e5e5f5b1fb841a0961ee))
* public front page at /:locale for everyone, redesigned as a SaaS landing page ([c9d86af](https://github.com/simpel/bibi/commit/c9d86afbdb37649e7d5a91e9825c755c2f9cb996))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @bibi/ai bumped to 1.0.1
    * @bibi/auth bumped to 0.3.0
    * @bibi/i18n bumped to 1.1.0
    * @bibi/mail bumped to 0.3.0

## [1.0.0](https://github.com/simpel/bibi/compare/@bibi/web-v0.1.0...@bibi/web-v1.0.0) (2026-11-05)


### ⚠ BREAKING CHANGES

* Inbox messages are read or unread for the team and can be deleted; dismiss is gone
* DataTableRowActions is the only row actions component
* customisationGroups no longer carry allowExtras on GraphQL, REST and MCP.
* sheet.* and sheetDefinition.* operations, MCP tools, GraphQL fields, REST paths and the sheet permission feature are renamed with no aliases.
* Custom booking with its own build step in the ticket intake
* One-page ticket intake with review, line dialog and Create
* dashboard.summary takes { from, to } again, its comingUp is now scheduled and status tiles carry a trend; finance.overview gains trends.
* dashboard.summary has no from/to input and a new shape; finance.overview drops forwardBooked and gains outcomes.
* Free status movement by default, admin-only flow and board views
* ticket statuses no longer have requiresReason, requiresAssignee or requiresAcceptedQuote; set gates with ticketStatus.setTransitions.
* ticketStatus.create no longer accepts flags or an event, and board phases have no color in input or output.
* ticketStatus.create without phaseId leaves the status on no board.
* Add boards with phases and a customize mode on the pipeline

### Features

* A customisation group never takes more picks than its max ([7abd9bf](https://github.com/simpel/bibi/commit/7abd9bff5b3374ab401ba5795e7ea0135ae75f65))
* A final invoice deducts the ticket's paid deposits ([ac07da2](https://github.com/simpel/bibi/commit/ac07da2f03dc5b69b528bef09292c5a2bd7989cf))
* A new notification or inbox message shows a toast ([cf44c96](https://github.com/simpel/bibi/commit/cf44c9695f015b72ba6e9f328ceb991f57431a70))
* A select with only one possible choice is left out and takes that choice ([0f9dbef](https://github.com/simpel/bibi/commit/0f9dbefbf9b4360540cf8a21197f14de55760d21))
* Add boards with phases and a customize mode on the pipeline ([4730341](https://github.com/simpel/bibi/commit/47303414497cf9c377dd34ae5b820ec873890e36)), closes [#446](https://github.com/simpel/bibi/issues/446)
* Add-ons as lines under any line in core ([2d8b66f](https://github.com/simpel/bibi/commit/2d8b66f0e9a6741921bdc12071d0210104d89ea0))
* Add-ons in the ticket intake ([175e6ce](https://github.com/simpel/bibi/commit/175e6ce69bb8c25a0f913110234a7aee298227af))
* Add-ons on the ticket page, quotes, invoices and sheets ([c52f5b5](https://github.com/simpel/bibi/commit/c52f5b5a8b3e8648fda655e95cc6b49811388066))
* Allocation UI: Resources and Staffing lists with a prepicked unit ([#438](https://github.com/simpel/bibi/issues/438)) ([e4d121d](https://github.com/simpel/bibi/commit/e4d121dcae795435cc44b83dbb94a6b34ad694d4)), closes [#384](https://github.com/simpel/bibi/issues/384)
* Assignee column on tickets, search on a picked filter value, joined search field ([8b0115c](https://github.com/simpel/bibi/commit/8b0115c22a7a42c6a24a0282e7dee881d484d5ba))
* Availability calendar page on real data, with calendar.range as a view read model ([e57b967](https://github.com/simpel/bibi/commit/e57b967d3af299dff939fc8a80c45a04611b08df)), closes [#484](https://github.com/simpel/bibi/issues/484)
* Backspace removes a whole highlighted filter value in the tickets search ([0a03eeb](https://github.com/simpel/bibi/commit/0a03eebc8ab7715ac3f356c3332184753975d8e4))
* Bibi subscription with a 14-day trial, seats and a payment gate ([6c25365](https://github.com/simpel/bibi/commit/6c25365a3b5487c55549cb921dc9c32815bed970))
* Calendar asset names link to their page, through an app link that @bibi/ui components can use ([3edf45c](https://github.com/simpel/bibi/commit/3edf45cbc5a5b3349bffaa6da7968020349c7d30))
* Calendar day values: booked, prebooked and still open per day ([a0886d8](https://github.com/simpel/bibi/commit/a0886d83f72668169bbf9efea6b7cdc0b0f11648)), closes [#485](https://github.com/simpel/bibi/issues/485)
* Calendar range picker for the dashboard and Financials period ([f46e3f6](https://github.com/simpel/bibi/commit/f46e3f6dafa975af4373505160c4bfd9defc1f7f))
* Calendar times in the user's clock format ([7635c08](https://github.com/simpel/bibi/commit/7635c083cce9c37a1f4d082082e38d8c689f2fb2)), closes [#487](https://github.com/simpel/bibi/issues/487)
* calendar URL as a date range and DST-safe columns ([21664c3](https://github.com/simpel/bibi/commit/21664c3a4f186f60dd9c5bcf68f9327b27320703)), closes [#428](https://github.com/simpel/bibi/issues/428)
* calendar.range core operation on all surfaces ([8c96256](https://github.com/simpel/bibi/commit/8c96256e6f3bf3cd4b047dc77d45d1626da3e63c)), closes [#430](https://github.com/simpel/bibi/issues/430)
* Choices step in the ticket intake with default options on package lines ([7161c26](https://github.com/simpel/bibi/commit/7161c26c254d8952d7da5db365d4b8fc00bf9a20))
* choose the time zone when creating an organization ([5a99c2d](https://github.com/simpel/bibi/commit/5a99c2d5aece8ac7c23a41d10b3f76fc2121e696)), closes [#427](https://github.com/simpel/bibi/issues/427)
* Color-coded type badges in the line dialog's item search ([eb118f5](https://github.com/simpel/bibi/commit/eb118f5b203bc31da25c7c7d6b9f7c9d9e9f8fb1))
* Colour-coded money totals, labelled estimates instead of ≈ ([0b7433e](https://github.com/simpel/bibi/commit/0b7433e71dd3bcda293f22a84852f3fac6cc5db1))
* Connect an organization to Fortnox ([476dc85](https://github.com/simpel/bibi/commit/476dc85226f59bae46c953784b6b902354350735))
* Contact per organization, opening hours and a booking sheet on the calendar ([5d7a7a6](https://github.com/simpel/bibi/commit/5d7a7a60e9b1c69fc2018abb3830e42c5e9abed9)), closes [#486](https://github.com/simpel/bibi/issues/486)
* Contact required, booking notes and package guest ranges ([b7eec2f](https://github.com/simpel/bibi/commit/b7eec2f27e2ad4094a7ce101e70d0b8a9bcd4bda))
* Create a status with a name and colour only, and drop the column colour ([a2f7360](https://github.com/simpel/bibi/commit/a2f73605d43602b9bd10507fd12232a40bca0b9c)), closes [#492](https://github.com/simpel/bibi/issues/492)
* Custom booking with its own build step in the ticket intake ([bc123d6](https://github.com/simpel/bibi/commit/bc123d6eebcbb4bd07cdb70424d83c8cf2aa84aa))
* Customisations on any item with a price effect ([#414](https://github.com/simpel/bibi/issues/414)) ([a573ac4](https://github.com/simpel/bibi/commit/a573ac490c7827730a8c964b4c95fb5cb1cc97a0)), closes [#382](https://github.com/simpel/bibi/issues/382)
* Dashboard looks ahead, Financials looks back ([c605182](https://github.com/simpel/bibi/commit/c60518212594487571a0352b3791cbc65835b64a))
* Dashboard with pipeline value, won/lost history, money and utilisation ([3af6b9b](https://github.com/simpel/bibi/commit/3af6b9b7449620574d6221e17dd9b9f64e8ebb97))
* Data dashboards with a kept header, a view switcher and pending states ([b42ac55](https://github.com/simpel/bibi/commit/b42ac551a2e3ac02cad0d5310ae7ba8a9a90ae87))
* DataTableRowActions is the only row actions component ([e3ac6e1](https://github.com/simpel/bibi/commit/e3ac6e1000d19f8c820f30a93d7913fb8a70a4b7))
* Day value as a bar under the date in every calendar zoom ([86b64f2](https://github.com/simpel/bibi/commit/86b64f2113d190ff1181584faacd59722a62c1cd))
* Deposit rule and invoice provider settings, deposits with a payment link ([703f10f](https://github.com/simpel/bibi/commit/703f10ff2e41be37b10fcd389ad9139269cb79c5))
* Derived warnings on line reads for unfilled optional demands ([#458](https://github.com/simpel/bibi/issues/458)) ([7ce69ac](https://github.com/simpel/bibi/commit/7ce69acaefaf5254893308e2fd4b4a942d274438)), closes [#385](https://github.com/simpel/bibi/issues/385)
* Dev menu sends a test inbox message, and its sends no longer toast ([53b4d18](https://github.com/simpel/bibi/commit/53b4d1899fca2266a121db7db9ab99a20d55817f))
* Dev menu sends the signed-in member a test notification ([72cc148](https://github.com/simpel/bibi/commit/72cc1487e8ce076a14dcbd83df94435dde60feb9))
* Disconnect Stripe, and integrations as a grid of provider cards ([763c374](https://github.com/simpel/bibi/commit/763c374c354aad58e80b46dc999880db34bf67a3))
* Draft a ticket from a message with the assistant ([0d6bb9f](https://github.com/simpel/bibi/commit/0d6bb9f6d0aa98edd8dd5a415f0c4487ba971ecf))
* Edit ticket is the page's primary button ([3be23fd](https://github.com/simpel/bibi/commit/3be23fd7656565c82bb4d69e0c918fd66a2ee87e))
* Exact pipeline totals in a shared MoneyTotals component ([2449a5f](https://github.com/simpel/bibi/commit/2449a5ff9f19032035c19d1a5d40c63cc1b8cc07))
* Expand a bundle into a bundle line and part lines, with per-rate VAT ([#413](https://github.com/simpel/bibi/issues/413)) ([1c19970](https://github.com/simpel/bibi/commit/1c199703666927018c90d11698bc859636ee0140)), closes [#381](https://github.com/simpel/bibi/issues/381)
* Favicon, app icons, web manifest and Open Graph images from the Bibi mark ([cce3854](https://github.com/simpel/bibi/commit/cce3854d73621a03cf0ff4abbe3817959e36ca7b))
* Filter suggestions while typing in the tickets search ([c3986c2](https://github.com/simpel/bibi/commit/c3986c210e62fab211401be9ee60ac5fddc1569e))
* Financials accounts table and page layout ([ebe18a6](https://github.com/simpel/bibi/commit/ebe18a64cf0db8e5e1ee2fbbcc7ffdd30c2bf6c3))
* Financials actions beside the heading, custom span and customer filter ([6457a28](https://github.com/simpel/bibi/commit/6457a28681027c5de19b4e1e4449e84c24b3c69f))
* Financials KPIs on MoneyTotals, replacing StatTile ([d576902](https://github.com/simpel/bibi/commit/d5769026e134b76a475662e030250af049ab7b4b))
* Financials page, accounting settings and incremental SIE 4I export ([a373297](https://github.com/simpel/bibi/commit/a373297a245e5448a57943e8ac20b1f49eda32be))
* Find similar customers and create a customer with its first contact ([24089d1](https://github.com/simpel/bibi/commit/24089d11b9f3f7f4951619d6f1c15ff65d0e62d4))
* Free status movement by default, admin-only flow and board views ([f8833c5](https://github.com/simpel/bibi/commit/f8833c524658d9bdbd30b1eb328c3bd818103e48))
* Gates on status transitions replace the status flags ([f1d23d5](https://github.com/simpel/bibi/commit/f1d23d52c6f1c9aa91a348e8bd5152f0b6f090da)), closes [#447](https://github.com/simpel/bibi/issues/447)
* GitHub-style filters in the tickets search ([75602a3](https://github.com/simpel/bibi/commit/75602a3cf225fdbe255c9a6a9259b762f0564045))
* GitHub-style people and customer search in the tickets filter ([77c11af](https://github.com/simpel/bibi/commit/77c11af17793017fcd1b34c48bb46d45d65af5af))
* Gray day bookings per item, unit price and Remove in the intake review ([c3e4a4b](https://github.com/simpel/bibi/commit/c3e4a4bbb8493639a22f4beab162942fdac592fa))
* Hide Financials charts that hold only zeros ([cf259b8](https://github.com/simpel/bibi/commit/cf259b85cd894d3a1ef3bdf2c5b7806dece4c81f))
* Highlighted filters in the tickets search field ([afc52d3](https://github.com/simpel/bibi/commit/afc52d34d869135c483e708d87f44805b9996061))
* Icons in the line menu and a confirmation before removing a line ([d587ee5](https://github.com/simpel/bibi/commit/d587ee578af3bf7e4e92948b28f5950c3a2ea631))
* Inbound messages from any channel with an organization inbox ([c92609f](https://github.com/simpel/bibi/commit/c92609f5ef42a1c2a8cbbae6e520ba6748569767))
* Inbox badge with the open count, live on the notification stream ([bb98457](https://github.com/simpel/bibi/commit/bb9845707d625dbae4fb43d833393c71bec49fc3))
* Inbox message page shows sender and received as stat cards and reads like a message ([d4d6ed5](https://github.com/simpel/bibi/commit/d4d6ed5c56fbc507329ec3fa05b784e01c545157))
* Inbox messages are read or unread for the team and can be deleted; dismiss is gone ([f072961](https://github.com/simpel/bibi/commit/f072961794fcabb261b5cb6fc568e5228f65a5ed))
* Inbox messages look like their channel, and the sheets show each fact once ([ecf1aae](https://github.com/simpel/bibi/commit/ecf1aae2a48fd5cbeb91092e35d619ba297b8950))
* Intake step actions, a paste dialog, Back and Next, and a calendar dialog ([1207247](https://github.com/simpel/bibi/commit/12072475281ff6ab38c3a306f6b1cb8f63cb7975))
* Intake steps in the URL, recent customers and straight to step 2 ([3d92ee6](https://github.com/simpel/bibi/commit/3d92ee61f47902da766cdc5ac1ca323fea2aabb6))
* Invoices raised in the venue's Fortnox, with payments pushed back over Fortnox's stream ([90f831a](https://github.com/simpel/bibi/commit/90f831ad10dfd4156225f3687058ba8cf3105ec5))
* item demands and line allocations ([#383](https://github.com/simpel/bibi/issues/383)) ([#436](https://github.com/simpel/bibi/issues/436)) ([512e57b](https://github.com/simpel/bibi/commit/512e57bb075231f82dee93ca9acb8cb8719ed86e))
* Leave a new status off the board until staff drag it onto a column ([871a2ea](https://github.com/simpel/bibi/commit/871a2ea8e6bcee30928cb7d186f03121fc3be127)), closes [#446](https://github.com/simpel/bibi/issues/446)
* Line costs and a total in the intake review ([2d622f2](https://github.com/simpel/bibi/commit/2d622f20022171084e1e7bff573cac78793a9a9e))
* Line warnings show a triangle and a short label, the full sentence on hover ([16f8ce5](https://github.com/simpel/bibi/commit/16f8ce537ce25bf4491c26fbc201c0a8d7a053a1))
* Loading and failed pages sit in the middle of the screen on every page ([fe724f5](https://github.com/simpel/bibi/commit/fe724f59d3b1db1285c79b2a84fdf0135b93a265))
* Manager preset gets item:write ([#423](https://github.com/simpel/bibi/issues/423)) ([36de054](https://github.com/simpel/bibi/commit/36de0542752766ccd2753a6a67a4d16c7a74eace)), closes [#389](https://github.com/simpel/bibi/issues/389)
* move platform admin to /mothership and add an /admin hub ([ad27763](https://github.com/simpel/bibi/commit/ad27763d939fefd9400f763776a12feddefb734b))
* Never bold headings and enlarge the H1 ([86f5670](https://github.com/simpel/bibi/commit/86f5670e983144ecda4327535e7ef37418aa4103))
* New ticket as the primary button in the sidebar ([37341f3](https://github.com/simpel/bibi/commit/37341f3d478fe4186322313d68ce498f90382409))
* New ticket intake page with who, when and package steps ([130a1ac](https://github.com/simpel/bibi/commit/130a1acbcae80af8748cb97ba53d71393153dcac))
* New ticket menu with From a message in the sidebar ([104ff7a](https://github.com/simpel/bibi/commit/104ff7a0207ab12d87b95e10424dd33275091bd1))
* Nordic Manor design tokens and a rename-app codemod ([#415](https://github.com/simpel/bibi/issues/415)) ([eed4708](https://github.com/simpel/bibi/commit/eed47083e9355714c7ef4d605a27eb7c35eb7e51))
* Notifications and inbox messages open in a side sheet ([0c8341a](https://github.com/simpel/bibi/commit/0c8341ac046ad0c3b97dfc55b6d5313cd72800f0))
* Notifications and the inbox are one inbox-style table, and opening a row shimmers while it is marked read ([ef83b41](https://github.com/simpel/bibi/commit/ef83b419ff894038f78d96390a3595ef8f0ec5ad))
* Notifications and the inbox share one table UX, with read and delete icons and notification delete ([b834e4e](https://github.com/simpel/bibi/commit/b834e4e413c8353749e132d5784c3907b89f5f05))
* Notifications list unread and read in two tables ([b8e6b5f](https://github.com/simpel/bibi/commit/b8e6b5f89b18fabb2a6ecb7e45562a0afa68d12e))
* Notifications update in place, one stream per browser ([4745304](https://github.com/simpel/bibi/commit/47453041fb16d85363c7b4dd1296c0b290b9b68b))
* Notifications with a live bell, a full list and per-kind choices ([aadefeb](https://github.com/simpel/bibi/commit/aadefebb2101f29b36e0fd55b746c7670751a41f))
* Offer organizations by email domain, invite codes and a primary organization ([d7eeeb5](https://github.com/simpel/bibi/commit/d7eeeb52a25578f6a09bc26ab2b70b9306a5bde7))
* One dashboard with Financials and Workload tabs and trend stat cards ([7a47acb](https://github.com/simpel/bibi/commit/7a47acb477a5c5c498df1e0bf79313b44b09d41a))
* One date and date-range picker across the app ([25ad284](https://github.com/simpel/bibi/commit/25ad284ec009803a478ba50694a4ee6aeb8e5d8c))
* One-page ticket intake with review, line dialog and Create ([eaeca9a](https://github.com/simpel/bibi/commit/eaeca9a381261dec8bcfff493f2bb209af638e52))
* Optional title on the intake's review step ([cbc8bea](https://github.com/simpel/bibi/commit/cbc8bea2614aec231141a123a7a1ef10d617e58e))
* order calendar joins the program table and stripes lines missing a time ([3c182bd](https://github.com/simpel/bibi/commit/3c182bdbd23a08b865e404d5165e03c1e2f8a438))
* order page leaves space under its alerts ([1f6bcec](https://github.com/simpel/bibi/commit/1f6bcec9a91081a140e94be3fab524db54458465))
* order page shows its alerts above the title ([8000dad](https://github.com/simpel/bibi/commit/8000dadc5e2963e997e9613e190ccc79b761d86e))
* order page shows the desired day above the times ([4b9b16b](https://github.com/simpel/bibi/commit/4b9b16b9d25618220c71d88d5580ab9460b7ce1a))
* Org-scoped member profiles linked to staff items ([37fc402](https://github.com/simpel/bibi/commit/37fc4020132812c69307a9c031e06a32ec17b007)), closes [#448](https://github.com/simpel/bibi/issues/448)
* People's names open their contact card everywhere, and the customer links to its page ([b9741be](https://github.com/simpel/bibi/commit/b9741bee2e0d8d361118fe5c31a1925497a83e35))
* Per-user date and clock format, applied to every date and time in the UI ([f6c383e](https://github.com/simpel/bibi/commit/f6c383e6781ebb0125c117a89f64e63114c59c90)), closes [#481](https://github.com/simpel/bibi/issues/481)
* Per-user number format and currency display, applied to every number and amount in the UI ([b9f47c5](https://github.com/simpel/bibi/commit/b9f47c5a3890f0c6369445eef1f3186fe8f2be9b)), closes [#482](https://github.com/simpel/bibi/issues/482)
* Pick the SIE export range on a calendar ([13bbd46](https://github.com/simpel/bibi/commit/13bbd461cbcb94049d87340d289fc3c445eb9a56))
* pinned booking cards show booking and order details with a clearer value ([ad69587](https://github.com/simpel/bibi/commit/ad69587d481fae0c75cf5a47728955c80089eb96))
* pinned card shows guests once and the day above the time ([c682cb8](https://github.com/simpel/bibi/commit/c682cb8a19937a1b92fcc5cc2e225ca3b1c91c8b))
* pinned cards use mini stats and linked names ([2792804](https://github.com/simpel/bibi/commit/2792804c0abb10f493e4619f599dab7422178b89))
* Pool targets: a need can target an item type plus tags, with unit allocation ([#411](https://github.com/simpel/bibi/issues/411)) ([d6b16e9](https://github.com/simpel/bibi/commit/d6b16e9dec810347f95c3af5e5ce1a51e9586e8e)), closes [#380](https://github.com/simpel/bibi/issues/380)
* Preview a ticket's lines before creating it ([6fa0a5a](https://github.com/simpel/bibi/commit/6fa0a5a6fd459e7d493ae64ccd605c37415decef))
* Put statuses without a column in a far-left column and turn the columns with GSAP ([2974a37](https://github.com/simpel/bibi/commit/2974a376d8da3bbe8606e5377f8a6ce010b096de)), closes [#446](https://github.com/simpel/bibi/issues/446)
* RelativeTime component with an exact-time tooltip ([#471](https://github.com/simpel/bibi/issues/471)) ([6b4bed6](https://github.com/simpel/bibi/commit/6b4bed6e8ec1a6f94e71acc8aa5239a0bd4b694c)), closes [#426](https://github.com/simpel/bibi/issues/426)
* Right-click menus on notification and inbox rows ([11bdd81](https://github.com/simpel/bibi/commit/11bdd815bd94dbc5bfd974ee0f9ff1efada8b531))
* Row action menus are dots only and primary actions are buttons beside them ([f54c9be](https://github.com/simpel/bibi/commit/f54c9be1fffce4cd2f354f75dcb3b691d071e7b4))
* Row actions stick to the table's right edge and show icons only on narrow tables ([3fe3603](https://github.com/simpel/bibi/commit/3fe36033662a8182c8a436fba62be30aaa268506))
* Saving Bibi's Stripe key sets Stripe up, and the billing page shows products instead of price ids ([444bc25](https://github.com/simpel/bibi/commit/444bc2580974cf43c94dd5fc0a85929498e438d9))
* Search button shows a spinner and is disabled while a search runs ([89ae0ef](https://github.com/simpel/bibi/commit/89ae0efbe63b1ba319099897a9660123d64e91c2))
* Seed a pending invitee and show invite codes on /welcome/join in dev ([56ca086](https://github.com/simpel/bibi/commit/56ca086b32a27d07cb0afd36691a80a7b2fe993f))
* Serve the public site on heybibi.se and the app on app.heybibi.se ([e69deb7](https://github.com/simpel/bibi/commit/e69deb7318e3d0c07e944e6b4c49176329a6dc66)), closes [#489](https://github.com/simpel/bibi/issues/489)
* Setup and teardown buffers for every item, with soft buffers and a TEARDOWN hold ([#404](https://github.com/simpel/bibi/issues/404)) ([2378542](https://github.com/simpel/bibi/commit/23785422bd11a325ef860d5db1281a5ac745bfc0)), closes [#379](https://github.com/simpel/bibi/issues/379)
* shared weekly hours pattern for venues and items ([1d96b92](https://github.com/simpel/bibi/commit/1d96b925036be332438d9808c7255be507ad7106)), closes [#429](https://github.com/simpel/bibi/issues/429)
* Sheets become work orders (Swedish "Order") ([de7732c](https://github.com/simpel/bibi/commit/de7732caaf896f42600e787507770cf1670e7d7a))
* Show board totals next to the board switcher ([bdbe7b2](https://github.com/simpel/bibi/commit/bdbe7b212edca8e3ba5c35ce80111321005a35b7))
* Show per-rate VAT rows for bundle lines on the quote and invoice screens ([#437](https://github.com/simpel/bibi/issues/437)) ([2425c80](https://github.com/simpel/bibi/commit/2425c80c27b21d74c48e4af3da4b4872ece340a6)), closes [#420](https://github.com/simpel/bibi/issues/420)
* show wordmark on auth pages and dev switcher on empty database ([#421](https://github.com/simpel/bibi/issues/421)) ([93a29ca](https://github.com/simpel/bibi/commit/93a29ca51e5798b6ae7cb9e088382153c4db7c83))
* Showcase data, end-to-end tests and guide for the ticket intake ([1d6e022](https://github.com/simpel/bibi/commit/1d6e02256e1fe3113cf4c05432fe562b95fd684a))
* SIE export reports a chosen date range, repeatable ([1e04436](https://github.com/simpel/bibi/commit/1e04436c76efe72c93fc6eb89963a874c19d8ad5))
* Split customisation choices with their own quantities ([22403e8](https://github.com/simpel/bibi/commit/22403e8106ac82f435de6918492c36cc842ce112))
* Status first in the tickets table, as its color dot with the name on hover ([1abb2a8](https://github.com/simpel/bibi/commit/1abb2a8bf16e6144991337a1965d16d0fb8556a3))
* Stripe connects on Settings → Integrations, with Stripe and Fortnox branding ([506f4f4](https://github.com/simpel/bibi/commit/506f4f4511ce86685278033834055d6a11a318a1))
* Table row actions are a labelled button, bare dots only on the board ([c7639e9](https://github.com/simpel/bibi/commit/c7639e99dc36848dcfb2c27b914fa1426e9f09c8))
* The bell wiggles when a new notification comes in ([03f4a30](https://github.com/simpel/bibi/commit/03f4a308d300d0ff0c9c10a1ca13edd90cbe5b76))
* The line dialog puts starts and ends on a row each ([c296eb0](https://github.com/simpel/bibi/commit/c296eb07fdaebb526dd9863da4ea7ac49e68abc4))
* The line dialog searches bookable items full width, and both item pickers show the list price ([2815f9d](https://github.com/simpel/bibi/commit/2815f9db6020bb012470a6a5ddd964be5ee3e103))
* The notification toast shows the notification's text, shortened ([6a91eab](https://github.com/simpel/bibi/commit/6a91eaba49d0b1328074d80d526a499e7fa3fc97))
* The payment page lists what is being paid for ([0a0242a](https://github.com/simpel/bibi/commit/0a0242aaee4026ff62d436f30fab764ca4040c60))
* Ticket header shows the number after the title, the alert first and the key facts in one row ([4456340](https://github.com/simpel/bibi/commit/445634003a4cd55c057030087e9b23ae66393f2a))
* Ticket page with issue alerts, line amounts and the day in the calendar ([a67d28a](https://github.com/simpel/bibi/commit/a67d28a90b2e0cc7ae769dc87d2c65661c577882))
* Ticket status sits beside the title, the same size as Edit ticket ([4957e8f](https://github.com/simpel/bibi/commit/4957e8f9aba830a5ae93994776c1277f9a3843c2))
* Ticket titles and a read-only ticket sheet in the pipeline and calendar ([5707208](https://github.com/simpel/bibi/commit/57072082a81eee2e7231d32c30045325e6fbfe31))
* Ticket titles in clash messages, the inbox, sheets and the demo seed ([322408b](https://github.com/simpel/bibi/commit/322408b58f5cceab207a35d4d5590bc9c547e8fc))
* Ticket value estimates, money display format and profile and consent rework ([1dc0b7b](https://github.com/simpel/bibi/commit/1dc0b7bf41203a24c33d286a6c61f5f4b7666c2f))
* Tickets and work orders share the Assigned to me and Following toggles, and the people filters are alternatives ([c0bf8a5](https://github.com/simpel/bibi/commit/c0bf8a57b577d9aa5dcd17e6a86f0bf8935e7e08))
* Tickets list with numbered pages, search and rows per page ([8e050cf](https://github.com/simpel/bibi/commit/8e050cf3cd48880dc719ab0a23190ba7a7123669))
* Tickets search filters in the UI language ([a727252](https://github.com/simpel/bibi/commit/a727252aecdc66f095b27b76ca4e407894033058))
* time zone on organization and venue with one resolver ([#424](https://github.com/simpel/bibi/issues/424)) ([ab03dea](https://github.com/simpel/bibi/commit/ab03deaab95bcc975ac9ce166b9114d5cccd1069))
* time zone on organization and venue with one resolver ([#475](https://github.com/simpel/bibi/issues/475)) ([ab03dea](https://github.com/simpel/bibi/commit/ab03deaab95bcc975ac9ce166b9114d5cccd1069)), closes [#424](https://github.com/simpel/bibi/issues/424)
* Type editor: capability sections replace the behaviour checkboxes ([#422](https://github.com/simpel/bibi/issues/422)) ([cf52927](https://github.com/simpel/bibi/commit/cf5292711a5624aad0267981c4c5bda189ff42f8)), closes [#386](https://github.com/simpel/bibi/issues/386)
* welcome flow without AI, org-scoped URLs and member profiles ([#419](https://github.com/simpel/bibi/issues/419)) ([c9db0e7](https://github.com/simpel/bibi/commit/c9db0e792b0d68a5cdb855280d2989b662d58bfd))
* Work order filters are independent Assigned to me and Following toggles, and All clears them ([5dcf42f](https://github.com/simpel/bibi/commit/5dcf42fe0e821083a903f5a771496af68b49b574))
* Work orders are one list of latest versions, with no Today and All ([f417b9c](https://github.com/simpel/bibi/commit/f417b9c2ff20ab5a5b02de3f2dcbf0b5316feb5f))
* Work orders get their own menu entry with Today and All ([84a78d5](https://github.com/simpel/bibi/commit/84a78d54a47f3b41232849ab27ed3448dc9c7861))
* Work orders regenerate when the ticket changes, and each version has its own page ([5d67099](https://github.com/simpel/bibi/commit/5d670998ed1e2dcb3cd848cead99c113984d8982))
* Working hours per organization, people as calendar rows and the whole ticket in the booking sheet ([14e89a8](https://github.com/simpel/bibi/commit/14e89a8ca201df4316987f118adb5cac9fce8115)), closes [#449](https://github.com/simpel/bibi/issues/449)


### Bug Fixes

* Booking side panel stays above the calendar's sticky header ([5150e3f](https://github.com/simpel/bibi/commit/5150e3f76e6381d76b632e7ea1376010665d6e08))
* Date and time fields fit their column, the date's label truncating first ([39d2d78](https://github.com/simpel/bibi/commit/39d2d78a5fd994bd8152ede4f9d114709d8b6024))
* Demo packages fit the rooms they book ([53642ec](https://github.com/simpel/bibi/commit/53642ece5c673126701125c351b11726fe7e6e62))
* desired-period day helper takes an object parameter ([012237e](https://github.com/simpel/bibi/commit/012237e44d21625e1e9e321a104af5be08c2832d))
* Fix the red e2e on main: approval-preview expects a Needs admin badge that item changes no longer get ([#395](https://github.com/simpel/bibi/issues/395)) ([02fc86a](https://github.com/simpel/bibi/commit/02fc86aa66ac75960dbdea39cad6a5f5901d8cf3)), closes [#391](https://github.com/simpel/bibi/issues/391)
* fix: paymentAccount.startOnboarding calls Stripe before commit, so previews create real accounts ([#402](https://github.com/simpel/bibi/issues/402)) ([c7801a9](https://github.com/simpel/bibi/commit/c7801a9eeabfd12763fe25af72434b5110858ea8)), closes [#392](https://github.com/simpel/bibi/issues/392)
* Inbox badge keeps its light number on hover and when active ([50c1ba6](https://github.com/simpel/bibi/commit/50c1ba67dcd74b727867523d35111fd20f8a7bb3))
* Inbox message page shows actions in the header and the message in a card ([a4a6dc5](https://github.com/simpel/bibi/commit/a4a6dc59cc584e6def37e2ac08b49f4d021b622c))
* Intake blocks what core would refuse and names every problem ([56ec4f1](https://github.com/simpel/bibi/commit/56ec4f1ebac9d982611b6709d4c2456c0eae6090))
* Keep the draft extractor on globalThis so the built web app finds it ([4bcc2ef](https://github.com/simpel/bibi/commit/4bcc2efbab1043ce44568b5c20f425870cae37a3))
* line state menu lists only the states the current state allows ([c281079](https://github.com/simpel/bibi/commit/c28107916f1e0a567d269ebe476ab6849a1b9e38))
* Lines table total includes VAT, matching Billed ([3fde4e4](https://github.com/simpel/bibi/commit/3fde4e4c4a832adc46bc76588302495df542c8d2))
* lint and structure checks pass after the rename ([9c0c465](https://github.com/simpel/bibi/commit/9c0c46566b7e37c8db49c7df08e478e87dc7bdb3))
* Page header actions stay on the title row beside a long description ([c28a2d1](https://github.com/simpel/bibi/commit/c28a2d1887125996693bb0ed9980564479e0a291))
* Pass the key of the intake's when step directly, not in a spread ([520486c](https://github.com/simpel/bibi/commit/520486c9a49a601c09512c3e5fa25c9c17e5577c))
* restore the final newline in apps/web/package.json ([#473](https://github.com/simpel/bibi/issues/473)) ([8b8efc8](https://github.com/simpel/bibi/commit/8b8efc890d80229428a37d18d86438483e2c2e25))
* Sheets give their content room, and the notification's message leads ([85c8523](https://github.com/simpel/bibi/commit/85c8523f847efdedf47c2a96b9b292a879d8dc62))
* Swedish ticket statuses are "ärendestatus", apart from item states ([8cb3321](https://github.com/simpel/bibi/commit/8cb332170d51a146133aa05aca7438e349cc88c1)), closes [#444](https://github.com/simpel/bibi/issues/444)
* The calendar dialog's booking panel opens inside the dialog ([8cc9eae](https://github.com/simpel/bibi/commit/8cc9eae090f7dc4e3505e402d76ca78873829492))
* The live stream drops an event that arrives after it closed ([b4f7e2f](https://github.com/simpel/bibi/commit/b4f7e2f82abc3c668d54bcac3142b3330f4b2477))
* The live stream no longer posts to a closed channel after a quick unmount ([530c999](https://github.com/simpel/bibi/commit/530c9991563ca3d32befa11b640e4f8839c98163))
* The tickets search field keeps a fixed width ([28ad14d](https://github.com/simpel/bibi/commit/28ad14d8ff57e4097f274402ef4427c53771b82e))
* The work orders list starts unfiltered, so everyone who can read work orders sees all of them ([61d50b1](https://github.com/simpel/bibi/commit/61d50b1c6b3653a1d12bea39d8e6b5d02596c4bf))
* Tickets search runs on one pick and shows a searching toast ([d10bf33](https://github.com/simpel/bibi/commit/d10bf3396331081f7afffcec9a45becc62c2299f))
* update next.js version to 16.4.2 in package.json and pnpm-lock.yaml ([#472](https://github.com/simpel/bibi/issues/472)) ([61a33a3](https://github.com/simpel/bibi/commit/61a33a3b7f563e2f860cab26f9cd9a7fae4da27c))
* web image build fails prerendering pages without runtime env ([a5f29e3](https://github.com/simpel/bibi/commit/a5f29e3fcad8a00c12012b4e1b4a68b85648c8c1))


### Performance Improvements

* fast page loads (ADR 0097) ([291d945](https://github.com/simpel/bibi/commit/291d9459c9fb798e2eea115802c6b86f125020a8))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @bibi/ai bumped to 1.0.0
    * @bibi/api bumped to 1.0.0
    * @bibi/auth bumped to 0.2.0
    * @bibi/config bumped to 0.2.0
    * @bibi/core bumped to 1.0.0
    * @bibi/db bumped to 1.0.0
    * @bibi/graphql bumped to 1.0.0
    * @bibi/i18n bumped to 1.0.0
    * @bibi/logger bumped to 0.1.1
    * @bibi/mail bumped to 0.2.0
    * @bibi/storage bumped to 0.2.0
    * @bibi/ui bumped to 1.0.0

## Changelog

Generated by release-please from Conventional Commits (ADR 0060). Do not edit by hand.
