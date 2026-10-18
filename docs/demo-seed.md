# Demo data

Specification for `pnpm --filter @okazi/core seed:demo` (ADR 0025). Two fictional organizations set up completely differently with the same code, to show the configurable domain (ADR 0021).

- **Lindholmen Experience Center**: conferences, exhibition and restaurant. Uses everything: vocabularies with allergens, sheets to the kitchen, packages, item states and a phase grid.
- **Vingaleden Archipelago Tours**: boat tours in the Gothenburg archipelago. No food, no allergens, other phases and other requirements.

All dates are relative to the day of the run: `D` = today, `D+3` = in three days. Times are local time (Europe/Stockholm).

## Checks after seeding (CI)

The script ends with checks that make CI fail if the demo does not show what it should:

1. The number of rows per entity and organization matches the tables below.
2. Vingaleden has no vocabulary called "Allergens", and none of its sheets include food.
3. Lindholmen's kitchen order for ticket L5 is **blocked**: anaphylaxis to crustaceans against a mandatory dish.
4. Lindholmen's kitchen order for ticket L3 is **not** blocked: the nut allergy has an alternative in the choice group.
5. Tickets F2 and F3 hold the same room and time with soft holds. Both lines are `Prebooked`, F2's `heldAt` is earlier than F3's (no queue).
6. Ticket F6's `holdsUntil` has passed and its line is still `Prebooked` until `ticket.expireHolds` runs.
7. Every write has a row in `AuditLog` with actor `SYSTEM`.

The checks that run today:
- **Part 1 (roles):** the members per organization, and that every user has their fixed role (ADR 0034) according to the tables.
- **Part 2 (configuration):**
  - The number of rows per organization matches for venue, vocabularies, vocabulary values, setups, responsibilities, types, fields, items and capacities (point 1 for what exists).
  - Vingaleden has no vocabulary "Allergens" (the first half of point 2).
  - Lindholmen's imported vocabulary "Allergens" has 14 values.
  - The number of item parts (`ItemComponent`) per organization matches the data files.
- **Part 3 (catalog):** the whole catalog of both organizations is seeded via `item.create` as SYSTEM, parts after the items they contain, and Nordkust management team via `item.saveAsPackage` right after its customer. The checks compare with the data files per organization: the number of items (Lindholmen 61, Vingaleden 9), customer-specific packages (Lindholmen 1), item parts (`ItemComponent`, choice options included) and choice groups (`ItemChoiceGroup`). The test also verifies that the Three-course dinner has the groups Starter, Main course and Dessert over 8 parts, and that Nordkust management team belongs to Nordkust Logistik. Every choice group in the tables is "choose 1" (`minPick` = `maxPick` = 1).
- **Part 2 (configuration), item states:** every item type with states in the data files gets them from a template (ADR 0044) through `itemState.create`, initial state first; the type's default state "Active" is archived and the template's Released state becomes the type's expiry state (`entityType.update` `expiryStateId`). Templates: bookable (Prebooked `SOFT` `expires`, Booked `HARD` `inSheets`, Released), food (Estimated, Ordered, Locked `inSheets`, Released) and other (Planned, Confirmed `inSheets`, Released; on a `BOOKABLE` type Planned holds `SOFT` and Confirmed `HARD`). Lindholmen: Conference room and Equipment bookable, Dish, Drink and Meal food, Tour and Guide other; Package keeps "Active". Vingaleden: Boat and Skipper bookable, Tour and Add-on other. Lindholmen also has the line type Line (base `PROGRAM_ITEM`).
- **Part 4 (customers), started:** the number of customers and contact persons per organization matches the data files, and Nordkust Logistik has its price list with a general discount of 15 %. Ticket phases and the phase grid follow when those operations exist.
- **Part 5 (tickets), started:** the number of tickets per organization matches the data files, each with its customer, type, desired period, headcount, own fields, main assignee and 0–2 followers by name (ADR 0034; `checkDemoAssignments` compares the counts). Each ticket is created through `ticket.create` in the entry phase and then moved to its phase with `ticket.changePhase` (`checkDemoTickets` compares the number of tickets per phase and checks the minimum configuration: one entry and one terminal phase). Until the organizations' own phases are seeded (#271), the phases are the provisioned defaults Lead (entry), Confirmed, Completed (terminal, invoiceable) and Lost (terminal, needs a reason): open tickets after the deal are Confirmed, L1, L2 and V1 Completed, L6 ("Budget") and V2 ("Weather") Lost. Requirements and the other lines follow.
- **Part 5, holds (checks 5 and 6):** the leads F2, F3 and F6 stay in the entry phase (Site visit comes with the organization's own phases, #271) and each gets one room line through `programItem.create`, which starts in Prebooked, a soft hold. F2 (Kickoff) and F3 (Product launch) hold Vinga (auditorium) on D+45 09–17 with `holdsUntil` D+5; F6 (Team day) holds Hönö on D+12 with `holdsUntil` D−1. `checkDemoHolds` verifies that every seeded line starts in its initial state, that F2 and F3 are two overlapping `SOFT` holds with F2's `heldAt` before F3's, then runs `ticket.expireHolds` once: F6's line is Released (its hold dropped) and F2's and F3's lines are still Prebooked. After seeding, F6's line is therefore already Released.
- **All parts:** point 7.

## Exceptions and sign-in

- The organization, the users and the memberships are Better Auth tables. They are written directly (`seed/demo/users.ts`), the same way sign-up and `addMember` do. Everything else goes through `execute` as `SYSTEM`. The owner gets `owner` directly, the others get their role via `member.assignRole`. Right after, `provisionOrganization` gives each organization its defaults (a minimal set of ticket phases, ADR 0043) as SYSTEM, the same way Better Auth's `afterCreateOrganization` hook does for a real sign-up.
- The users' email is `firstname.lastname@<slug>.okazi.test`, e.g. `anna.berg@lindholmen-demo.okazi.test`. Sign in with a magic link or a one-time code; the email ends up in Mailpit.
- Access uses the fixed roles (ADR 0034): `viewer` reads everything, `member` also writes operational data (customers, tickets, program items, requirements, payments, sheets), `admin` also configures and manages members, `owner` can do everything. What each person answers for (sales, coordinator, kitchen, caretaker) comes with responsibilities, not roles.
- Part 2 seeds the configuration and the bookable spaces: Lindholmen's 10 conference rooms and Vingaleden's 3 boats, each in the organization's venue. Part 3 seeds the rest of the catalog (dishes, drinks, meals, guides, tours, equipment, packages, skippers, trips and add-ons) in the same venue. A part has no setup of its own, so "Knippla in the Cabaret setup" and "The View, Banquet" are seeded as the room only; the setup is chosen on the line. Tour group sizes ("max 25 people") are not seeded, since Tour has no `SETUPS`. The requirement types under "Other types" come in part 5, because they point to vocabularies via `requirement.*`.

---

# Lindholmen Experience Center

Slug `lindholmen-demo`. Venue: Lindholmspiren 1, 417 56 Göteborg.

## Configuration

### Roles
Fixed roles (ADR 0034). The function in parentheses is what the person answers for; see Responsibilities below.

| User | Role |
|---|---|
| Anna Berg | owner |
| Erik Lund (sales) | member |
| Sara Nilsson (sales) | member |
| Johan Ek (coordinator) | admin |
| Maria Holm (coordinator) | member |
| Ali Karimi (kitchen) | member |
| Peter Sjoberg (caretaker) | viewer |
| Lena Strand (finance) | member |

### Responsibilities
Seeded in part 2 via `responsibility.create` as SYSTEM, after the item types. Followers are optional.

| Responsibility | Covers (item types) | Default assignee | Default followers |
|---|---|---|---|
| Sales | Package | Erik Lund | Sara Nilsson |
| Coordinator | Conference room, Equipment, Tour, Guide | Johan Ek | Maria Holm |
| Head of kitchen | Dish, Drink, Meal | Ali Karimi | – |

### Vocabularies
| Vocabulary | Values |
|---|---|
| Allergens | Imported template "EU 14 allergens": Gluten, Crustaceans, Eggs, Fish, Peanuts, Soy, Milk, Tree nuts, Celery, Mustard, Sesame, Sulphur dioxide/sulphites, Lupin, Molluscs |
| Diet | Vegetarian, Vegan, Halal, Pork-free |
| Severity | Intolerance, Allergy, Anaphylaxis |
| Accessibility | Wheelchair, Hearing loop, Guide dog |
| View | River, Courtyard, None |
| Dresscode | Casual, Blazer, Dark suit |

### Setups
Theatre (15 min), Classroom (30), U-shape (30), Boardroom (20), Cabaret (40), Banquet (60), Reception (15).

### Item types
| Type | Behaviours | Own fields |
|---|---|---|
| Conference room | `BOOKABLE`, `SETUPS`, `PRICED` | Floor (number), Area m² (number), Ceiling height m (number), Daylight (yes/no), View (choice: View) |
| Dish | – | Allergens (multi-choice: Allergens), Diet (multi-choice: Diet) |
| Drink | `PRICED` | Allergens (multi-choice), Alcoholic (yes/no) |
| Meal | `PRICED`, `COMPOSABLE`, `CHOICES` | Service style (choice: Buffet, Plated, Finger food) |
| Tour | `PRICED`, `COMPOSABLE`, `CHOICES`, `BOOKABLE` | Language (multi-choice: Swedish, English, German) |
| Guide | `BOOKABLE` | Language (multi-choice) |
| Equipment | `BOOKABLE`, `PRICED` | Inventory number (text) |
| Package | `PRICED`, `COMPOSABLE`, `CHOICES` | Minimum quantity (number) |

### Other types
| Base entity | Types and fields |
|---|---|
| Customer | Company (Org no., Framework agreement yes/no) · Public sector (Org no., Peppol-ID, Requires case number yes/no) · Association (Org no.) |
| Contact | Contact person (Role: choice Orderer, Invoice recipient, Organizer) |
| Ticket | Conference (Purpose) · Event (Dresscode: choice Dresscode, Speaker/entertainment) · Tour (School class yes/no) |
| Requirement | Dietary requirement (vocabulary Allergens or Diet, field Severity) · Accessibility (vocabulary Accessibility) |

### Ticket phases (ADR 0043)
| Phase | Flags |
|---|---|
| New | `entry` |
| Site visit | – |
| Quote sent | `event` `QUOTE_SENT` |
| Confirmed | `event` `QUOTE_ACCEPTED`, `requiresAssignee` |
| Final count locked | `requiresAssignee` |
| Completed | `terminal`, `requiresAssignee`, `invoiceable` |
| Lost | `terminal`, `requiresReason` |
| Cancelled | `terminal`, `requiresReason` |

### Item states and the phase grid (ADR 0044)
| Item type | States (initial first) |
|---|---|
| Conference room, Equipment (`BOOKABLE`) | Prebooked (`SOFT`, `expires`), Booked (`HARD`), Released |
| Dish, Drink, Meal | Estimated, Ordered, Locked (`inSheets`), Released |
| Tour, Guide | Planned, Confirmed, Released |

| Phase | Rooms and equipment | Food | Tours and guides |
|---|---|---|---|
| New, Site visit, Quote sent | Prebooked | Estimated | Planned |
| Confirmed | Booked | Ordered | Confirmed |
| Final count locked | keep | Locked | keep |
| Completed, Lost, Cancelled | Released | Released | Released |

### Ticket templates
| Template | Type | Phase | Lines |
|---|---|---|---|
| Small meeting | Conference | Confirmed | Boardroom, 4 people, 2 hours, plus Coffee and tea |
| Afternoon break | Conference | Confirmed | Boardroom, 6 people, 3 hours, plus Afternoon break |

### Sheets
| Sheet | Item types | Requirements | To (responsibility, ADR 0034) |
|---|---|---|---|
| Kitchen order | Dish, Drink, Meal | Allergens, Diet | Kitchen |
| Setup order | Conference room, Equipment | Accessibility | Caretaker |
| Guide brief | Tour, Guide | Accessibility | Coordinator |

## Catalog

### Conference rooms (10)
Price per hour excl. VAT. Capacity per setup.

| Room | Floor | m² | Daylight | View | Capacity | SEK/h |
|---|---|---|---|---|---|---|
| Vinga (auditorium) | 1 | 260 | yes | River | Theatre 220, Classroom 120, Banquet 160, Reception 250 | 4,500 |
| Hönö | 2 | 90 | yes | River | Theatre 70, Classroom 40, U-shape 28, Cabaret 48, Banquet 56 | 1,900 |
| Öckerö | 2 | 70 | yes | Courtyard | Theatre 50, Classroom 30, U-shape 22, Cabaret 36 | 1,500 |
| Styrsö | 3 | 45 | yes | River | Boardroom 16, U-shape 14 | 950 |
| Vrångö | 3 | 45 | yes | Courtyard | Boardroom 14, U-shape 12 | 900 |
| Donsö | 3 | 32 | yes | River | Boardroom 10 | 700 |
| Brännö | 3 | 32 | yes | Courtyard | Boardroom 10 | 650 |
| Asperö | 3 | 20 | no | None | Boardroom 6 | 450 |
| Knippla (workshop) | 1 | 120 | yes | Courtyard | Classroom 50, Cabaret 60, Reception 100 | 2,200 |
| The View (roof terrace) | 5 | 150 | yes | River | Banquet 90, Reception 150 | 3,800 |

### Dishes (24)
| Dish | Allergens | Diet |
|---|---|---|
| Sourdough bread with butter | Gluten, Milk | Vegetarian |
| Yoghurt with granola | Milk, Gluten, Tree nuts | Vegetarian |
| Scrambled eggs | Eggs, Milk | Vegetarian |
| Fresh fruit | – | Vegan |
| Cinnamon bun | Gluten, Milk, Eggs | Vegetarian |
| Carrot cake | Gluten, Eggs, Milk, Tree nuts | Vegetarian |
| Oat ball | Gluten | Vegan |
| Oven-baked cod loin, browned butter | Fish, Milk | Pork-free |
| Veal roast with red wine sauce | Milk, Celery, Sulphur dioxide/sulphites | Pork-free |
| Mushroom risotto | Milk | Vegetarian |
| Lentil stew with coconut rice | Celery | Vegan |
| Green salad and bread | Gluten | Vegan |
| Skagen shrimp salad on rye bread | Crustaceans, Eggs, Gluten, Mustard | – |
| Beetroot carpaccio with chèvre | Milk, Tree nuts | Vegetarian |
| Venison fillet, celeriac purée | Milk, Celery, Sulphur dioxide/sulphites | Pork-free |
| Pan-fried pike-perch, mussel sauce | Fish, Molluscs, Milk, Sulphur dioxide/sulphites | Pork-free |
| Celeriac steak, mustard vinaigrette | Celery, Mustard | Vegan |
| Chocolate fondant with hazelnut | Tree nuts, Eggs, Milk, Gluten | Vegetarian |
| Cloudberry parfait | Eggs, Milk | Vegetarian |
| Lemon sorbet | – | Vegan |
| Toast Skagen | Crustaceans, Gluten, Eggs | – |
| Charcuterie and cheese | Milk, Mustard, Sulphur dioxide/sulphites | – |
| Hummus with vegetable sticks | Sesame | Vegan |
| Spiced nuts | Tree nuts, Peanuts | Vegan |

### Drinks (6)
| Drink | Price | Allergens | Alcohol |
|---|---|---|---|
| Coffee and tea | SEK 35/pp | – | no |
| Mineral water | SEK 25/each | – | no |
| Sparkling welcome drink | SEK 95/pp | Sulphur dioxide/sulphites | yes |
| Alcohol-free bubbly | SEK 65/pp | – | no |
| Lager from Göteborg | SEK 85/each | Gluten | yes |
| Wine package (2 glasses) | SEK 225/pp | Sulphur dioxide/sulphites | yes |

### Meals (6)
Parts without a choice group are mandatory.

| Meal | Price/pp | Parts |
|---|---|---|
| Conference breakfast | 125 | Sourdough bread, Yoghurt with granola, Scrambled eggs, Fresh fruit, Coffee and tea |
| Morning break | 65 | Coffee and tea + **choose 1:** Cinnamon bun, Oat ball, Fresh fruit |
| Afternoon break | 65 | Coffee and tea + **choose 1:** Carrot cake, Oat ball, Fresh fruit |
| Conference lunch | 245 | Green salad and bread, Mineral water + **main course, choose 1:** Cod loin, Veal roast, Mushroom risotto, Lentil stew |
| Three-course dinner | 595 | **Starter, choose 1:** Skagen shrimp salad, Beetroot carpaccio · **Main course, choose 1:** Venison fillet, Pike-perch, Celeriac steak · **Dessert, choose 1:** Chocolate fondant, Cloudberry parfait, Lemon sorbet |
| Reception buffet | 245 | Toast Skagen, Charcuterie and cheese, Hummus with vegetable sticks, Spiced nuts (all mandatory) |

### Guides and tours
- Guides (`BOOKABLE`): Emma Lind (Swedish, English), Oskar Ahl (Swedish, German), Nora Falk (Swedish, English).
- Exhibition tour: 60 min, max 25 people, SEK 1,450 per group. **Choose 1 guide.**
- Evening tour: 90 min, max 25 people, SEK 2,200 per group. **Choose 1 guide.** Shows that something bookable can sit in a choice group.
- Design workshop: 120 min in Knippla, SEK 395/pp. Contains the room Knippla in the Cabaret setup.

### Equipment
Projector (SEK 450), Mobile sound system (SEK 900), Extra whiteboard (SEK 150), Hearing loop (SEK 0).

### Packages (4 in the catalog + 1 customer-specific)
| Package | Price/pp | Contents (offset from start) |
|---|---|---|
| Half-day conference | 545 | **Room, choose 1:** Hönö, Öckerö, Styrsö, Vrångö (+0:00, 4 h) · Morning break (+1:30) · Conference lunch (+3:30) |
| Full-day conference | 795 | **Room, choose 1:** Hönö, Öckerö, Styrsö, Vrångö (+0:00, 8 h) · Morning break (+1:30) · Conference lunch (+3:30) · Afternoon break (+6:00) |
| Day + evening | 1,016 | Sparkling welcome drink (+0:00) · **Room, choose 1:** Hönö, Öckerö (+0:15, 7 h) · Morning break (+1:30) · Conference lunch (+3:00) · Evening tour (+8:00) · Reception buffet (+9:30) |
| Evening event | 1,290 | Evening tour (+0:00) · Sparkling welcome drink (+1:30) · The View, Banquet (+1:30, 5 h) · Three-course dinner (+2:00) · Wine package (+2:00) |
| Nordkust management team *(customer: Nordkust Logistik)* | 595 | Styrsö, Boardroom (+0:00, 4 h) · Morning break (+0:30) · Conference lunch (+3:00) |

## Customers

Contact persons have the type Contact person; the role in parentheses is its Role field. Contacts without a role in the table are Orderer, except Eva Sund (Organizer), Ekonomienheten (Invoice recipient) and Ulla Berg (Organizer).

| Customer | Type | Contacts | Price list |
|---|---|---|---|
| Nordkust Logistik AB | Company (framework agreement) | Karin Wallin (orderer), Fakturor Nordkust (invoice recipient) | Nordkust framework agreement: −15% on everything |
| Hisingen Energi AB | Company | Mats Olsson | – |
| Västra Sjukvårdsregionen | Public sector (Peppol, case number) | Eva Sund, Ekonomienheten | – |
| Kvarnby Design AB | Company | Linnea Kvist | – |
| Göta Advokatbyrå KB | Company | Henrik Strand | – |
| Älvstrand Tech AB | Company | Amir Haddad | – |
| Göteborgs Seglarsällskap | Association | Ulla Berg | – |

## Tickets

The main assignee (A) and followers (F) are given by first name (ADR 0034): the coordinator answers for a ticket and the salesperson follows it.

### Leads, holds and quotes
| # | Customer | What | Phase | Shows |
|---|---|---|---|---|
| F1 | Göteborgs Seglarsällskap | Anniversary party, 150 people, D+60 | New, no assignee yet | the inbox |
| F2 | Hisingen Energi | Kickoff, 100 people, D+45 in Vinga | Site visit, A Erik. Vinga D+45 09–17 `Prebooked`, `holdsUntil` D+5 | a soft hold |
| F3 | Kvarnby Design | Product launch, 80 people, D+45 in Vinga | Site visit, A Sara. Vinga on the same time `Prebooked` (held later than F2) | overlapping soft holds, "held since" |
| F4 | Västra Sjukvårdsregionen | Workshop, 30 people, D+40 | Quote sent. Quote v1 (40 people) replaced by **v2 (30 people) `SENT`**, valid until D+10 | quote versions |
| F5 | Göta Advokatbyrå | Evening event, 40 people, D+20 | Lost, reason "Price". Quote v1 `DECLINED` | loss reason |
| F6 | Älvstrand Tech | Team day, 20 people, D+12 | Site visit. `holdsUntil` D−1, room line `Prebooked` until `ticket.expireHolds` runs | expiry |

### Tickets after the deal
| # | Customer · type | When | Count | Contents | Phase | A / F | Shows |
|---|---|---|---|---|---|---|---|
| L1 | Hisingen Energi · Conference | D−21 | 40 | Full-day conference in Hönö (U-shape) | Completed | Johan / Erik | history |
| L2 | Kvarnby Design · Event | D−10 | 80 | Evening event | Completed | Maria / Sara | history |
| L3 | Västra Sjukvårdsregionen · Conference | D+3 | 60 | Day + evening in Hönö (Theatre) + Projector. In the evening the Reception buffet is replaced by the Three-course dinner. | Final count locked | Johan / Erik, Maria | **Requirements:** Gluten × 4 (Allergy), Tree nuts × 1 (Anaphylaxis), Vegetarian × 8, Wheelchair × 1. The nuts give "may contain" without blocking. See note below. |
| L4 | Göta Advokatbyrå · Conference | D+5 | 12 | Half-day conference, Styrsö (Boardroom) | Confirmed | Maria / Sara | simple ticket |
| L5 | Älvstrand Tech · Event | D+14 | 120 | Vinga (Reception) + Reception buffet + Wine package | Confirmed, invoice not yet paid | Maria / Erik | **Blocked kitchen order:** Crustaceans × 2 (Anaphylaxis) against Toast Skagen, which is mandatory |
| L6 | Hisingen Energi · Conference | D+30 | 25 | Full-day conference | Cancelled, reason "Budget" | Erik / – | cancellation |
| L7 | Göta Advokatbyrå · Conference | D+1 10–12 | 4 | Asperö (Boardroom) + Coffee and tea | Confirmed, payment link sent | Sara / – | ticket from the Small meeting template, payment pending |
| L10 | Hisingen Energi · Conference | D+4 13–16 | 6 | Donsö (Boardroom) + Afternoon break | Confirmed, on invoice | Johan / Erik | ticket from the Afternoon break template, invoice |
| L8 | Göteborgs Seglarsällskap · Tour | D+2 14:00 | 22 | Exhibition tour with guide Oskar (German) | Confirmed | Johan / Sara | Tour type, bookable guide |
| L9 | Kvarnby Design · Conference | D+8 | 18 | Design workshop + Conference lunch | Confirmed | Maria / Sara | activity that contains a room |
| L11 | Göta Advokatbyrå · Conference | D+6 | 10 | Styrsö (Boardroom), Projector line set to Booked | Quote sent | Maria / – | a line state override |

**Note on L3:** the nut allergy hits Chocolate fondant, which has the alternatives Cloudberry parfait and Lemon sorbet. The result is "may contain" and no blocking (check 4). The replacement is made on the ticket's copy of the package, so the catalog package is not changed (snapshot, ADR 0021). L3 thus also shows that a package can be adapted for a single occasion.

---

# Vingaleden Archipelago Tours

Slug `vingaleden-demo`. Venue: Saltholmen, 426 76 Västra Frölunda. No food and no allergens. The same code, another world.

## Configuration

### Roles
Fixed roles (ADR 0034).

| User | Role |
|---|---|
| Per Vinga | owner |
| Stina Holm (tour desk) | member |
| Kalle Ek (skipper) | viewer |
| Jonna Sand (skipper) | viewer |

### Responsibilities
| Responsibility | Covers (item types) | Default assignee | Default followers |
|---|---|---|---|
| Tour desk | Tour, Add-on | Stina Holm | – |
| Skipper | Boat, Skipper | Kalle Ek | Jonna Sand |

### Vocabularies
| Vocabulary | Values |
|---|---|
| Harbor | Saltholmen, Lilla Bommen, Styrsö Bratten, Vrångö |
| Accessibility | Wheelchair, Walker, Stroller |
| Life jacket | Child under 15 kg, Child 15–40 kg |
| Certification | Ship officer class VIII, Boat license |

### Setups
Seated (10 min), Standing (5 min), Deck reception (20 min).

### Item types
| Type | Behaviours | Own fields |
|---|---|---|
| Boat | `BOOKABLE`, `SETUPS`, `PRICED` | Registration number (text), Toilet on board (yes/no), Max knots (number) |
| Skipper | `BOOKABLE` | Certification (choice: Certification) |
| Tour | `PRICED`, `COMPOSABLE`, `CHOICES` | Departure harbor (choice: Harbor), Distance nm (number) |
| Add-on | `PRICED` | – |

### Other types, phases, item states and sheets
- Customer: Company (Org no.) · Private (no fields).
- Contact: Contact person (no fields).
- Ticket: Charter · Round trip.
- Requirement: Accessibility (vocabulary Accessibility) · Life jacket (vocabulary Life jacket).
- Ticket phases: Request (`entry`), Weather hold, Confirmed (`event` `QUOTE_ACCEPTED`), Weather OK, Completed (`terminal`, `invoiceable`), Called off – weather (`terminal`, `requiresReason`), Cancelled (`terminal`, `requiresReason`).
- Item states: Boat and Skipper (`BOOKABLE`): Prebooked (`SOFT`), Booked (`HARD`), Released. Tour and Add-on: Planned, Confirmed, Released. The grid sets Prebooked and Planned in Request and Weather hold, Booked and Confirmed from Confirmed on, and Released in the terminal phases.
- Sheets: **Pier order** to Skipper with the item types Boat, Skipper and Add-on and the requirements Accessibility and Life jacket.

## Catalog
| Item | Type | Details | Price |
|---|---|---|---|
| M/S Kajan | Boat | Seated 48, Standing 80, Deck reception 60, toilet | SEK 3,200/h |
| M/S Tern | Boat | Seated 24, Standing 40, toilet | SEK 2,100/h |
| RIB Snabben | Boat | Seated 12, 40 knots | SEK 2,600/h |
| Kalle Ek | Skipper | Ship officer class VIII | – |
| Jonna Sand | Skipper | Boat license | – |
| Sunset tour | Tour | Saltholmen, 18 nm. **Boat, choose 1:** Kajan, Tern · **Skipper, choose 1** · 2.5 h | SEK 495/pp |
| Lighthouse tour to Vinga | Tour | Saltholmen, 14 nm. RIB Snabben + skipper Jonna · 1.5 h | SEK 650/pp |
| Blankets and rain gear | Add-on | – | SEK 40/pp |
| Coffee on board | Add-on | Shows that food can exist without allergen vocabularies | SEK 35/pp |

## Customers and tickets
Customers: Hisingen Energi AB (Company, the same name as at Lindholmen but a completely separate row in another organization; contact Mats Olsson), Familjen Rask (Private; contact Johan Rask), Kvarnby Design AB (Company; contact Linnea Kvist).

Per Vinga is the main assignee of V1–V3 and Stina Holm follows them; V4 is assigned to Stina Holm.

| # | Customer · type | When | Count | Contents | Phase | Shows |
|---|---|---|---|---|---|---|
| V1 | Hisingen Energi · Charter | D−7 | 40 | Sunset tour with Kajan, Standing | Completed | history |
| V2 | Kvarnby Design · Charter | D−2 | 20 | Sunset tour with Tern | Called off – weather | an organization-defined terminal phase |
| V3 | Familjen Rask · Round trip | D+2 | 9 | Lighthouse tour to Vinga + Blankets | Weather OK | **Requirements:** Wheelchair × 1, Life jacket child under 15 kg × 2 → Pier order |
| V4 | Hisingen Energi · Charter | D+10 | 60 | Sunset tour with Kajan, Deck reception + Coffee on board | Weather hold | an organization-defined phase with soft holds on the boat |

---

## Structure in the code

- `packages/core/src/seed/demo/data/` has one folder per organization (`lindholmen/`, `vingaleden/`). The files are pure data, split so that no file goes over 150 lines, e.g. `lindholmen.ts` (roles and users), `config.ts`, `types.ts`, `rooms.ts`, `dishes.ts`, `drinks.ts`, `meals.ts`, `activities.ts` (guides, tours, equipment), `packages.ts`, `customers.ts` and `tickets.ts`; Vingaleden's skippers, trips and add-ons are in `tours.ts`. Later parts add `pipeline.ts`.
- `seed-demo.ts` runs the parts in order via `execute` with core operations: `seed-roles.ts`, `seed-config.ts`, `seed-responsibilities.ts`, `seed-items.ts`, `seed-customers.ts` and `seed-tickets.ts`. Items with `parts` or `choices` come after the items they contain (`seed-item-input.ts` resolves them); a choice group's options become parts too. Contact persons, the price list and customer-specific packages are created right after their customer.
  - The data refers to rows by name: vocabulary, setup, type, field and value, e.g. `View: "River"`.
  - The names are resolved to ids and field keys at run time (`demo-refs.ts`).
- `checks.ts` and `config-checks.ts` contain the checks above.
- The seed is extended at the same pace as the parts in ADR 0025. A part that lacks operations is skipped with a clear log, so the demo can always be run.
