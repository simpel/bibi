# Changelog

## [3.0.0](https://github.com/simpel/bibi/compare/@bibi/core-v2.0.0...@bibi/core-v3.0.0) (2026-11-12)


### ⚠ BREAKING CHANGES

* accountingExport.* and paying a quote (quoteId) are removed from REST, GraphQL and MCP, and money operations need a connected accounting system.

### Features

* Bibi numbers nothing, deposits mirror payments booked in the ledger, and unanswered credits are retried ([318826f](https://github.com/simpel/bibi/commit/318826f2be3d48afa8bb54ef8ee587a2e11b0755))
* buyer's reference on contact and order, required per customer, frozen on the invoice ([ce0c178](https://github.com/simpel/bibi/commit/ce0c178032580eb14a5cf0ad8ed0822a3ac9765b))
* customers and orders are business or private, with the org no. as a column ([3ccc5a1](https://github.com/simpel/bibi/commit/3ccc5a1a4d183002a2e306f876a60250a3140bf7))
* customers list shows each customer's billed value ([4668f16](https://github.com/simpel/bibi/commit/4668f1690ca79fb9460d8402b28edc633387b073))
* deposits are prepayment invoices in Fortnox or Visma, and Fortnox books card and Swish payments ([2b6e5d8](https://github.com/simpel/bibi/commit/2b6e5d8b1676704364f152860caf4e622a36a435))
* money needs a connected Fortnox or Visma; quote payments, Stripe Invoicing and the SIE export go ([6c6586e](https://github.com/simpel/bibi/commit/6c6586e127b2be5bb8324985961098a1a46a56bf))
* the credit retry reads a lost Visma credit too, by its invoice and amount ([1973d05](https://github.com/simpel/bibi/commit/1973d051940e8afc591162970096fce3c55c0cde))
* the credit retry reads a lost Visma credit too, by its invoice and amount ([8acfa7a](https://github.com/simpel/bibi/commit/8acfa7abe8636c28acdc4934bb2cc2f5d91ddfae))
* the order page says to connect Fortnox or Visma before money can be taken ([198c451](https://github.com/simpel/bibi/commit/198c4510c267553c063f2388958341f0107550b7))
* the order page says to connect Fortnox or Visma before money can be taken ([9ce50db](https://github.com/simpel/bibi/commit/9ce50db8e92a665e961c325574c9f50f5e63b521))
* venue items summary with per-type subpages and plural type names ([a1384fc](https://github.com/simpel/bibi/commit/a1384fc1ef3f7056ce8907e0768114faa3ce0fe5))
* venue items summary with per-type subpages and plural type names ([b135d0e](https://github.com/simpel/bibi/commit/b135d0ea8081b17a14b59eec83918ae59c7d2fdd))


### Bug Fixes

* a deadlock between two concurrent writes is a CONFLICT, not INTERNAL ([34e8b4a](https://github.com/simpel/bibi/commit/34e8b4ac07897318a0b66462cd4695dc1fd06d01))
* the Fortnox test fake books payments like the real adapter ([c4f2cd7](https://github.com/simpel/bibi/commit/c4f2cd72fd4dfa96d4dcedc3c9bb660de8aacbfe))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @bibi/db bumped to 2.1.0

## [2.0.0](https://github.com/simpel/bibi/compare/@bibi/core-v1.3.0...@bibi/core-v2.0.0) (2026-11-11)


### ⚠ BREAKING CHANGES

* setup.* and setupLayout.* are replaced by layout.* on GraphQL, REST and MCP; lines, previews and templates take layoutId instead of setupId; items take maxPeople instead of setups.

### Features

* item type groups, with a tab per group on /items ([e717e88](https://github.com/simpel/bibi/commit/e717e8846deb77faf1166399c3303e784b879fa1))
* rooms have layouts instead of shared setups, with a people limit and emergency exits ([cb33bdf](https://github.com/simpel/bibi/commit/cb33bdf6dbad9ecd6c602781e7dc5b5bde4232b2))
* several layouts per setup, doors and windows on walls, floor plan split from layouts ([1712a9d](https://github.com/simpel/bibi/commit/1712a9d04b2bd12d51b198af3d503007705104db))
* several layouts per setup, doors and windows on walls, floor plan split from layouts ([1273331](https://github.com/simpel/bibi/commit/127333165e43e9e9fb0ef1fbe8722a3255bf0ab7))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @bibi/config bumped to 0.4.0
    * @bibi/db bumped to 2.0.0
    * @bibi/logger bumped to 0.1.3

## [1.3.0](https://github.com/simpel/bibi/compare/@bibi/core-v1.2.0...@bibi/core-v1.3.0) (2026-11-09)


### Features

* draw rooms of any shape on the floor plan ([#511](https://github.com/simpel/bibi/issues/511)) ([77e9225](https://github.com/simpel/bibi/commit/77e922584a05c33210a516d6a0ec035fbfe183f1))

## [1.2.0](https://github.com/simpel/bibi/compare/@bibi/core-v1.1.0...@bibi/core-v1.2.0) (2026-11-07)


### Features

* administration area with its own sidebar replaces the settings hubs ([caef1fd](https://github.com/simpel/bibi/commit/caef1fdd1589443e6f4597f8312d1ca6fb7e708b))
* the payment operator is stored, and empty admin sections stay off the page ([3645afe](https://github.com/simpel/bibi/commit/3645afe91e52627dedc7202ef7d6ae549cfb28b6))


### Bug Fixes

* example orders isolation test and pipeline e2e follow the admin sections ([5f9bd79](https://github.com/simpel/bibi/commit/5f9bd791ad108f29e9d49c6598c5bb1fa10018b7))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @bibi/db bumped to 1.1.0

## [1.1.0](https://github.com/simpel/bibi/compare/@bibi/core-v1.0.1...@bibi/core-v1.1.0) (2026-11-06)


### Features

* create an order from the pipeline board's entry column ([b2bb99d](https://github.com/simpel/bibi/commit/b2bb99d524887bddd2db053e59d5e734cebc09ce))
* new organizations start with example orders and the base types to create orders ([2e9e74b](https://github.com/simpel/bibi/commit/2e9e74b6e5291a5a317be4accdd1fadf722fcb63))
* setup review shows template statuses and states in the user's language ([a0a58c0](https://github.com/simpel/bibi/commit/a0a58c0a2306aa33a33d93762d126ee292948b35))

## [1.0.1](https://github.com/simpel/bibi/compare/@bibi/core-v1.0.0...@bibi/core-v1.0.1) (2026-11-06)


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @bibi/config bumped to 0.3.0
    * @bibi/db bumped to 1.0.1
    * @bibi/logger bumped to 0.1.2

## [1.0.0](https://github.com/simpel/bibi/compare/@bibi/core-v0.1.0...@bibi/core-v1.0.0) (2026-11-05)


### ⚠ BREAKING CHANGES

* Inbox messages are read or unread for the team and can be deleted; dismiss is gone
* customisationGroups no longer carry allowExtras on GraphQL, REST and MCP.
* sheet.* and sheetDefinition.* operations, MCP tools, GraphQL fields, REST paths and the sheet permission feature are renamed with no aliases.
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
* A year of dated finance history in the demo seed ([d5c2502](https://github.com/simpel/bibi/commit/d5c2502995cf325f3b0a97195a8857891576004c))
* Add boards with phases and a customize mode on the pipeline ([4730341](https://github.com/simpel/bibi/commit/47303414497cf9c377dd34ae5b820ec873890e36)), closes [#446](https://github.com/simpel/bibi/issues/446)
* Add-ons as lines under any line in core ([2d8b66f](https://github.com/simpel/bibi/commit/2d8b66f0e9a6741921bdc12071d0210104d89ea0))
* Add-ons in the ticket intake ([175e6ce](https://github.com/simpel/bibi/commit/175e6ce69bb8c25a0f913110234a7aee298227af))
* Add-ons on the ticket page, quotes, invoices and sheets ([c52f5b5](https://github.com/simpel/bibi/commit/c52f5b5a8b3e8648fda655e95cc6b49811388066))
* Assignee column on tickets, search on a picked filter value, joined search field ([8b0115c](https://github.com/simpel/bibi/commit/8b0115c22a7a42c6a24a0282e7dee881d484d5ba))
* Availability calendar page on real data, with calendar.range as a view read model ([e57b967](https://github.com/simpel/bibi/commit/e57b967d3af299dff939fc8a80c45a04611b08df)), closes [#484](https://github.com/simpel/bibi/issues/484)
* Bibi costs 9 990 SEK a month, and provisioning replaces prices whose amount changed ([6271c0d](https://github.com/simpel/bibi/commit/6271c0d9d155e4e39892998c6f551822e3204af7))
* Bibi subscription with a 14-day trial, seats and a payment gate ([6c25365](https://github.com/simpel/bibi/commit/6c25365a3b5487c55549cb921dc9c32815bed970))
* Calendar day values: booked, prebooked and still open per day ([a0886d8](https://github.com/simpel/bibi/commit/a0886d83f72668169bbf9efea6b7cdc0b0f11648)), closes [#485](https://github.com/simpel/bibi/issues/485)
* calendar.range core operation on all surfaces ([8c96256](https://github.com/simpel/bibi/commit/8c96256e6f3bf3cd4b047dc77d45d1626da3e63c)), closes [#430](https://github.com/simpel/bibi/issues/430)
* Choices step in the ticket intake with default options on package lines ([7161c26](https://github.com/simpel/bibi/commit/7161c26c254d8952d7da5db365d4b8fc00bf9a20))
* choose the time zone when creating an organization ([5a99c2d](https://github.com/simpel/bibi/commit/5a99c2d5aece8ac7c23a41d10b3f76fc2121e696)), closes [#427](https://github.com/simpel/bibi/issues/427)
* Connect an organization to Fortnox ([476dc85](https://github.com/simpel/bibi/commit/476dc85226f59bae46c953784b6b902354350735))
* Contact per organization, opening hours and a booking sheet on the calendar ([5d7a7a6](https://github.com/simpel/bibi/commit/5d7a7a60e9b1c69fc2018abb3830e42c5e9abed9)), closes [#486](https://github.com/simpel/bibi/issues/486)
* Contact required, booking notes and package guest ranges ([b7eec2f](https://github.com/simpel/bibi/commit/b7eec2f27e2ad4094a7ce101e70d0b8a9bcd4bda))
* Create a status with a name and colour only, and drop the column colour ([a2f7360](https://github.com/simpel/bibi/commit/a2f73605d43602b9bd10507fd12232a40bca0b9c)), closes [#492](https://github.com/simpel/bibi/issues/492)
* Create a ticket with its lines in one command ([e18f62c](https://github.com/simpel/bibi/commit/e18f62cb9ebfadbbd4a6c9dde3fbc45630d52dbb))
* Customisations on any item with a price effect ([#414](https://github.com/simpel/bibi/issues/414)) ([a573ac4](https://github.com/simpel/bibi/commit/a573ac490c7827730a8c964b4c95fb5cb1cc97a0)), closes [#382](https://github.com/simpel/bibi/issues/382)
* Dashboard looks ahead, Financials looks back ([c605182](https://github.com/simpel/bibi/commit/c60518212594487571a0352b3791cbc65835b64a))
* Dashboard with pipeline value, won/lost history, money and utilisation ([3af6b9b](https://github.com/simpel/bibi/commit/3af6b9b7449620574d6221e17dd9b9f64e8ebb97))
* Date and number filters in the tickets search ([453d8f3](https://github.com/simpel/bibi/commit/453d8f3d2ac64c72f4ae785a3da8abbf12e595f2))
* Demo seed gives Anna Berg read and unread notifications ([cc091df](https://github.com/simpel/bibi/commit/cc091dfa788e9bb7d3551cc60442046ec409ab96))
* Demo seed: a busy calendar from D−7 to D+30 at both venues ([cc2c115](https://github.com/simpel/bibi/commit/cc2c115f762688efdfb3f6781480431e0701f738)), closes [#488](https://github.com/simpel/bibi/issues/488)
* Deposit rule and invoice provider settings, deposits with a payment link ([703f10f](https://github.com/simpel/bibi/commit/703f10ff2e41be37b10fcd389ad9139269cb79c5))
* Deposits carry VAT, booked when paid and reversed on the final invoice ([95caa5d](https://github.com/simpel/bibi/commit/95caa5daa162979ee1f0dcd368fe334fe9c99279))
* Derived warnings on line reads for unfilled optional demands ([#458](https://github.com/simpel/bibi/issues/458)) ([7ce69ac](https://github.com/simpel/bibi/commit/7ce69acaefaf5254893308e2fd4b4a942d274438)), closes [#385](https://github.com/simpel/bibi/issues/385)
* Dev menu sends a test inbox message, and its sends no longer toast ([53b4d18](https://github.com/simpel/bibi/commit/53b4d1899fca2266a121db7db9ab99a20d55817f))
* Dev menu sends the signed-in member a test notification ([72cc148](https://github.com/simpel/bibi/commit/72cc1487e8ce076a14dcbd83df94435dde60feb9))
* Disconnect Stripe, and integrations as a grid of provider cards ([763c374](https://github.com/simpel/bibi/commit/763c374c354aad58e80b46dc999880db34bf67a3))
* Draft a ticket from a message with the assistant ([0d6bb9f](https://github.com/simpel/bibi/commit/0d6bb9f6d0aa98edd8dd5a415f0c4487ba971ecf))
* Expand a bundle into a bundle line and part lines, with per-rate VAT ([#413](https://github.com/simpel/bibi/issues/413)) ([1c19970](https://github.com/simpel/bibi/commit/1c199703666927018c90d11698bc859636ee0140)), closes [#381](https://github.com/simpel/bibi/issues/381)
* Filter suggestions while typing in the tickets search ([c3986c2](https://github.com/simpel/bibi/commit/c3986c210e62fab211401be9ee60ac5fddc1569e))
* Financials actions beside the heading, custom span and customer filter ([6457a28](https://github.com/simpel/bibi/commit/6457a28681027c5de19b4e1e4449e84c24b3c69f))
* Financials page, accounting settings and incremental SIE 4I export ([a373297](https://github.com/simpel/bibi/commit/a373297a245e5448a57943e8ac20b1f49eda32be))
* Find similar customers and create a customer with its first contact ([24089d1](https://github.com/simpel/bibi/commit/24089d11b9f3f7f4951619d6f1c15ff65d0e62d4))
* Free status movement by default, admin-only flow and board views ([f8833c5](https://github.com/simpel/bibi/commit/f8833c524658d9bdbd30b1eb328c3bd818103e48))
* Gates on status transitions replace the status flags ([f1d23d5](https://github.com/simpel/bibi/commit/f1d23d52c6f1c9aa91a348e8bd5152f0b6f090da)), closes [#447](https://github.com/simpel/bibi/issues/447)
* GitHub-style filters in the tickets search ([75602a3](https://github.com/simpel/bibi/commit/75602a3cf225fdbe255c9a6a9259b762f0564045))
* GitHub-style people and customer search in the tickets filter ([77c11af](https://github.com/simpel/bibi/commit/77c11af17793017fcd1b34c48bb46d45d65af5af))
* Inbound messages from any channel with an organization inbox ([c92609f](https://github.com/simpel/bibi/commit/c92609f5ef42a1c2a8cbbae6e520ba6748569767))
* Inbox badge with the open count, live on the notification stream ([bb98457](https://github.com/simpel/bibi/commit/bb9845707d625dbae4fb43d833393c71bec49fc3))
* Inbox messages are read or unread for the team and can be deleted; dismiss is gone ([f072961](https://github.com/simpel/bibi/commit/f072961794fcabb261b5cb6fc568e5228f65a5ed))
* Invoices raised in the venue's Fortnox, with payments pushed back over Fortnox's stream ([90f831a](https://github.com/simpel/bibi/commit/90f831ad10dfd4156225f3687058ba8cf3105ec5))
* item demands and line allocations ([#383](https://github.com/simpel/bibi/issues/383)) ([#436](https://github.com/simpel/bibi/issues/436)) ([512e57b](https://github.com/simpel/bibi/commit/512e57bb075231f82dee93ca9acb8cb8719ed86e))
* Keep archive cascades consistent for occupancy, requirements and lines ([#400](https://github.com/simpel/bibi/issues/400)) ([fe5cae9](https://github.com/simpel/bibi/commit/fe5cae92191fbdc1c30b162b1104a86af0e4039e))
* Keep send, void and refund dates and add the finance permission ([23489ed](https://github.com/simpel/bibi/commit/23489ed75312725e87ed997a87ec6e6ebbb27395))
* Leave a new status off the board until staff drag it onto a column ([871a2ea](https://github.com/simpel/bibi/commit/871a2ea8e6bcee30928cb7d186f03121fc3be127)), closes [#446](https://github.com/simpel/bibi/issues/446)
* Manager preset gets item:write ([#423](https://github.com/simpel/bibi/issues/423)) ([36de054](https://github.com/simpel/bibi/commit/36de0542752766ccd2753a6a67a4d16c7a74eace)), closes [#389](https://github.com/simpel/bibi/issues/389)
* Notifications and the inbox share one table UX, with read and delete icons and notification delete ([b834e4e](https://github.com/simpel/bibi/commit/b834e4e413c8353749e132d5784c3907b89f5f05))
* Notifications with a live bell, a full list and per-kind choices ([aadefeb](https://github.com/simpel/bibi/commit/aadefebb2101f29b36e0fd55b746c7670751a41f))
* Offer organizations by email domain, invite codes and a primary organization ([d7eeeb5](https://github.com/simpel/bibi/commit/d7eeeb52a25578f6a09bc26ab2b70b9306a5bde7))
* One dashboard with Financials and Workload tabs and trend stat cards ([7a47acb](https://github.com/simpel/bibi/commit/7a47acb477a5c5c498df1e0bf79313b44b09d41a))
* One-page ticket intake with review, line dialog and Create ([eaeca9a](https://github.com/simpel/bibi/commit/eaeca9a381261dec8bcfff493f2bb209af638e52))
* Org-scoped member profiles linked to staff items ([37fc402](https://github.com/simpel/bibi/commit/37fc4020132812c69307a9c031e06a32ec17b007)), closes [#448](https://github.com/simpel/bibi/issues/448)
* Per-user date and clock format, applied to every date and time in the UI ([f6c383e](https://github.com/simpel/bibi/commit/f6c383e6781ebb0125c117a89f64e63114c59c90)), closes [#481](https://github.com/simpel/bibi/issues/481)
* Per-user number format and currency display, applied to every number and amount in the UI ([b9f47c5](https://github.com/simpel/bibi/commit/b9f47c5a3890f0c6369445eef1f3186fe8f2be9b)), closes [#482](https://github.com/simpel/bibi/issues/482)
* Pool targets: a need can target an item type plus tags, with unit allocation ([#411](https://github.com/simpel/bibi/issues/411)) ([d6b16e9](https://github.com/simpel/bibi/commit/d6b16e9dec810347f95c3af5e5ce1a51e9586e8e)), closes [#380](https://github.com/simpel/bibi/issues/380)
* Preview a ticket's lines before creating it ([6fa0a5a](https://github.com/simpel/bibi/commit/6fa0a5a6fd459e7d493ae64ccd605c37415decef))
* Saving Bibi's Stripe key sets Stripe up, and the billing page shows products instead of price ids ([444bc25](https://github.com/simpel/bibi/commit/444bc2580974cf43c94dd5fc0a85929498e438d9))
* Seed a pending invitee and show invite codes on /welcome/join in dev ([56ca086](https://github.com/simpel/bibi/commit/56ca086b32a27d07cb0afd36691a80a7b2fe993f))
* Setup and teardown buffers for every item, with soft buffers and a TEARDOWN hold ([#404](https://github.com/simpel/bibi/issues/404)) ([2378542](https://github.com/simpel/bibi/commit/23785422bd11a325ef860d5db1281a5ac745bfc0)), closes [#379](https://github.com/simpel/bibi/issues/379)
* shared weekly hours pattern for venues and items ([1d96b92](https://github.com/simpel/bibi/commit/1d96b925036be332438d9808c7255be507ad7106)), closes [#429](https://github.com/simpel/bibi/issues/429)
* Sheets become work orders (Swedish "Order") ([de7732c](https://github.com/simpel/bibi/commit/de7732caaf896f42600e787507770cf1670e7d7a))
* Showcase data, end-to-end tests and guide for the ticket intake ([1d6e022](https://github.com/simpel/bibi/commit/1d6e02256e1fe3113cf4c05432fe562b95fd684a))
* SIE export reports a chosen date range, repeatable ([1e04436](https://github.com/simpel/bibi/commit/1e04436c76efe72c93fc6eb89963a874c19d8ad5))
* Split customisation choices with their own quantities ([22403e8](https://github.com/simpel/bibi/commit/22403e8106ac82f435de6918492c36cc842ce112))
* Stripe connects on Settings → Integrations, with Stripe and Fortnox branding ([506f4f4](https://github.com/simpel/bibi/commit/506f4f4511ce86685278033834055d6a11a318a1))
* The notification toast shows the notification's text, shortened ([6a91eab](https://github.com/simpel/bibi/commit/6a91eaba49d0b1328074d80d526a499e7fa3fc97))
* The payment page lists what is being paid for ([0a0242a](https://github.com/simpel/bibi/commit/0a0242aaee4026ff62d436f30fab764ca4040c60))
* Ticket page with issue alerts, line amounts and the day in the calendar ([a67d28a](https://github.com/simpel/bibi/commit/a67d28a90b2e0cc7ae769dc87d2c65661c577882))
* Ticket titles and a read-only ticket sheet in the pipeline and calendar ([5707208](https://github.com/simpel/bibi/commit/57072082a81eee2e7231d32c30045325e6fbfe31))
* Ticket titles in clash messages, the inbox, sheets and the demo seed ([322408b](https://github.com/simpel/bibi/commit/322408b58f5cceab207a35d4d5590bc9c547e8fc))
* Ticket value estimates, money display format and profile and consent rework ([1dc0b7b](https://github.com/simpel/bibi/commit/1dc0b7bf41203a24c33d286a6c61f5f4b7666c2f))
* Tickets and work orders share the Assigned to me and Following toggles, and the people filters are alternatives ([c0bf8a5](https://github.com/simpel/bibi/commit/c0bf8a57b577d9aa5dcd17e6a86f0bf8935e7e08))
* Tickets list with numbered pages, search and rows per page ([8e050cf](https://github.com/simpel/bibi/commit/8e050cf3cd48880dc719ab0a23190ba7a7123669))
* Tickets search filters in the UI language ([a727252](https://github.com/simpel/bibi/commit/a727252aecdc66f095b27b76ca4e407894033058))
* time zone on organization and venue with one resolver ([#424](https://github.com/simpel/bibi/issues/424)) ([ab03dea](https://github.com/simpel/bibi/commit/ab03deaab95bcc975ac9ce166b9114d5cccd1069))
* time zone on organization and venue with one resolver ([#475](https://github.com/simpel/bibi/issues/475)) ([ab03dea](https://github.com/simpel/bibi/commit/ab03deaab95bcc975ac9ce166b9114d5cccd1069)), closes [#424](https://github.com/simpel/bibi/issues/424)
* welcome flow without AI, org-scoped URLs and member profiles ([#419](https://github.com/simpel/bibi/issues/419)) ([c9db0e7](https://github.com/simpel/bibi/commit/c9db0e792b0d68a5cdb855280d2989b662d58bfd))
* Work orders get their own menu entry with Today and All ([84a78d5](https://github.com/simpel/bibi/commit/84a78d54a47f3b41232849ab27ed3448dc9c7861))
* Work orders regenerate when the ticket changes, and each version has its own page ([5d67099](https://github.com/simpel/bibi/commit/5d670998ed1e2dcb3cd848cead99c113984d8982))
* Working hours per organization, people as calendar rows and the whole ticket in the booking sheet ([14e89a8](https://github.com/simpel/bibi/commit/14e89a8ca201df4316987f118adb5cac9fce8115)), closes [#449](https://github.com/simpel/bibi/issues/449)
* Write SIE 4I vouchers from invoices, payments, refunds and fees ([f87a2d8](https://github.com/simpel/bibi/commit/f87a2d842f828bbc26851bf14a527d4a60bd66a7))


### Bug Fixes

* checkOverlaps in hold-checks ignores the ticket day ([#401](https://github.com/simpel/bibi/issues/401)) ([f787c37](https://github.com/simpel/bibi/commit/f787c37cc99c132a5ba10b63847c74d9a5a328ef))
* demo add-on and option checks look in their own order ([4eff316](https://github.com/simpel/bibi/commit/4eff316e2b472cb9062211648a16cef332d7e07a))
* Demo packages fit the rooms they book ([53642ec](https://github.com/simpel/bibi/commit/53642ece5c673126701125c351b11726fe7e6e62))
* fix: paymentAccount.startOnboarding calls Stripe before commit, so previews create real accounts ([#402](https://github.com/simpel/bibi/issues/402)) ([c7801a9](https://github.com/simpel/bibi/commit/c7801a9eeabfd12763fe25af72434b5110858ea8)), closes [#392](https://github.com/simpel/bibi/issues/392)
* Green CI: no barrel re-exports, fixtures keep their references ([c27c0bf](https://github.com/simpel/bibi/commit/c27c0bf93040f152c4838b0f1809af5a679b1358))
* Keep the draft extractor on globalThis so the built web app finds it ([4bcc2ef](https://github.com/simpel/bibi/commit/4bcc2efbab1043ce44568b5c20f425870cae37a3))
* lint and structure checks pass after the rename ([9c0c465](https://github.com/simpel/bibi/commit/9c0c46566b7e37c8db49c7df08e478e87dc7bdb3))


### Performance Improvements

* fast page loads (ADR 0097) ([291d945](https://github.com/simpel/bibi/commit/291d9459c9fb798e2eea115802c6b86f125020a8))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @bibi/config bumped to 0.2.0
    * @bibi/db bumped to 1.0.0
    * @bibi/logger bumped to 0.1.1

## Changelog

Generated by release-please from Conventional Commits (ADR 0060). Do not edit by hand.
