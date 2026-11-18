import type { DateTimeFormat } from "@bibi/core/schemas";
import type { CardIssue } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { flagLevel } from "../lib/flag-level";
import type { MyWorkFlagWireish } from "./my-work-wireish";

export type UseFlagIssuesInput = {
  flags: readonly MyWorkFlagWireish[];
  timeZone: string;
  dates: DateTimeFormat;
};

/**
 * A card's flags as issues in words, most urgent first (spec: home): errors and warnings shown
 * as badges in the card's header.
 */
export function useFlagIssues({ flags, timeZone, dates }: UseFlagIssuesInput): CardIssue[] {
  const t = useTranslations("myWork.flags");
  const d = useTranslations("myWork.flagDetails");
  return flags.map((flag, index) => {
    const date = flag.at ? dates.date({ instant: new Date(flag.at), timeZone }) : "";
    const runSheet = flag.runSheetName ?? "";
    const label =
      flag.kind === "HARD_CLASH"
        ? flag.reference === null
          ? t("HARD_CLASH_BLOCK")
          : t("HARD_CLASH", { reference: flag.reference })
        : flag.kind === "RUN_SHEET"
          ? t(`RUN_SHEET.${flag.runSheetStatus ?? "DRAFT"}`, { runSheet })
          : flag.kind === "UNREAD_MESSAGES"
            ? t("UNREAD_MESSAGES", { count: flag.count ?? 0 })
            : t(flag.kind, { date });
    const detail =
      flag.kind === "HARD_CLASH"
        ? flag.reference === null
          ? d("HARD_CLASH_BLOCK")
          : d("HARD_CLASH", { reference: flag.reference })
        : flag.kind === "RUN_SHEET"
          ? d(`RUN_SHEET.${flag.runSheetStatus ?? "DRAFT"}`, { runSheet })
          : flag.kind === "UNREAD_MESSAGES"
            ? d("UNREAD_MESSAGES", { count: flag.count ?? 0 })
            : d(flag.kind, { date });
    const level = flagLevel({ flag });
    return { key: `${flag.kind}:${index}`, level, label, detail };
  });
}
