/** Bounds for one assistant run. Tune here, not in callers. */
export const ASSISTANT_LIMITS = {
  /** Model steps (each tool round-trip is one step). */
  maxSteps: 8,
  maxOutputTokens: 4096,
  totalTimeoutMs: 120_000,
  stepTimeoutMs: 60_000,
  /** Earlier messages (from the database) sent to the model. */
  maxHistoryMessages: 40,
  /** Max characters of the user's new message. */
  maxUserTextChars: 20_000,
  /** Conversation title derived from the first user message. */
  titleChars: 80,
  /** PUBLISHED skills listed in the system prompt. */
  maxPromptSkills: 8,
} as const;
