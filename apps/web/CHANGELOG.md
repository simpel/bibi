# Changelog

## [0.2.0](https://github.com/simpel/bibi/compare/@bibi/web-v0.1.0...@bibi/web-v0.2.0) (2026-10-24)


### Features

* Allocation UI: Resources and Staffing lists with a prepicked unit ([#438](https://github.com/simpel/bibi/issues/438)) ([e4d121d](https://github.com/simpel/bibi/commit/e4d121dcae795435cc44b83dbb94a6b34ad694d4)), closes [#384](https://github.com/simpel/bibi/issues/384)
* calendar URL as a date range and DST-safe columns ([21664c3](https://github.com/simpel/bibi/commit/21664c3a4f186f60dd9c5bcf68f9327b27320703)), closes [#428](https://github.com/simpel/bibi/issues/428)
* choose the time zone when creating an organization ([5a99c2d](https://github.com/simpel/bibi/commit/5a99c2d5aece8ac7c23a41d10b3f76fc2121e696)), closes [#427](https://github.com/simpel/bibi/issues/427)
* Customisations on any item with a price effect ([#414](https://github.com/simpel/bibi/issues/414)) ([a573ac4](https://github.com/simpel/bibi/commit/a573ac490c7827730a8c964b4c95fb5cb1cc97a0)), closes [#382](https://github.com/simpel/bibi/issues/382)
* Derived warnings on line reads for unfilled optional demands ([#458](https://github.com/simpel/bibi/issues/458)) ([7ce69ac](https://github.com/simpel/bibi/commit/7ce69acaefaf5254893308e2fd4b4a942d274438)), closes [#385](https://github.com/simpel/bibi/issues/385)
* Expand a bundle into a bundle line and part lines, with per-rate VAT ([#413](https://github.com/simpel/bibi/issues/413)) ([1c19970](https://github.com/simpel/bibi/commit/1c199703666927018c90d11698bc859636ee0140)), closes [#381](https://github.com/simpel/bibi/issues/381)
* item demands and line allocations ([#383](https://github.com/simpel/bibi/issues/383)) ([#436](https://github.com/simpel/bibi/issues/436)) ([512e57b](https://github.com/simpel/bibi/commit/512e57bb075231f82dee93ca9acb8cb8719ed86e))
* Manager preset gets item:write ([#423](https://github.com/simpel/bibi/issues/423)) ([36de054](https://github.com/simpel/bibi/commit/36de0542752766ccd2753a6a67a4d16c7a74eace)), closes [#389](https://github.com/simpel/bibi/issues/389)
* move platform admin to /mothership and add an /admin hub ([ad27763](https://github.com/simpel/bibi/commit/ad27763d939fefd9400f763776a12feddefb734b))
* Nordic Manor design tokens and a rename-app codemod ([#415](https://github.com/simpel/bibi/issues/415)) ([eed4708](https://github.com/simpel/bibi/commit/eed47083e9355714c7ef4d605a27eb7c35eb7e51))
* Pool targets: a need can target an item type plus tags, with unit allocation ([#411](https://github.com/simpel/bibi/issues/411)) ([d6b16e9](https://github.com/simpel/bibi/commit/d6b16e9dec810347f95c3af5e5ce1a51e9586e8e)), closes [#380](https://github.com/simpel/bibi/issues/380)
* RelativeTime component with an exact-time tooltip ([#471](https://github.com/simpel/bibi/issues/471)) ([6b4bed6](https://github.com/simpel/bibi/commit/6b4bed6e8ec1a6f94e71acc8aa5239a0bd4b694c)), closes [#426](https://github.com/simpel/bibi/issues/426)
* Setup and teardown buffers for every item, with soft buffers and a TEARDOWN hold ([#404](https://github.com/simpel/bibi/issues/404)) ([2378542](https://github.com/simpel/bibi/commit/23785422bd11a325ef860d5db1281a5ac745bfc0)), closes [#379](https://github.com/simpel/bibi/issues/379)
* Show per-rate VAT rows for bundle lines on the quote and invoice screens ([#437](https://github.com/simpel/bibi/issues/437)) ([2425c80](https://github.com/simpel/bibi/commit/2425c80c27b21d74c48e4af3da4b4872ece340a6)), closes [#420](https://github.com/simpel/bibi/issues/420)
* show wordmark on auth pages and dev switcher on empty database ([#421](https://github.com/simpel/bibi/issues/421)) ([93a29ca](https://github.com/simpel/bibi/commit/93a29ca51e5798b6ae7cb9e088382153c4db7c83))
* time zone on organization and venue with one resolver ([#424](https://github.com/simpel/bibi/issues/424)) ([ab03dea](https://github.com/simpel/bibi/commit/ab03deaab95bcc975ac9ce166b9114d5cccd1069))
* time zone on organization and venue with one resolver ([#475](https://github.com/simpel/bibi/issues/475)) ([ab03dea](https://github.com/simpel/bibi/commit/ab03deaab95bcc975ac9ce166b9114d5cccd1069)), closes [#424](https://github.com/simpel/bibi/issues/424)
* Type editor: capability sections replace the behaviour checkboxes ([#422](https://github.com/simpel/bibi/issues/422)) ([cf52927](https://github.com/simpel/bibi/commit/cf5292711a5624aad0267981c4c5bda189ff42f8)), closes [#386](https://github.com/simpel/bibi/issues/386)
* welcome flow without AI, org-scoped URLs and member profiles ([#419](https://github.com/simpel/bibi/issues/419)) ([c9db0e7](https://github.com/simpel/bibi/commit/c9db0e792b0d68a5cdb855280d2989b662d58bfd))


### Bug Fixes

* Fix the red e2e on main: approval-preview expects a Needs admin badge that item changes no longer get ([#395](https://github.com/simpel/bibi/issues/395)) ([02fc86a](https://github.com/simpel/bibi/commit/02fc86aa66ac75960dbdea39cad6a5f5901d8cf3)), closes [#391](https://github.com/simpel/bibi/issues/391)
* fix: paymentAccount.startOnboarding calls Stripe before commit, so previews create real accounts ([#402](https://github.com/simpel/bibi/issues/402)) ([c7801a9](https://github.com/simpel/bibi/commit/c7801a9eeabfd12763fe25af72434b5110858ea8)), closes [#392](https://github.com/simpel/bibi/issues/392)
* restore the final newline in apps/web/package.json ([#473](https://github.com/simpel/bibi/issues/473)) ([8b8efc8](https://github.com/simpel/bibi/commit/8b8efc890d80229428a37d18d86438483e2c2e25))
* Swedish ticket statuses are "ärendestatus", apart from item states ([8cb3321](https://github.com/simpel/bibi/commit/8cb332170d51a146133aa05aca7438e349cc88c1)), closes [#444](https://github.com/simpel/bibi/issues/444)
* update next.js version to 16.4.2 in package.json and pnpm-lock.yaml ([#472](https://github.com/simpel/bibi/issues/472)) ([61a33a3](https://github.com/simpel/bibi/commit/61a33a3b7f563e2f860cab26f9cd9a7fae4da27c))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @bibi/ai bumped to 0.2.0
    * @bibi/api bumped to 0.2.0
    * @bibi/auth bumped to 0.2.0
    * @bibi/config bumped to 0.2.0
    * @bibi/core bumped to 0.2.0
    * @bibi/db bumped to 0.2.0
    * @bibi/graphql bumped to 0.2.0
    * @bibi/i18n bumped to 0.2.0
    * @bibi/logger bumped to 0.1.1
    * @bibi/mail bumped to 0.2.0
    * @bibi/storage bumped to 0.2.0
    * @bibi/ui bumped to 0.2.0

## Changelog

Generated by release-please from Conventional Commits (ADR 0060). Do not edit by hand.
