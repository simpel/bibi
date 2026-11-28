# Changelog

## [4.1.0](https://github.com/simpel/bibi/compare/@bibi/db-v4.0.0...@bibi/db-v4.1.0) (2026-11-28)


### Features

* table booking gets open-from and days-ahead limits, a calendar operation and a pause for online booking ([21a3cbc](https://github.com/simpel/bibi/commit/21a3cbcffd51e23273acb45a4719e3c5f48c46b5))
* tasks sit on the pipeline board and move between statuses ([061014d](https://github.com/simpel/bibi/commit/061014dffb0a3393fd3c313b1e6e4eed6ff5d803))
* texts, docs and exports for tasks on the pipeline and table booking ([361382c](https://github.com/simpel/bibi/commit/361382cfb2f7b18138e856f8b14ecf7c36b39d78))


### Bug Fixes

* the relation map is valid TypeScript and lists ProviderConnection in schema order ([d5653f7](https://github.com/simpel/bibi/commit/d5653f7af5c758660b4a6cb9fe9881333f3916a1))

## [4.0.0](https://github.com/simpel/bibi/compare/@bibi/db-v3.1.0...@bibi/db-v4.0.0) (2026-11-27)


### ⚠ BREAKING CHANGES

* purposes are mapped to the accounting system's accounts in AccountMapping

### Features

* a database projection records who is related to each order and item ([f82f058](https://github.com/simpel/bibi/commit/f82f058a057e113840b6009dd7dc34281742cdaf))
* a task needs only its type, has one due time and can prebook or book rooms ([c2e99cf](https://github.com/simpel/bibi/commit/c2e99cf8e49b8e56d093a0d3ddc36be10e69dc22))
* admins edit the inbox address and get forwarding steps ([e06d0c7](https://github.com/simpel/bibi/commit/e06d0c7c58ebb29cb4a1989c20e3e350a9959e64))
* archived records are restored, deleted for good and purged after a retention period ([e8fa178](https://github.com/simpel/bibi/commit/e8fa178ee30efb0ee1f235a070b8c0e7fcb30a26))
* comment icons, unread dots, replies and mentions ([816137d](https://github.com/simpel/bibi/commit/816137db95fd648425dad04e46d5b466a745f89f))
* comments on orders and lines, shown on run sheets ([17ade2e](https://github.com/simpel/bibi/commit/17ade2eee0544984a4a4c92c92bbdb90b743e994))
* customer types carry business or private, and private customers get an optional personal identity number ([2da90a7](https://github.com/simpel/bibi/commit/2da90a7dc966bd86542206a3fc6746bee93b5f5a))
* dining rooms, sittings, exceptions, table combinations and the booking page can be set up on every surface ([575068e](https://github.com/simpel/bibi/commit/575068e132e3822e798643539024d4357523037e))
* guests count kitchen needs on the booking page against the lists the restaurant picks ([ae868ef](https://github.com/simpel/bibi/commit/ae868eff593fde5335c564de01f09bfdb884c22e))
* items get a Lucide icon or an image, and the package step compares each package with the request ([9b86f64](https://github.com/simpel/bibi/commit/9b86f643a9485528f910815951b2f30fcc215c4c))
* members can be limited to related records; auth and notifications resolve access in one place ([034f590](https://github.com/simpel/bibi/commit/034f59060b53fe13fb799e8d3e6ac73d22c022a0))
* notifications open in a panel on the right, with Needs you on top and dismissable ([597ea74](https://github.com/simpel/bibi/commit/597ea740e59b98200ff8e7471c164a9ed08a2236))
* order versions, restore and the superseded quote ([be41d10](https://github.com/simpel/bibi/commit/be41d106acf7e29722e76bcb17f6184ae11cb40c))
* packages get their own permission and leave the administration area ([eaf769d](https://github.com/simpel/bibi/commit/eaf769d70d2635634b3a75a6e218205e25b8e5fb))
* pipeline views are personal and shared with members or the organization ([58b0836](https://github.com/simpel/bibi/commit/58b083669fff4453d519e06424ab2f38d010b6c5))
* purposes are mapped to the accounting system's accounts in AccountMapping ([f20a0ed](https://github.com/simpel/bibi/commit/f20a0edb79ae99ae46f38bfd16aabe01ee4c0a46))
* restaurants take table reservations from staff, the assistant and guests, and the start page tells that story ([4314d17](https://github.com/simpel/bibi/commit/4314d175751b1fd30d2492ca73c609aaeeda9a84))
* tasks around a customer, before or beside an order (ADR 0117) ([0ebbfdc](https://github.com/simpel/bibi/commit/0ebbfdc0ab36b63d5817e0de780bf50f7d45dda3))
* the database holds dining rooms, sittings, table combinations, reservations and table holds ([3191e2b](https://github.com/simpel/bibi/commit/3191e2b6c95f81600847d8a9670a489e4029cd85))
* the scoped client enforces declared record intent ([5975e2d](https://github.com/simpel/bibi/commit/5975e2db025bbef995dd9dc6d21168e7573ee38d))


### Bug Fixes

* setting the language works before a profile exists ([79ddb8b](https://github.com/simpel/bibi/commit/79ddb8b37bccbe626cfdb0e3b8d5aa9b060106ac))
* the relation map lists AccountMapping where the schema does ([6a09267](https://github.com/simpel/bibi/commit/6a09267e9043c8053e21f03ee7b80375ef958159))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @bibi/config bumped to 1.1.0

## [3.1.0](https://github.com/simpel/bibi/compare/@bibi/db-v3.0.0...@bibi/db-v3.1.0) (2026-11-15)


### Features

* one accounting system at a time, an account check at the provider, and Integrations grouped by purpose ([ff39f82](https://github.com/simpel/bibi/commit/ff39f821a550af566e0d9992d19d441f1aa12647))
* one default revenue account row, and payment routes only to connected services ([5c744cf](https://github.com/simpel/bibi/commit/5c744cf6a04e99518fc981bff572a69de70fe2be))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @bibi/config bumped to 1.0.0

## [3.0.0](https://github.com/simpel/bibi/compare/@bibi/db-v2.1.0...@bibi/db-v3.0.0) (2026-11-12)


### ⚠ BREAKING CHANGES

* invoices and credit notes no longer carry number or voidPending, and accountingSettings no longer has the SIE-only accounts or fiscalYearStartMonth.

### Code Refactoring

* drop Bibi's own document numbers, the void retry and the SIE export tables ([5baa33b](https://github.com/simpel/bibi/commit/5baa33bda035e9db22a75323638da60fa421d94d))

## [2.1.0](https://github.com/simpel/bibi/compare/@bibi/db-v2.0.0...@bibi/db-v2.1.0) (2026-11-12)


### Features

* Bibi numbers nothing, deposits mirror payments booked in the ledger, and unanswered credits are retried ([318826f](https://github.com/simpel/bibi/commit/318826f2be3d48afa8bb54ef8ee587a2e11b0755))
* buyer's reference on contact and order, required per customer, frozen on the invoice ([ce0c178](https://github.com/simpel/bibi/commit/ce0c178032580eb14a5cf0ad8ed0822a3ac9765b))
* customers and orders are business or private, with the org no. as a column ([3ccc5a1](https://github.com/simpel/bibi/commit/3ccc5a1a4d183002a2e306f876a60250a3140bf7))
* deposits are prepayment invoices in Fortnox or Visma, and Fortnox books card and Swish payments ([2b6e5d8](https://github.com/simpel/bibi/commit/2b6e5d8b1676704364f152860caf4e622a36a435))
* venue items summary with per-type subpages and plural type names ([a1384fc](https://github.com/simpel/bibi/commit/a1384fc1ef3f7056ce8907e0768114faa3ce0fe5))
* venue items summary with per-type subpages and plural type names ([b135d0e](https://github.com/simpel/bibi/commit/b135d0ea8081b17a14b59eec83918ae59c7d2fdd))

## [2.0.0](https://github.com/simpel/bibi/compare/@bibi/db-v1.1.0...@bibi/db-v2.0.0) (2026-11-11)


### ⚠ BREAKING CHANGES

* setup.* and setupLayout.* are replaced by layout.* on GraphQL, REST and MCP; lines, previews and templates take layoutId instead of setupId; items take maxPeople instead of setups.

### Features

* item type groups, with a tab per group on /items ([e717e88](https://github.com/simpel/bibi/commit/e717e8846deb77faf1166399c3303e784b879fa1))
* payment providers as ports, with Swish, Visma and the full payment lifecycle ([#512](https://github.com/simpel/bibi/issues/512)) ([29b57e4](https://github.com/simpel/bibi/commit/29b57e49511134b6003365096ca64e747259ea42))
* rooms have layouts instead of shared setups, with a people limit and emergency exits ([cb33bdf](https://github.com/simpel/bibi/commit/cb33bdf6dbad9ecd6c602781e7dc5b5bde4232b2))
* several layouts per setup, doors and windows on walls, floor plan split from layouts ([1712a9d](https://github.com/simpel/bibi/commit/1712a9d04b2bd12d51b198af3d503007705104db))
* several layouts per setup, doors and windows on walls, floor plan split from layouts ([1273331](https://github.com/simpel/bibi/commit/127333165e43e9e9fb0ef1fbe8722a3255bf0ab7))


### Bug Fixes

* slim production images and cap container memory ([df69148](https://github.com/simpel/bibi/commit/df6914833b27a343763747f4738357557ea2d2e7))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @bibi/config bumped to 0.4.0

## [1.1.0](https://github.com/simpel/bibi/compare/@bibi/db-v1.0.1...@bibi/db-v1.1.0) (2026-11-07)


### Features

* the payment operator is stored, and empty admin sections stay off the page ([3645afe](https://github.com/simpel/bibi/commit/3645afe91e52627dedc7202ef7d6ae549cfb28b6))

## [1.0.1](https://github.com/simpel/bibi/compare/@bibi/db-v1.0.0...@bibi/db-v1.0.1) (2026-11-06)


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @bibi/config bumped to 0.3.0

## [1.0.0](https://github.com/simpel/bibi/compare/@bibi/db-v0.1.0...@bibi/db-v1.0.0) (2026-11-05)


### ⚠ BREAKING CHANGES

* Inbox messages are read or unread for the team and can be deleted; dismiss is gone
* customisationGroups no longer carry allowExtras on GraphQL, REST and MCP.
* sheet.* and sheetDefinition.* operations, MCP tools, GraphQL fields, REST paths and the sheet permission feature are renamed with no aliases.
* Free status movement by default, admin-only flow and board views
* ticket statuses no longer have requiresReason, requiresAssignee or requiresAcceptedQuote; set gates with ticketStatus.setTransitions.
* ticketStatus.create no longer accepts flags or an event, and board phases have no color in input or output.
* Add boards with phases and a customize mode on the pipeline

### Features

* A customisation group never takes more picks than its max ([7abd9bf](https://github.com/simpel/bibi/commit/7abd9bff5b3374ab401ba5795e7ea0135ae75f65))
* A final invoice deducts the ticket's paid deposits ([ac07da2](https://github.com/simpel/bibi/commit/ac07da2f03dc5b69b528bef09292c5a2bd7989cf))
* A new notification or inbox message shows a toast ([cf44c96](https://github.com/simpel/bibi/commit/cf44c9695f015b72ba6e9f328ceb991f57431a70))
* Add boards with phases and a customize mode on the pipeline ([4730341](https://github.com/simpel/bibi/commit/47303414497cf9c377dd34ae5b820ec873890e36)), closes [#446](https://github.com/simpel/bibi/issues/446)
* Add-ons as lines under any line in core ([2d8b66f](https://github.com/simpel/bibi/commit/2d8b66f0e9a6741921bdc12071d0210104d89ea0))
* Bibi subscription with a 14-day trial, seats and a payment gate ([6c25365](https://github.com/simpel/bibi/commit/6c25365a3b5487c55549cb921dc9c32815bed970))
* calendar.range core operation on all surfaces ([8c96256](https://github.com/simpel/bibi/commit/8c96256e6f3bf3cd4b047dc77d45d1626da3e63c)), closes [#430](https://github.com/simpel/bibi/issues/430)
* Choices step in the ticket intake with default options on package lines ([7161c26](https://github.com/simpel/bibi/commit/7161c26c254d8952d7da5db365d4b8fc00bf9a20))
* Connect an organization to Fortnox ([476dc85](https://github.com/simpel/bibi/commit/476dc85226f59bae46c953784b6b902354350735))
* Contact per organization, opening hours and a booking sheet on the calendar ([5d7a7a6](https://github.com/simpel/bibi/commit/5d7a7a60e9b1c69fc2018abb3830e42c5e9abed9)), closes [#486](https://github.com/simpel/bibi/issues/486)
* Contact required, booking notes and package guest ranges ([b7eec2f](https://github.com/simpel/bibi/commit/b7eec2f27e2ad4094a7ce101e70d0b8a9bcd4bda))
* Create a status with a name and colour only, and drop the column colour ([a2f7360](https://github.com/simpel/bibi/commit/a2f73605d43602b9bd10507fd12232a40bca0b9c)), closes [#492](https://github.com/simpel/bibi/issues/492)
* Create a ticket with its lines in one command ([e18f62c](https://github.com/simpel/bibi/commit/e18f62cb9ebfadbbd4a6c9dde3fbc45630d52dbb))
* Customisations on any item with a price effect ([#414](https://github.com/simpel/bibi/issues/414)) ([a573ac4](https://github.com/simpel/bibi/commit/a573ac490c7827730a8c964b4c95fb5cb1cc97a0)), closes [#382](https://github.com/simpel/bibi/issues/382)
* Date and number filters in the tickets search ([453d8f3](https://github.com/simpel/bibi/commit/453d8f3d2ac64c72f4ae785a3da8abbf12e595f2))
* Deposit rule and invoice provider settings, deposits with a payment link ([703f10f](https://github.com/simpel/bibi/commit/703f10ff2e41be37b10fcd389ad9139269cb79c5))
* Deposits carry VAT, booked when paid and reversed on the final invoice ([95caa5d](https://github.com/simpel/bibi/commit/95caa5daa162979ee1f0dcd368fe334fe9c99279))
* Disconnect Stripe, and integrations as a grid of provider cards ([763c374](https://github.com/simpel/bibi/commit/763c374c354aad58e80b46dc999880db34bf67a3))
* Expand a bundle into a bundle line and part lines, with per-rate VAT ([#413](https://github.com/simpel/bibi/issues/413)) ([1c19970](https://github.com/simpel/bibi/commit/1c199703666927018c90d11698bc859636ee0140)), closes [#381](https://github.com/simpel/bibi/issues/381)
* Financials page, accounting settings and incremental SIE 4I export ([a373297](https://github.com/simpel/bibi/commit/a373297a245e5448a57943e8ac20b1f49eda32be))
* Free status movement by default, admin-only flow and board views ([f8833c5](https://github.com/simpel/bibi/commit/f8833c524658d9bdbd30b1eb328c3bd818103e48))
* Gates on status transitions replace the status flags ([f1d23d5](https://github.com/simpel/bibi/commit/f1d23d52c6f1c9aa91a348e8bd5152f0b6f090da)), closes [#447](https://github.com/simpel/bibi/issues/447)
* Inbound messages from any channel with an organization inbox ([c92609f](https://github.com/simpel/bibi/commit/c92609f5ef42a1c2a8cbbae6e520ba6748569767))
* Inbox badge with the open count, live on the notification stream ([bb98457](https://github.com/simpel/bibi/commit/bb9845707d625dbae4fb43d833393c71bec49fc3))
* Inbox messages are read or unread for the team and can be deleted; dismiss is gone ([f072961](https://github.com/simpel/bibi/commit/f072961794fcabb261b5cb6fc568e5228f65a5ed))
* Invoices raised in the venue's Fortnox, with payments pushed back over Fortnox's stream ([90f831a](https://github.com/simpel/bibi/commit/90f831ad10dfd4156225f3687058ba8cf3105ec5))
* item demands and line allocations ([#383](https://github.com/simpel/bibi/issues/383)) ([#436](https://github.com/simpel/bibi/issues/436)) ([512e57b](https://github.com/simpel/bibi/commit/512e57bb075231f82dee93ca9acb8cb8719ed86e))
* Keep send, void and refund dates and add the finance permission ([23489ed](https://github.com/simpel/bibi/commit/23489ed75312725e87ed997a87ec6e6ebbb27395))
* Notifications with a live bell, a full list and per-kind choices ([aadefeb](https://github.com/simpel/bibi/commit/aadefebb2101f29b36e0fd55b746c7670751a41f))
* Offer organizations by email domain, invite codes and a primary organization ([d7eeeb5](https://github.com/simpel/bibi/commit/d7eeeb52a25578f6a09bc26ab2b70b9306a5bde7))
* Org-scoped member profiles linked to staff items ([37fc402](https://github.com/simpel/bibi/commit/37fc4020132812c69307a9c031e06a32ec17b007)), closes [#448](https://github.com/simpel/bibi/issues/448)
* Per-user date and clock format, applied to every date and time in the UI ([f6c383e](https://github.com/simpel/bibi/commit/f6c383e6781ebb0125c117a89f64e63114c59c90)), closes [#481](https://github.com/simpel/bibi/issues/481)
* Per-user number format and currency display, applied to every number and amount in the UI ([b9f47c5](https://github.com/simpel/bibi/commit/b9f47c5a3890f0c6369445eef1f3186fe8f2be9b)), closes [#482](https://github.com/simpel/bibi/issues/482)
* Setup and teardown buffers for every item, with soft buffers and a TEARDOWN hold ([#404](https://github.com/simpel/bibi/issues/404)) ([2378542](https://github.com/simpel/bibi/commit/23785422bd11a325ef860d5db1281a5ac745bfc0)), closes [#379](https://github.com/simpel/bibi/issues/379)
* shared weekly hours pattern for venues and items ([1d96b92](https://github.com/simpel/bibi/commit/1d96b925036be332438d9808c7255be507ad7106)), closes [#429](https://github.com/simpel/bibi/issues/429)
* Sheets become work orders (Swedish "Order") ([de7732c](https://github.com/simpel/bibi/commit/de7732caaf896f42600e787507770cf1670e7d7a))
* SIE export reports a chosen date range, repeatable ([1e04436](https://github.com/simpel/bibi/commit/1e04436c76efe72c93fc6eb89963a874c19d8ad5))
* Split customisation choices with their own quantities ([22403e8](https://github.com/simpel/bibi/commit/22403e8106ac82f435de6918492c36cc842ce112))
* Ticket titles and a read-only ticket sheet in the pipeline and calendar ([5707208](https://github.com/simpel/bibi/commit/57072082a81eee2e7231d32c30045325e6fbfe31))
* Ticket value estimates, money display format and profile and consent rework ([1dc0b7b](https://github.com/simpel/bibi/commit/1dc0b7bf41203a24c33d286a6c61f5f4b7666c2f))
* Tickets list with numbered pages, search and rows per page ([8e050cf](https://github.com/simpel/bibi/commit/8e050cf3cd48880dc719ab0a23190ba7a7123669))
* time zone on organization and venue with one resolver ([#424](https://github.com/simpel/bibi/issues/424)) ([ab03dea](https://github.com/simpel/bibi/commit/ab03deaab95bcc975ac9ce166b9114d5cccd1069))
* time zone on organization and venue with one resolver ([#475](https://github.com/simpel/bibi/issues/475)) ([ab03dea](https://github.com/simpel/bibi/commit/ab03deaab95bcc975ac9ce166b9114d5cccd1069)), closes [#424](https://github.com/simpel/bibi/issues/424)
* welcome flow without AI, org-scoped URLs and member profiles ([#419](https://github.com/simpel/bibi/issues/419)) ([c9db0e7](https://github.com/simpel/bibi/commit/c9db0e792b0d68a5cdb855280d2989b662d58bfd))
* Work orders get their own menu entry with Today and All ([84a78d5](https://github.com/simpel/bibi/commit/84a78d54a47f3b41232849ab27ed3448dc9c7861))
* Working hours per organization, people as calendar rows and the whole ticket in the booking sheet ([14e89a8](https://github.com/simpel/bibi/commit/14e89a8ca201df4316987f118adb5cac9fce8115)), closes [#449](https://github.com/simpel/bibi/issues/449)


### Bug Fixes

* fix: paymentAccount.startOnboarding calls Stripe before commit, so previews create real accounts ([#402](https://github.com/simpel/bibi/issues/402)) ([c7801a9](https://github.com/simpel/bibi/commit/c7801a9eeabfd12763fe25af72434b5110858ea8)), closes [#392](https://github.com/simpel/bibi/issues/392)
* lint and structure checks pass after the rename ([9c0c465](https://github.com/simpel/bibi/commit/9c0c46566b7e37c8db49c7df08e478e87dc7bdb3))
* Run sheets load again after the rename, and notifications keep their order name ([94d0980](https://github.com/simpel/bibi/commit/94d0980181ba80d3a1c76ac6918a2476f1e53770))


### Performance Improvements

* fast page loads (ADR 0097) ([291d945](https://github.com/simpel/bibi/commit/291d9459c9fb798e2eea115802c6b86f125020a8))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @bibi/config bumped to 0.2.0

## Changelog

Generated by release-please from Conventional Commits (ADR 0060). Do not edit by hand.
