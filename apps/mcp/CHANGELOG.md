# Changelog

## [5.0.0](https://github.com/simpel/bibi/compare/@bibi/mcp-v4.0.0...@bibi/mcp-v5.0.0) (2026-11-14)


### ⚠ BREAKING CHANGES

* environments with Stripe or Fortnox credentials must set their hosts (values in .exampleenv); Swish needs SWISH_API_BASE_URL.
* env URLs are named by use: *_ORIGIN, *_BASE_URL, *_URL as written

### Features

* one accounting system at a time, an account check at the provider, and Integrations grouped by purpose ([ff39f82](https://github.com/simpel/bibi/commit/ff39f821a550af566e0d9992d19d441f1aa12647))
* one default revenue account row, and payment routes only to connected services ([5c744cf](https://github.com/simpel/bibi/commit/5c744cf6a04e99518fc981bff572a69de70fe2be))


### Code Refactoring

* env URLs are named by use: *_ORIGIN, *_BASE_URL, *_URL as written ([fbe4bc3](https://github.com/simpel/bibi/commit/fbe4bc3da34e4a086596117490a929ffb606a06f))
* provider hosts come only from env ([04217ec](https://github.com/simpel/bibi/commit/04217ec38875dfe08b1db28ff0bb54c5409d0a3b))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @bibi/ai bumped to 5.0.0
    * @bibi/auth bumped to 1.0.0
    * @bibi/config bumped to 1.0.0
    * @bibi/core bumped to 5.0.0
    * @bibi/db bumped to 3.1.0
    * @bibi/graphql bumped to 3.1.0
    * @bibi/logger bumped to 0.1.4
    * @bibi/mail bumped to 1.0.0
    * @bibi/storage bumped to 0.2.8
  * devDependencies
    * @bibi/api bumped to 3.1.0

## [4.0.0](https://github.com/simpel/bibi/compare/@bibi/mcp-v3.0.0...@bibi/mcp-v4.0.0) (2026-11-12)


### ⚠ BREAKING CHANGES

* invoices and credit notes no longer carry number or voidPending, and accountingSettings no longer has the SIE-only accounts or fiscalYearStartMonth.

### Code Refactoring

* drop Bibi's own document numbers, the void retry and the SIE export tables ([5baa33b](https://github.com/simpel/bibi/commit/5baa33bda035e9db22a75323638da60fa421d94d))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @bibi/ai bumped to 4.0.0
    * @bibi/auth bumped to 0.6.4
    * @bibi/core bumped to 4.0.0
    * @bibi/db bumped to 3.0.0
    * @bibi/graphql bumped to 3.0.1
    * @bibi/mail bumped to 0.5.4
    * @bibi/storage bumped to 0.2.7
  * devDependencies
    * @bibi/api bumped to 3.0.1

## [3.0.0](https://github.com/simpel/bibi/compare/@bibi/mcp-v2.0.0...@bibi/mcp-v3.0.0) (2026-11-12)


### ⚠ BREAKING CHANGES

* accountingExport.* and paying a quote (quoteId) are removed from REST, GraphQL and MCP, and money operations need a connected accounting system.

### Features

* money needs a connected Fortnox or Visma; quote payments, Stripe Invoicing and the SIE export go ([6c6586e](https://github.com/simpel/bibi/commit/6c6586e127b2be5bb8324985961098a1a46a56bf))
* venue items summary with per-type subpages and plural type names ([a1384fc](https://github.com/simpel/bibi/commit/a1384fc1ef3f7056ce8907e0768114faa3ce0fe5))
* venue items summary with per-type subpages and plural type names ([b135d0e](https://github.com/simpel/bibi/commit/b135d0ea8081b17a14b59eec83918ae59c7d2fdd))


### Bug Fixes

* the MCP payment approval test settles the Stripe connection, not whichever comes first ([5624ef8](https://github.com/simpel/bibi/commit/5624ef83c65e43fa688b2c52f8bb3996cc0e3dac))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @bibi/ai bumped to 3.0.0
    * @bibi/auth bumped to 0.6.3
    * @bibi/core bumped to 3.0.0
    * @bibi/db bumped to 2.1.0
    * @bibi/graphql bumped to 3.0.0
    * @bibi/mail bumped to 0.5.3
    * @bibi/storage bumped to 0.2.6
  * devDependencies
    * @bibi/api bumped to 3.0.0

## [2.0.0](https://github.com/simpel/bibi/compare/@bibi/mcp-v1.2.1...@bibi/mcp-v2.0.0) (2026-11-11)


### ⚠ BREAKING CHANGES

* setup.* and setupLayout.* are replaced by layout.* on GraphQL, REST and MCP; lines, previews and templates take layoutId instead of setupId; items take maxPeople instead of setups.

### Features

* item type groups, with a tab per group on /items ([e717e88](https://github.com/simpel/bibi/commit/e717e8846deb77faf1166399c3303e784b879fa1))
* rooms have layouts instead of shared setups, with a people limit and emergency exits ([cb33bdf](https://github.com/simpel/bibi/commit/cb33bdf6dbad9ecd6c602781e7dc5b5bde4232b2))
* several layouts per setup, doors and windows on walls, floor plan split from layouts ([1712a9d](https://github.com/simpel/bibi/commit/1712a9d04b2bd12d51b198af3d503007705104db))
* several layouts per setup, doors and windows on walls, floor plan split from layouts ([1273331](https://github.com/simpel/bibi/commit/127333165e43e9e9fb0ef1fbe8722a3255bf0ab7))


### Bug Fixes

* mcp declares prisma, now a runtime dependency of @bibi/db ([ef54a10](https://github.com/simpel/bibi/commit/ef54a10815ff1ddb01a52b04dbe97663254560fe))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @bibi/ai bumped to 2.0.0
    * @bibi/auth bumped to 0.6.2
    * @bibi/config bumped to 0.4.0
    * @bibi/core bumped to 2.0.0
    * @bibi/db bumped to 2.0.0
    * @bibi/graphql bumped to 2.0.0
    * @bibi/logger bumped to 0.1.3
    * @bibi/mail bumped to 0.5.2
    * @bibi/storage bumped to 0.2.5
  * devDependencies
    * @bibi/api bumped to 2.0.0

## [1.2.1](https://github.com/simpel/bibi/compare/@bibi/mcp-v1.2.0...@bibi/mcp-v1.2.1) (2026-11-09)


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @bibi/ai bumped to 1.2.1
    * @bibi/auth bumped to 0.6.1
    * @bibi/core bumped to 1.3.0
    * @bibi/graphql bumped to 1.1.2
    * @bibi/mail bumped to 0.5.1
    * @bibi/storage bumped to 0.2.4
  * devDependencies
    * @bibi/api bumped to 1.1.2

## [1.2.0](https://github.com/simpel/bibi/compare/@bibi/mcp-v1.1.0...@bibi/mcp-v1.2.0) (2026-11-07)


### Features

* the payment operator is stored, and empty admin sections stay off the page ([3645afe](https://github.com/simpel/bibi/commit/3645afe91e52627dedc7202ef7d6ae549cfb28b6))


### Bug Fixes

* example orders isolation test and pipeline e2e follow the admin sections ([5f9bd79](https://github.com/simpel/bibi/commit/5f9bd791ad108f29e9d49c6598c5bb1fa10018b7))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @bibi/ai bumped to 1.2.0
    * @bibi/auth bumped to 0.6.0
    * @bibi/core bumped to 1.2.0
    * @bibi/db bumped to 1.1.0
    * @bibi/graphql bumped to 1.1.1
    * @bibi/mail bumped to 0.5.0
    * @bibi/storage bumped to 0.2.3
  * devDependencies
    * @bibi/api bumped to 1.1.1

## [1.1.0](https://github.com/simpel/bibi/compare/@bibi/mcp-v1.0.2...@bibi/mcp-v1.1.0) (2026-11-06)


### Features

* magic link is the only sign-in, passwords removed ([105ae06](https://github.com/simpel/bibi/commit/105ae068a0e194cf2bc6afcbe7248e9f4f4ff890))
* new organizations start with example orders and the base types to create orders ([2e9e74b](https://github.com/simpel/bibi/commit/2e9e74b6e5291a5a317be4accdd1fadf722fcb63))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @bibi/ai bumped to 1.1.0
    * @bibi/auth bumped to 0.5.0
    * @bibi/core bumped to 1.1.0
    * @bibi/graphql bumped to 1.1.0
    * @bibi/mail bumped to 0.4.0
    * @bibi/storage bumped to 0.2.2
  * devDependencies
    * @bibi/api bumped to 1.1.0

## [1.0.2](https://github.com/simpel/bibi/compare/@bibi/mcp-v1.0.1...@bibi/mcp-v1.0.2) (2026-11-06)


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @bibi/ai bumped to 1.0.2
    * @bibi/auth bumped to 0.4.0
    * @bibi/config bumped to 0.3.0
    * @bibi/core bumped to 1.0.1
    * @bibi/db bumped to 1.0.1
    * @bibi/graphql bumped to 1.0.1
    * @bibi/logger bumped to 0.1.2
    * @bibi/mail bumped to 0.3.1
    * @bibi/storage bumped to 0.2.1
  * devDependencies
    * @bibi/api bumped to 1.0.1

## [1.0.1](https://github.com/simpel/bibi/compare/@bibi/mcp-v1.0.0...@bibi/mcp-v1.0.1) (2026-11-05)


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @bibi/ai bumped to 1.0.1
    * @bibi/auth bumped to 0.3.0
    * @bibi/mail bumped to 0.3.0

## [1.0.0](https://github.com/simpel/bibi/compare/@bibi/mcp-v0.1.0...@bibi/mcp-v1.0.0) (2026-11-05)


### ⚠ BREAKING CHANGES

* Inbox messages are read or unread for the team and can be deleted; dismiss is gone
* customisationGroups no longer carry allowExtras on GraphQL, REST and MCP.
* sheet.* and sheetDefinition.* operations, MCP tools, GraphQL fields, REST paths and the sheet permission feature are renamed with no aliases.
* dashboard.summary takes { from, to } again, its comingUp is now scheduled and status tiles carry a trend; finance.overview gains trends.
* dashboard.summary has no from/to input and a new shape; finance.overview drops forwardBooked and gains outcomes.
* Free status movement by default, admin-only flow and board views
* ticket statuses no longer have requiresReason, requiresAssignee or requiresAcceptedQuote; set gates with ticketStatus.setTransitions.
* ticketStatus.create no longer accepts flags or an event, and board phases have no color in input or output.
* Add boards with phases and a customize mode on the pipeline

### Features

* A customisation group never takes more picks than its max ([7abd9bf](https://github.com/simpel/bibi/commit/7abd9bff5b3374ab401ba5795e7ea0135ae75f65))
* Add boards with phases and a customize mode on the pipeline ([4730341](https://github.com/simpel/bibi/commit/47303414497cf9c377dd34ae5b820ec873890e36)), closes [#446](https://github.com/simpel/bibi/issues/446)
* Add-ons as lines under any line in core ([2d8b66f](https://github.com/simpel/bibi/commit/2d8b66f0e9a6741921bdc12071d0210104d89ea0))
* Add-ons in the ticket intake ([175e6ce](https://github.com/simpel/bibi/commit/175e6ce69bb8c25a0f913110234a7aee298227af))
* Bibi subscription with a 14-day trial, seats and a payment gate ([6c25365](https://github.com/simpel/bibi/commit/6c25365a3b5487c55549cb921dc9c32815bed970))
* calendar.range core operation on all surfaces ([8c96256](https://github.com/simpel/bibi/commit/8c96256e6f3bf3cd4b047dc77d45d1626da3e63c)), closes [#430](https://github.com/simpel/bibi/issues/430)
* choose the time zone when creating an organization ([5a99c2d](https://github.com/simpel/bibi/commit/5a99c2d5aece8ac7c23a41d10b3f76fc2121e696)), closes [#427](https://github.com/simpel/bibi/issues/427)
* Connect an organization to Fortnox ([476dc85](https://github.com/simpel/bibi/commit/476dc85226f59bae46c953784b6b902354350735))
* Contact required, booking notes and package guest ranges ([b7eec2f](https://github.com/simpel/bibi/commit/b7eec2f27e2ad4094a7ce101e70d0b8a9bcd4bda))
* Create a status with a name and colour only, and drop the column colour ([a2f7360](https://github.com/simpel/bibi/commit/a2f73605d43602b9bd10507fd12232a40bca0b9c)), closes [#492](https://github.com/simpel/bibi/issues/492)
* Create a ticket with its lines in one command ([e18f62c](https://github.com/simpel/bibi/commit/e18f62cb9ebfadbbd4a6c9dde3fbc45630d52dbb))
* Customisations on any item with a price effect ([#414](https://github.com/simpel/bibi/issues/414)) ([a573ac4](https://github.com/simpel/bibi/commit/a573ac490c7827730a8c964b4c95fb5cb1cc97a0)), closes [#382](https://github.com/simpel/bibi/issues/382)
* Dashboard looks ahead, Financials looks back ([c605182](https://github.com/simpel/bibi/commit/c60518212594487571a0352b3791cbc65835b64a))
* Dashboard with pipeline value, won/lost history, money and utilisation ([3af6b9b](https://github.com/simpel/bibi/commit/3af6b9b7449620574d6221e17dd9b9f64e8ebb97))
* Deposit rule and invoice provider settings, deposits with a payment link ([703f10f](https://github.com/simpel/bibi/commit/703f10ff2e41be37b10fcd389ad9139269cb79c5))
* Disconnect Stripe, and integrations as a grid of provider cards ([763c374](https://github.com/simpel/bibi/commit/763c374c354aad58e80b46dc999880db34bf67a3))
* Draft a ticket from a message with the assistant ([0d6bb9f](https://github.com/simpel/bibi/commit/0d6bb9f6d0aa98edd8dd5a415f0c4487ba971ecf))
* Expand a bundle into a bundle line and part lines, with per-rate VAT ([#413](https://github.com/simpel/bibi/issues/413)) ([1c19970](https://github.com/simpel/bibi/commit/1c199703666927018c90d11698bc859636ee0140)), closes [#381](https://github.com/simpel/bibi/issues/381)
* Financials page, accounting settings and incremental SIE 4I export ([a373297](https://github.com/simpel/bibi/commit/a373297a245e5448a57943e8ac20b1f49eda32be))
* Find similar customers and create a customer with its first contact ([24089d1](https://github.com/simpel/bibi/commit/24089d11b9f3f7f4951619d6f1c15ff65d0e62d4))
* Free status movement by default, admin-only flow and board views ([f8833c5](https://github.com/simpel/bibi/commit/f8833c524658d9bdbd30b1eb328c3bd818103e48))
* Gates on status transitions replace the status flags ([f1d23d5](https://github.com/simpel/bibi/commit/f1d23d52c6f1c9aa91a348e8bd5152f0b6f090da)), closes [#447](https://github.com/simpel/bibi/issues/447)
* Inbound messages from any channel with an organization inbox ([c92609f](https://github.com/simpel/bibi/commit/c92609f5ef42a1c2a8cbbae6e520ba6748569767))
* Inbox badge with the open count, live on the notification stream ([bb98457](https://github.com/simpel/bibi/commit/bb9845707d625dbae4fb43d833393c71bec49fc3))
* Inbox messages are read or unread for the team and can be deleted; dismiss is gone ([f072961](https://github.com/simpel/bibi/commit/f072961794fcabb261b5cb6fc568e5228f65a5ed))
* Invoices raised in the venue's Fortnox, with payments pushed back over Fortnox's stream ([90f831a](https://github.com/simpel/bibi/commit/90f831ad10dfd4156225f3687058ba8cf3105ec5))
* item demands and line allocations ([#383](https://github.com/simpel/bibi/issues/383)) ([#436](https://github.com/simpel/bibi/issues/436)) ([512e57b](https://github.com/simpel/bibi/commit/512e57bb075231f82dee93ca9acb8cb8719ed86e))
* Manager preset gets item:write ([#423](https://github.com/simpel/bibi/issues/423)) ([36de054](https://github.com/simpel/bibi/commit/36de0542752766ccd2753a6a67a4d16c7a74eace)), closes [#389](https://github.com/simpel/bibi/issues/389)
* Notifications and the inbox share one table UX, with read and delete icons and notification delete ([b834e4e](https://github.com/simpel/bibi/commit/b834e4e413c8353749e132d5784c3907b89f5f05))
* Notifications with a live bell, a full list and per-kind choices ([aadefeb](https://github.com/simpel/bibi/commit/aadefebb2101f29b36e0fd55b746c7670751a41f))
* Offer organizations by email domain, invite codes and a primary organization ([d7eeeb5](https://github.com/simpel/bibi/commit/d7eeeb52a25578f6a09bc26ab2b70b9306a5bde7))
* One dashboard with Financials and Workload tabs and trend stat cards ([7a47acb](https://github.com/simpel/bibi/commit/7a47acb477a5c5c498df1e0bf79313b44b09d41a))
* Org-scoped member profiles linked to staff items ([37fc402](https://github.com/simpel/bibi/commit/37fc4020132812c69307a9c031e06a32ec17b007)), closes [#448](https://github.com/simpel/bibi/issues/448)
* Per-user date and clock format, applied to every date and time in the UI ([f6c383e](https://github.com/simpel/bibi/commit/f6c383e6781ebb0125c117a89f64e63114c59c90)), closes [#481](https://github.com/simpel/bibi/issues/481)
* Per-user number format and currency display, applied to every number and amount in the UI ([b9f47c5](https://github.com/simpel/bibi/commit/b9f47c5a3890f0c6369445eef1f3186fe8f2be9b)), closes [#482](https://github.com/simpel/bibi/issues/482)
* Pool targets: a need can target an item type plus tags, with unit allocation ([#411](https://github.com/simpel/bibi/issues/411)) ([d6b16e9](https://github.com/simpel/bibi/commit/d6b16e9dec810347f95c3af5e5ce1a51e9586e8e)), closes [#380](https://github.com/simpel/bibi/issues/380)
* Preview a ticket's lines before creating it ([6fa0a5a](https://github.com/simpel/bibi/commit/6fa0a5a6fd459e7d493ae64ccd605c37415decef))
* Setup and teardown buffers for every item, with soft buffers and a TEARDOWN hold ([#404](https://github.com/simpel/bibi/issues/404)) ([2378542](https://github.com/simpel/bibi/commit/23785422bd11a325ef860d5db1281a5ac745bfc0)), closes [#379](https://github.com/simpel/bibi/issues/379)
* shared weekly hours pattern for venues and items ([1d96b92](https://github.com/simpel/bibi/commit/1d96b925036be332438d9808c7255be507ad7106)), closes [#429](https://github.com/simpel/bibi/issues/429)
* Sheets become work orders (Swedish "Order") ([de7732c](https://github.com/simpel/bibi/commit/de7732caaf896f42600e787507770cf1670e7d7a))
* show wordmark on auth pages and dev switcher on empty database ([#421](https://github.com/simpel/bibi/issues/421)) ([93a29ca](https://github.com/simpel/bibi/commit/93a29ca51e5798b6ae7cb9e088382153c4db7c83))
* SIE export reports a chosen date range, repeatable ([1e04436](https://github.com/simpel/bibi/commit/1e04436c76efe72c93fc6eb89963a874c19d8ad5))
* Split customisation choices with their own quantities ([22403e8](https://github.com/simpel/bibi/commit/22403e8106ac82f435de6918492c36cc842ce112))
* Ticket page with issue alerts, line amounts and the day in the calendar ([a67d28a](https://github.com/simpel/bibi/commit/a67d28a90b2e0cc7ae769dc87d2c65661c577882))
* Ticket value estimates, money display format and profile and consent rework ([1dc0b7b](https://github.com/simpel/bibi/commit/1dc0b7bf41203a24c33d286a6c61f5f4b7666c2f))
* welcome flow without AI, org-scoped URLs and member profiles ([#419](https://github.com/simpel/bibi/issues/419)) ([c9db0e7](https://github.com/simpel/bibi/commit/c9db0e792b0d68a5cdb855280d2989b662d58bfd))
* Working hours per organization, people as calendar rows and the whole ticket in the booking sheet ([14e89a8](https://github.com/simpel/bibi/commit/14e89a8ca201df4316987f118adb5cac9fce8115)), closes [#449](https://github.com/simpel/bibi/issues/449)


### Bug Fixes

* fix: paymentAccount.startOnboarding calls Stripe before commit, so previews create real accounts ([#402](https://github.com/simpel/bibi/issues/402)) ([c7801a9](https://github.com/simpel/bibi/commit/c7801a9eeabfd12763fe25af72434b5110858ea8)), closes [#392](https://github.com/simpel/bibi/issues/392)
* lint and structure checks pass after the rename ([9c0c465](https://github.com/simpel/bibi/commit/9c0c46566b7e37c8db49c7df08e478e87dc7bdb3))


### Performance Improvements

* fast page loads (ADR 0097) ([291d945](https://github.com/simpel/bibi/commit/291d9459c9fb798e2eea115802c6b86f125020a8))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @bibi/ai bumped to 1.0.0
    * @bibi/auth bumped to 0.2.0
    * @bibi/config bumped to 0.2.0
    * @bibi/core bumped to 1.0.0
    * @bibi/db bumped to 1.0.0
    * @bibi/graphql bumped to 1.0.0
    * @bibi/logger bumped to 0.1.1
    * @bibi/mail bumped to 0.2.0
    * @bibi/storage bumped to 0.2.0
  * devDependencies
    * @bibi/api bumped to 1.0.0

## Changelog

Generated by release-please from Conventional Commits (ADR 0060). Do not edit by hand.
