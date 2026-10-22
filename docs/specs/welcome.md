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

## `/welcome`
- **Your organizations:** each one links to `/:slug/welcome`.
- **Invitations:** pending invitations for the signed-in email, each showing the organization, the inviter and the role, with Accept. With none: "No invitations for a•••@example.se. Ask your admin to invite this email."
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

## Profile (per user, entered once)
- **`profile`:** first name and last name (prefilled by splitting the sign-up name), phone (required), and an optional avatar (png, jpeg or webp, at most 2 MB; initials when there is none).
- **`hours`:** shows "Mon–Fri 08:00–17:00, lunch 12:00–13:00" with Change and Continue. Change opens a weekday editor (start, end, break) on the same page. Continue saves.
- The profile is complete when first name, last name and phone are set and at least one working-hours row exists.

## Setup (per organization)
- **`organization`:** legal name, org number, street address, postal code, city, country (default SE), website, contact email and phone. The checkbox "This address is also our first venue" is on by default and creates a venue.
- **`kind`:** a 3×3 grid of venue kinds, plus a "Start empty" link that skips to review.
- **`bookable` / `sellable`:** the kind's item types as checkboxes, with "+ Add another". A note says more can be added later in Settings → Types.
- **`review`:** the chosen types and the phase path, then Activate (`pipelineSetup.activate`, `actor=user`). This sets the setup status to `COMPLETED`.
- **Skip for now** (on every setup page) sets the status to `SKIPPED`. Setup can still be changed later in Settings and through the assistant.
- The draft lives in the `setup` layout and is copied to `sessionStorage`. A step without a draft goes back to `kind`.

## Venue kinds
Full = the `conference-estate` phases; Simple = the `default` phases.

| Kind | Bookable | Sellable | Phases |
|---|---|---|---|
| Conference estate | Conference room, Breakout room, Equipment | Coffee break, Lunch, Dinner, Drink, Activity | Full |
| Manor house | Banquet hall, Meeting room, Garden | Dinner menu, Drink package, Coffee break, Activity | Full |
| Experience centre | Hall, Guide | Tour, Workshop, Meal, Drink | Full |
| Museum | Event space, Guide | Guided tour, Coffee break, Meal | Simple |
| Restaurant with private rooms | Private room | Set menu, Dish, Drink, Wine package | Simple |
| Event & congress hall | Hall, Meeting room, Exhibition stand, Equipment | Catering, Coffee break, Drink | Full |
| Arena hospitality | Lodge, Lounge | Match-day package, Meal, Drink | Simple |
| Theatre & concert hall | Foyer, Rehearsal room | Pre-show dinner, Drink, Interval package | Simple |
| Meeting space | Meeting room, Equipment | Coffee break, Lunch | Simple |
| Start empty | – | – | Simple |

- Presets live in `packages/core/src/templates/setup-presets`.
- Type names are i18n keys (`welcome.types.*`), so they are created in the language of the member doing the setup.
