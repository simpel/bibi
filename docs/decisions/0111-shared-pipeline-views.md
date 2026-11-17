# 0111 – Pipeline views are personal and shared

- **Date:** 2026-11-15
- **Status:** Accepted (the user's decision, 2026-11-15: anyone creates a pipeline view and shares it with specific members or the whole organization; one default view)
- **Amends:** 0067 (boards were organization configuration, made and ordered by `board:write`)
- **Related:** 0050, 0051, 0056, 0076

## Context
- A board (pipeline view) was organization configuration: only managers (`board:write`) could make one, and everyone saw every board.
- Staff want their own views of the same orders (a coordinator's week, a sales funnel) without asking a manager, and to hand a view to a colleague or the whole team.

## Decision
1. Every organization has exactly one **default view** (`Board.isDefault`). It is shared with the whole organization, cannot be made private or archived, and only `board:write` configures it (managers and admins, as before).
2. Any member with `board:read` (everyone: boards are always visible, ADR 0050) creates a view. They own it (`Board.ownerId`) and it starts private.
3. A view is shared with the whole organization (`Board.sharedWithOrganization`) and/or with specific members (`BoardShare` rows, ADR 0056). A caller sees the default view, views shared with the organization, their own views and views shared with them. A view they may not see is `NOT_FOUND`. An API key or SYSTEM (no user) sees every view.
4. Everyone who sees a view edits it: name, filter and columns. Only its owner, or a holder of `board:delete`, changes its sharing (`board.share`) or archives it.
5. Views are listed default first, then by name. `board.reorder` and `Board.position` are removed.
6. A view's name is unique per owner, not per organization.

## Rejected
- Keep boards as organization configuration with a per-member hide list: everyone's experiments would clutter everyone's switcher.
- Store personal views in user preferences (like saved views on lists): a shared view needs one row many members edit, with columns (`BoardPhase`) that reference statuses by foreign key.
- Only the owner edits a shared view: the user chose that everyone it is shared with may change it.

## Consequences
- Board commands run on `board:read` and check the view in the handler (visibility, default, owner). `board:write` keeps its meaning: the default view, the organization's shared configuration.
- The migration marks each organization's first board the default and shares every other board with the organization, owned by whoever created it.
- The demo seed keeps only the default view.
