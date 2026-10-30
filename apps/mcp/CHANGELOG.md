# Changelog

## [1.0.0](https://github.com/simpel/bibi/compare/@bibi/mcp-v0.1.0...@bibi/mcp-v1.0.0) (2026-10-30)


### ⚠ BREAKING CHANGES

* ticket statuses no longer have requiresReason, requiresAssignee or requiresAcceptedQuote; set gates with ticketStatus.setTransitions.
* ticketStatus.create no longer accepts flags or an event, and board phases have no color in input or output.
* Add boards with phases and a customize mode on the pipeline

### Features

* Add boards with phases and a customize mode on the pipeline ([4730341](https://github.com/simpel/bibi/commit/47303414497cf9c377dd34ae5b820ec873890e36)), closes [#446](https://github.com/simpel/bibi/issues/446)
* calendar.range core operation on all surfaces ([8c96256](https://github.com/simpel/bibi/commit/8c96256e6f3bf3cd4b047dc77d45d1626da3e63c)), closes [#430](https://github.com/simpel/bibi/issues/430)
* choose the time zone when creating an organization ([5a99c2d](https://github.com/simpel/bibi/commit/5a99c2d5aece8ac7c23a41d10b3f76fc2121e696)), closes [#427](https://github.com/simpel/bibi/issues/427)
* Create a status with a name and colour only, and drop the column colour ([a2f7360](https://github.com/simpel/bibi/commit/a2f73605d43602b9bd10507fd12232a40bca0b9c)), closes [#492](https://github.com/simpel/bibi/issues/492)
* Customisations on any item with a price effect ([#414](https://github.com/simpel/bibi/issues/414)) ([a573ac4](https://github.com/simpel/bibi/commit/a573ac490c7827730a8c964b4c95fb5cb1cc97a0)), closes [#382](https://github.com/simpel/bibi/issues/382)
* Expand a bundle into a bundle line and part lines, with per-rate VAT ([#413](https://github.com/simpel/bibi/issues/413)) ([1c19970](https://github.com/simpel/bibi/commit/1c199703666927018c90d11698bc859636ee0140)), closes [#381](https://github.com/simpel/bibi/issues/381)
* Gates on status transitions replace the status flags ([f1d23d5](https://github.com/simpel/bibi/commit/f1d23d52c6f1c9aa91a348e8bd5152f0b6f090da)), closes [#447](https://github.com/simpel/bibi/issues/447)
* item demands and line allocations ([#383](https://github.com/simpel/bibi/issues/383)) ([#436](https://github.com/simpel/bibi/issues/436)) ([512e57b](https://github.com/simpel/bibi/commit/512e57bb075231f82dee93ca9acb8cb8719ed86e))
* Manager preset gets item:write ([#423](https://github.com/simpel/bibi/issues/423)) ([36de054](https://github.com/simpel/bibi/commit/36de0542752766ccd2753a6a67a4d16c7a74eace)), closes [#389](https://github.com/simpel/bibi/issues/389)
* Org-scoped member profiles linked to staff items ([37fc402](https://github.com/simpel/bibi/commit/37fc4020132812c69307a9c031e06a32ec17b007)), closes [#448](https://github.com/simpel/bibi/issues/448)
* Per-user date and clock format, applied to every date and time in the UI ([f6c383e](https://github.com/simpel/bibi/commit/f6c383e6781ebb0125c117a89f64e63114c59c90)), closes [#481](https://github.com/simpel/bibi/issues/481)
* Per-user number format and currency display, applied to every number and amount in the UI ([b9f47c5](https://github.com/simpel/bibi/commit/b9f47c5a3890f0c6369445eef1f3186fe8f2be9b)), closes [#482](https://github.com/simpel/bibi/issues/482)
* Pool targets: a need can target an item type plus tags, with unit allocation ([#411](https://github.com/simpel/bibi/issues/411)) ([d6b16e9](https://github.com/simpel/bibi/commit/d6b16e9dec810347f95c3af5e5ce1a51e9586e8e)), closes [#380](https://github.com/simpel/bibi/issues/380)
* Setup and teardown buffers for every item, with soft buffers and a TEARDOWN hold ([#404](https://github.com/simpel/bibi/issues/404)) ([2378542](https://github.com/simpel/bibi/commit/23785422bd11a325ef860d5db1281a5ac745bfc0)), closes [#379](https://github.com/simpel/bibi/issues/379)
* shared weekly hours pattern for venues and items ([1d96b92](https://github.com/simpel/bibi/commit/1d96b925036be332438d9808c7255be507ad7106)), closes [#429](https://github.com/simpel/bibi/issues/429)
* show wordmark on auth pages and dev switcher on empty database ([#421](https://github.com/simpel/bibi/issues/421)) ([93a29ca](https://github.com/simpel/bibi/commit/93a29ca51e5798b6ae7cb9e088382153c4db7c83))
* welcome flow without AI, org-scoped URLs and member profiles ([#419](https://github.com/simpel/bibi/issues/419)) ([c9db0e7](https://github.com/simpel/bibi/commit/c9db0e792b0d68a5cdb855280d2989b662d58bfd))
* Working hours per organization, people as calendar rows and the whole ticket in the booking sheet ([14e89a8](https://github.com/simpel/bibi/commit/14e89a8ca201df4316987f118adb5cac9fce8115)), closes [#449](https://github.com/simpel/bibi/issues/449)


### Bug Fixes

* fix: paymentAccount.startOnboarding calls Stripe before commit, so previews create real accounts ([#402](https://github.com/simpel/bibi/issues/402)) ([c7801a9](https://github.com/simpel/bibi/commit/c7801a9eeabfd12763fe25af72434b5110858ea8)), closes [#392](https://github.com/simpel/bibi/issues/392)


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
