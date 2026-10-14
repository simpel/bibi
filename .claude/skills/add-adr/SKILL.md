---
name: add-adr
description: Write a new decision record (ADR) in `docs/decisions/NNNN-title.md`, in English. Use when an architecture or product decision should be logged or changed.
---

# New ADR

1. Next number: highest `NNNN` in `docs/decisions/` + 1. Filename `NNNN-short-title.md` (lowercase, hyphens). The content is in English.
2. Structure (see `0010-web-data-access.md`):
   ```
   # NNNN – Title

   - **Date:** YYYY-MM-DD
   - **Status:** Proposed | Accepted | Superseded by NNNN

   ## Context
   ## Decision
   ## Consequences
   ```
3. English. Short bullet points. Refer to related ADRs by number.
4. If the decision changes an earlier ADR: set the old one to "Superseded by NNNN", or add a dated "Addendum" (as in 0010) when the decision is only extended.
5. If the decision affects `CLAUDE.md` (stack, principles, open questions), update it in the same change.
