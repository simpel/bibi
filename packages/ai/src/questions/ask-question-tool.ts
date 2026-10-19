import { tool } from "ai";
import { type AskedQuestion, QuestionSchema } from "./question-schema";

export const ASK_QUESTION_TOOL = "ask_question";

/**
 * Local tool: shows the user one question with clickable answers (a questionnaire in the chat).
 * It changes nothing. The answer arrives as the user's next message, so the run stops after the
 * call (`hasToolCall` in `streamChat`): the model never answers its own question.
 */
export function createAskQuestionTool() {
  return tool({
    description:
      "Ask the user one short question with 2 to 6 answers to click, and an optional free-text " +
      "answer. Use it instead of asking in plain text when the answers are known in advance. " +
      "Ask one question per call. Your turn ends with the call: the user's answer arrives as " +
      "the next message.",
    inputSchema: QuestionSchema,
    execute: async (question): Promise<AskedQuestion> => ({ status: "asked", ...question }),
  });
}
