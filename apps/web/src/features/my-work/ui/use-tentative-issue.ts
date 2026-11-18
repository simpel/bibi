import type { CardIssue } from "@bibi/ui";
import { useTranslations } from "next-intl";

/** The amber clock badge of a preliminary (soft hold) booking, as on the calendar's cards. */
export function useTentativeIssue(): CardIssue {
  const t = useTranslations("calendar.pinCard");
  return {
    key: "tentative",
    level: "warning",
    icon: "clock",
    label: t("tentative"),
    detail: t("tentativeDetail"),
  };
}
