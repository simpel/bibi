# 0009 – Language in code and UI, and code rules

- **Date:** 2026-10-13
- **Status:** Accepted
- **Amended:** 2026-10-14 (English only), 2026-11-04 (action verb taxonomy)

## Context
- The team works in Swedish, but the codebase must be developable by more people and by AI tools.
- Entity names shape APIs and AI tools. The UI is Swedish for Swedish customers and English for others.

## Decision
1. Code, entity names, API fields, tool names, comments, docs, ADRs, skills, prompts, commits, issues and PRs are English.
2. Swedish appears only in translations and in test input that specifically exercises Swedish text.
3. All UI text goes through next-intl in sv and en. No hardcoded strings.
4. Verbs are a controlled vocabulary in sv and en: Create (Skapa) for new entities, never New; Add for attaching to a list; Edit; Delete for destroying; Remove for detaching; Save. Actions read `[Verb] + [Noun]`.
5. The code rules (file size, named exports, no barrels, one object parameter, strict TypeScript, Zod at boundaries) live in the root `CLAUDE.md` and are checked by `pnpm check:structure` and Biome.

## Rejected
- Swedish entity names: APIs and MCP tools would be inconsistent for international integrations.
- Swedish documentation: replaced by English only on 2026-10-14.

## Consequences
- Every new string needs two translations; this is mechanical work.
- Small files with one idea each keep AI context small and review easy.
- Rules that can be automated should be; the rest are checked in review.
