import { useTranslations } from "next-intl";
import { useDateTimeFormat } from "@/lib/time/use-date-time-format";
import type { OpenQuestion } from "./open-questions";
import { useDraftFieldName } from "./use-draft-field-name";

const MINUTE = 60_000;

/** "+1 h 30 min", "−45 min": how far the lines move. */
export function useDelta() {
  const t = useTranslations("ticketIntake.questions");
  return ({ deltaMs }: { deltaMs: number }) => {
    const minutes = Math.round(Math.abs(deltaMs) / MINUTE);
    const sign = deltaMs < 0 ? "−" : "+";
    return t("delta", { sign, hours: Math.floor(minutes / 60), minutes: minutes % 60 });
  };
}

/** The question as the review's yellow panel asks it (spec "Open questions"). */
export function useOpenQuestionText() {
  const t = useTranslations("ticketIntake.questions");
  const dates = useDateTimeFormat();
  const delta = useDelta();
  const fieldName = useDraftFieldName();
  return ({ question }: { question: OpenQuestion }): string => {
    switch (question.kind) {
      case "START_CHANGED": {
        const from = dates.dateTime({ instant: question.from });
        const to = dates.dateTime({ instant: question.to });
        return t("startChanged", { from, to, delta: delta(question) });
      }
      case "NO_LINES":
        return t("noLines");
      case "ZERO_QUANTITY":
        return t("zeroQuantity", { line: question.name });
      case "OVER_QUANTITY": {
        const { name: line, count, quantity } = question;
        const what = question.what === "CHOICES" ? "choices" : "needs";
        return t("overQuantity", { line, count, quantity, what });
      }
      case "POOL_SHORT":
        return t("poolShort", {
          line: question.name,
          needed: question.needed,
          free: question.free,
        });
      case "GUESSED":
        return t("guessed", { field: fieldName({ field: question.field }), value: question.value });
      case "TYPE_FIELD":
        return t("typeField", { type: question.typeName, field: question.fieldName });
      case "PACKAGE_NAME":
        return t("packageName");
    }
  };
}
