import { ASK_QUESTION_TOOL } from "../questions/ask-question-tool";
import { AskedQuestionSchema } from "../questions/question-schema";
import type { ToolUiEntry } from "./tool-ui-types";
import { uiEntry } from "./ui-entry";

/** Tool → component for questions to the user (ADR 0045): a questionnaire in the chat. */
export const QUESTION_UI_ENTRIES: Readonly<Record<string, ToolUiEntry>> = {
  [ASK_QUESTION_TOOL]: uiEntry({
    component: "questionnaire",
    schema: AskedQuestionSchema,
    toProps: ({ value }) => ({ question: value }),
  }),
};
