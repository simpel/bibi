// E2E ONLY. A deterministic model for `orderDraft.fromMessage` (ADR 0084): imported dynamically
// by the apps when `E2E_MOCK_MODEL` is on outside production. Never use it elsewhere.
import { MockLanguageModelV4 } from "ai/test";

const evidence = ({ quote, guessed = false }: { quote: string; guessed?: boolean }) => ({
  quote,
  guessed,
});

/**
 * The draft it always returns, written for the E2E request "A wine tasting for 14 people on
 * Friday 21 November, around 3 pm. Two of us are vegan." The end time is guessed.
 */
export const E2E_DRAFT = {
  senderName: null,
  company: null,
  email: null,
  phone: null,
  date: {
    asWritten: "21 November",
    year: null,
    month: 11,
    day: 21,
    ...evidence({ quote: "21 November" }),
  },
  start: { asWritten: "around 3 pm", time: "15:00", ...evidence({ quote: "around 3 pm" }) },
  end: { asWritten: "", time: "17:00", ...evidence({ quote: "", guessed: true }) },
  headcount: { value: 14, ...evidence({ quote: "14 people" }) },
  wish: { value: "A wine tasting", ...evidence({ quote: "A wine tasting" }) },
  packageName: null,
  needs: [],
  notes: null,
};

const usage = {
  inputTokens: { total: 10, noCache: 10, cacheRead: undefined, cacheWrite: undefined },
  outputTokens: { total: 20, text: 20, reasoning: undefined },
};

/** The scripted model: every call answers `E2E_DRAFT` as JSON text. */
export function createE2eDraftModel(): MockLanguageModelV4 {
  return new MockLanguageModelV4({
    modelId: "e2e-draft-model",
    doGenerate: async () => ({
      content: [{ type: "text", text: JSON.stringify(E2E_DRAFT) }],
      finishReason: { unified: "stop", raw: undefined },
      usage,
      warnings: [],
    }),
  });
}
