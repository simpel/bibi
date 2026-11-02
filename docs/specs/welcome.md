# Welcome flow

Current behaviour. Why: ADR 0061 (replaces the AI onboarding of ADR 0045), ADR 0062 (org-scoped URLs).

## Routes
Locale prefix (`/sv`, `/en`) omitted.

```
/welcome                       your orgs · pending invitations · Create new
├─ pick / accept ────────────► /:org/welcome
└─ /welcome/new                name + slug → creates the org (you are admin) → /:org/welcome
/:org/welcome                  router only (server redirect)
├─ profile incomplete ───────► /:org/welcome/profile, then /:org/welcome/hours
├─ setup PENDING
│   ├─ pipeline:write ───────► /:org/welcome/setup/organization
│   │                          /:org/welcome/setup/kind
│   │                          /:org/welcome/setup/bookable
│   │                          /:org/welcome/setup/sellable
│   │                          /:org/welcome/setup/review → /:org/welcome/done
│   └─ otherwise ────────────► /:org/welcome/done
└─ nothing left ─────────────► /:org/pipeline
```

- Every welcome page is full screen with the logo at the top centre and the content centred. There is no sidebar or top bar.
- Step pages show "Step n of m" and have Back and Continue.
- The app layout runs the same check as the router, so a member with an open step always lands back in the flow.

## Joining (ADR 0078)
```
/welcome                          a verified work domain claimed by an organization?
├─ yes ─► "Join <organization>"   [Join <organization>] → /welcome/organizations
│         ghost: Join a different organization → /welcome/join
│         link: Create a new organization instead → /welcome/new
└─ no ──► your orgs · invitations · "Have an invite code?" · Create new
/welcome/join[/<code>]            invite code from the invitation mail → /welcome/organizations
/welcome/organizations            joined (ticked) · offered by domain [Join] · invited [Join]
                                  Primary organization (when more than one) · Continue → /:org/welcome
```
- Nobody is added without clicking Join. An organization is offered when it claims the user's verified work domain with domain join on, unless the user has been a member there before (removed or left) or has a pending invitation (shown as an invitation instead).
- An invite code works only for the invited email, while the invitation is pending; it is accepted through Better Auth like the mailed link.
- The primary organization is where a new session starts; with one membership it is that one.
- Creating an organization claims the creator's verified work domain (never a public provider). Admins turn it off or on in `/settings/organization`, which shows the domain.

## `/welcome`
- **Your organizations:** each one links to `/:slug/welcome`.
- **Invitations:** pending invitations for the signed-in email, each showing the organization and the role, with Accept. With none: "No invitations for anna@example.se. Ask your admin to invite this email."
- **Create a new organization:** goes to `/welcome/new`.

## `/welcome/new`
- Name, plus the URL `bibi.se/<slug>`. The slug follows the name until the user edits it.
- Live check, 300 ms after typing stops. The states:

| State | Message |
|---|---|
| checking | Checking |
| free | /slug is yours |
| taken | /slug is taken. We picked /slug-2. Use it or change it. |
| reserved | /slug is reserved. Use /slug-2 or change it. |
| invalid | Use 3–40 letters, numbers or dashes |

- The server checks again on create.
- **Time zone** (ADR 0064): a searchable dropdown of IANA zones after name and URL, defaulting to the browser's zone (fallback `Europe/Stockholm`). It is required: the create call carries it in Better Auth's `metadata`, `beforeCreateOrganization` refuses a missing or unknown zone, and `afterCreateOrganization` stores it on the organization's profile and clears `metadata`. Editable later in `/settings/organization`.

## Profile (per user, entered once)
- **`profile`:** first name and last name (prefilled by splitting the sign-up name), phone (required), and an optional avatar (png, jpeg or webp, at most 2 MB; initials when there is none).
- **`hours`:** shows "Mon–Fri 08:00–17:00, lunch 12:00–13:00" with Change and Continue. Change opens a weekday editor (start, end, break) on the same page. Continue saves.
- The profile is complete when first name, last name and phone are set and at least one working-hours row exists.

## Setup (per organization)
- **`organization`:** legal name, org number, street address, postal code, city, country (default SE), website, contact email and phone. The checkbox "This address is also our first venue" is on by default and creates a venue.
- **`kind`:** a grid of the 8 venue kinds, plus a "Start empty" link that skips to review.
- **`bookable` / `sellable`:** the kind's item types as checkboxes, with "+ Add another". A note says more can be added later in Settings → Types.
- **`review`:** a short "You're all set" summary (organization name, the chosen kind and how many types), then Activate (`pipelineSetup.activate`, `actor=user`). It shows no statuses, states or grid: the kind's flow sets them silently. Activate sets the setup status to `COMPLETED`.
- **Skip for now** (on every setup page) sets the status to `SKIPPED`. The organization keeps flow C, which it got at creation. Setup can still be changed later in Settings and through the assistant.
- The draft lives in the `setup` layout and is copied to `sessionStorage`. A step without a draft goes back to `kind`.

## Venue kinds
Not built yet: the flows, state sets and responsibilities below replace the `conference-estate` and `default` templates the presets use today.

| Kind | Bookable (Hold) | Sellable (Order) | Flow |
|---|---|---|---|
| Conference estate | Conference room, Breakout room, Equipment | Coffee break, Lunch, Dinner, Drink, Activity | A |
| Event & congress hall | Hall, Meeting room, Exhibition stand, Equipment | Catering, Coffee break, Drink | A |
| Experience centre | Hall, Guide | Tour, Workshop, Meal, Drink | A |
| Museum | Event space, Guide | Guided tour, Coffee break, Meal | B |
| Restaurant with private rooms | Private room | Set menu, Dish, Drink, Wine package | B |
| Arena hospitality | Lodge, Lounge | Match-day package, Meal, Drink | B |
| Theatre & concert hall | Foyer, Rehearsal room | Pre-show dinner, Drink, Interval package | B |
| Meeting space | Meeting room, Equipment | Coffee break, Lunch | C |
| Start empty, Skip for now | – | – | C |

- Presets live in `packages/core/src/templates/setup-presets`.
- Type names are i18n keys (`welcome.types.*`), so they are created in the language of the member doing the setup.

## Flows
Every booking follows the same arc: enquiry, a provisional hold that lapses, confirmation, final numbers before the event, then the event. The flows differ in whether a written proposal comes first and whether numbers are locked separately.

| Flow | For | Ticket statuses (closing ones last) |
|---|---|---|
| A. Quoted event | Conference and event business, priced per enquiry | Enquiry → Proposal sent → Confirmed → Final numbers → Completed · Lost · Cancelled |
| B. Package booking | Predefined packages, usually without a proposal | Enquiry → Confirmed → Final numbers → Completed · Lost · Cancelled |
| C. Simple | A room is booked or not | Lead → Confirmed → Completed · Lost |

- Transitions are the forward default (ADR 0043): any later status, or any closing status.
- Confirmed, Final numbers and Completed require an assignee. Final numbers in A requires an accepted quote. Completed is invoiceable. Lost and Cancelled require a reason.
- Proposal sent fires `QUOTE_SENT`; Confirmed in A fires `QUOTE_ACCEPTED`.
- There is no site-visit status: most tickets never have one, so it would only be clicked past.

## State sets
Each item type gets one set from its capability. Food is a part of a booking (lunch with a conference room), not a restaurant order.

| Set | Types | States (initial first) |
|---|---|---|
| Hold | `BOOKABLE` types: rooms, halls, lodges, guides, equipment | Prebooked (soft hold, expires) → Booked (hard hold, in work orders) → Released |
| Order | Every other type: food, drink, menus, tours, workshops, activities | Estimated → Ordered → Locked (in work orders) → Released |

- Released is the expiry state of both sets.
- A type added later in Settings gets the set of its capability.

## Grid
Cells per open status; closing statuses release every line.

| Status | Hold | Order |
|---|---|---|
| Enquiry, Proposal sent, Lead | Prebooked | Estimated |
| Confirmed | Booked | Ordered (C: Locked, since C has no Final numbers) |
| Final numbers | Booked | Locked |

## Responsibilities
Created with the flow, each with the member who activates the setup as default assignee (ADR 0034). Names are i18n keys like the types.

| Flow | Responsibility | Types |
|---|---|---|
| A | Sales | the ticket itself |
| A | Coordinator | Hold types and Order types that are not food or drink |
| A | Kitchen | Order types that are food or drink |
| B | Bookings | Hold types and Order types that are not food or drink |
| B | Kitchen | Order types that are food or drink |
| C | – | – |

- Whether a preset type is food or drink is part of the preset data.
