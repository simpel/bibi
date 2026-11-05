import { useTranslations } from "next-intl";
import { DRAFT_FIELDS } from "./message-draft";

/** A draft field's name as the panel and the questions show it ("the date", "the end time"). */
export function useDraftFieldName() {
  const t = useTranslations("orderIntake.message.fields");
  return ({ field }: { field: string }): string => {
    const known = DRAFT_FIELDS.find((candidate) => candidate === field);
    return known ? t(known) : field;
  };
}
