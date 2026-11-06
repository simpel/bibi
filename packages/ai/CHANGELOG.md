# Changelog

## [1.0.2](https://github.com/simpel/bibi/compare/@bibi/ai-v1.0.1...@bibi/ai-v1.0.2) (2026-11-06)


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @bibi/auth bumped to 0.4.0
    * @bibi/config bumped to 0.3.0
    * @bibi/core bumped to 1.0.1
    * @bibi/db bumped to 1.0.1
    * @bibi/logger bumped to 0.1.2

## [1.0.1](https://github.com/simpel/bibi/compare/@bibi/ai-v1.0.0...@bibi/ai-v1.0.1) (2026-11-05)


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @bibi/auth bumped to 0.3.0

## [1.0.0](https://github.com/simpel/bibi/compare/@bibi/ai-v0.1.0...@bibi/ai-v1.0.0) (2026-11-05)


### ⚠ BREAKING CHANGES

* Inbox messages are read or unread for the team and can be deleted; dismiss is gone
* sheet.* and sheetDefinition.* operations, MCP tools, GraphQL fields, REST paths and the sheet permission feature are renamed with no aliases.
* dashboard.summary takes { from, to } again, its comingUp is now scheduled and status tiles carry a trend; finance.overview gains trends.
* dashboard.summary has no from/to input and a new shape; finance.overview drops forwardBooked and gains outcomes.
* Free status movement by default, admin-only flow and board views
* Add boards with phases and a customize mode on the pipeline

### Features

* Add boards with phases and a customize mode on the pipeline ([4730341](https://github.com/simpel/bibi/commit/47303414497cf9c377dd34ae5b820ec873890e36)), closes [#446](https://github.com/simpel/bibi/issues/446)
* Bibi subscription with a 14-day trial, seats and a payment gate ([6c25365](https://github.com/simpel/bibi/commit/6c25365a3b5487c55549cb921dc9c32815bed970))
* calendar.range core operation on all surfaces ([8c96256](https://github.com/simpel/bibi/commit/8c96256e6f3bf3cd4b047dc77d45d1626da3e63c)), closes [#430](https://github.com/simpel/bibi/issues/430)
* choose the time zone when creating an organization ([5a99c2d](https://github.com/simpel/bibi/commit/5a99c2d5aece8ac7c23a41d10b3f76fc2121e696)), closes [#427](https://github.com/simpel/bibi/issues/427)
* Connect an organization to Fortnox ([476dc85](https://github.com/simpel/bibi/commit/476dc85226f59bae46c953784b6b902354350735))
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
* shared weekly hours pattern for venues and items ([1d96b92](https://github.com/simpel/bibi/commit/1d96b925036be332438d9808c7255be507ad7106)), closes [#429](https://github.com/simpel/bibi/issues/429)
* Sheets become work orders (Swedish "Order") ([de7732c](https://github.com/simpel/bibi/commit/de7732caaf896f42600e787507770cf1670e7d7a))
* show wordmark on auth pages and dev switcher on empty database ([#421](https://github.com/simpel/bibi/issues/421)) ([93a29ca](https://github.com/simpel/bibi/commit/93a29ca51e5798b6ae7cb9e088382153c4db7c83))
* SIE export reports a chosen date range, repeatable ([1e04436](https://github.com/simpel/bibi/commit/1e04436c76efe72c93fc6eb89963a874c19d8ad5))
* The notification toast shows the notification's text, shortened ([6a91eab](https://github.com/simpel/bibi/commit/6a91eaba49d0b1328074d80d526a499e7fa3fc97))
* Ticket page with issue alerts, line amounts and the day in the calendar ([a67d28a](https://github.com/simpel/bibi/commit/a67d28a90b2e0cc7ae769dc87d2c65661c577882))
* Ticket titles and a read-only ticket sheet in the pipeline and calendar ([5707208](https://github.com/simpel/bibi/commit/57072082a81eee2e7231d32c30045325e6fbfe31))
* Ticket value estimates, money display format and profile and consent rework ([1dc0b7b](https://github.com/simpel/bibi/commit/1dc0b7bf41203a24c33d286a6c61f5f4b7666c2f))
* time zone on organization and venue with one resolver ([#424](https://github.com/simpel/bibi/issues/424)) ([ab03dea](https://github.com/simpel/bibi/commit/ab03deaab95bcc975ac9ce166b9114d5cccd1069))
* time zone on organization and venue with one resolver ([#475](https://github.com/simpel/bibi/issues/475)) ([ab03dea](https://github.com/simpel/bibi/commit/ab03deaab95bcc975ac9ce166b9114d5cccd1069)), closes [#424](https://github.com/simpel/bibi/issues/424)
* welcome flow without AI, org-scoped URLs and member profiles ([#419](https://github.com/simpel/bibi/issues/419)) ([c9db0e7](https://github.com/simpel/bibi/commit/c9db0e792b0d68a5cdb855280d2989b662d58bfd))


### Bug Fixes

* fix: paymentAccount.startOnboarding calls Stripe before commit, so previews create real accounts ([#402](https://github.com/simpel/bibi/issues/402)) ([c7801a9](https://github.com/simpel/bibi/commit/c7801a9eeabfd12763fe25af72434b5110858ea8)), closes [#392](https://github.com/simpel/bibi/issues/392)
* lint and structure checks pass after the rename ([9c0c465](https://github.com/simpel/bibi/commit/9c0c46566b7e37c8db49c7df08e478e87dc7bdb3))


### Performance Improvements

* fast page loads (ADR 0097) ([291d945](https://github.com/simpel/bibi/commit/291d9459c9fb798e2eea115802c6b86f125020a8))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @bibi/auth bumped to 0.2.0
    * @bibi/config bumped to 0.2.0
    * @bibi/core bumped to 1.0.0
    * @bibi/db bumped to 1.0.0
    * @bibi/logger bumped to 0.1.1

## Changelog

Generated by release-please from Conventional Commits (ADR 0060). Do not edit by hand.
