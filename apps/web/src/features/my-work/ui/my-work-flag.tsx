import type { DateTimeFormat } from "@bibi/core/schemas";
import type { CardIssue } from "@bibi/ui";
import { useTranslations } from "next-intl";
import type { MyWorkFlagWireish } from "./my-work-wireish";

export type UseFlagIssuesInput = {
  flags: readonly MyWorkFlagWireish[];
  timeZone: string;
  dates: DateTimeFormat;
};

/** A clash or a blocked run sheet blocks the order: an error. The rest need fixing. */
const isError = ({ flag }: { flag: MyWorkFlagWireish }) =>
  flag.kind === "HARD_CLASH" || flag.runSheetStatus === "BLOCKED";

/**
 * A card's flags as issues in words, most urgent first (spec: home): errors and warnings shown
 * as badges in the card's header.
 */
export function useFlagIssues({ flags, timeZone, dates }: UseFlagIssuesInput): CardIssue[] {
  const t = useTranslations("myWork.flags");
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
    return { key: `${flag.kind}:${index}`, level: isError({ flag }) ? "error" : "warning", label };
  });
}
