/**
 * The models the demo seed configures for the AI features (ADR 0015, `/admin/ai-models`), so the
 * assistant and the onboarding work right after `seed:demo`. Vercel AI Gateway ids, checked
 * against its catalog (`GET https://ai-gateway.vercel.sh/v1/models`: language with the `tool-use`
 * tag, embedding of 1536 dimensions); a superadmin can change every one of them.
 * Keyed by `AI_FEATURES` id, so a new feature without an entry here fails to typecheck.
 */
export const DEMO_AI_MODELS = {
  "assistant.chat": "anthropic/claude-sonnet-5.5",
  onboarding: "anthropic/claude-sonnet-5.5",
  "search.embedding": "openai/text-embedding-3-small",
} as const;
