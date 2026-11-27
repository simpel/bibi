:robot: I have created a release *beep* *boop*
---


<details><summary>@bibi/ai: 6.0.0</summary>

## [6.0.0](https://github.com/simpel/bibi/compare/@bibi/ai-v5.0.0...@bibi/ai-v6.0.0) (2026-11-27)


###   BREAKING CHANGES

* GraphQL, REST, MCP and the assistant follow the account mappings

### Features

* a task needs only its type, has one due time and can prebook or book rooms ([c2e99cf](https://github.com/simpel/bibi/commit/c2e99cf8e49b8e56d093a0d3ddc36be10e69dc22))
* archived records are restored, deleted for good and purged after a retention period ([e8fa178](https://github.com/simpel/bibi/commit/e8fa178ee30efb0ee1f235a070b8c0e7fcb30a26))
* board cues, hours check, help hints and follow controls ([dec5f73](https://github.com/simpel/bibi/commit/dec5f733332cdff5918d02193312a3dd20440065))
* comments on orders and lines, shown on run sheets ([17ade2e](https://github.com/simpel/bibi/commit/17ade2eee0544984a4a4c92c92bbdb90b743e994))
* dining rooms, sittings, exceptions, table combinations and the booking page can be set up on every surface ([575068e](https://github.com/simpel/bibi/commit/575068e132e3822e798643539024d4357523037e))
* edit values on the assistant's confirmation card ([dbdaeca](https://github.com/simpel/bibi/commit/dbdaecacf4dac8f5c8c2bcbb8bc2902240e77252))
* GraphQL, REST, MCP and the assistant follow the account mappings ([bd31204](https://github.com/simpel/bibi/commit/bd31204ea7cd08c5e59e165d2aeeb396f2ede3b8))
* guests book, change and cancel tables on the restaurant's own page, and staff switch table booking on from the room ([c64a86c](https://github.com/simpel/bibi/commit/c64a86c7f840e75c0e86665368346456ccdbf6d8))
* My work is a timeline of order cards with a shared card tone ([d21c3e6](https://github.com/simpel/bibi/commit/d21c3e646d27b1c5b01f25088b2b46b6d304a7c0))
* My work is a timeline of order cards with a shared card tone ([1a8dcaa](https://github.com/simpel/bibi/commit/1a8dcaa62758b0fb411a8a6eb87b5d1872b50d5d))
* My work opens with Needs you, the tasks the member must act on ([0741372](https://github.com/simpel/bibi/commit/074137279bafff113c6fa31a34687150f4c65f40))
* notifications open in a panel on the right, with Needs you on top and dismissable ([597ea74](https://github.com/simpel/bibi/commit/597ea740e59b98200ff8e7471c164a9ed08a2236))
* order versions, restore and the superseded quote ([be41d10](https://github.com/simpel/bibi/commit/be41d106acf7e29722e76bcb17f6184ae11cb40c))
* pipeline views are personal and shared with members or the organization ([58b0836](https://github.com/simpel/bibi/commit/58b083669fff4453d519e06424ab2f38d010b6c5))
* restaurants take table reservations from staff, the assistant and guests, and the start page tells that story ([4314d17](https://github.com/simpel/bibi/commit/4314d175751b1fd30d2492ca73c609aaeeda9a84))
* tasks around a customer, before or beside an order (ADR 0117) ([0ebbfdc](https://github.com/simpel/bibi/commit/0ebbfdc0ab36b63d5817e0de780bf50f7d45dda3))
* the quote shows where it stands in a next-step card, and a replaced version can be set as current ([6f09500](https://github.com/simpel/bibi/commit/6f095001e6c8207852f1fcc4e41cc154130b732c))


### Bug Fixes

* the assistant shows inboundEndpoint.setEmail as JSON ([273b967](https://github.com/simpel/bibi/commit/273b96797d01df22a9bd3583873bd86b4fc438a9))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @bibi/auth bumped to 1.1.0
    * @bibi/config bumped to 1.1.0
    * @bibi/core bumped to 6.0.0
    * @bibi/db bumped to 4.0.0
    * @bibi/logger bumped to 0.2.0
</details>

<details><summary>@bibi/api: 4.0.0</summary>

## [4.0.0](https://github.com/simpel/bibi/compare/@bibi/api-v3.1.0...@bibi/api-v4.0.0) (2026-11-27)


###   BREAKING CHANGES

* GraphQL, REST, MCP and the assistant follow the account mappings

### Features

* admins edit the inbox address and get forwarding steps ([e06d0c7](https://github.com/simpel/bibi/commit/e06d0c7c58ebb29cb4a1989c20e3e350a9959e64))
* archived records are restored, deleted for good and purged after a retention period ([e8fa178](https://github.com/simpel/bibi/commit/e8fa178ee30efb0ee1f235a070b8c0e7fcb30a26))
* board cues, hours check, help hints and follow controls ([dec5f73](https://github.com/simpel/bibi/commit/dec5f733332cdff5918d02193312a3dd20440065))
* comments on orders and lines, shown on run sheets ([17ade2e](https://github.com/simpel/bibi/commit/17ade2eee0544984a4a4c92c92bbdb90b743e994))
* dining rooms, sittings, exceptions, table combinations and the booking page can be set up on every surface ([575068e](https://github.com/simpel/bibi/commit/575068e132e3822e798643539024d4357523037e))
* GraphQL, REST, MCP and the assistant follow the account mappings ([bd31204](https://github.com/simpel/bibi/commit/bd31204ea7cd08c5e59e165d2aeeb396f2ede3b8))
* guests book, change and cancel tables on the restaurant's own page, and staff switch table booking on from the room ([c64a86c](https://github.com/simpel/bibi/commit/c64a86c7f840e75c0e86665368346456ccdbf6d8))
* My work opens with Needs you, the tasks the member must act on ([0741372](https://github.com/simpel/bibi/commit/074137279bafff113c6fa31a34687150f4c65f40))
* notifications open in a panel on the right, with Needs you on top and dismissable ([597ea74](https://github.com/simpel/bibi/commit/597ea740e59b98200ff8e7471c164a9ed08a2236))
* order versions, restore and the superseded quote ([be41d10](https://github.com/simpel/bibi/commit/be41d106acf7e29722e76bcb17f6184ae11cb40c))
* pipeline views are personal and shared with members or the organization ([58b0836](https://github.com/simpel/bibi/commit/58b083669fff4453d519e06424ab2f38d010b6c5))
* restaurants take table reservations from staff, the assistant and guests, and the start page tells that story ([4314d17](https://github.com/simpel/bibi/commit/4314d175751b1fd30d2492ca73c609aaeeda9a84))
* tasks around a customer, before or beside an order (ADR 0117) ([0ebbfdc](https://github.com/simpel/bibi/commit/0ebbfdc0ab36b63d5817e0de780bf50f7d45dda3))
* the quote shows where it stands in a next-step card, and a replaced version can be set as current ([6f09500](https://github.com/simpel/bibi/commit/6f095001e6c8207852f1fcc4e41cc154130b732c))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @bibi/core bumped to 6.0.0
    * @bibi/logger bumped to 0.2.0
  * devDependencies
    * @bibi/config bumped to 1.1.0
    * @bibi/db bumped to 4.0.0
</details>

<details><summary>@bibi/auth: 1.1.0</summary>

## [1.1.0](https://github.com/simpel/bibi/compare/@bibi/auth-v1.0.0...@bibi/auth-v1.1.0) (2026-11-27)


### Features

* board cues, hours check, help hints and follow controls ([dec5f73](https://github.com/simpel/bibi/commit/dec5f733332cdff5918d02193312a3dd20440065))
* guests book, change and cancel tables on the restaurant's own page, and staff switch table booking on from the room ([c64a86c](https://github.com/simpel/bibi/commit/c64a86c7f840e75c0e86665368346456ccdbf6d8))
* members can be limited to related records; auth and notifications resolve access in one place ([034f590](https://github.com/simpel/bibi/commit/034f59060b53fe13fb799e8d3e6ac73d22c022a0))
* the demo seed adds Kvarnby Manor, an organization with no setup yet ([999fb67](https://github.com/simpel/bibi/commit/999fb677779b722b188cf383859bb74a7d124b32))


### Bug Fixes

* pnpm dev serves https when WEB_ORIGIN is https, and a refused assistant client is a server error ([a6090a8](https://github.com/simpel/bibi/commit/a6090a859bfc67fd89f368d45dae150ffb4ef2d4))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @bibi/config bumped to 1.1.0
    * @bibi/core bumped to 6.0.0
    * @bibi/db bumped to 4.0.0
    * @bibi/i18n bumped to 5.0.0
    * @bibi/logger bumped to 0.2.0
    * @bibi/mail bumped to 1.1.0
</details>

<details><summary>@bibi/config: 1.1.0</summary>

## [1.1.0](https://github.com/simpel/bibi/compare/@bibi/config-v1.0.0...@bibi/config-v1.1.0) (2026-11-27)


### Features

* guests book, change and cancel tables on the restaurant's own page, and staff switch table booking on from the room ([c64a86c](https://github.com/simpel/bibi/commit/c64a86c7f840e75c0e86665368346456ccdbf6d8))
</details>

<details><summary>@bibi/core: 6.0.0</summary>

## [6.0.0](https://github.com/simpel/bibi/compare/@bibi/core-v5.0.0...@bibi/core-v6.0.0) (2026-11-27)


###   BREAKING CHANGES

* invoices and deposits book to the mapped accounts of the connected ledger
* an order's customer is fixed at creation, and the order page is regrouped

### Features

* a closed order is read-only ([d55f67a](https://github.com/simpel/bibi/commit/d55f67a76bdfc57bb7a72c2ca2fae4430724c620))
* a database projection records who is related to each order and item ([f82f058](https://github.com/simpel/bibi/commit/f82f058a057e113840b6009dd7dc34281742cdaf))
* a task needs only its type, has one due time and can prebook or book rooms ([c2e99cf](https://github.com/simpel/bibi/commit/c2e99cf8e49b8e56d093a0d3ddc36be10e69dc22))
* admins edit the inbox address and get forwarding steps ([e06d0c7](https://github.com/simpel/bibi/commit/e06d0c7c58ebb29cb4a1989c20e3e350a9959e64))
* an item's occupancy has Upcoming and Past tabs, upcoming first ([5cc582f](https://github.com/simpel/bibi/commit/5cc582fc63d0a10f2dab7e7273d5275b3fe19cdd))
* an order's customer is fixed at creation, and the order page is regrouped ([ccb1583](https://github.com/simpel/bibi/commit/ccb1583991892dc81cec61139a5a494ff81d60b8))
* archived records are restored, deleted for good and purged after a retention period ([e8fa178](https://github.com/simpel/bibi/commit/e8fa178ee30efb0ee1f235a070b8c0e7fcb30a26))
* board cues, hours check, help hints and follow controls ([dec5f73](https://github.com/simpel/bibi/commit/dec5f733332cdff5918d02193312a3dd20440065))
* comment icons, unread dots, replies and mentions ([816137d](https://github.com/simpel/bibi/commit/816137db95fd648425dad04e46d5b466a745f89f))
* comments on orders and lines, shown on run sheets ([17ade2e](https://github.com/simpel/bibi/commit/17ade2eee0544984a4a4c92c92bbdb90b743e994))
* customer types carry business or private, and private customers get an optional personal identity number ([2da90a7](https://github.com/simpel/bibi/commit/2da90a7dc966bd86542206a3fc6746bee93b5f5a))
* demo items get their own icons by name, else their type's ([bb9af08](https://github.com/simpel/bibi/commit/bb9af080d2558d554e579d49d48754239295beba))
* dining rooms, sittings, exceptions, table combinations and the booking page can be set up on every surface ([575068e](https://github.com/simpel/bibi/commit/575068e132e3822e798643539024d4357523037e))
* guests book, change and cancel tables on the restaurant's own page, and staff switch table booking on from the room ([c64a86c](https://github.com/simpel/bibi/commit/c64a86c7f840e75c0e86665368346456ccdbf6d8))
* guests count kitchen needs on the booking page against the lists the restaurant picks ([ae868ef](https://github.com/simpel/bibi/commit/ae868eff593fde5335c564de01f09bfdb884c22e))
* invoices and deposits book to the mapped accounts of the connected ledger ([106b078](https://github.com/simpel/bibi/commit/106b0785cd9b1a96695598be4095f33b6c300a5d))
* items get a Lucide icon or an image, and the package step compares each package with the request ([9b86f64](https://github.com/simpel/bibi/commit/9b86f643a9485528f910815951b2f30fcc215c4c))
* layout pieces keep their ids when a layout or floor plan is saved ([85f82e9](https://github.com/simpel/bibi/commit/85f82e9adfb3e2fd6ed1919a6dc7ce27bff2502a))
* members can be limited to related records; auth and notifications resolve access in one place ([034f590](https://github.com/simpel/bibi/commit/034f59060b53fe13fb799e8d3e6ac73d22c022a0))
* My work in Today, This week, Next week and Later, reading on as you scroll ([25c8641](https://github.com/simpel/bibi/commit/25c86415a0eb1fe6dedf127ebb8930619dc200e4))
* My work is a timeline of order cards with a shared card tone ([d21c3e6](https://github.com/simpel/bibi/commit/d21c3e646d27b1c5b01f25088b2b46b6d304a7c0))
* My work is a timeline of order cards with a shared card tone ([1a8dcaa](https://github.com/simpel/bibi/commit/1a8dcaa62758b0fb411a8a6eb87b5d1872b50d5d))
* My work opens with Needs you, the tasks the member must act on ([0741372](https://github.com/simpel/bibi/commit/074137279bafff113c6fa31a34687150f4c65f40))
* notifications open in a panel on the right, with Needs you on top and dismissable ([597ea74](https://github.com/simpel/bibi/commit/597ea740e59b98200ff8e7471c164a9ed08a2236))
* order versions, restore and the superseded quote ([be41d10](https://github.com/simpel/bibi/commit/be41d106acf7e29722e76bcb17f6184ae11cb40c))
* packages get their own permission and leave the administration area ([eaf769d](https://github.com/simpel/bibi/commit/eaf769d70d2635634b3a75a6e218205e25b8e5fb))
* pipeline views are personal and shared with members or the organization ([58b0836](https://github.com/simpel/bibi/commit/58b083669fff4453d519e06424ab2f38d010b6c5))
* restaurants take table reservations from staff, the assistant and guests, and the start page tells that story ([4314d17](https://github.com/simpel/bibi/commit/4314d175751b1fd30d2492ca73c609aaeeda9a84))
* Saved views above Orders, Run sheets and My work ([21ea9de](https://github.com/simpel/bibi/commit/21ea9dee7b5759b8942e52d9b11bd7756f0cef7f))
* tasks around a customer, before or beside an order (ADR 0117) ([0ebbfdc](https://github.com/simpel/bibi/commit/0ebbfdc0ab36b63d5817e0de780bf50f7d45dda3))
* the database holds dining rooms, sittings, table combinations, reservations and table holds ([3191e2b](https://github.com/simpel/bibi/commit/3191e2b6c95f81600847d8a9670a489e4029cd85))
* the demo seed adds Kvarnby Manor, an organization with no setup yet ([999fb67](https://github.com/simpel/bibi/commit/999fb677779b722b188cf383859bb74a7d124b32))
* the order's key facts show the quoted sum, linking to the renamed Quote & payments tab ([71956be](https://github.com/simpel/bibi/commit/71956be641d2c33f9f9665f87f29c86899041611))
* the quote shows where it stands in a next-step card, and a replaced version can be set as current ([6f09500](https://github.com/simpel/bibi/commit/6f095001e6c8207852f1fcc4e41cc154130b732c))
* the sidebar counts down the free trial and leads admins to pick a plan ([5b9ffdb](https://github.com/simpel/bibi/commit/5b9ffdb3daedac34a2e11e2c0577f97738b651d7))
* the welcome flow skips working hours; members set them on their profile ([055c2a0](https://github.com/simpel/bibi/commit/055c2a035d8c5832f08f3b4feb1b4c53ecebcbf9))


### Bug Fixes

* authorization errors follow one convention ([f465b3a](https://github.com/simpel/bibi/commit/f465b3aecd39afd26fc1ab247d49c2c7320847c3))
* board views expose viewerCan; the web reads it instead of re-implementing edit and manage ([17fc91e](https://github.com/simpel/bibi/commit/17fc91e8c28f4e7b11edbbbc459d5da65c6b5168))
* operations declare their real gate; GraphQL edges use core's permission check ([ff5c164](https://github.com/simpel/bibi/commit/ff5c1649aca03acc7a761c41819179369efce89e))
* provider sweep tests read only their own organization ([fe6044e](https://github.com/simpel/bibi/commit/fe6044ea215699dcf67e6275ff07d62dea719f85))
* removing a member leaves no assignments, follows or views behind ([d645625](https://github.com/simpel/bibi/commit/d645625957235b6e7317698d2b2563c4de77df24))
* requirements are called Requirements everywhere in English ([2e8661d](https://github.com/simpel/bibi/commit/2e8661d2748b73d0fc0630ccf42e69c74e1833e6))
* setting the language works before a profile exists ([79ddb8b](https://github.com/simpel/bibi/commit/79ddb8b37bccbe626cfdb0e3b8d5aa9b060106ac))
* the demo seed writes estimates before it closes an order ([5520ac1](https://github.com/simpel/bibi/commit/5520ac14dee3c93c89bfffaa0bdc87dcfae85353))
* the pay page keeps offering its methods after a payment attempt lapsed ([0a1bd00](https://github.com/simpel/bibi/commit/0a1bd0025a0038c94187e00f77ba4669df324820))
* the quote transition test allows reopening a replaced version ([d50d0bc](https://github.com/simpel/bibi/commit/d50d0bc40228f71d5660fa4626bfeaaa0c1786f6))
* the requirement dialog picks a list, then its value, and says when setup is missing ([75f5feb](https://github.com/simpel/bibi/commit/75f5febc6f8881bf31e2b114ae125bf83006de00))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @bibi/config bumped to 1.1.0
    * @bibi/db bumped to 4.0.0
    * @bibi/logger bumped to 0.2.0
</details>

<details><summary>@bibi/db: 4.0.0</summary>

## [4.0.0](https://github.com/simpel/bibi/compare/@bibi/db-v3.1.0...@bibi/db-v4.0.0) (2026-11-27)


###   BREAKING CHANGES

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
</details>

<details><summary>@bibi/graphql: 4.0.0</summary>

## [4.0.0](https://github.com/simpel/bibi/compare/@bibi/graphql-v3.1.0...@bibi/graphql-v4.0.0) (2026-11-27)


###   BREAKING CHANGES

* GraphQL, REST, MCP and the assistant follow the account mappings

### Features

* a task needs only its type, has one due time and can prebook or book rooms ([c2e99cf](https://github.com/simpel/bibi/commit/c2e99cf8e49b8e56d093a0d3ddc36be10e69dc22))
* admins edit the inbox address and get forwarding steps ([e06d0c7](https://github.com/simpel/bibi/commit/e06d0c7c58ebb29cb4a1989c20e3e350a9959e64))
* archived records are restored, deleted for good and purged after a retention period ([e8fa178](https://github.com/simpel/bibi/commit/e8fa178ee30efb0ee1f235a070b8c0e7fcb30a26))
* board cues, hours check, help hints and follow controls ([dec5f73](https://github.com/simpel/bibi/commit/dec5f733332cdff5918d02193312a3dd20440065))
* comments on orders and lines, shown on run sheets ([17ade2e](https://github.com/simpel/bibi/commit/17ade2eee0544984a4a4c92c92bbdb90b743e994))
* dining rooms, sittings, exceptions, table combinations and the booking page can be set up on every surface ([575068e](https://github.com/simpel/bibi/commit/575068e132e3822e798643539024d4357523037e))
* GraphQL, REST, MCP and the assistant follow the account mappings ([bd31204](https://github.com/simpel/bibi/commit/bd31204ea7cd08c5e59e165d2aeeb396f2ede3b8))
* guests book, change and cancel tables on the restaurant's own page, and staff switch table booking on from the room ([c64a86c](https://github.com/simpel/bibi/commit/c64a86c7f840e75c0e86665368346456ccdbf6d8))
* My work in Today, This week, Next week and Later, reading on as you scroll ([25c8641](https://github.com/simpel/bibi/commit/25c86415a0eb1fe6dedf127ebb8930619dc200e4))
* My work is a timeline of order cards with a shared card tone ([d21c3e6](https://github.com/simpel/bibi/commit/d21c3e646d27b1c5b01f25088b2b46b6d304a7c0))
* My work is a timeline of order cards with a shared card tone ([1a8dcaa](https://github.com/simpel/bibi/commit/1a8dcaa62758b0fb411a8a6eb87b5d1872b50d5d))
* My work opens with Needs you, the tasks the member must act on ([0741372](https://github.com/simpel/bibi/commit/074137279bafff113c6fa31a34687150f4c65f40))
* notifications open in a panel on the right, with Needs you on top and dismissable ([597ea74](https://github.com/simpel/bibi/commit/597ea740e59b98200ff8e7471c164a9ed08a2236))
* order versions, restore and the superseded quote ([be41d10](https://github.com/simpel/bibi/commit/be41d106acf7e29722e76bcb17f6184ae11cb40c))
* pipeline views are personal and shared with members or the organization ([58b0836](https://github.com/simpel/bibi/commit/58b083669fff4453d519e06424ab2f38d010b6c5))
* restaurants take table reservations from staff, the assistant and guests, and the start page tells that story ([4314d17](https://github.com/simpel/bibi/commit/4314d175751b1fd30d2492ca73c609aaeeda9a84))
* tasks around a customer, before or beside an order (ADR 0117) ([0ebbfdc](https://github.com/simpel/bibi/commit/0ebbfdc0ab36b63d5817e0de780bf50f7d45dda3))
* the quote shows where it stands in a next-step card, and a replaced version can be set as current ([6f09500](https://github.com/simpel/bibi/commit/6f095001e6c8207852f1fcc4e41cc154130b732c))


### Bug Fixes

* operations declare their real gate; GraphQL edges use core's permission check ([ff5c164](https://github.com/simpel/bibi/commit/ff5c1649aca03acc7a761c41819179369efce89e))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @bibi/core bumped to 6.0.0
    * @bibi/db bumped to 4.0.0
    * @bibi/logger bumped to 0.2.0
  * devDependencies
    * @bibi/config bumped to 1.1.0
</details>

<details><summary>@bibi/i18n: 5.0.0</summary>

## [5.0.0](https://github.com/simpel/bibi/compare/@bibi/i18n-v4.1.0...@bibi/i18n-v5.0.0) (2026-11-27)


###   BREAKING CHANGES

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
</details>

<details><summary>@bibi/logger: 0.2.0</summary>

## [0.2.0](https://github.com/simpel/bibi/compare/@bibi/logger-v0.1.4...@bibi/logger-v0.2.0) (2026-11-27)


### Features

* restaurants take table reservations from staff, the assistant and guests, and the start page tells that story ([4314d17](https://github.com/simpel/bibi/commit/4314d175751b1fd30d2492ca73c609aaeeda9a84))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @bibi/config bumped to 1.1.0
</details>

<details><summary>@bibi/mail: 1.1.0</summary>

## [1.1.0](https://github.com/simpel/bibi/compare/@bibi/mail-v1.0.0...@bibi/mail-v1.1.0) (2026-11-27)


### Features

* board cues, hours check, help hints and follow controls ([dec5f73](https://github.com/simpel/bibi/commit/dec5f733332cdff5918d02193312a3dd20440065))
* restaurants take table reservations from staff, the assistant and guests, and the start page tells that story ([4314d17](https://github.com/simpel/bibi/commit/4314d175751b1fd30d2492ca73c609aaeeda9a84))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @bibi/config bumped to 1.1.0
    * @bibi/core bumped to 6.0.0
    * @bibi/i18n bumped to 5.0.0
    * @bibi/logger bumped to 0.2.0
</details>

<details><summary>@bibi/mcp: 6.0.0</summary>

## [6.0.0](https://github.com/simpel/bibi/compare/@bibi/mcp-v5.0.0...@bibi/mcp-v6.0.0) (2026-11-27)


###   BREAKING CHANGES

* GraphQL, REST, MCP and the assistant follow the account mappings

### Features

* a task needs only its type, has one due time and can prebook or book rooms ([c2e99cf](https://github.com/simpel/bibi/commit/c2e99cf8e49b8e56d093a0d3ddc36be10e69dc22))
* admins edit the inbox address and get forwarding steps ([e06d0c7](https://github.com/simpel/bibi/commit/e06d0c7c58ebb29cb4a1989c20e3e350a9959e64))
* archived records are restored, deleted for good and purged after a retention period ([e8fa178](https://github.com/simpel/bibi/commit/e8fa178ee30efb0ee1f235a070b8c0e7fcb30a26))
* board cues, hours check, help hints and follow controls ([dec5f73](https://github.com/simpel/bibi/commit/dec5f733332cdff5918d02193312a3dd20440065))
* comments on orders and lines, shown on run sheets ([17ade2e](https://github.com/simpel/bibi/commit/17ade2eee0544984a4a4c92c92bbdb90b743e994))
* customer types carry business or private, and private customers get an optional personal identity number ([2da90a7](https://github.com/simpel/bibi/commit/2da90a7dc966bd86542206a3fc6746bee93b5f5a))
* dining rooms, sittings, exceptions, table combinations and the booking page can be set up on every surface ([575068e](https://github.com/simpel/bibi/commit/575068e132e3822e798643539024d4357523037e))
* edit values on the assistant's confirmation card ([dbdaeca](https://github.com/simpel/bibi/commit/dbdaecacf4dac8f5c8c2bcbb8bc2902240e77252))
* GraphQL, REST, MCP and the assistant follow the account mappings ([bd31204](https://github.com/simpel/bibi/commit/bd31204ea7cd08c5e59e165d2aeeb396f2ede3b8))
* guests book, change and cancel tables on the restaurant's own page, and staff switch table booking on from the room ([c64a86c](https://github.com/simpel/bibi/commit/c64a86c7f840e75c0e86665368346456ccdbf6d8))
* My work is a timeline of order cards with a shared card tone ([d21c3e6](https://github.com/simpel/bibi/commit/d21c3e646d27b1c5b01f25088b2b46b6d304a7c0))
* My work is a timeline of order cards with a shared card tone ([1a8dcaa](https://github.com/simpel/bibi/commit/1a8dcaa62758b0fb411a8a6eb87b5d1872b50d5d))
* My work opens with Needs you, the tasks the member must act on ([0741372](https://github.com/simpel/bibi/commit/074137279bafff113c6fa31a34687150f4c65f40))
* notifications open in a panel on the right, with Needs you on top and dismissable ([597ea74](https://github.com/simpel/bibi/commit/597ea740e59b98200ff8e7471c164a9ed08a2236))
* order versions, restore and the superseded quote ([be41d10](https://github.com/simpel/bibi/commit/be41d106acf7e29722e76bcb17f6184ae11cb40c))
* pipeline views are personal and shared with members or the organization ([58b0836](https://github.com/simpel/bibi/commit/58b083669fff4453d519e06424ab2f38d010b6c5))
* restaurants take table reservations from staff, the assistant and guests, and the start page tells that story ([4314d17](https://github.com/simpel/bibi/commit/4314d175751b1fd30d2492ca73c609aaeeda9a84))
* tasks around a customer, before or beside an order (ADR 0117) ([0ebbfdc](https://github.com/simpel/bibi/commit/0ebbfdc0ab36b63d5817e0de780bf50f7d45dda3))
* the quote shows where it stands in a next-step card, and a replaced version can be set as current ([6f09500](https://github.com/simpel/bibi/commit/6f095001e6c8207852f1fcc4e41cc154130b732c))


### Bug Fixes

* board views expose viewerCan; the web reads it instead of re-implementing edit and manage ([17fc91e](https://github.com/simpel/bibi/commit/17fc91e8c28f4e7b11edbbbc459d5da65c6b5168))
* removing a member leaves no assignments, follows or views behind ([d645625](https://github.com/simpel/bibi/commit/d645625957235b6e7317698d2b2563c4de77df24))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @bibi/ai bumped to 6.0.0
    * @bibi/auth bumped to 1.1.0
    * @bibi/config bumped to 1.1.0
    * @bibi/core bumped to 6.0.0
    * @bibi/db bumped to 4.0.0
    * @bibi/graphql bumped to 4.0.0
    * @bibi/logger bumped to 0.2.0
    * @bibi/mail bumped to 1.1.0
    * @bibi/storage bumped to 0.2.9
  * devDependencies
    * @bibi/api bumped to 4.0.0
</details>

<details><summary>@bibi/storage: 0.2.9</summary>

## [0.2.9](https://github.com/simpel/bibi/compare/@bibi/storage-v0.2.8...@bibi/storage-v0.2.9) (2026-11-27)


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @bibi/config bumped to 1.1.0
    * @bibi/core bumped to 6.0.0
    * @bibi/logger bumped to 0.2.0
</details>

<details><summary>@bibi/ui: 3.0.0</summary>

## [3.0.0](https://github.com/simpel/bibi/compare/@bibi/ui-v2.1.1...@bibi/ui-v3.0.0) (2026-11-27)


###   BREAKING CHANGES

* an order's customer is fixed at creation, and the order page is regrouped

### Features

* a choice field from a list offers Create value, which adds it to the list and selects it ([0792faa](https://github.com/simpel/bibi/commit/0792faad0244e2d51bb5461985b6a8a13b77c3d5))
* a danger area at the bottom of the task page is the only place to archive it, and the note leads the page ([48ce7da](https://github.com/simpel/bibi/commit/48ce7da15d97939685904edda9fc1a0b79f96883))
* a line's missing time and open choice show in amber stripes and are filled in Edit line ([3b3b94c](https://github.com/simpel/bibi/commit/3b3b94c10efb00ec647b43020fd37215d1a59f59))
* a mapping canvas draws a line from each purpose to an account ([88295e7](https://github.com/simpel/bibi/commit/88295e7c39dc181bf376f42d33d49c94e89b5858))
* a pending button shows a spinner in place of its icon ([3029fbe](https://github.com/simpel/bibi/commit/3029fbe70648f8a0d1948cb1f6e51993d3a6b148))
* a task needs only its type, has one due time and can prebook or book rooms ([c2e99cf](https://github.com/simpel/bibi/commit/c2e99cf8e49b8e56d093a0d3ddc36be10e69dc22))
* an order's customer is fixed at creation, and the order page is regrouped ([ccb1583](https://github.com/simpel/bibi/commit/ccb1583991892dc81cec61139a5a494ff81d60b8))
* board cues, hours check, help hints and follow controls ([dec5f73](https://github.com/simpel/bibi/commit/dec5f733332cdff5918d02193312a3dd20440065))
* calendar cards turn red when a hard hold blocks them, and hover cards fit the screen ([8b54d09](https://github.com/simpel/bibi/commit/8b54d0989475c2136cbe057f39e6a37ce2d2325e))
* card issues are error and warning badges in words, state is the first stat ([1540c50](https://github.com/simpel/bibi/commit/1540c50bfae425bd022d7feff4eabce2ad7ea45f))
* cards show issues as an error icon or a warning triangle, not a striped outline ([3ec59a9](https://github.com/simpel/bibi/commit/3ec59a980801c0b7df237ba40ec39b87254b5650))
* cards wash their header in the status colour, show the order number as a stat and stripe the outline when there is an issue ([9bb8080](https://github.com/simpel/bibi/commit/9bb80808915a990944c3f13d0b01612badb20d57))
* comment icons, unread dots, replies and mentions ([816137d](https://github.com/simpel/bibi/commit/816137db95fd648425dad04e46d5b466a745f89f))
* every icon button has a tooltip saying what a click does ([7852d2b](https://github.com/simpel/bibi/commit/7852d2bd787292240183201526b9a51ccf59aea5))
* items get a Lucide icon or an image, and the package step compares each package with the request ([9b86f64](https://github.com/simpel/bibi/commit/9b86f643a9485528f910815951b2f30fcc215c4c))
* My work has a search box, and card headers edge in their status colour ([0019ce4](https://github.com/simpel/bibi/commit/0019ce41c39d2face9332f44a15cbc5f359080d3))
* My work in Today, This week, Next week and Later, reading on as you scroll ([25c8641](https://github.com/simpel/bibi/commit/25c86415a0eb1fe6dedf127ebb8930619dc200e4))
* My work is a timeline of order cards with a shared card tone ([d21c3e6](https://github.com/simpel/bibi/commit/d21c3e646d27b1c5b01f25088b2b46b6d304a7c0))
* My work is a timeline of order cards with a shared card tone ([1a8dcaa](https://github.com/simpel/bibi/commit/1a8dcaa62758b0fb411a8a6eb87b5d1872b50d5d))
* My work, pinned and hover cards are one card with a tinted header, pin and expand ([9032c08](https://github.com/simpel/bibi/commit/9032c08af6b6056f069f9229379a20823ae6a328))
* notifications open in a panel on the right, with Needs you on top and dismissable ([597ea74](https://github.com/simpel/bibi/commit/597ea740e59b98200ff8e7471c164a9ed08a2236))
* restaurants take table reservations from staff, the assistant and guests, and the start page tells that story ([4314d17](https://github.com/simpel/bibi/commit/4314d175751b1fd30d2492ca73c609aaeeda9a84))
* tasks around a customer, before or beside an order (ADR 0117) ([0ebbfdc](https://github.com/simpel/bibi/commit/0ebbfdc0ab36b63d5817e0de780bf50f7d45dda3))
* the item page leads with editable stat cards and Create order, and edits one setting at a time ([87e220a](https://github.com/simpel/bibi/commit/87e220a5f32147d83fda525c9e82ecd45375f3db))
* the sidebar collapses to icons with tooltips and a red dot on Inbox ([4df3a79](https://github.com/simpel/bibi/commit/4df3a7911287f1d0148706f67ec6a9ac53d03580))


### Bug Fixes

* a narrow header folds its actions into the menu first, so the title keeps its row ([045567e](https://github.com/simpel/bibi/commit/045567e387a2bb54d38f43ee8bc5dcd4aa770196))
* card headers are a solid wash, so no edge shows through around them ([8d863ef](https://github.com/simpel/bibi/commit/8d863ef8c5945fd55db234aa122db51b3ce5af27))
* card headers end at the card's edge in their own wash, with no stronger edge ([33a1f4e](https://github.com/simpel/bibi/commit/33a1f4e82c6fbc37e8b5f148ff9e176ec8822903))
* on a narrow page or card the actions sit on their own row above the title, everywhere ([36d826f](https://github.com/simpel/bibi/commit/36d826fb98baa878c6b85c1be8e28c03eddeece3))
* search inputs' clear button is a muted cross from the theme, not Chrome's blue ([eb7c45b](https://github.com/simpel/bibi/commit/eb7c45bdee7a2ac9af0ef51fc8d440404d8d0bc4))
* sort the @bibi/ui exports ([2defbf8](https://github.com/simpel/bibi/commit/2defbf8fe6a8b47c6057fb0a6b744cb46a133365))
* the order header's comment button is an icon button with a red dot ([34a5782](https://github.com/simpel/bibi/commit/34a5782bd4acada677063e9a92dfa63c3db22441))
* the select matches shadcn's, so icons in its items and trigger are sized and muted ([0da7c10](https://github.com/simpel/bibi/commit/0da7c102b23077d4abc9c5b8c581a0e38d1abe83))
* the task done toggle is a check button, like the Needs you checkmark ([49c75c7](https://github.com/simpel/bibi/commit/49c75c7ab2192f9261adfec7d66d3ab5d4977c50))


### Dependencies

* The following workspace dependencies were updated
  * devDependencies
    * @bibi/config bumped to 1.1.0
</details>

<details><summary>@bibi/web: 6.0.0</summary>

## [6.0.0](https://github.com/simpel/bibi/compare/@bibi/web-v5.0.0...@bibi/web-v6.0.0) (2026-11-27)


###   BREAKING CHANGES

* map purposes to accounts on the integration page and open it after connecting
* an order's customer is fixed at creation, and the order page is regrouped

### Features

* a choice field from a list offers Create value, which adds it to the list and selects it ([0792faa](https://github.com/simpel/bibi/commit/0792faad0244e2d51bb5461985b6a8a13b77c3d5))
* a closed order is read-only ([d55f67a](https://github.com/simpel/bibi/commit/d55f67a76bdfc57bb7a72c2ca2fae4430724c620))
* a confirmed proposal says it is done, with Continue setup ([837167b](https://github.com/simpel/bibi/commit/837167b405fdaa714ff4671e1644fe9a5456b3aa))
* a crash in the root layout shows Bibi's own error page ([7694475](https://github.com/simpel/bibi/commit/76944750eb36a9b0e7cef9bc14d507fb80af22ca))
* a danger area at the bottom of the task page is the only place to archive it, and the note leads the page ([48ce7da](https://github.com/simpel/bibi/commit/48ce7da15d97939685904edda9fc1a0b79f96883))
* a line's missing time and open choice show in amber stripes and are filled in Edit line ([3b3b94c](https://github.com/simpel/bibi/commit/3b3b94c10efb00ec647b43020fd37215d1a59f59))
* a pending button shows a spinner in place of its icon ([3029fbe](https://github.com/simpel/bibi/commit/3029fbe70648f8a0d1948cb1f6e51993d3a6b148))
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
* item lists and the line dialog's search show each item's icon or image ([6904168](https://github.com/simpel/bibi/commit/690416820006bab41a3593adbe15b536aea68b98))
* items get a Lucide icon or an image, and the package step compares each package with the request ([9b86f64](https://github.com/simpel/bibi/commit/9b86f643a9485528f910815951b2f30fcc215c4c))
* layout pieces keep their ids when a layout or floor plan is saved ([85f82e9](https://github.com/simpel/bibi/commit/85f82e9adfb3e2fd6ed1919a6dc7ce27bff2502a))
* map purposes to accounts on the integration page and open it after connecting ([fce1c3f](https://github.com/simpel/bibi/commit/fce1c3fe3099a1a2327494bc50362bed060e6156))
* My work has a search box, and card headers edge in their status colour ([0019ce4](https://github.com/simpel/bibi/commit/0019ce41c39d2face9332f44a15cbc5f359080d3))
* My work in Today, This week, Next week and Later, reading on as you scroll ([25c8641](https://github.com/simpel/bibi/commit/25c86415a0eb1fe6dedf127ebb8930619dc200e4))
* My work is a timeline of order cards with a shared card tone ([d21c3e6](https://github.com/simpel/bibi/commit/d21c3e646d27b1c5b01f25088b2b46b6d304a7c0))
* My work is a timeline of order cards with a shared card tone ([1a8dcaa](https://github.com/simpel/bibi/commit/1a8dcaa62758b0fb411a8a6eb87b5d1872b50d5d))
* My work opens with Needs you, the tasks the member must act on ([0741372](https://github.com/simpel/bibi/commit/074137279bafff113c6fa31a34687150f4c65f40))
* My work, pinned and hover cards are one card with a tinted header, pin and expand ([9032c08](https://github.com/simpel/bibi/commit/9032c08af6b6056f069f9229379a20823ae6a328))
* notifications open in a panel on the right, with Needs you on top and dismissable ([597ea74](https://github.com/simpel/bibi/commit/597ea740e59b98200ff8e7471c164a9ed08a2236))
* order and item pages drop the side panel for Customer and Details tabs, and rooms leave setup to their layouts ([9c51e6f](https://github.com/simpel/bibi/commit/9c51e6fc2251d6d60648983368768b99c4239901))
* order versions, restore and the superseded quote ([be41d10](https://github.com/simpel/bibi/commit/be41d106acf7e29722e76bcb17f6184ae11cb40c))
* packages get their own permission and leave the administration area ([eaf769d](https://github.com/simpel/bibi/commit/eaf769d70d2635634b3a75a6e218205e25b8e5fb))
* pipeline views are personal and shared with members or the organization ([58b0836](https://github.com/simpel/bibi/commit/58b083669fff4453d519e06424ab2f38d010b6c5))
* restaurants take table reservations from staff, the assistant and guests, and the start page tells that story ([4314d17](https://github.com/simpel/bibi/commit/4314d175751b1fd30d2492ca73c609aaeeda9a84))
* Saved views above Orders, Run sheets and My work ([21ea9de](https://github.com/simpel/bibi/commit/21ea9dee7b5759b8942e52d9b11bd7756f0cef7f))
* show a thank-you page after paying for a plan in Stripe Checkout ([acc5f55](https://github.com/simpel/bibi/commit/acc5f555b1731b1172a4ad7472fac435022ed403))
* tasks around a customer, before or beside an order (ADR 0117) ([0ebbfdc](https://github.com/simpel/bibi/commit/0ebbfdc0ab36b63d5817e0de780bf50f7d45dda3))
* the 404 and 500 pages get the wordmark, a large status figure and a way onward ([b8b4d33](https://github.com/simpel/bibi/commit/b8b4d330c6b7eca579c519c1ab4a099b453b0702))
* the command bar searches with prefixes and lists every page and create action ([1f3f526](https://github.com/simpel/bibi/commit/1f3f526b688b01d7852994958e7b0682afbfad14))
* the item page has tabs like the order page, with its details in a side panel ([044eecf](https://github.com/simpel/bibi/commit/044eecfaee7b14adf11202afa100bccab1bbc024))
* the item page is edited in place, with its picture beside the name and a pencil on each layout ([afab75c](https://github.com/simpel/bibi/commit/afab75c20c121f1880b35e40258708fd7d3759d1))
* the item page leads with editable stat cards and Create order, and edits one setting at a time ([87e220a](https://github.com/simpel/bibi/commit/87e220a5f32147d83fda525c9e82ecd45375f3db))
* the new order page refuses a date or start time that has passed ([9560d40](https://github.com/simpel/bibi/commit/9560d4068dacbb78c526956b6d6d8f76038ace77))
* the order is edited in place, and its money sections stand apart ([3c5435d](https://github.com/simpel/bibi/commit/3c5435d5f6e4b21846dd5d3f10d1ac7abd694103))
* the order page opens in tabs beside a facts panel ([a5738a7](https://github.com/simpel/bibi/commit/a5738a760b0b6383517b04280c28e6d51e481c19))
* the order page shows your Needs you tasks with what to do ([0c1fdbb](https://github.com/simpel/bibi/commit/0c1fdbbd930c2c3f1a57e01f702f9c27636a5f09))
* the order's key facts show the quoted sum, linking to the renamed Quote & payments tab ([71956be](https://github.com/simpel/bibi/commit/71956be641d2c33f9f9665f87f29c86899041611))
* the order's versions open from a Versions button and the quote pill under Program ([b518686](https://github.com/simpel/bibi/commit/b5186863332ed64801a638a1bb49f7acaed3b6f3))
* the organization setup step has no Skip; join another organization instead ([24d8248](https://github.com/simpel/bibi/commit/24d8248dd0c3e1bcf330fb39277882479743e7eb))
* the quote shows where it stands in a next-step card, and a replaced version can be set as current ([6f09500](https://github.com/simpel/bibi/commit/6f095001e6c8207852f1fcc4e41cc154130b732c))
* the Run sheets tab warns when a run sheet is unsent, changed or blocked ([f657e40](https://github.com/simpel/bibi/commit/f657e40a57c6614fe669de06dde2fd14fc0ef949))
* the sidebar collapses to icons with tooltips and a red dot on Inbox ([4df3a79](https://github.com/simpel/bibi/commit/4df3a7911287f1d0148706f67ec6a9ac53d03580))
* the sidebar counts down the free trial and leads admins to pick a plan ([5b9ffdb](https://github.com/simpel/bibi/commit/5b9ffdb3daedac34a2e11e2c0577f97738b651d7))
* the sidebar's My work entry counts the Needs you tasks due now ([387544f](https://github.com/simpel/bibi/commit/387544f5d59b4e7c0d5e6bdaafd57aadee4f55fc))
* the start page tells four stories, meetings, the restaurant, your lists and the assistant ([40112d2](https://github.com/simpel/bibi/commit/40112d2616b4bb9654c186beb59db86eee01c3a8))
* the welcome flow skips working hours; members set them on their profile ([055c2a0](https://github.com/simpel/bibi/commit/055c2a035d8c5832f08f3b4feb1b4c53ecebcbf9))


### Bug Fixes

* a narrow header folds its actions into the menu first, so the title keeps its row ([045567e](https://github.com/simpel/bibi/commit/045567e387a2bb54d38f43ee8bc5dcd4aa770196))
* a narrow search box in the top bar shows only the magnifier and K ([44b5f13](https://github.com/simpel/bibi/commit/44b5f1340025b063430739cce3db211f641fdc69))
* a Needs you alert on the order shows its due date under the title and a button to do it ([c5f5e6b](https://github.com/simpel/bibi/commit/c5f5e6b279bcce86f558e300c8eb11612c31bc2d))
* a task is marked done from a header button, like Follow, not a check before its title ([f1c6d18](https://github.com/simpel/bibi/commit/f1c6d181c2cbc7f04e2e72c1f662d97ae7c8a6b3))
* add the task's linkable-orders loader missed from the last commit ([6e9298d](https://github.com/simpel/bibi/commit/6e9298df27f247ce2200787a9a380bc3aba408d8))
* an item's needs are called resources and staff, so Swedish no longer says Behov for two things ([17784b9](https://github.com/simpel/bibi/commit/17784b9f1afdd5d17d845574bc8fe6b1b792b2c6))
* board views expose viewerCan; the web reads it instead of re-implementing edit and manage ([17fc91e](https://github.com/simpel/bibi/commit/17fc91e8c28f4e7b11edbbbc459d5da65c6b5168))
* Follow shows an eye to follow and a crossed-out eye to stop ([a02fcf7](https://github.com/simpel/bibi/commit/a02fcf70cfd7c9c829dfbf8beca9d302b6b7f51e))
* Follow shows an open eye while following and a crossed-out eye otherwise ([fb2b710](https://github.com/simpel/bibi/commit/fb2b71004a71455addce83779f84c072ed0ccb11))
* Follow uses an eye, and tasks due today or soon get an amber icon ([43f3873](https://github.com/simpel/bibi/commit/43f387369936fc52cf41255df6a69ce3b749c634))
* hovering anywhere on a fact shows its pencil, not only its value ([609f318](https://github.com/simpel/bibi/commit/609f318f69bf477be6fae57d6714b188adddda0a))
* on a narrow page or card the actions sit on their own row above the title, everywhere ([36d826f](https://github.com/simpel/bibi/commit/36d826fb98baa878c6b85c1be8e28c03eddeece3))
* pnpm dev serves https when WEB_ORIGIN is https, and a refused assistant client is a server error ([a6090a8](https://github.com/simpel/bibi/commit/a6090a859bfc67fd89f368d45dae150ffb4ef2d4))
* setting the language works before a profile exists ([79ddb8b](https://github.com/simpel/bibi/commit/79ddb8b37bccbe626cfdb0e3b8d5aa9b060106ac))
* the booking captcha checks Turnstile's action and hostname, caps the token and times out ([ff3538b](https://github.com/simpel/bibi/commit/ff3538b4224b88d2f325abfd78c0227ff3c4b64f))
* the order header's comment button goes to the Comments section ([69de0f9](https://github.com/simpel/bibi/commit/69de0f92bc2ede208442bea1327b70ddd18f0b28))
* the order header's comment button is an icon button with a red dot ([34a5782](https://github.com/simpel/bibi/commit/34a5782bd4acada677063e9a92dfa63c3db22441))
* the order's versions section sits at the bottom of the page ([1c3abbf](https://github.com/simpel/bibi/commit/1c3abbf36739daeab2486064263cc2d0cb0f4718))
* the people limit reads label, input, then what it means, in its popover and the item form ([1e32088](https://github.com/simpel/bibi/commit/1e320882cd973c5f009cbe2b97c4fda5f7f8c1d9))
* the picture's pencil and the layout pencils are the same round corner button ([2906c81](https://github.com/simpel/bibi/commit/2906c81509dc3e5f1c231c12a3da30a9eb0e35eb))
* the requirement dialog picks a list, then its value, and says when setup is missing ([75f5feb](https://github.com/simpel/bibi/commit/75f5febc6f8881bf31e2b114ae125bf83006de00))
* the sidebar's Catalog keeps only daily work; types, lists and price lists stay in administration ([5f61748](https://github.com/simpel/bibi/commit/5f6174821764ce933bde1771ed8c203a98a36d05))
* the task's danger area sits in the main column, and Related reads Relaterat in Swedish ([82c77d1](https://github.com/simpel/bibi/commit/82c77d1cd1389902569b97cfeb92737e75575267))
* the top bar's search keeps its placeholder, and below md it is a small pill with the magnifier and K ([160e4b4](https://github.com/simpel/bibi/commit/160e4b483db117594f49af94961d4f57a542f6b0))
* the top bar's search shrinks with the window so the breadcrumb and buttons keep their room ([59f982f](https://github.com/simpel/bibi/commit/59f982f49c7c8759b42f1c662e9c7a1c278b37f5))
* upgrade Next.js from 16.4.2 to 16.4.6 for a security advisory ([fbc7ad7](https://github.com/simpel/bibi/commit/fbc7ad752db6bed0f4a0db147a40114635b27e68))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @bibi/ai bumped to 6.0.0
    * @bibi/api bumped to 4.0.0
    * @bibi/auth bumped to 1.1.0
    * @bibi/config bumped to 1.1.0
    * @bibi/core bumped to 6.0.0
    * @bibi/db bumped to 4.0.0
    * @bibi/graphql bumped to 4.0.0
    * @bibi/i18n bumped to 5.0.0
    * @bibi/logger bumped to 0.2.0
    * @bibi/mail bumped to 1.1.0
    * @bibi/mcp bumped to 6.0.0
    * @bibi/storage bumped to 0.2.9
    * @bibi/ui bumped to 3.0.0
</details>

<details><summary>@bibi/worker: 2.1.0</summary>

## [2.1.0](https://github.com/simpel/bibi/compare/@bibi/worker-v2.0.0...@bibi/worker-v2.1.0) (2026-11-27)


### Features

* archived records are restored, deleted for good and purged after a retention period ([e8fa178](https://github.com/simpel/bibi/commit/e8fa178ee30efb0ee1f235a070b8c0e7fcb30a26))
* board cues, hours check, help hints and follow controls ([dec5f73](https://github.com/simpel/bibi/commit/dec5f733332cdff5918d02193312a3dd20440065))
* restaurants take table reservations from staff, the assistant and guests, and the start page tells that story ([4314d17](https://github.com/simpel/bibi/commit/4314d175751b1fd30d2492ca73c609aaeeda9a84))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @bibi/auth bumped to 1.1.0
    * @bibi/config bumped to 1.1.0
    * @bibi/core bumped to 6.0.0
    * @bibi/db bumped to 4.0.0
    * @bibi/logger bumped to 0.2.0
    * @bibi/mail bumped to 1.1.0
</details>

---
This PR was generated with [Release Please](https://github.com/googleapis/release-please). See [documentation](https://github.com/googleapis/release-please#release-please).