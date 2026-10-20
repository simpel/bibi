// E2E ONLY. A scripted language model for the Playwright suite (ADR 0007: the approval flow is
// tested "with a mocked model"). It is imported dynamically from `assistant-handlers.ts` and only
// when `E2E_MOCK_MODEL` is on outside production (`mock-model-policy.ts`). Never use it elsewhere.
import { MockLanguageModelV4 } from "ai/test";
import { firstSetupStep, isFirstSetup } from "./e2e-mock-first-setup";
import {
  lastToolResult,
  lastUserText,
  type PromptInput,
  type StreamResult,
  textStep,
  toolStep,
} from "./e2e-mock-steps";

/**
 * Script: on `/onboarding` the first setup (`e2e-mock-first-setup.ts`); elsewhere "create venue
 * <name>", "set capacity <itemId> <setupId> <n>",
 * "rename responsibility <id> <name>", "list venues", "list skills"; anything else
 * gets a canned reply.
 */
function respond({ prompt }: PromptInput): StreamResult {
  if (isFirstSetup({ prompt })) return firstSetupStep({ prompt });
  if (lastToolResult({ prompt }) !== null) return textStep({ text: "Klart. Se resultatet ovan." });
  const text = lastUserText({ prompt }).trim();
  const create = /create venue (.+)/i.exec(text);
  if (create?.[1]) return toolStep({ toolName: "venue_create", input: { name: create[1].trim() } });
  const capacity = /set capacity (\S+) (\S+) (\d+)/i.exec(text);
  if (capacity?.[1] && capacity[2] && capacity[3]) {
    const setups = [{ setupId: capacity[2], capacity: Number(capacity[3]) }];
    return toolStep({ toolName: "item_update", input: { id: capacity[1], setups } });
  }
  const rename = /rename responsibility (\S+) (.+)/i.exec(text);
  if (rename?.[1] && rename[2]) {
    const input = { id: rename[1], name: rename[2].trim() };
    return toolStep({ toolName: "responsibility_update", input });
  }
  if (/list venues/i.test(text)) return toolStep({ toolName: "venue_list", input: {} });
  if (/list skills/i.test(text)) return toolStep({ toolName: "skill_list", input: {} });
  return textStep({ text: "I am a scripted test assistant. Try: create venue Test Hall." });
}

export function createE2eMockModel(): MockLanguageModelV4 {
  return new MockLanguageModelV4({
    modelId: "e2e-mock-model",
    doStream: async ({ prompt }) => respond({ prompt }),
  });
}
