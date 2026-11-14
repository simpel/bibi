# Changelog

## [1.0.0](https://github.com/simpel/bibi/compare/@bibi/auth-v0.6.4...@bibi/auth-v1.0.0) (2026-11-14)


### ⚠ BREAKING CHANGES

* env URLs are named by use: *_ORIGIN, *_BASE_URL, *_URL as written

### Features

* the worker provisions the assistant's OAuth client on start ([02b63fc](https://github.com/simpel/bibi/commit/02b63fc1c528c569dcd2fd2331ecff5d7ef402dd))


### Code Refactoring

* env URLs are named by use: *_ORIGIN, *_BASE_URL, *_URL as written ([fbe4bc3](https://github.com/simpel/bibi/commit/fbe4bc3da34e4a086596117490a929ffb606a06f))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @bibi/config bumped to 1.0.0
    * @bibi/core bumped to 5.0.0
    * @bibi/db bumped to 3.1.0
    * @bibi/i18n bumped to 4.1.0
    * @bibi/logger bumped to 0.1.4
    * @bibi/mail bumped to 1.0.0

## [0.6.4](https://github.com/simpel/bibi/compare/@bibi/auth-v0.6.3...@bibi/auth-v0.6.4) (2026-11-12)


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @bibi/core bumped to 4.0.0
    * @bibi/db bumped to 3.0.0
    * @bibi/i18n bumped to 4.0.0
    * @bibi/mail bumped to 0.5.4

## [0.6.3](https://github.com/simpel/bibi/compare/@bibi/auth-v0.6.2...@bibi/auth-v0.6.3) (2026-11-12)


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @bibi/core bumped to 3.0.0
    * @bibi/db bumped to 2.1.0
    * @bibi/i18n bumped to 3.0.0
    * @bibi/mail bumped to 0.5.3

## [0.6.2](https://github.com/simpel/bibi/compare/@bibi/auth-v0.6.1...@bibi/auth-v0.6.2) (2026-11-11)


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @bibi/config bumped to 0.4.0
    * @bibi/core bumped to 2.0.0
    * @bibi/db bumped to 2.0.0
    * @bibi/i18n bumped to 2.0.0
    * @bibi/logger bumped to 0.1.3
    * @bibi/mail bumped to 0.5.2

## [0.6.1](https://github.com/simpel/bibi/compare/@bibi/auth-v0.6.0...@bibi/auth-v0.6.1) (2026-11-09)


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @bibi/core bumped to 1.3.0
    * @bibi/i18n bumped to 1.5.0
    * @bibi/mail bumped to 0.5.1

## [0.6.0](https://github.com/simpel/bibi/compare/@bibi/auth-v0.5.0...@bibi/auth-v0.6.0) (2026-11-07)


### Features

* administration area with its own sidebar replaces the settings hubs ([caef1fd](https://github.com/simpel/bibi/commit/caef1fdd1589443e6f4597f8312d1ca6fb7e708b))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @bibi/core bumped to 1.2.0
    * @bibi/db bumped to 1.1.0
    * @bibi/i18n bumped to 1.4.0
    * @bibi/mail bumped to 0.5.0

## [0.5.0](https://github.com/simpel/bibi/compare/@bibi/auth-v0.4.0...@bibi/auth-v0.5.0) (2026-11-06)


### Features

* magic link is the only sign-in, passwords removed ([105ae06](https://github.com/simpel/bibi/commit/105ae068a0e194cf2bc6afcbe7248e9f4f4ff890))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @bibi/core bumped to 1.1.0
    * @bibi/i18n bumped to 1.3.0
    * @bibi/mail bumped to 0.4.0

## [0.4.0](https://github.com/simpel/bibi/compare/@bibi/auth-v0.3.0...@bibi/auth-v0.4.0) (2026-11-06)


### Features

* public /support help centre and /developers, replacing /docs ([81936c0](https://github.com/simpel/bibi/commit/81936c02ffd771c5944c5a5e348233017d453796))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @bibi/config bumped to 0.3.0
    * @bibi/core bumped to 1.0.1
    * @bibi/db bumped to 1.0.1
    * @bibi/i18n bumped to 1.2.0
    * @bibi/logger bumped to 0.1.2
    * @bibi/mail bumped to 0.3.1

## [0.3.0](https://github.com/simpel/bibi/compare/@bibi/auth-v0.2.0...@bibi/auth-v0.3.0) (2026-11-05)


### Features

* drop the one-time code sign-in, magic link is the default tab ([88d2930](https://github.com/simpel/bibi/commit/88d29303159b97e12c83e5e5f5b1fb841a0961ee))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @bibi/i18n bumped to 1.1.0
    * @bibi/mail bumped to 0.3.0

## [0.2.0](https://github.com/simpel/bibi/compare/@bibi/auth-v0.1.0...@bibi/auth-v0.2.0) (2026-11-05)


### Features

* Bibi subscription with a 14-day trial, seats and a payment gate ([6c25365](https://github.com/simpel/bibi/commit/6c25365a3b5487c55549cb921dc9c32815bed970))
* choose the time zone when creating an organization ([5a99c2d](https://github.com/simpel/bibi/commit/5a99c2d5aece8ac7c23a41d10b3f76fc2121e696)), closes [#427](https://github.com/simpel/bibi/issues/427)
* Connect an organization to Fortnox ([476dc85](https://github.com/simpel/bibi/commit/476dc85226f59bae46c953784b6b902354350735))
* Contact per organization, opening hours and a booking sheet on the calendar ([5d7a7a6](https://github.com/simpel/bibi/commit/5d7a7a60e9b1c69fc2018abb3830e42c5e9abed9)), closes [#486](https://github.com/simpel/bibi/issues/486)
* Inbound messages from any channel with an organization inbox ([c92609f](https://github.com/simpel/bibi/commit/c92609f5ef42a1c2a8cbbae6e520ba6748569767))
* Manager preset gets item:write ([#423](https://github.com/simpel/bibi/issues/423)) ([36de054](https://github.com/simpel/bibi/commit/36de0542752766ccd2753a6a67a4d16c7a74eace)), closes [#389](https://github.com/simpel/bibi/issues/389)
* Offer organizations by email domain, invite codes and a primary organization ([d7eeeb5](https://github.com/simpel/bibi/commit/d7eeeb52a25578f6a09bc26ab2b70b9306a5bde7))
* Seed a pending invitee and show invite codes on /welcome/join in dev ([56ca086](https://github.com/simpel/bibi/commit/56ca086b32a27d07cb0afd36691a80a7b2fe993f))
* Serve the public site on heybibi.se and the app on app.heybibi.se ([e69deb7](https://github.com/simpel/bibi/commit/e69deb7318e3d0c07e944e6b4c49176329a6dc66)), closes [#489](https://github.com/simpel/bibi/issues/489)
* show wordmark on auth pages and dev switcher on empty database ([#421](https://github.com/simpel/bibi/issues/421)) ([93a29ca](https://github.com/simpel/bibi/commit/93a29ca51e5798b6ae7cb9e088382153c4db7c83))
* Ticket value estimates, money display format and profile and consent rework ([1dc0b7b](https://github.com/simpel/bibi/commit/1dc0b7bf41203a24c33d286a6c61f5f4b7666c2f))
* welcome flow without AI, org-scoped URLs and member profiles ([#419](https://github.com/simpel/bibi/issues/419)) ([c9db0e7](https://github.com/simpel/bibi/commit/c9db0e792b0d68a5cdb855280d2989b662d58bfd))


### Bug Fixes

* lint and structure checks pass after the rename ([9c0c465](https://github.com/simpel/bibi/commit/9c0c46566b7e37c8db49c7df08e478e87dc7bdb3))


### Performance Improvements

* fast page loads (ADR 0097) ([291d945](https://github.com/simpel/bibi/commit/291d9459c9fb798e2eea115802c6b86f125020a8))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @bibi/config bumped to 0.2.0
    * @bibi/core bumped to 1.0.0
    * @bibi/db bumped to 1.0.0
    * @bibi/i18n bumped to 1.0.0
    * @bibi/logger bumped to 0.1.1
    * @bibi/mail bumped to 0.2.0

## Changelog

Generated by release-please from Conventional Commits (ADR 0060). Do not edit by hand.
