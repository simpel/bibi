import type { PreviewLine } from "@bibi/core";
import { cn } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { lineTone, TONE_CLASS, useIssueText } from "./use-issue-text";

export type LineAvailabilityBoxProps = {
  /** This line as the live preview plans it; null while none is ready or the line is invalid. */
  planned: PreviewLine | null;
  availabilityHidden: boolean;
};

/** The preview's issues for this line, live (spec "Availability box"). */
export function LineAvailabilityBox({ planned, availabilityHidden }: LineAvailabilityBoxProps) {
  const t = useTranslations("orderIntake.line");
  const issueText = useIssueText();
  if (availabilityHidden) return null;
  const tone = lineTone({ planned });
  const clash = tone === "clash";
  return (
    <div className="grid gap-1 rounded-md border bg-muted/40 p-3 text-sm" aria-live="polite">
      <p className={cn("font-medium", TONE_CLASS[tone])}>
        {tone === "unknown" ? t("checking") : t(`availability.${tone}`)}
      </p>
      {planned?.issues.length ? (
        <ul className="grid gap-0.5">
          {planned.issues.map((issue) => (
            <li key={`${issue.kind}-${issue.message}`}>{issueText({ issue })}</li>
          ))}
        </ul>
      ) : null}
      {clash ? <p className="text-muted-foreground">{t("clashCanSave")}</p> : null}
    </div>
  );
}
