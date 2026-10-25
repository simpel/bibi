# Member profiles

Behaviour spec for [ADR 0068](../decisions/0068-member-profiles-positions-and-shifts.md). Entities: `MemberProfile` and `MemberProfileItem` in [the domain model](../domain-model.md).

## Profile
- A member has at most one profile per organization. It is created on the first write (`memberProfile.update` or `memberProfile.setItems`) and removed with the member.
- `memberProfile.get` of a member who never saved one answers the defaults: `PATTERN` and no items, with `id: null`.
- It is separate from the global `UserProfile` (name, phone, avatar). Access level stays on the member.

## Schedule kind
- `PATTERN`: weekly pattern with exceptions (default).
- `SHIFTS`: dated shifts only.
- `CASUAL`: no schedule, called in when needed.
- Advisory. Nothing is refused because of it.

## Staff item links
- Only items of a type with `resourceKind` PERSON can be linked (otherwise `VALIDATION` on `itemIds.<i>`).
- An item is linked to at most one profile; linking one that belongs to another member is `CONFLICT`. A staff item without a link stays valid.
- `memberProfile.setItems` replaces the set. Duplicate ids count once; an empty list unlinks all.
- An archived item's link is kept but hidden: reads do not show it and it is not a position. Replacing the set keeps it. It still blocks linking the item to another member.

## Positions
- Positions are derived: the types of the member's active linked staff items. There is no position list. A person with two positions has two staff items.

## Permissions
- Reads need `item:read`, writes need `item:write` (ADR 0050).
- The member must be readable by the caller (`member:read`), otherwise `refused as for any member read.
- Writes are audited on the profile.

## Operations
- `memberProfile.get { memberId }`
- `memberProfile.list { limit, cursor?, itemIds?, memberIds? }`: saved profiles only; `itemIds` finds who is behind a staff item (active items).
- `memberProfile.update { memberId, scheduleKind }`
- `memberProfile.setItems { memberId, itemIds }`

All four exist in web, GraphQL, REST and MCP.

## Not built yet
- Working hours per organization (#449).
- Shifts, on-shift ranking and warnings (#450).
- Person-wide collision: two staff items of one person can still be held at once (#451).
