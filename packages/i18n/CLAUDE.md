# @bibi/i18n – localization and copy standards

Localized string catalogues for Swedish (`sv`) and English (`en`) powered by `next-intl`.

## Structure
- `messages/sv/*.json` – source of truth for message keys.
- `messages/en/*.json` – English translations matching every key in `sv`.
- `src/catalog.ts` – bundles catalogue registration.
- `src/check-messages.ts` and `src/check-messages.test.ts` – key parity test between `sv` and `en`.

## Controlled Vocabulary & Action Verb Taxonomy
All user-facing copy adheres to a strict controlled vocabulary and an **Action-First Pattern** (`[Action Verb] + [Noun]`):

1. **"Create" over "New" (Strict):**
   - For anything that creates an entity, record, or resource, always use the active imperative verb **Create** (Swedish: *Skapa*), never *New* (Swedish: *Ny*).
   - Applies to buttons, tooltips, action menus, modals, empty states, and breadcrumbs.
   - Examples:
     - `Create order` / `Skapa bokning` (not *New order* / *Ny bokning*)
     - `Create customer` / `Skapa kund` (not *New customer* / *Ny kund*)
     - `Create package` / `Skapa mall` (not *New package* / *Ny mall*)
     - `Create board` / `Skapa tavla` (not *New board* / *Ny tavla*)
     - `Create chat` / `Skapa chatt` (not *New chat* / *Ny chatt*)
     - `Create conversation` / `Skapa konversation` (not *New conversation* / *Ny konversation*)

2. **Standard CRUD Verbs:**
   | Action | English | Swedish | Usage | Avoid |
   | :--- | :--- | :--- | :--- | :--- |
   | **Creation** | **Create** | **Skapa** | Creating a new entity from scratch | New, Add, Make, Generate |
   | **Association** | **Add** | **Lägg till** | Attaching existing entity or sub-item to a container | Create, Link, Attach |
   | **Modification** | **Edit** | **Redigera** / **Ändra** | Modifying details of an existing entity | Change, Modify, Update |
   | **Destruction** | **Delete** | **Ta bort** / **Radera** | Permanently destroying a record | Remove, Trash, Kill |
   | **Disassociation** | **Remove** | **Ta bort** / **Koppla bort** | Detaching without deleting the record | Delete, Detach |
   | **Confirmation** | **Save** | **Spara** | Persisting form input | Submit, Done, Apply |

3. **Key Parity:**
   - Every key in `messages/sv/<bundle>.json` must exist in `messages/en/<bundle>.json` with identical interpolation tokens (`{name}`, `{count, plural, ...}`).

## Commands
- `pnpm --filter @bibi/i18n test` – runs message key parity tests.
