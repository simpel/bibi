# 0020 – Custom roles per organization

- **Date:** 2026-10-14
- **Status:** Superseded by 0034

This ADR replaced four fixed levels (`viewer < member < admin < owner`) with roles defined per organization, stored through Better Auth's dynamic access control, each a named set of `<resource>:read|write|admin` permissions. Auth would resolve a member's roles once per call into the context, and `owner` stayed fixed so an organization could not lock itself out. ADR 0034 replaced it with three fixed role presets (member, manager, admin) of `<feature>:<action>` permissions that admins fine-tune per member or API key (ADR 0050).
