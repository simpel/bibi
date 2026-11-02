import { StepSection } from "@bibi/ui";
import { useTranslations } from "next-intl";
import type { IntakeSummaries } from "./use-intake-summaries";

export type ReviewPlaceholderProps = { summaries: IntakeSummaries };

/**
 * Step 4 until slice 7 of the intake plan builds it: what steps 1–3 collected, read-only. Nothing
 * is created from here yet.
 */
export function ReviewPlaceholder({ summaries }: ReviewPlaceholderProps) {
  const t = useTranslations("ticketIntake.review");
  const rows = [
    { label: t("who"), value: summaries.who },
    { label: t("when"), value: summaries.when },
    { label: t("pick"), value: summaries.pick },
  ];
  return (
    <StepSection number={4} title={t("title")} state="open">
      <dl className="grid gap-2 text-sm sm:grid-cols-[auto_1fr] sm:gap-x-6">
        {rows.map(({ label, value }) => (
          <div key={label} className="contents">
            <dt className="text-muted-foreground">{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      <p className="text-sm text-muted-foreground">{t("comingNext")}</p>
    </StepSection>
  );
}
