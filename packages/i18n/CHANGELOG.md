# Changelog

## [5.0.0](https://github.com/simpel/bibi/compare/@bibi/i18n-v4.1.0...@bibi/i18n-v5.0.0) (2026-11-27)


### ⚠ BREAKING CHANGES

* an order's customer is fixed at creation, and the order page is regrouped

### Features

* a choice field from a list offers Create value, which adds it to the list and selects it ([0792faa](https://github.com/simpel/bibi/commit/0792faad0244e2d51bb5461985b6a8a13b77c3d5))
* a closed order is read-only ([d55f67a](https://github.com/simpel/bibi/commit/d55f67a76bdfc57bb7a72c2ca2fae4430724c620))
* a confirmed proposal says it is done, with Continue setup ([837167b](https://github.com/simpel/bibi/commit/837167b405fdaa714ff4671e1644fe9a5456b3aa))
* a crash in the root layout shows Bibi's own error page ([7694475](https://github.com/simpel/bibi/commit/76944750eb36a9b0e7cef9bc14d507fb80af22ca))
* a danger area at the bottom of the task page is the only place to archive it, and the note leads the page ([48ce7da](https://github.com/simpel/bibi/commit/48ce7da15d97939685904edda9fc1a0b79f96883))
* a line's missing time and open choice show in amber stripes and are filled in Edit line ([3b3b94c](https://github.com/simpel/bibi/commit/3b3b94c10efb00ec647b43020fd37215d1a59f59))
* a split choice warns while typing when it places more than the line is for ([c41ab21](https://github.com/simpel/bibi/commit/c41ab2113c8a469fc628e1e87145e3ecbb2b52d0))
* a task needs only its type, has one due time and can prebook or book rooms ([c2e99cf](https://github.com/simpel/bibi/commit/c2e99cf8e49b8e56d093a0d3ddc36be10e69dc22))
* a task's Add to order finds orders as you type and joins Create order in its menu; Mark as done shows its label first ([f1bb52b](https://github.com/simpel/bibi/commit/f1bb52bc1a733b827edafe32c05f96ca8f9903e2))
* a task's note comes first, and Add to order is its primary action with Create order in the menu ([ae1263c](https://github.com/simpel/bibi/commit/ae1263cbacba44b6ecdf634bb2ae46df936d6f83))
* a task's note reads big in sans, beside a Related column with Add ([2543126](https://github.com/simpel/bibi/commit/25431264d8128829b6b9cf4733c8f9d936faf488))
* admins edit the inbox address and get forwarding steps ([e06d0c7](https://github.com/simpel/bibi/commit/e06d0c7c58ebb29cb4a1989c20e3e350a9959e64))
* an item's occupancy has Upcoming and Past tabs, upcoming first ([5cc582f](https://github.com/simpel/bibi/commit/5cc582fc63d0a10f2dab7e7273d5275b3fe19cdd))
* an item's working hours show its week with an Own hours switch, and its key facts read like an order's ([19bbd9b](https://github.com/simpel/bibi/commit/19bbd9b5de9d6ce92aa97705a98c65937d449c9d))
* an order's customer is fixed at creation, and the order page is regrouped ([ccb1583](https://github.com/simpel/bibi/commit/ccb1583991892dc81cec61139a5a494ff81d60b8))
* archived records are restored, deleted for good and purged after a retention period ([e8fa178](https://github.com/simpel/bibi/commit/e8fa178ee30efb0ee1f235a070b8c0e7fcb30a26))
* board cues, hours check, help hints and follow controls ([dec5f73](https://github.com/simpel/bibi/commit/dec5f733332cdff5918d02193312a3dd20440065))
* card issues are error and warning badges in words, state is the first stat ([1540c50](https://github.com/simpel/bibi/commit/1540c50bfae425bd022d7feff4eabce2ad7ea45f))
* cards show issues as an error icon or a warning triangle, not a striped outline ([3ec59a9](https://github.com/simpel/bibi/commit/3ec59a980801c0b7df237ba40ec39b87254b5650))
* cards wash their header in the status colour, show the order number as a stat and stripe the outline when there is an issue ([9bb8080](https://github.com/simpel/bibi/commit/9bb80808915a990944c3f13d0b01612badb20d57))
* comment icons, unread dots, replies and mentions ([816137d](https://github.com/simpel/bibi/commit/816137db95fd648425dad04e46d5b466a745f89f))
* comments on orders and lines, shown on run sheets ([17ade2e](https://github.com/simpel/bibi/commit/17ade2eee0544984a4a4c92c92bbdb90b743e994))
* create an item type from the item create page; catalog setup in the sidebar ([70a67aa](https://github.com/simpel/bibi/commit/70a67aa639a73745e1ceb5673b543b04f6810171))
* customer types carry business or private, and private customers get an optional personal identity number ([2da90a7](https://github.com/simpel/bibi/commit/2da90a7dc966bd86542206a3fc6746bee93b5f5a))
* dining rooms, sittings, exceptions, table combinations and the booking page can be set up on every surface ([575068e](https://github.com/simpel/bibi/commit/575068e132e3822e798643539024d4357523037e))
* each connected integration has its own settings page with its accounts and the way to disconnect ([40d4f96](https://github.com/simpel/bibi/commit/40d4f96704edb1e64cadc12eb9079858125720fb))
* edit values on the assistant's confirmation card ([dbdaeca](https://github.com/simpel/bibi/commit/dbdaecacf4dac8f5c8c2bcbb8bc2902240e77252))
* every icon button has a tooltip saying what a click does ([7852d2b](https://github.com/simpel/bibi/commit/7852d2bd787292240183201526b9a51ccf59aea5))
* every record with a page is archived only from its danger area ([9380077](https://github.com/simpel/bibi/commit/93800774a8ceafeea21918174c8d1757d5c2c6f8))
* guests book, change and cancel tables on the restaurant's own page, and staff switch table booking on from the room ([c64a86c](https://github.com/simpel/bibi/commit/c64a86c7f840e75c0e86665368346456ccdbf6d8))
* guests count kitchen needs on the booking page against the lists the restaurant picks ([ae868ef](https://github.com/simpel/bibi/commit/ae868eff593fde5335c564de01f09bfdb884c22e))
* item details and working hours edit one fact at a time, with round corner pencils ([d176c00](https://github.com/simpel/bibi/commit/d176c00d6ae4bac056e536ead14ac4a1747604d0))
* items get a Lucide icon or an image, and the package step compares each package with the request ([9b86f64](https://github.com/simpel/bibi/commit/9b86f643a9485528f910815951b2f30fcc215c4c))
* My work has a search box, and card headers edge in their status colour ([0019ce4](https://github.com/simpel/bibi/commit/0019ce41c39d2face9332f44a15cbc5f359080d3))
* My work in Today, This week, Next week and Later, reading on as you scroll ([25c8641](https://github.com/simpel/bibi/commit/25c86415a0eb1fe6dedf127ebb8930619dc200e4))
* My work is a timeline of order cards with a shared card tone ([d21c3e6](https://github.com/simpel/bibi/commit/d21c3e646d27b1c5b01f25088b2b46b6d304a7c0))
* My work is a timeline of order cards with a shared card tone ([1a8dcaa](https://github.com/simpel/bibi/commit/1a8dcaa62758b0fb411a8a6eb87b5d1872b50d5d))
* My work opens with Needs you, the tasks the member must act on ([0741372](https://github.com/simpel/bibi/commit/074137279bafff113c6fa31a34687150f4c65f40))
* notifications open in a panel on the right, with Needs you on top and dismissable ([597ea74](https://github.com/simpel/bibi/commit/597ea740e59b98200ff8e7471c164a9ed08a2236))
* order and item pages drop the side panel for Customer and Details tabs, and rooms leave setup to their layouts ([9c51e6f](https://github.com/simpel/bibi/commit/9c51e6fc2251d6d60648983368768b99c4239901))
* order versions, restore and the superseded quote ([be41d10](https://github.com/simpel/bibi/commit/be41d106acf7e29722e76bcb17f6184ae11cb40c))
* packages get their own permission and leave the administration area ([eaf769d](https://github.com/simpel/bibi/commit/eaf769d70d2635634b3a75a6e218205e25b8e5fb))
* pipeline views are personal and shared with members or the organization ([58b0836](https://github.com/simpel/bibi/commit/58b083669fff4453d519e06424ab2f38d010b6c5))
* restaurants take table reservations from staff, the assistant and guests, and the start page tells that story ([4314d17](https://github.com/simpel/bibi/commit/4314d175751b1fd30d2492ca73c609aaeeda9a84))
* Saved views above Orders, Run sheets and My work ([21ea9de](https://github.com/simpel/bibi/commit/21ea9dee7b5759b8942e52d9b11bd7756f0cef7f))
* show a thank-you page after paying for a plan in Stripe Checkout ([acc5f55](https://github.com/simpel/bibi/commit/acc5f555b1731b1172a4ad7472fac435022ed403))
* tasks around a customer, before or beside an order (ADR 0117) ([0ebbfdc](https://github.com/simpel/bibi/commit/0ebbfdc0ab36b63d5817e0de780bf50f7d45dda3))
* texts for the account mappings and the integration settings page ([6ab39ce](https://github.com/simpel/bibi/commit/6ab39ceddfd81ca433d30b08bfea680ce3b04aac))
* the 404 and 500 pages get the wordmark, a large status figure and a way onward ([b8b4d33](https://github.com/simpel/bibi/commit/b8b4d330c6b7eca579c519c1ab4a099b453b0702))
* the command bar searches with prefixes and lists every page and create action ([1f3f526](https://github.com/simpel/bibi/commit/1f3f526b688b01d7852994958e7b0682afbfad14))
* the database holds dining rooms, sittings, table combinations, reservations and table holds ([3191e2b](https://github.com/simpel/bibi/commit/3191e2b6c95f81600847d8a9670a489e4029cd85))
* the item page has tabs like the order page, with its details in a side panel ([044eecf](https://github.com/simpel/bibi/commit/044eecfaee7b14adf11202afa100bccab1bbc024))
* the item page is edited in place, with its picture beside the name and a pencil on each layout ([afab75c](https://github.com/simpel/bibi/commit/afab75c20c121f1880b35e40258708fd7d3759d1))
* the item page leads with editable stat cards and Create order, and edits one setting at a time ([87e220a](https://github.com/simpel/bibi/commit/87e220a5f32147d83fda525c9e82ecd45375f3db))
* the new order page refuses a date or start time that has passed ([9560d40](https://github.com/simpel/bibi/commit/9560d4068dacbb78c526956b6d6d8f76038ace77))
* the order is edited in place, and its money sections stand apart ([3c5435d](https://github.com/simpel/bibi/commit/3c5435d5f6e4b21846dd5d3f10d1ac7abd694103))
* the order page opens in tabs beside a facts panel ([a5738a7](https://github.com/simpel/bibi/commit/a5738a760b0b6383517b04280c28e6d51e481c19))
* the order page shows your Needs you tasks with what to do ([0c1fdbb](https://github.com/simpel/bibi/commit/0c1fdbbd930c2c3f1a57e01f702f9c27636a5f09))
* the order's key facts show the quoted sum, linking to the renamed Quote & payments tab ([71956be](https://github.com/simpel/bibi/commit/71956be641d2c33f9f9665f87f29c86899041611))
* the order's versions open from a Versions button and the quote pill under Program ([b518686](https://github.com/simpel/bibi/commit/b5186863332ed64801a638a1bb49f7acaed3b6f3))
* the quote shows where it stands in a next-step card, and a replaced version can be set as current ([6f09500](https://github.com/simpel/bibi/commit/6f095001e6c8207852f1fcc4e41cc154130b732c))
* the Run sheets tab warns when a run sheet is unsent, changed or blocked ([f657e40](https://github.com/simpel/bibi/commit/f657e40a57c6614fe669de06dde2fd14fc0ef949))
* the sidebar collapses to icons with tooltips and a red dot on Inbox ([4df3a79](https://github.com/simpel/bibi/commit/4df3a7911287f1d0148706f67ec6a9ac53d03580))
* the sidebar counts down the free trial and leads admins to pick a plan ([5b9ffdb](https://github.com/simpel/bibi/commit/5b9ffdb3daedac34a2e11e2c0577f97738b651d7))
* the sidebar's My work entry counts the Needs you tasks due now ([387544f](https://github.com/simpel/bibi/commit/387544f5d59b4e7c0d5e6bdaafd57aadee4f55fc))
* the start page tells four stories, meetings, the restaurant, your lists and the assistant ([40112d2](https://github.com/simpel/bibi/commit/40112d2616b4bb9654c186beb59db86eee01c3a8))
* the welcome flow skips working hours; members set them on their profile ([055c2a0](https://github.com/simpel/bibi/commit/055c2a035d8c5832f08f3b4feb1b4c53ecebcbf9))


### Bug Fixes

* a task is marked done from a header button, like Follow, not a check before its title ([f1c6d18](https://github.com/simpel/bibi/commit/f1c6d181c2cbc7f04e2e72c1f662d97ae7c8a6b3))
* an item's needs are called resources and staff, so Swedish no longer says Behov for two things ([17784b9](https://github.com/simpel/bibi/commit/17784b9f1afdd5d17d845574bc8fe6b1b792b2c6))
* Follow shows an eye to follow and a crossed-out eye to stop ([a02fcf7](https://github.com/simpel/bibi/commit/a02fcf70cfd7c9c829dfbf8beca9d302b6b7f51e))
* Follow shows an open eye while following and a crossed-out eye otherwise ([fb2b710](https://github.com/simpel/bibi/commit/fb2b71004a71455addce83779f84c072ed0ccb11))
* Follow uses an eye, and tasks due today or soon get an amber icon ([43f3873](https://github.com/simpel/bibi/commit/43f387369936fc52cf41255df6a69ce3b749c634))
* removing a member leaves no assignments, follows or views behind ([d645625](https://github.com/simpel/bibi/commit/d645625957235b6e7317698d2b2563c4de77df24))
* requirements are called Requirements everywhere in English ([2e8661d](https://github.com/simpel/bibi/commit/2e8661d2748b73d0fc0630ccf42e69c74e1833e6))
* the notification panel search says Search notifications ([856177e](https://github.com/simpel/bibi/commit/856177e30d22bda43b4c6efe41631069f1896c55))
* the order header's comment button goes to the Comments section ([69de0f9](https://github.com/simpel/bibi/commit/69de0f92bc2ede208442bea1327b70ddd18f0b28))
* the requirement dialog picks a list, then its value, and says when setup is missing ([75f5feb](https://github.com/simpel/bibi/commit/75f5febc6f8881bf31e2b114ae125bf83006de00))
* the sidebar's Catalog keeps only daily work; types, lists and price lists stay in administration ([5f61748](https://github.com/simpel/bibi/commit/5f6174821764ce933bde1771ed8c203a98a36d05))
* the task's danger area sits in the main column, and Related reads Relaterat in Swedish ([82c77d1](https://github.com/simpel/bibi/commit/82c77d1cd1389902569b97cfeb92737e75575267))
* upgrade Next.js from 16.4.2 to 16.4.6 for a security advisory ([fbc7ad7](https://github.com/simpel/bibi/commit/fbc7ad752db6bed0f4a0db147a40114635b27e68))


### Dependencies

* The following workspace dependencies were updated
  * devDependencies
    * @bibi/config bumped to 1.1.0

## [4.1.0](https://github.com/simpel/bibi/compare/@bibi/i18n-v4.0.0...@bibi/i18n-v4.1.0) (2026-11-15)


### Features

* a connected provider card shows only its status, company and actions ([12390a2](https://github.com/simpel/bibi/commit/12390a2e882ad929505a9d5e7eede9ad463b458d))
* a free calendar slot opens a dialog to create an order from it ([884054a](https://github.com/simpel/bibi/commit/884054a26f58e6760de24992d08cf9be3b39f7ab))
* a provider card and the Swish dialog link to the provider's own guide under How to connect ([e92e56b](https://github.com/simpel/bibi/commit/e92e56b91bc19d542de8b5ada3167b2e1fe6d67d))
* a provider card says when the company is not ready to connect, and shows reconnect only when the connection is lost ([8feeaec](https://github.com/simpel/bibi/commit/8feeaec5175190de64a200479f78b7c715b67c18))
* How to connect opens a guide with what each provider needs first ([7c6bddb](https://github.com/simpel/bibi/commit/7c6bddbf3f7527d388aeba240034dfeeb3c20c3f))
* My work is the start page, the assistant moves to /assistant ([#533](https://github.com/simpel/bibi/issues/533)) ([8b66a4f](https://github.com/simpel/bibi/commit/8b66a4fb45e49e383b0674a428cb5f2120c70c47))
* one accounting system at a time, an account check at the provider, and Integrations grouped by purpose ([ff39f82](https://github.com/simpel/bibi/commit/ff39f821a550af566e0d9992d19d441f1aa12647))
* one default revenue account row, and payment routes only to connected services ([5c744cf](https://github.com/simpel/bibi/commit/5c744cf6a04e99518fc981bff572a69de70fe2be))
* revenue accounts per item type open from the name, with a menu to set the default and a Default badge ([53c011e](https://github.com/simpel/bibi/commit/53c011e04a3b8bcff062de079e3c6f4394402877))
* the demo seed leaves its fake providers disconnected, and a provider card says what it can handle ([6e6069b](https://github.com/simpel/bibi/commit/6e6069bce9bf517715c2e239e3442324b6ff1d92))
* the front page hero drops its badge ([a58781a](https://github.com/simpel/bibi/commit/a58781ade8fda7da4073b20be7f66d91d6002ccb))


### Bug Fixes

* Visma eEkonomi is named Spiris and its hosts come only from env ([87caa43](https://github.com/simpel/bibi/commit/87caa4337d9eed9c269fc2fc1c76ded14259b6d9))


### Dependencies

* The following workspace dependencies were updated
  * devDependencies
    * @bibi/config bumped to 1.0.0

## [4.0.0](https://github.com/simpel/bibi/compare/@bibi/i18n-v3.0.0...@bibi/i18n-v4.0.0) (2026-11-12)


### ⚠ BREAKING CHANGES

* invoices and credit notes no longer carry number or voidPending, and accountingSettings no longer has the SIE-only accounts or fiscalYearStartMonth.

### Features

* Visma books prepayments and their deductions on customer advances ([03aa6b2](https://github.com/simpel/bibi/commit/03aa6b20efbd9eeba3aa3a27ace81859558f07e5))


### Bug Fixes

* a connection the server cannot use shows Unavailable, not Connected ([b8aae04](https://github.com/simpel/bibi/commit/b8aae04a1bddc1d6735495dea159a58f9a390c94))


### Code Refactoring

* drop Bibi's own document numbers, the void retry and the SIE export tables ([5baa33b](https://github.com/simpel/bibi/commit/5baa33bda035e9db22a75323638da60fa421d94d))

## [3.0.0](https://github.com/simpel/bibi/compare/@bibi/i18n-v2.0.0...@bibi/i18n-v3.0.0) (2026-11-12)


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

* Swedish plural-name label no longer contains "Namn" ([936b440](https://github.com/simpel/bibi/commit/936b44012c26657f4075c370e2fc3c49691b37b8))

## [2.0.0](https://github.com/simpel/bibi/compare/@bibi/i18n-v1.5.0...@bibi/i18n-v2.0.0) (2026-11-11)


### ⚠ BREAKING CHANGES

* setup.* and setupLayout.* are replaced by layout.* on GraphQL, REST and MCP; lines, previews and templates take layoutId instead of setupId; items take maxPeople instead of setups.

### Features

* item type groups, with a tab per group on /items ([e717e88](https://github.com/simpel/bibi/commit/e717e8846deb77faf1166399c3303e784b879fa1))
* rooms have layouts instead of shared setups, with a people limit and emergency exits ([cb33bdf](https://github.com/simpel/bibi/commit/cb33bdf6dbad9ecd6c602781e7dc5b5bde4232b2))
* several layouts per setup, doors and windows on walls, floor plan split from layouts ([1712a9d](https://github.com/simpel/bibi/commit/1712a9d04b2bd12d51b198af3d503007705104db))
* several layouts per setup, doors and windows on walls, floor plan split from layouts ([1273331](https://github.com/simpel/bibi/commit/127333165e43e9e9fb0ef1fbe8722a3255bf0ab7))


### Dependencies

* The following workspace dependencies were updated
  * devDependencies
    * @bibi/config bumped to 0.4.0

## [1.5.0](https://github.com/simpel/bibi/compare/@bibi/i18n-v1.4.0...@bibi/i18n-v1.5.0) (2026-11-09)


### Features

* draw rooms of any shape on the floor plan ([#511](https://github.com/simpel/bibi/issues/511)) ([77e9225](https://github.com/simpel/bibi/commit/77e922584a05c33210a516d6a0ec035fbfe183f1))

## [1.4.0](https://github.com/simpel/bibi/compare/@bibi/i18n-v1.3.0...@bibi/i18n-v1.4.0) (2026-11-07)


### Features

* admin lists are full data tables and the admin sidebar searches every setting ([4528c37](https://github.com/simpel/bibi/commit/4528c376fa4663b39db4d916ea41acd3fedc9f1f))
* admin pages are sections with sidebar anchors, no tabs ([0e5dcba](https://github.com/simpel/bibi/commit/0e5dcbae6a1eee4be2504ba0760557b507d7532c))
* administration area with its own sidebar replaces the settings hubs ([caef1fd](https://github.com/simpel/bibi/commit/caef1fdd1589443e6f4597f8312d1ca6fb7e708b))
* the payment operator is stored, and empty admin sections stay off the page ([3645afe](https://github.com/simpel/bibi/commit/3645afe91e52627dedc7202ef7d6ae549cfb28b6))


### Bug Fixes

* admin page titles and breadcrumbs match the sidebar ([64f873d](https://github.com/simpel/bibi/commit/64f873da10185173f5cb5b5d51fe0e55f3993115))
* admin sidebar sub-links and page sections match one to one ([f2f7f20](https://github.com/simpel/bibi/commit/f2f7f208fd9294842e9a33c8e14c7cd344bcbcaa))

## [1.3.0](https://github.com/simpel/bibi/compare/@bibi/i18n-v1.2.0...@bibi/i18n-v1.3.0) (2026-11-06)


### Features

* create an order from the pipeline board's entry column ([b2bb99d](https://github.com/simpel/bibi/commit/b2bb99d524887bddd2db053e59d5e734cebc09ce))
* magic link is the only sign-in, passwords removed ([105ae06](https://github.com/simpel/bibi/commit/105ae068a0e194cf2bc6afcbe7248e9f4f4ff890))
* new organizations start with example orders and the base types to create orders ([2e9e74b](https://github.com/simpel/bibi/commit/2e9e74b6e5291a5a317be4accdd1fadf722fcb63))
* setup review shows template statuses and states in the user's language ([a0a58c0](https://github.com/simpel/bibi/commit/a0a58c0a2306aa33a33d93762d126ee292948b35))

## [1.2.0](https://github.com/simpel/bibi/compare/@bibi/i18n-v1.1.0...@bibi/i18n-v1.2.0) (2026-11-06)


### Features

* public /support help centre and /developers, replacing /docs ([81936c0](https://github.com/simpel/bibi/commit/81936c02ffd771c5944c5a5e348233017d453796))


### Dependencies

* The following workspace dependencies were updated
  * devDependencies
    * @bibi/config bumped to 0.3.0

## [1.1.0](https://github.com/simpel/bibi/compare/@bibi/i18n-v1.0.0...@bibi/i18n-v1.1.0) (2026-11-05)


### Features

* drop the one-time code sign-in, magic link is the default tab ([88d2930](https://github.com/simpel/bibi/commit/88d29303159b97e12c83e5e5f5b1fb841a0961ee))
* public front page at /:locale for everyone, redesigned as a SaaS landing page ([c9d86af](https://github.com/simpel/bibi/commit/c9d86afbdb37649e7d5a91e9825c755c2f9cb996))

## [1.0.0](https://github.com/simpel/bibi/compare/@bibi/i18n-v0.1.0...@bibi/i18n-v1.0.0) (2026-11-05)


### ⚠ BREAKING CHANGES

* Inbox messages are read or unread for the team and can be deleted; dismiss is gone
* customisationGroups no longer carry allowExtras on GraphQL, REST and MCP.
* sheet.* and sheetDefinition.* operations, MCP tools, GraphQL fields, REST paths and the sheet permission feature are renamed with no aliases.
* Custom booking with its own build step in the ticket intake
* One-page ticket intake with review, line dialog and Create
* dashboard.summary takes { from, to } again, its comingUp is now scheduled and status tiles carry a trend; finance.overview gains trends.
* dashboard.summary has no from/to input and a new shape; finance.overview drops forwardBooked and gains outcomes.
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
* Add-ons in the ticket intake ([175e6ce](https://github.com/simpel/bibi/commit/175e6ce69bb8c25a0f913110234a7aee298227af))
* Add-ons on the ticket page, quotes, invoices and sheets ([c52f5b5](https://github.com/simpel/bibi/commit/c52f5b5a8b3e8648fda655e95cc6b49811388066))
* Allocation UI: Resources and Staffing lists with a prepicked unit ([#438](https://github.com/simpel/bibi/issues/438)) ([e4d121d](https://github.com/simpel/bibi/commit/e4d121dcae795435cc44b83dbb94a6b34ad694d4)), closes [#384](https://github.com/simpel/bibi/issues/384)
* Assignee column on tickets, search on a picked filter value, joined search field ([8b0115c](https://github.com/simpel/bibi/commit/8b0115c22a7a42c6a24a0282e7dee881d484d5ba))
* Availability calendar page on real data, with calendar.range as a view read model ([e57b967](https://github.com/simpel/bibi/commit/e57b967d3af299dff939fc8a80c45a04611b08df)), closes [#484](https://github.com/simpel/bibi/issues/484)
* Bibi subscription with a 14-day trial, seats and a payment gate ([6c25365](https://github.com/simpel/bibi/commit/6c25365a3b5487c55549cb921dc9c32815bed970))
* Calendar day values: booked, prebooked and still open per day ([a0886d8](https://github.com/simpel/bibi/commit/a0886d83f72668169bbf9efea6b7cdc0b0f11648)), closes [#485](https://github.com/simpel/bibi/issues/485)
* calendar URL as a date range and DST-safe columns ([21664c3](https://github.com/simpel/bibi/commit/21664c3a4f186f60dd9c5bcf68f9327b27320703)), closes [#428](https://github.com/simpel/bibi/issues/428)
* calendar.range core operation on all surfaces ([8c96256](https://github.com/simpel/bibi/commit/8c96256e6f3bf3cd4b047dc77d45d1626da3e63c)), closes [#430](https://github.com/simpel/bibi/issues/430)
* Choices step in the ticket intake with default options on package lines ([7161c26](https://github.com/simpel/bibi/commit/7161c26c254d8952d7da5db365d4b8fc00bf9a20))
* choose the time zone when creating an organization ([5a99c2d](https://github.com/simpel/bibi/commit/5a99c2d5aece8ac7c23a41d10b3f76fc2121e696)), closes [#427](https://github.com/simpel/bibi/issues/427)
* Connect an organization to Fortnox ([476dc85](https://github.com/simpel/bibi/commit/476dc85226f59bae46c953784b6b902354350735))
* Contact per organization, opening hours and a booking sheet on the calendar ([5d7a7a6](https://github.com/simpel/bibi/commit/5d7a7a60e9b1c69fc2018abb3830e42c5e9abed9)), closes [#486](https://github.com/simpel/bibi/issues/486)
* Contact required, booking notes and package guest ranges ([b7eec2f](https://github.com/simpel/bibi/commit/b7eec2f27e2ad4094a7ce101e70d0b8a9bcd4bda))
* Create a status with a name and colour only, and drop the column colour ([a2f7360](https://github.com/simpel/bibi/commit/a2f73605d43602b9bd10507fd12232a40bca0b9c)), closes [#492](https://github.com/simpel/bibi/issues/492)
* Custom booking with its own build step in the ticket intake ([bc123d6](https://github.com/simpel/bibi/commit/bc123d6eebcbb4bd07cdb70424d83c8cf2aa84aa))
* Customisations on any item with a price effect ([#414](https://github.com/simpel/bibi/issues/414)) ([a573ac4](https://github.com/simpel/bibi/commit/a573ac490c7827730a8c964b4c95fb5cb1cc97a0)), closes [#382](https://github.com/simpel/bibi/issues/382)
* Dashboard looks ahead, Financials looks back ([c605182](https://github.com/simpel/bibi/commit/c60518212594487571a0352b3791cbc65835b64a))
* Dashboard with pipeline value, won/lost history, money and utilisation ([3af6b9b](https://github.com/simpel/bibi/commit/3af6b9b7449620574d6221e17dd9b9f64e8ebb97))
* Data dashboards with a kept header, a view switcher and pending states ([b42ac55](https://github.com/simpel/bibi/commit/b42ac551a2e3ac02cad0d5310ae7ba8a9a90ae87))
* Day value as a bar under the date in every calendar zoom ([86b64f2](https://github.com/simpel/bibi/commit/86b64f2113d190ff1181584faacd59722a62c1cd))
* Deposit rule and invoice provider settings, deposits with a payment link ([703f10f](https://github.com/simpel/bibi/commit/703f10ff2e41be37b10fcd389ad9139269cb79c5))
* Derived warnings on line reads for unfilled optional demands ([#458](https://github.com/simpel/bibi/issues/458)) ([7ce69ac](https://github.com/simpel/bibi/commit/7ce69acaefaf5254893308e2fd4b4a942d274438)), closes [#385](https://github.com/simpel/bibi/issues/385)
* Dev menu sends a test inbox message, and its sends no longer toast ([53b4d18](https://github.com/simpel/bibi/commit/53b4d1899fca2266a121db7db9ab99a20d55817f))
* Dev menu sends the signed-in member a test notification ([72cc148](https://github.com/simpel/bibi/commit/72cc1487e8ce076a14dcbd83df94435dde60feb9))
* Disconnect Stripe, and integrations as a grid of provider cards ([763c374](https://github.com/simpel/bibi/commit/763c374c354aad58e80b46dc999880db34bf67a3))
* Draft a ticket from a message with the assistant ([0d6bb9f](https://github.com/simpel/bibi/commit/0d6bb9f6d0aa98edd8dd5a415f0c4487ba971ecf))
* Exact pipeline totals in a shared MoneyTotals component ([2449a5f](https://github.com/simpel/bibi/commit/2449a5ff9f19032035c19d1a5d40c63cc1b8cc07))
* Expand a bundle into a bundle line and part lines, with per-rate VAT ([#413](https://github.com/simpel/bibi/issues/413)) ([1c19970](https://github.com/simpel/bibi/commit/1c199703666927018c90d11698bc859636ee0140)), closes [#381](https://github.com/simpel/bibi/issues/381)
* Filter suggestions while typing in the tickets search ([c3986c2](https://github.com/simpel/bibi/commit/c3986c210e62fab211401be9ee60ac5fddc1569e))
* Financials accounts table and page layout ([ebe18a6](https://github.com/simpel/bibi/commit/ebe18a64cf0db8e5e1ee2fbbcc7ffdd30c2bf6c3))
* Financials actions beside the heading, custom span and customer filter ([6457a28](https://github.com/simpel/bibi/commit/6457a28681027c5de19b4e1e4449e84c24b3c69f))
* Financials page, accounting settings and incremental SIE 4I export ([a373297](https://github.com/simpel/bibi/commit/a373297a245e5448a57943e8ac20b1f49eda32be))
* Find similar customers and create a customer with its first contact ([24089d1](https://github.com/simpel/bibi/commit/24089d11b9f3f7f4951619d6f1c15ff65d0e62d4))
* Free status movement by default, admin-only flow and board views ([f8833c5](https://github.com/simpel/bibi/commit/f8833c524658d9bdbd30b1eb328c3bd818103e48))
* Gates on status transitions replace the status flags ([f1d23d5](https://github.com/simpel/bibi/commit/f1d23d52c6f1c9aa91a348e8bd5152f0b6f090da)), closes [#447](https://github.com/simpel/bibi/issues/447)
* GitHub-style filters in the tickets search ([75602a3](https://github.com/simpel/bibi/commit/75602a3cf225fdbe255c9a6a9259b762f0564045))
* GitHub-style people and customer search in the tickets filter ([77c11af](https://github.com/simpel/bibi/commit/77c11af17793017fcd1b34c48bb46d45d65af5af))
* Gray day bookings per item, unit price and Remove in the intake review ([c3e4a4b](https://github.com/simpel/bibi/commit/c3e4a4bbb8493639a22f4beab162942fdac592fa))
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
* Keep send, void and refund dates and add the finance permission ([23489ed](https://github.com/simpel/bibi/commit/23489ed75312725e87ed997a87ec6e6ebbb27395))
* lead the public front page with daily operation for organisations ([7be1070](https://github.com/simpel/bibi/commit/7be1070fbf3556e593e7d4a56150cbf1e9e90af9))
* Line costs and a total in the intake review ([2d622f2](https://github.com/simpel/bibi/commit/2d622f20022171084e1e7bff573cac78793a9a9e))
* Line warnings show a triangle and a short label, the full sentence on hover ([16f8ce5](https://github.com/simpel/bibi/commit/16f8ce537ce25bf4491c26fbc201c0a8d7a053a1))
* missing-time label centered on a solid chip, day heading is just the date ([d328be3](https://github.com/simpel/bibi/commit/d328be3563a34e3589a68f9aacba895e74b89d7f))
* move platform admin to /mothership and add an /admin hub ([ad27763](https://github.com/simpel/bibi/commit/ad27763d939fefd9400f763776a12feddefb734b))
* New ticket as the primary button in the sidebar ([37341f3](https://github.com/simpel/bibi/commit/37341f3d478fe4186322313d68ce498f90382409))
* New ticket intake page with who, when and package steps ([130a1ac](https://github.com/simpel/bibi/commit/130a1acbcae80af8748cb97ba53d71393153dcac))
* New ticket menu with From a message in the sidebar ([104ff7a](https://github.com/simpel/bibi/commit/104ff7a0207ab12d87b95e10424dd33275091bd1))
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
* order calendar joins the program table and stripes lines missing a time ([3c182bd](https://github.com/simpel/bibi/commit/3c182bdbd23a08b865e404d5165e03c1e2f8a438))
* Org-scoped member profiles linked to staff items ([37fc402](https://github.com/simpel/bibi/commit/37fc4020132812c69307a9c031e06a32ec17b007)), closes [#448](https://github.com/simpel/bibi/issues/448)
* Per-user date and clock format, applied to every date and time in the UI ([f6c383e](https://github.com/simpel/bibi/commit/f6c383e6781ebb0125c117a89f64e63114c59c90)), closes [#481](https://github.com/simpel/bibi/issues/481)
* Per-user number format and currency display, applied to every number and amount in the UI ([b9f47c5](https://github.com/simpel/bibi/commit/b9f47c5a3890f0c6369445eef1f3186fe8f2be9b)), closes [#482](https://github.com/simpel/bibi/issues/482)
* pinned booking cards show booking and order details with a clearer value ([ad69587](https://github.com/simpel/bibi/commit/ad69587d481fae0c75cf5a47728955c80089eb96))
* pinned card shows guests once and the day above the time ([c682cb8](https://github.com/simpel/bibi/commit/c682cb8a19937a1b92fcc5cc2e225ca3b1c91c8b))
* Put statuses without a column in a far-left column and turn the columns with GSAP ([2974a37](https://github.com/simpel/bibi/commit/2974a376d8da3bbe8606e5377f8a6ce010b096de)), closes [#446](https://github.com/simpel/bibi/issues/446)
* RelativeTime component with an exact-time tooltip ([#471](https://github.com/simpel/bibi/issues/471)) ([6b4bed6](https://github.com/simpel/bibi/commit/6b4bed6e8ec1a6f94e71acc8aa5239a0bd4b694c)), closes [#426](https://github.com/simpel/bibi/issues/426)
* Right-click menus on notification and inbox rows ([11bdd81](https://github.com/simpel/bibi/commit/11bdd815bd94dbc5bfd974ee0f9ff1efada8b531))
* Saving Bibi's Stripe key sets Stripe up, and the billing page shows products instead of price ids ([444bc25](https://github.com/simpel/bibi/commit/444bc2580974cf43c94dd5fc0a85929498e438d9))
* Seed a pending invitee and show invite codes on /welcome/join in dev ([56ca086](https://github.com/simpel/bibi/commit/56ca086b32a27d07cb0afd36691a80a7b2fe993f))
* Serve the public site on heybibi.se and the app on app.heybibi.se ([e69deb7](https://github.com/simpel/bibi/commit/e69deb7318e3d0c07e944e6b4c49176329a6dc66)), closes [#489](https://github.com/simpel/bibi/issues/489)
* Setup and teardown buffers for every item, with soft buffers and a TEARDOWN hold ([#404](https://github.com/simpel/bibi/issues/404)) ([2378542](https://github.com/simpel/bibi/commit/23785422bd11a325ef860d5db1281a5ac745bfc0)), closes [#379](https://github.com/simpel/bibi/issues/379)
* shared weekly hours pattern for venues and items ([1d96b92](https://github.com/simpel/bibi/commit/1d96b925036be332438d9808c7255be507ad7106)), closes [#429](https://github.com/simpel/bibi/issues/429)
* Sheets become work orders (Swedish "Order") ([de7732c](https://github.com/simpel/bibi/commit/de7732caaf896f42600e787507770cf1670e7d7a))
* Show per-rate VAT rows for bundle lines on the quote and invoice screens ([#437](https://github.com/simpel/bibi/issues/437)) ([2425c80](https://github.com/simpel/bibi/commit/2425c80c27b21d74c48e4af3da4b4872ece340a6)), closes [#420](https://github.com/simpel/bibi/issues/420)
* Showcase data, end-to-end tests and guide for the ticket intake ([1d6e022](https://github.com/simpel/bibi/commit/1d6e02256e1fe3113cf4c05432fe562b95fd684a))
* SIE export reports a chosen date range, repeatable ([1e04436](https://github.com/simpel/bibi/commit/1e04436c76efe72c93fc6eb89963a874c19d8ad5))
* Split customisation choices with their own quantities ([22403e8](https://github.com/simpel/bibi/commit/22403e8106ac82f435de6918492c36cc842ce112))
* Stripe connects on Settings → Integrations, with Stripe and Fortnox branding ([506f4f4](https://github.com/simpel/bibi/commit/506f4f4511ce86685278033834055d6a11a318a1))
* Swedish calls ticket templates Mall, so Paket only means bundles ([454aeae](https://github.com/simpel/bibi/commit/454aeae3846253254118e097ff21d6fab9333e14))
* The line dialog searches bookable items full width, and both item pickers show the list price ([2815f9d](https://github.com/simpel/bibi/commit/2815f9db6020bb012470a6a5ddd964be5ee3e103))
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
* Type editor: capability sections replace the behaviour checkboxes ([#422](https://github.com/simpel/bibi/issues/422)) ([cf52927](https://github.com/simpel/bibi/commit/cf5292711a5624aad0267981c4c5bda189ff42f8)), closes [#386](https://github.com/simpel/bibi/issues/386)
* welcome flow without AI, org-scoped URLs and member profiles ([#419](https://github.com/simpel/bibi/issues/419)) ([c9db0e7](https://github.com/simpel/bibi/commit/c9db0e792b0d68a5cdb855280d2989b662d58bfd))
* Work order filters are independent Assigned to me and Following toggles, and All clears them ([5dcf42f](https://github.com/simpel/bibi/commit/5dcf42fe0e821083a903f5a771496af68b49b574))
* Work orders are one list of latest versions, with no Today and All ([f417b9c](https://github.com/simpel/bibi/commit/f417b9c2ff20ab5a5b02de3f2dcbf0b5316feb5f))
* Work orders get their own menu entry with Today and All ([84a78d5](https://github.com/simpel/bibi/commit/84a78d54a47f3b41232849ab27ed3448dc9c7861))
* Work orders regenerate when the ticket changes, and each version has its own page ([5d67099](https://github.com/simpel/bibi/commit/5d670998ed1e2dcb3cd848cead99c113984d8982))
* Working hours per organization, people as calendar rows and the whole ticket in the booking sheet ([14e89a8](https://github.com/simpel/bibi/commit/14e89a8ca201df4316987f118adb5cac9fce8115)), closes [#449](https://github.com/simpel/bibi/issues/449)


### Bug Fixes

* Intake blocks what core would refuse and names every problem ([56ec4f1](https://github.com/simpel/bibi/commit/56ec4f1ebac9d982611b6709d4c2456c0eae6090))
* Lines table total includes VAT, matching Billed ([3fde4e4](https://github.com/simpel/bibi/commit/3fde4e4c4a832adc46bc76588302495df542c8d2))
* Sheets give their content room, and the notification's message leads ([85c8523](https://github.com/simpel/bibi/commit/85c8523f847efdedf47c2a96b9b292a879d8dc62))
* Swedish ticket statuses are "ärendestatus", apart from item states ([8cb3321](https://github.com/simpel/bibi/commit/8cb332170d51a146133aa05aca7438e349cc88c1)), closes [#444](https://github.com/simpel/bibi/issues/444)
* Tickets search runs on one pick and shows a searching toast ([d10bf33](https://github.com/simpel/bibi/commit/d10bf3396331081f7afffcec9a45becc62c2299f))


### Performance Improvements

* fast page loads (ADR 0097) ([291d945](https://github.com/simpel/bibi/commit/291d9459c9fb798e2eea115802c6b86f125020a8))


### Dependencies

* The following workspace dependencies were updated
  * devDependencies
    * @bibi/config bumped to 0.2.0

## Changelog

Generated by release-please from Conventional Commits (ADR 0060). Do not edit by hand.
