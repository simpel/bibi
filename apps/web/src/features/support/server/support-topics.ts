import "server-only";
import { resolveLocale } from "@bibi/i18n";
import { getTranslations } from "next-intl/server";
import { z } from "zod";

const questionSchema = z.object({ question: z.string(), answer: z.string() });

const topicsSchema = z.record(
  z.string(),
  z.object({
    title: z.string(),
    description: z.string(),
    questions: z.record(z.string(), questionSchema),
  }),
);

export type SupportQuestion = { id: string; question: string; paragraphs: string[] };

export type SupportTopic = {
  id: string;
  title: string;
  description: string;
  questions: SupportQuestion[];
};

/** `raw` of a whole subtree is untyped in next-intl; Zod checks its shape instead. */
type RawTranslator = { raw(key: string): unknown };

export type LoadSupportTopicsInput = { locale: string };

/**
 * Topics and questions in message order (`support.topics`). The messages are the registry: adding
 * a question to `support.json` (sv and en) is all it takes to show it. Answers split on newlines.
 */
export async function loadSupportTopics({
  locale,
}: LoadSupportTopicsInput): Promise<SupportTopic[]> {
  const t = (await getTranslations({
    locale: resolveLocale({ value: locale }),
    namespace: "support",
  })) as unknown as RawTranslator;
  const topics = topicsSchema.parse(t.raw("topics"));
  return Object.entries(topics).map(([id, topic]) => ({
    id,
    title: topic.title,
    description: topic.description,
    questions: Object.entries(topic.questions).map(([questionId, { question, answer }]) => ({
      id: `${id}-${questionId}`,
      question,
      paragraphs: answer.split("\n").filter((line) => line.trim() !== ""),
    })),
  }));
}
