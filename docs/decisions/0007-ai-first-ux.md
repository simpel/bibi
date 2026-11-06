# 0007 – AI-first UX

- **Date:** 2026-10-13
- **Status:** Accepted

## Context
- Staff work through many steps from first contact to run sheet. An assistant that only answers questions is not enough.
- The assistant must be able to act, but never without the user's approval, and with the user's permissions.

## Decision
1. The Vercel AI SDK drives chat and tool calls, reached through Vercel AI Gateway. The provider is replaceable and the model is configured per feature. Claude is the default. A superadmin chooses models in `/admin/ai-models`, with no default and no env variable (ADR 0015).
2. The assistant is an MCP client against `apps/mcp` as the signed-in user. It gets the same tools, permissions and scoping as external clients, and no special path into the service layer.
3. Mutations appear as proposals on a card. The user confirms or cancels. Audit logs `actor=ai` and the conversation id.
4. A registry maps result types to generative UI components in `@bibi/ui`.
5. Conversations and messages are stored per organization and user, as core operations with parity (ADR 0003).
6. Models and prompts live in `packages/ai`, not in app code.
7. The assistant is the home page, and the command bar starts a conversation there (ADR 0035).

## Rejected
- A privileged internal path for the assistant: it would bypass permissions and audit.
- Autonomous mutations without approval.

## Consequences
- MCP tools need good descriptions and Zod schemas, or the assistant fails.
- Every feature must work through MCP and have a generative UI component for its results.
- The approval flow is security-critical: Opus review and Playwright tests with a mocked model.
- Conversations hold business data and get the same scoping and audit as other data.
- We depend on AI Gateway for cost and latency.
