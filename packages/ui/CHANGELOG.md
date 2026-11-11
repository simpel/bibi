# Changelog

## [2.0.0](https://github.com/simpel/bibi/compare/@bibi/ui-v1.2.0...@bibi/ui-v2.0.0) (2026-11-11)


### ⚠ BREAKING CHANGES

* setup.* and setupLayout.* are replaced by layout.* on GraphQL, REST and MCP; lines, previews and templates take layoutId instead of setupId; items take maxPeople instead of setups.

### Features

* rooms have layouts instead of shared setups, with a people limit and emergency exits ([cb33bdf](https://github.com/simpel/bibi/commit/cb33bdf6dbad9ecd6c602781e7dc5b5bde4232b2))
* several layouts per setup, doors and windows on walls, floor plan split from layouts ([1712a9d](https://github.com/simpel/bibi/commit/1712a9d04b2bd12d51b198af3d503007705104db))
* several layouts per setup, doors and windows on walls, floor plan split from layouts ([1273331](https://github.com/simpel/bibi/commit/127333165e43e9e9fb0ef1fbe8722a3255bf0ab7))


### Dependencies

* The following workspace dependencies were updated
  * devDependencies
    * @bibi/config bumped to 0.4.0

## [1.2.0](https://github.com/simpel/bibi/compare/@bibi/ui-v1.1.0...@bibi/ui-v1.2.0) (2026-11-09)


### Features

* draw floor plans and setup layouts with table sizes and chairs per side ([#509](https://github.com/simpel/bibi/issues/509)) ([51ddd0c](https://github.com/simpel/bibi/commit/51ddd0c1d772701ff06b4d66e2aecdcbd1bc18fa))

## [1.1.0](https://github.com/simpel/bibi/compare/@bibi/ui-v1.0.1...@bibi/ui-v1.1.0) (2026-11-06)


### Features

* create an order from the pipeline board's entry column ([b2bb99d](https://github.com/simpel/bibi/commit/b2bb99d524887bddd2db053e59d5e734cebc09ce))

## [1.0.1](https://github.com/simpel/bibi/compare/@bibi/ui-v1.0.0...@bibi/ui-v1.0.1) (2026-11-06)


### Dependencies

* The following workspace dependencies were updated
  * devDependencies
    * @bibi/config bumped to 0.3.0

## [1.0.0](https://github.com/simpel/bibi/compare/@bibi/ui-v0.1.0...@bibi/ui-v1.0.0) (2026-11-05)


### ⚠ BREAKING CHANGES

* DataTableRowActions is the only row actions component
* customisationGroups no longer carry allowExtras on GraphQL, REST and MCP.
* One-page ticket intake with review, line dialog and Create
* dashboard.summary takes { from, to } again, its comingUp is now scheduled and status tiles carry a trend; finance.overview gains trends.
* ticketStatus.create no longer accepts flags or an event, and board phases have no color in input or output.
* ticketStatus.create without phaseId leaves the status on no board.
* Add boards with phases and a customize mode on the pipeline

### Features

* A customisation group never takes more picks than its max ([7abd9bf](https://github.com/simpel/bibi/commit/7abd9bff5b3374ab401ba5795e7ea0135ae75f65))
* Add boards with phases and a customize mode on the pipeline ([4730341](https://github.com/simpel/bibi/commit/47303414497cf9c377dd34ae5b820ec873890e36)), closes [#446](https://github.com/simpel/bibi/issues/446)
* Assignee column on tickets, search on a picked filter value, joined search field ([8b0115c](https://github.com/simpel/bibi/commit/8b0115c22a7a42c6a24a0282e7dee881d484d5ba))
* Availability calendar page on real data, with calendar.range as a view read model ([e57b967](https://github.com/simpel/bibi/commit/e57b967d3af299dff939fc8a80c45a04611b08df)), closes [#484](https://github.com/simpel/bibi/issues/484)
* Availability calendar with day, week, month and custom ranges on an endless timeline ([856d337](https://github.com/simpel/bibi/commit/856d337419d82269c06228c36a09d7db75b9988a)), closes [#483](https://github.com/simpel/bibi/issues/483)
* Backspace removes a whole highlighted filter value in the tickets search ([0a03eeb](https://github.com/simpel/bibi/commit/0a03eebc8ab7715ac3f356c3332184753975d8e4))
* Calendar asset names link to their page, through an app link that @bibi/ui components can use ([3edf45c](https://github.com/simpel/bibi/commit/3edf45cbc5a5b3349bffaa6da7968020349c7d30))
* Calendar day values: booked, prebooked and still open per day ([a0886d8](https://github.com/simpel/bibi/commit/a0886d83f72668169bbf9efea6b7cdc0b0f11648)), closes [#485](https://github.com/simpel/bibi/issues/485)
* Calendar range picker for the dashboard and Financials period ([f46e3f6](https://github.com/simpel/bibi/commit/f46e3f6dafa975af4373505160c4bfd9defc1f7f))
* Calendar times in the user's clock format ([7635c08](https://github.com/simpel/bibi/commit/7635c083cce9c37a1f4d082082e38d8c689f2fb2)), closes [#487](https://github.com/simpel/bibi/issues/487)
* Calendar toolbar with date and asset blocks, multiselect groups and compact layouts ([4990e16](https://github.com/simpel/bibi/commit/4990e16f8da243c91f9aed13eed6adffc116a96d))
* Click to book in the calendar's week view ([6779793](https://github.com/simpel/bibi/commit/677979314a5338f2cc3b89c75477665121f12d49))
* Color-coded type badges in the line dialog's item search ([eb118f5](https://github.com/simpel/bibi/commit/eb118f5b203bc31da25c7c7d6b9f7c9d9e9f8fb1))
* Colour-coded money totals, labelled estimates instead of ≈ ([0b7433e](https://github.com/simpel/bibi/commit/0b7433e71dd3bcda293f22a84852f3fac6cc5db1))
* Contact per organization, opening hours and a booking sheet on the calendar ([5d7a7a6](https://github.com/simpel/bibi/commit/5d7a7a60e9b1c69fc2018abb3830e42c5e9abed9)), closes [#486](https://github.com/simpel/bibi/issues/486)
* Create a status with a name and colour only, and drop the column colour ([a2f7360](https://github.com/simpel/bibi/commit/a2f73605d43602b9bd10507fd12232a40bca0b9c)), closes [#492](https://github.com/simpel/bibi/issues/492)
* Dashboard with pipeline value, won/lost history, money and utilisation ([3af6b9b](https://github.com/simpel/bibi/commit/3af6b9b7449620574d6221e17dd9b9f64e8ebb97))
* Data dashboards with a kept header, a view switcher and pending states ([b42ac55](https://github.com/simpel/bibi/commit/b42ac551a2e3ac02cad0d5310ae7ba8a9a90ae87))
* DataTableRowActions is the only row actions component ([e3ac6e1](https://github.com/simpel/bibi/commit/e3ac6e1000d19f8c820f30a93d7913fb8a70a4b7))
* Day snapshot sits on a white card wherever it is shown ([8fd5f36](https://github.com/simpel/bibi/commit/8fd5f3696a4196d7bdbf2c639da2b4857974bb50))
* Day value as a bar under the date in every calendar zoom ([86b64f2](https://github.com/simpel/bibi/commit/86b64f2113d190ff1181584faacd59722a62c1cd))
* Exact pipeline totals in a shared MoneyTotals component ([2449a5f](https://github.com/simpel/bibi/commit/2449a5ff9f19032035c19d1a5d40c63cc1b8cc07))
* Financials accounts table and page layout ([ebe18a6](https://github.com/simpel/bibi/commit/ebe18a64cf0db8e5e1ee2fbbcc7ffdd30c2bf6c3))
* Financials KPIs on MoneyTotals, replacing StatTile ([d576902](https://github.com/simpel/bibi/commit/d5769026e134b76a475662e030250af049ab7b4b))
* Financials page, accounting settings and incremental SIE 4I export ([a373297](https://github.com/simpel/bibi/commit/a373297a245e5448a57943e8ac20b1f49eda32be))
* Fold calendar asset groups open and closed ([0bd8c1f](https://github.com/simpel/bibi/commit/0bd8c1f162e0267c76557f9a657a04e1623b318c))
* Gray day bookings per item, unit price and Remove in the intake review ([c3e4a4b](https://github.com/simpel/bibi/commit/c3e4a4bbb8493639a22f4beab162942fdac592fa))
* Intake step actions, a paste dialog, Back and Next, and a calendar dialog ([1207247](https://github.com/simpel/bibi/commit/12072475281ff6ab38c3a306f6b1cb8f63cb7975))
* KeyFacts labels sit under the values and the pinned card's values open the order ([56039f5](https://github.com/simpel/bibi/commit/56039f57a75d344f05411c07c7b98a0ddc0fd9cc))
* large KeyFacts keeps its light value and a clearer preheader ([53aea1a](https://github.com/simpel/bibi/commit/53aea1a783f5f197a992701b70792eae2a532195))
* large KeyFacts values use a regular weight ([334d831](https://github.com/simpel/bibi/commit/334d8313e4208a5e7d0beed8c667370336432df1))
* Leave a new status off the board until staff drag it onto a column ([871a2ea](https://github.com/simpel/bibi/commit/871a2ea8e6bcee30928cb7d186f03121fc3be127)), closes [#446](https://github.com/simpel/bibi/issues/446)
* Line costs and a total in the intake review ([2d622f2](https://github.com/simpel/bibi/commit/2d622f20022171084e1e7bff573cac78793a9a9e))
* missing-time stripes use the warning color ([366dfa3](https://github.com/simpel/bibi/commit/366dfa3f78a7180863a00068ffeba2a3aa696160))
* move platform admin to /mothership and add an /admin hub ([ad27763](https://github.com/simpel/bibi/commit/ad27763d939fefd9400f763776a12feddefb734b))
* Never bold headings and enlarge the H1 ([86f5670](https://github.com/simpel/bibi/commit/86f5670e983144ecda4327535e7ef37418aa4103))
* New ticket intake page with who, when and package steps ([130a1ac](https://github.com/simpel/bibi/commit/130a1acbcae80af8748cb97ba53d71393153dcac))
* Nordic Manor design tokens and a rename-app codemod ([#415](https://github.com/simpel/bibi/issues/415)) ([eed4708](https://github.com/simpel/bibi/commit/eed47083e9355714c7ef4d605a27eb7c35eb7e51))
* Notifications and the inbox are one inbox-style table, and opening a row shimmers while it is marked read ([ef83b41](https://github.com/simpel/bibi/commit/ef83b419ff894038f78d96390a3595ef8f0ec5ad))
* One dashboard with Financials and Workload tabs and trend stat cards ([7a47acb](https://github.com/simpel/bibi/commit/7a47acb477a5c5c498df1e0bf79313b44b09d41a))
* One date and date-range picker across the app ([25ad284](https://github.com/simpel/bibi/commit/25ad284ec009803a478ba50694a4ee6aeb8e5d8c))
* One-page ticket intake with review, line dialog and Create ([eaeca9a](https://github.com/simpel/bibi/commit/eaeca9a381261dec8bcfff493f2bb209af638e52))
* order calendar joins the program table and stripes lines missing a time ([3c182bd](https://github.com/simpel/bibi/commit/3c182bdbd23a08b865e404d5165e03c1e2f8a438))
* People's names open their contact card everywhere, and the customer links to its page ([b9741be](https://github.com/simpel/bibi/commit/b9741bee2e0d8d361118fe5c31a1925497a83e35))
* pinned booking cards show booking and order details with a clearer value ([ad69587](https://github.com/simpel/bibi/commit/ad69587d481fae0c75cf5a47728955c80089eb96))
* pinned card shows guests once and the day above the time ([c682cb8](https://github.com/simpel/bibi/commit/c682cb8a19937a1b92fcc5cc2e225ca3b1c91c8b))
* pinned cards use mini stats and linked names ([2792804](https://github.com/simpel/bibi/commit/2792804c0abb10f493e4619f599dab7422178b89))
* Put statuses without a column in a far-left column and turn the columns with GSAP ([2974a37](https://github.com/simpel/bibi/commit/2974a376d8da3bbe8606e5377f8a6ce010b096de)), closes [#446](https://github.com/simpel/bibi/issues/446)
* RelativeTime component with an exact-time tooltip ([#471](https://github.com/simpel/bibi/issues/471)) ([6b4bed6](https://github.com/simpel/bibi/commit/6b4bed6e8ec1a6f94e71acc8aa5239a0bd4b694c)), closes [#426](https://github.com/simpel/bibi/issues/426)
* Right-click menus on notification and inbox rows ([11bdd81](https://github.com/simpel/bibi/commit/11bdd815bd94dbc5bfd974ee0f9ff1efada8b531))
* Row action menus are dots only and primary actions are buttons beside them ([f54c9be](https://github.com/simpel/bibi/commit/f54c9be1fffce4cd2f354f75dcb3b691d071e7b4))
* Row actions stick to the table's right edge and show icons only on narrow tables ([3fe3603](https://github.com/simpel/bibi/commit/3fe36033662a8182c8a436fba62be30aaa268506))
* Search button shows a spinner and is disabled while a search runs ([89ae0ef](https://github.com/simpel/bibi/commit/89ae0efbe63b1ba319099897a9660123d64e91c2))
* show wordmark on auth pages and dev switcher on empty database ([#421](https://github.com/simpel/bibi/issues/421)) ([93a29ca](https://github.com/simpel/bibi/commit/93a29ca51e5798b6ae7cb9e088382153c4db7c83))
* small KeyFacts puts labels under the values ([aeabd14](https://github.com/simpel/bibi/commit/aeabd14aa8cdf55a30f777256767cbd0ba8bcb8e))
* Stripe connects on Settings → Integrations, with Stripe and Fortnox branding ([506f4f4](https://github.com/simpel/bibi/commit/506f4f4511ce86685278033834055d6a11a318a1))
* Table row actions are a labelled button, bare dots only on the board ([c7639e9](https://github.com/simpel/bibi/commit/c7639e99dc36848dcfb2c27b914fa1426e9f09c8))
* The bell wiggles when a new notification comes in ([03f4a30](https://github.com/simpel/bibi/commit/03f4a308d300d0ff0c9c10a1ca13edd90cbe5b76))
* The line dialog searches bookable items full width, and both item pickers show the list price ([2815f9d](https://github.com/simpel/bibi/commit/2815f9db6020bb012470a6a5ddd964be5ee3e103))
* Ticket page with issue alerts, line amounts and the day in the calendar ([a67d28a](https://github.com/simpel/bibi/commit/a67d28a90b2e0cc7ae769dc87d2c65661c577882))
* Ticket value estimates, money display format and profile and consent rework ([1dc0b7b](https://github.com/simpel/bibi/commit/1dc0b7bf41203a24c33d286a6c61f5f4b7666c2f))
* Working hours per organization, people as calendar rows and the whole ticket in the booking sheet ([14e89a8](https://github.com/simpel/bibi/commit/14e89a8ca201df4316987f118adb5cac9fce8115)), closes [#449](https://github.com/simpel/bibi/issues/449)


### Bug Fixes

* Badge follows shadcn's base, so icons are small ([ab3f9e5](https://github.com/simpel/bibi/commit/ab3f9e5806401d54705c786a0dc752e7c5f10f9d))
* Green CI: no barrel re-exports, fixtures keep their references ([c27c0bf](https://github.com/simpel/bibi/commit/c27c0bf93040f152c4838b0f1809af5a679b1358))
* lint and structure checks pass after the rename ([9c0c465](https://github.com/simpel/bibi/commit/9c0c46566b7e37c8db49c7df08e478e87dc7bdb3))
* Mark the Calendar as a client component ([227a371](https://github.com/simpel/bibi/commit/227a3716957e2844d5354b91c04b5e833b40ce90))
* missing-time label centered on a solid chip ([f43b9a1](https://github.com/simpel/bibi/commit/f43b9a139c676d117cbd4c68119b9907b5defb69))
* Stat card tooltip above the card's text ([362d46b](https://github.com/simpel/bibi/commit/362d46bc2168f8d67f8a3ff9fc494371fb391a99))


### Performance Improvements

* fast page loads (ADR 0097) ([291d945](https://github.com/simpel/bibi/commit/291d9459c9fb798e2eea115802c6b86f125020a8))


### Dependencies

* The following workspace dependencies were updated
  * devDependencies
    * @bibi/config bumped to 0.2.0

## Changelog

Generated by release-please from Conventional Commits (ADR 0060). Do not edit by hand.
