# 0007 – AI-first UX

- **Date:** 2026-10-13
- **Status:** Accepted

## Context
Users at venues (sales staff, coordinators, kitchen) work through many steps between first contact, quote, delivery and sheet. An AI assistant that only answers questions is not enough. The assistant must be able to perform actions, but never without the user's approval, and it must follow the same permissions as the user.

## Decision
- The Vercel AI SDK drives the UI for chat and tool calls. Models are reached through Vercel AI Gateway. The provider is replaceable, and the model is chosen per feature in configuration. Claude is the default.
- The web app is an MCP client against `apps/mcp` over HTTP, acting as the signed-in user. The assistant therefore uses the same tools, permissions and scoping as external clients. No special path into the service layer.
- v1 UI:
  - Assistant panel on all pages, with page context (active organization, route and entity).
  - ⌘K command bar for natural language.
  - Generative UI: a registry maps result types to `@bibi/ui` components.
  - Approval: mutations are shown as proposals on a card. The user confirms or cancels. Audit logs `actor=ai` and the conversation ID.
- Conversations and messages are stored per organization and user. They are core operations and follow the parity rule (ADR 0003).
- Models and prompts for features are configured in `packages/ai`, not in app code.

## Consequences
- Because the assistant uses the MCP surface, the MCP tools must have good descriptions and Zod schemas. That is a precondition for it to work.
- Every new feature must be usable through MCP and have a generative UI component for its results. This becomes part of the Definition of Done.
- The approval flow is security-critical. It is reviewed at Opus level and tested in Playwright with a mocked model.
- Conversations contain business data and are therefore stored with the same org scoping and audit as other data.
- We depend on AI Gateway. Cost and latency follow the provider's prices and models.

## Addenda
- 2026-10-17: the assistant is the home page `/`, not a panel on every page (ADR 0035); ⌘K starts a conversation there.
- 2026-10-14: models are chosen per feature by a superadmin in `/admin/ai-models`, with no default and no env variable (ADR 0015).
