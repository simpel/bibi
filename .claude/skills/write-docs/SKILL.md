---
name: write-docs
description: Change documentation only (docs, ADR addenda, skills, CLAUDE.md), with every claim checked against the code. Use for tickets of Kind Docs.
---

# Write documentation

1. **Documentation only.** Allowed: `docs/**`, `*.md`, `.claude/skills/**`, `CLAUDE.md`. A code file in the change is sent back. Only lint and `check:structure` run.
2. **Check every claim before you write it.** Every path, command, file, operation and name you mention must exist: confirm with `ls` or `rg`. Describe what is built as built and what is only decided as "accepted, not built yet" with the issue that builds it. ADR 0021 described a bundle expansion that was never built.
3. **Keep the domain model in step:** `docs/domain-model.md` and `docs/artifacts/domain-model.html` change together.
4. **ADRs, specs and rules:** use the `add-adr` skill for a decision. Addenda are dated one-line pointers; the current behaviour goes in `docs/specs/`, and a rule in the nearest `CLAUDE.md`, never in an ADR body.
5. **Style:** English, short bullets, no filler. Swedish only in `packages/i18n/messages/sv.json`.
6. The commit and PR title is `docs: <summary>` (ADR 0060).
