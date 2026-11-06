import { useTranslations } from "next-intl";
import type { ExampleTexts } from "../../lib/example-orders";

/** The example orders' texts (`welcome.examples`) in the user's language. */
export function useExampleTexts(): ExampleTexts {
  const t = useTranslations("welcome.examples");
  return {
    typeNames: {
      customer: t("typeNames.customer"),
      contact: t("typeNames.contact"),
      order: t("typeNames.order"),
      line: t("typeNames.line"),
    },
    customerName: t("customerName"),
    contactName: t("contactName"),
    meeting: t("orders.meeting"),
    conference: t("orders.conference"),
    dinner: t("orders.dinner"),
  };
}
