// E2E ONLY. The scripted first setup (ADR 0045) on `/onboarding`: load the skill, three questions,
// a preset draft and its preview. Used by `e2e-mock-model.ts`; never elsewhere.
import { draftFromPreset } from "@okazi/core/pipeline-setup-templates";
import {
  lastToolResult,
  lastUserText,
  type PromptInput,
  type StreamResult,
  systemText,
  textStep,
  toolCallCount,
  toolStep,
} from "./e2e-mock-steps";

const QUESTIONS = [
  {
    question: "What kind of place do you run?",
    choices: [
      { value: "conference-estate", label: "A conference venue" },
      { value: "restaurant", label: "A restaurant with private rooms" },
    ],
  },
  {
    question: "What do you sell?",
    choices: [
      { value: "rooms", label: "Rooms" },
      { value: "both", label: "Rooms, food and drink" },
    ],
  },
  {
    question: "Do your customers usually get a quote before they book?",
    choices: [
      { value: "quote-first", label: "Yes, a quote first" },
      { value: "book-directly", label: "No, they book straight away" },
    ],
  },
] as const;

/** The one-click follow-up that accepts the first version, in both locales. */
const APPROVE_TEXTS = ["Looks good", "Ser bra ut"];

const ask = ({ index }: { index: number }) =>
  toolStep({ toolName: "ask_question", input: { ...QUESTIONS[index], allowOther: true } });

/** True on `/onboarding`, where the system prompt carries the first-setup section. */
export const isFirstSetup = ({ prompt }: PromptInput): boolean =>
  systemText({ prompt }).includes("## First setup");

/** The next step of the first setup, decided from the conversation so far. */
export function firstSetupStep({ prompt }: PromptInput): StreamResult {
  const tool = lastToolResult({ prompt });
  if (tool === "load_skill") return ask({ index: 0 });
  if (tool === "pipelineSetup_presetDraft") {
    const draft = draftFromPreset({ key: "conference-estate", existingTypes: [] });
    return toolStep({ toolName: "pipelineSetup_preview", input: draft });
  }
  if (tool !== null) return textStep({ text: "Here is a first version. Nothing is saved yet." });
  if (APPROVE_TEXTS.includes(lastUserText({ prompt }))) {
    const draft = draftFromPreset({ key: "conference-estate", existingTypes: [] });
    return toolStep({ toolName: "pipelineSetup_activate", input: draft });
  }
  const asked = toolCallCount({ prompt, toolName: "ask_question" });
  if (asked === 0) return toolStep({ toolName: "load_skill", input: { slug: "first-setup" } });
  if (asked < QUESTIONS.length) return ask({ index: asked });
  return toolStep({ toolName: "pipelineSetup_presetDraft", input: { key: "conference-estate" } });
}
