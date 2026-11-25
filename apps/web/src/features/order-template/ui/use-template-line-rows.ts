import type { OrderTemplateDto } from "@bibi/core/schemas";
import { useTranslations } from "next-intl";
import { nameOf } from "@/components/form/named-option";
import { splitMinutes } from "../lib/line-time";
import type { OrderTemplateFormData } from "./order-template-form-data";

/** One line of the template as its table shows it, with its place in the template's lines. */
export type TemplateLineRow = {
  index: number;
  id: string;
  name: string;
  item: string;
  start: string;
  length: string;
  quantity: string;
};

export type UseTemplateLineRowsInput = { template: OrderTemplateDto; data: OrderTemplateFormData };

/** The template's lines in order, in words: "30 min after the start", "1 h 30 min", "The headcount". */
export function useTemplateLineRows({
  template,
  data,
}: UseTemplateLineRowsInput): TemplateLineRow[] {
  const t = useTranslations("orderTemplate");
  const span = ({ minutes }: { minutes: number }) => {
    const parts = splitMinutes({ minutes });
    return [
      parts.hours > 0 ? t("time.hours", { count: parts.hours }) : null,
      parts.minutes > 0 || parts.hours === 0 ? t("time.minutes", { count: parts.minutes }) : null,
    ]
      .filter(Boolean)
      .join(" ");
  };
  return template.lines.map((line, index) => ({
    index,
    id: line.id,
    name: line.name,
    item: line.itemId
      ? nameOf({ options: data.items, id: line.itemId, hidden: data.itemsHidden ? "–" : undefined })
      : t("noItem"),
    start:
      line.offsetMinutes === 0
        ? t("time.atStart")
        : t("time.after", { time: span({ minutes: line.offsetMinutes }) }),
    length: span({ minutes: line.durationMinutes }),
    quantity: line.quantity === null ? t("headcount") : String(line.quantity),
  }));
}
