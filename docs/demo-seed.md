# Demo data

Specification for `pnpm --filter @okazi/core seed:demo` (ADR 0025). Two fictional organizations set up completely differently with the same code, to show the configurable domain (ADR 0021).

- **Lindholmen Experience Center**: conferences, exhibition and restaurant. Uses everything: vocabularies with allergens, sheets to the kitchen, packages and series.
- **Vingaleden Archipelago Tours**: boat tours in the Gothenburg archipelago. No food, no allergens, other statuses and other requirements.

All dates are relative to the day of the run: `D` = today, `D+3` = in three days. Times are local time (Europe/Stockholm).

## Checks after seeding (CI)

The script ends with checks that make CI fail if the demo does not show what it should:

1. The number of rows per entity and organization matches the tables below.
2. Vingaleden has no vocabulary called "Allergens", and none of its sheets include food.
3. Lindholmen's kitchen order for booking L5 is **blocked**: anaphylaxis to crustaceans against a mandatory dish.
4. Lindholmen's kitchen order for booking L3 is **not** blocked: the nut allergy has an alternative in the choice group.
5. Option O1 has rank 1 and O2 rank 2 on the same room and time.
6. In series S1, occurrence 4 is flagged for a conflict and moved to another room.
7. Every write has a row in `AuditLog` with actor `SYSTEM`.

The checks that run today:
- **Part 1 (roles):** roles and members per organization, and that every user has their role according to the tables.
- **Part 2 (configuration):**
  - The number of rows per organization matches for venue, vocabularies, vocabulary values, setups, types, fields, items and capacities (point 1 for what exists).
  - Vingaleden has no vocabulary "Allergens" (the first half of point 2).
  - Lindholmen's imported vocabulary "Allergens" has 14 values.
  - The number of item parts (`ItemComponent`) per organization matches the data files.
- **Part 3 (catalog), started:** Vingaleden's skippers and the Lighthouse tour to Vinga, a tour whose mandatory parts are RIB Snabben and skipper Jonna Sand (1.5 h each). Parts refer to items seeded earlier by name. The rest of the catalog follows when choice groups exist.
- **Part 4 (customers), started:** the number of customers and contact persons per organization matches the data files. Price lists and the sales pipeline follow when those operations exist.
- **All parts:** point 7.

## Exceptions and sign-in

- The organization, the users and the memberships are Better Auth tables. They are written directly (`seed/demo/users.ts`), the same way sign-up and `addMember` do. Everything else goes through `execute` as `SYSTEM`. The owner gets `owner` directly, the others get their role via `member.assignRole`. Right after, `provisionOrganization` gives each organization its defaults (one booking status per phase, ADR 0022) as SYSTEM, the same way Better Auth's `afterCreateOrganization` hook does for a real sign-up.
- The users' email is `firstname.lastname@<slug>.okazi.test`, e.g. `anna.berg@lindholmen-demo.okazi.test`. Sign in with a magic link or a one-time code; the email ends up in Mailpit.
- Roles that are to write bookings or sheets get those permissions when the resources exist (parts 5–6). Until then they read venues, items (`item`) and the configuration (`configuration`). Sales and Coordinator (template) and Vingaleden's Booking write customers and contact persons (`customer`, `contact`). Admin has `admin` on all of them.
- Part 2 seeds the configuration and the bookable spaces: Lindholmen's 10 conference rooms and Vingaleden's 3 boats, each in the organization's venue. The rest of the catalog (dishes, drinks, meals, guides, tours, equipment, packages, skippers, trips and add-ons) comes in part 3; Vingaleden's skippers and the Lighthouse tour are seeded already. The requirement types under "Other types" come in part 5, because they point to vocabularies via `requirement.*`.

---

# Lindholmen Experience Center

Slug `lindholmen-demo`. Venue: Lindholmspiren 1, 417 56 Göteborg.

## Configuration

### Roles
Imported from the "Conference venue" template (ADR 0020), plus a custom role Caretaker.

| User | Role |
|---|---|
| Anna Berg | owner |
| Erik Lund | Sales |
| Sara Nilsson | Sales |
| Johan Ek | Coordinator |
| Maria Holm | Coordinator |
| Ali Karimi | Kitchen |
| Peter Sjoberg | Caretaker |
| Lena Strand | Finance |

### Vocabularies
| Vocabulary | Values |
|---|---|
| Allergens | Imported template "EU 14 allergens": Gluten, Crustaceans, Eggs, Fish, Peanuts, Soy, Milk, Nuts, Celery, Mustard, Sesame, Sulphur dioxide/sulphites, Lupin, Molluscs |
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
| Booking | Conference (Purpose) · Event (Dresscode: choice Dresscode, Speaker/entertainment) · Tour (School class yes/no) |
| Requirement | Dietary requirement (vocabulary Allergens or Diet, field Severity) · Accessibility (vocabulary Accessibility) |

### Booking statuses
| Status | Phase |
|---|---|
| Tentative | `TENTATIVE` |
| Awaiting deposit | `TENTATIVE` |
| Confirmed | `CONFIRMED` |
| Final count locked | `CONFIRMED` |
| Completed | `COMPLETED` |
| Cancelled | `CANCELLED` |

### Sheets
| Sheet | Item types | Requirements | To role |
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
| Yoghurt with granola | Milk, Gluten, Nuts | Vegetarian |
| Scrambled eggs | Eggs, Milk | Vegetarian |
| Fresh fruit | – | Vegan |
| Cinnamon bun | Gluten, Milk, Eggs | Vegetarian |
| Carrot cake | Gluten, Eggs, Milk, Nuts | Vegetarian |
| Oat ball | Gluten | Vegan |
| Oven-baked cod loin, browned butter | Fish, Milk | Pork-free |
| Veal roast with red wine sauce | Milk, Celery, Sulphur dioxide/sulphites | Pork-free |
| Mushroom risotto | Milk | Vegetarian |
| Lentil stew with coconut rice | Celery | Vegan |
| Green salad and bread | Gluten | Vegan |
| Skagen shrimp salad on rye bread | Crustaceans, Eggs, Gluten, Mustard | – |
| Beetroot carpaccio with chèvre | Milk, Nuts | Vegetarian |
| Venison fillet, celeriac purée | Milk, Celery, Sulphur dioxide/sulphites | Pork-free |
| Pan-fried pike-perch, mussel sauce | Fish, Molluscs, Milk, Sulphur dioxide/sulphites | Pork-free |
| Celeriac steak, mustard vinaigrette | Celery, Mustard | Vegan |
| Chocolate fondant with hazelnut | Nuts, Eggs, Milk, Gluten | Vegetarian |
| Cloudberry parfait | Eggs, Milk | Vegetarian |
| Lemon sorbet | – | Vegan |
| Toast Skagen | Crustaceans, Gluten, Eggs | – |
| Charcuterie and cheese | Milk, Mustard, Sulphur dioxide/sulphites | – |
| Hummus with vegetable sticks | Sesame | Vegan |
| Spiced nuts | Nuts, Peanuts | Vegan |

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

## Sales flow and bookings

Salesperson (S) and coordinator (C) are given by first name.

### Inquiries, options and quotes
| # | Customer | What | Status | Shows |
|---|---|---|---|---|
| F1 | Göteborgs Seglarsällskap | Anniversary party, 150 people, D+60 | Inquiry `NEW`, no salesperson yet | the inbox |
| F2 | Hisingen Energi | Kickoff, 100 people, D+45 in Vinga | `QUALIFIED`, S Erik. **Option O1, rank 1** on Vinga D+45 09–17, expires D+5 | option queue |
| F3 | Kvarnby Design | Product launch, 80 people, D+45 in Vinga | `QUALIFIED`, S Sara. **Option O2, rank 2** on the same time | option queue |
| F4 | Västra Sjukvårdsregionen | Workshop, 30 people, D+40 | `QUOTED`. Quote v1 (40 people) replaced by **v2 (30 people) `SENT`**, valid until D+10 | quote versions |
| F5 | Göta Advokatbyrå | Evening event, 40 people, D+20 | `LOST`, reason "Price". Quote v1 `DECLINED` | loss reason |
| F6 | Älvstrand Tech | Team day, 20 people, D+12 | `QUALIFIED`. Option O3 expired D−1 (`ACTIVE` until `option.expireDue` runs) | expiry |

### Bookings
| # | Customer · type | When | Count | Contents | Status | S / C | Shows |
|---|---|---|---|---|---|---|---|
| L1 | Hisingen Energi · Conference | D−21 | 40 | Full-day conference in Hönö (U-shape) | Completed | Erik / Johan | history |
| L2 | Kvarnby Design · Event | D−10 | 80 | Evening event | Completed | Sara / Maria | history |
| L3 | Västra Sjukvårdsregionen · Conference | D+3 | 60 | Day + evening in Hönö (Theatre) + Projector. In the evening the Reception buffet is replaced by the Three-course dinner. | Final count locked | Erik / Johan | **Requirements:** Gluten × 4 (Allergy), Nuts × 1 (Anaphylaxis), Vegetarian × 8, Wheelchair × 1. The nuts give "may contain" without blocking. See note below. |
| L4 | Göta Advokatbyrå · Conference | D+5 | 12 | Half-day conference, Styrsö (Boardroom) | Confirmed | Sara / Maria | simple booking |
| L5 | Älvstrand Tech · Event | D+14 | 120 | Vinga (Reception) + Reception buffet + Wine package | Awaiting deposit | Erik / Maria | **Blocked kitchen order:** Crustaceans × 2 (Anaphylaxis) against Toast Skagen, which is mandatory |
| L6 | Hisingen Energi · Conference | D+30 | 25 | Full-day conference | Cancelled, reason "Budget" | Erik / – | cancellation |
| L7 | Göta Advokatbyrå · Conference | D+1 10–12 | 4 | Asperö (Boardroom) + Coffee and tea | Tentative, Swish link sent | Sara / – | quick booking with payment link |
| L10 | Hisingen Energi · Conference | D+4 13–16 | 6 | Donsö (Boardroom) + Afternoon break | Confirmed, on invoice | Erik / Johan | quick booking on invoice |
| L8 | Göteborgs Seglarsällskap · Tour | D+2 14:00 | 22 | Exhibition tour with guide Oskar (German) | Confirmed | Sara / Johan | Tour type, bookable guide |
| L9 | Kvarnby Design · Conference | D+8 | 18 | Design workshop + Conference lunch | Confirmed | Sara / Maria | activity that contains a room |

**Note on L3:** the nut allergy hits Chocolate fondant, which has the alternatives Cloudberry parfait and Lemon sorbet. The result is "may contain" and no blocking (check 4). The replacement is made on the booking's copy of the package, so the catalog package is not changed (snapshot, ADR 0021). L3 thus also shows that a package can be adapted for a single occasion.

### Series
| # | Customer | Rule | Contents | Shows |
|---|---|---|---|---|
| S1 | Nordkust Logistik | `FREQ=MONTHLY;BYDAY=1TU;COUNT=10`, start on the first Tuesday 2 months ago, 09–13 | The package Nordkust management team, 12 people, price list −15% | Occurrences 1–2 Completed, 3 Confirmed, 4–10 Tentative. **Occurrence 4 conflicts** with an internally blocked time in Styrsö and is moved to Vrångö. |

---

# Vingaleden Archipelago Tours

Slug `vingaleden-demo`. Venue: Saltholmen, 426 76 Västra Frölunda. No food and no allergens. The same code, another world.

## Configuration

### Roles
No templates. Custom roles: Admin, Booking (writes customer, inquiry, booking) and Skipper (reads booking and sheets).

| User | Role |
|---|---|
| Per Vinga | owner |
| Stina Holm | Booking |
| Kalle Ek | Skipper |
| Jonna Sand | Skipper |

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

### Other types, statuses and sheets
- Customer: Company (Org no.) · Private (no fields).
- Contact: Contact person (no fields).
- Booking: Charter · Round trip.
- Requirement: Accessibility (vocabulary Accessibility) · Life jacket (vocabulary Life jacket).
- Statuses: Inquiry (`TENTATIVE`), Weather hold (`TENTATIVE`), Confirmed (`CONFIRMED`), Weather OK (`CONFIRMED`), Completed (`COMPLETED`), Called off – weather (`CANCELLED`), Cancelled (`CANCELLED`).
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

## Customers and bookings
Customers: Hisingen Energi AB (Company, the same name as at Lindholmen but a completely separate row in another organization; contact Mats Olsson), Familjen Rask (Private; contact Johan Rask), Kvarnby Design AB (Company; contact Linnea Kvist).

| # | Customer · type | When | Count | Contents | Status | Shows |
|---|---|---|---|---|---|---|
| V1 | Hisingen Energi · Charter | D−7 | 40 | Sunset tour with Kajan, Standing | Completed | history |
| V2 | Kvarnby Design · Charter | D−2 | 20 | Sunset tour with Tern | Called off – weather | its own status in the phase `CANCELLED` |
| V3 | Familjen Rask · Round trip | D+2 | 9 | Lighthouse tour to Vinga + Blankets | Weather OK | **Requirements:** Wheelchair × 1, Life jacket child under 15 kg × 2 → Pier order |
| V4 | Hisingen Energi · Charter | D+10 | 60 | Sunset tour with Kajan, Deck reception + Coffee on board | Weather hold | its own status in the phase `TENTATIVE` |
| S2 | Familjen Rask · Round trip | `FREQ=WEEKLY;BYDAY=TH;COUNT=6`, from D+7 | 6 | Sunset tour with Tern | Confirmed | a series in another industry |

---

## Structure in the code

- `packages/core/src/seed/demo/data/` has one folder per organization (`lindholmen/`, `vingaleden/`). The files are pure data, split so that no file goes over 150 lines, e.g. `lindholmen.ts` (roles and users), `config.ts`, `types.ts` and `rooms.ts`. Later parts add `dishes.ts`, `meals.ts`, `packages.ts`, `customers.ts`, `pipeline.ts` and `bookings.ts`.
- `seed-demo.ts` runs the parts in order via `execute` with core operations: `seed-roles.ts`, `seed-config.ts`, `seed-items.ts` and `seed-customers.ts`. Items with `parts` come after the items they contain; contact persons are created right after their customer.
  - The data refers to rows by name: vocabulary, setup, type, field and value, e.g. `View: "River"`.
  - The names are resolved to ids and field keys at run time (`demo-refs.ts`).
- `checks.ts` and `config-checks.ts` contain the checks above.
- The seed is extended at the same pace as the parts in ADR 0025. A part that lacks operations is skipped with a clear log, so the demo can always be run.
