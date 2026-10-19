/**
 * The models the demo seed configures for the AI features (ADR 0015, `/admin/ai-models`), so the
 * assistant and the onboarding work right after `seed:demo`. Vercel AI Gateway ids; a platform
 * admin can change every one of them. Keyed by `AI_FEATURES` id (a test checks all are covered).
 */
export const DEMO_AI_MODELS = {
  "assistant.chat": "anthropic/claude-sonnet-4.5",
  onboarding: "anthropic/claude-sonnet-4.5",
  "search.embedding": "openai/text-embedding-3-small",
} as const;
