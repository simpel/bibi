# 0009 – Language in code and UI, and code rules

- **Date:** 2026-10-13
- **Status:** Accepted
- **Amended:** 2026-10-14 (English only, see Addendum)

## Context
The team worked in Swedish for documentation and product, but the codebase must be developable by more people and by AI tools. Entity names have a large impact on APIs and AI tools. At the same time, the user interface is in Swedish for customers in Sweden and in English for international users. The language choice for entity names has been open in CLAUDE.md.

## Decision
### Language
- Code, entity names, API fields, tool names and comments in English. See the glossary in `docs/domain-model.md` for the sv↔en translation.
- Documentation (`docs/`, ADRs and CLAUDE.md) in Swedish. (Superseded by the Addendum below.)
- All UI text goes through next-intl with messages for Swedish and English. No hardcoded strings in components.

### Code rules
- Max 150 lines per file and max 40 lines per function. One idea per file.
- Named exports only. `default` only for Next.js page, layout and route.
- No barrel files except a package's `src/index.ts`.
- Functions take one typed object as a parameter.
- Strict TypeScript without `any`. Zod at all boundaries.
- Environment variables only through `@okazi/config`.
- Typed `AppError` and `Result`. No thrown strings.
- Feature folders with fixed file names: `schema.ts`, `operations.ts`, `graphql.ts`, `rest.ts`, `mcp.ts`, `ui/`.
- UI only through `@okazi/ui`. Variants with cva. Tokens in one file.
- Compliance is checked by `pnpm check:structure` and Biome in CI.

## Consequences
- English names make APIs and MCP tools consistent for international integrations. Swedish terms remain in the UI.
- Every new string requires two translations. Haiku subagents can do this mechanically.
- The rule of 150 lines and one idea per file produces more small files. That is intentional, because it makes AI tools' context smaller and review easier.
- Code rules that can be automated should be. The rest are checked in code review.

## Addendum 2026-10-14 – English only
- All code, comments, documentation, ADRs, CLAUDE.md and AGENTS.md files, skills, AI prompts, commit messages, issues and pull requests are written in English.
- Swedish appears only in translations (`packages/i18n/messages/sv.json`) and in test inputs that specifically exercise Swedish text (for example handling of Swedish characters).
- UI text still goes through next-intl, in sv and en.
- This replaces the earlier rule that documentation is written in Swedish.
