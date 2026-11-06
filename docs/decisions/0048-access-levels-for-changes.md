# 0048 – Access levels for changes

- **Date:** 2026-10-19
- **Status:** Superseded by 0050
- **Related:** 0034, 0007, 0003

This ADR gave every resource one of three access levels in a single table: operational (manager and admin write), configuration (admin writes) and personal (everyone, their own). The fixed role map was built from it. The assistant listed only the commands the caller could run, knew the user's role and explained plainly when a change needed an admin instead of proposing a card that would fail. ADR 0050 replaced the levels with `<feature>:<action>` permissions, role presets and per-member overrides. The assistant and approval card follow effective permissions.
