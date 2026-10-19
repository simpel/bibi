import { z } from "zod";

/** One answer the user can pick with a click. */
export const QuestionChoiceSchema = z.object({
  value: z
    .string()
    .trim()
    .min(1)
    .max(64)
    .regex(/^[a-z0-9-]+$/)
    .describe("Stable key, e.g. rooms-and-food"),
  label: z.string().trim().min(1).max(120).describe("What the user sees, in their language"),
  description: z.string().trim().max(200).optional().describe("One short line under the label"),
});

/**
 * A question for the user (`ask_question`): single choice, plus a free-text answer when
 * `allowOther` is on. The answer comes back as the user's next chat message.
 */
export const QuestionSchema = z.object({
  question: z.string().trim().min(1).max(200).describe("The question, in plain words"),
  description: z.string().trim().max(300).optional().describe("One short line of help"),
  choices: z.array(QuestionChoiceSchema).min(2).max(6).describe("The answers to pick from"),
  allowOther: z
    .boolean()
    .default(true)
    .describe("Also offer a free-text answer in the user's own words"),
});

export type QuestionChoice = z.infer<typeof QuestionChoiceSchema>;
export type Question = z.infer<typeof QuestionSchema>;

/** The question as the tool result carries it; the chat renders it as a questionnaire. */
export const AskedQuestionSchema = QuestionSchema.extend({
  status: z.literal("asked"),
  allowOther: z.boolean(),
});

export type AskedQuestion = z.infer<typeof AskedQuestionSchema>;
