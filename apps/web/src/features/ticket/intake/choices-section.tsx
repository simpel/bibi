import { Button, StepSection } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { useCallback } from "react";
import { ChoiceLineCard } from "./choice-line-card";
import { openChoiceCount } from "./choice-lines";
import type { DraftLine } from "./draft-line";
import { hasChoices, isCustom } from "./intake-state";
import type { StepsProps } from "./section-props";
import { StepBack } from "./step-back";

type ChoicesProps = Omit<StepsProps, "summaries">;

/** The asked lines' cards; each change replaces its line in the draft. */
function ChoiceCards({ data, state, dispatch }: ChoicesProps) {
  const t = useTranslations("ticketIntake");
  const { review, when } = state;
  const lines = review?.lines ?? [];
  const onChange = useCallback(
    ({ line }: { line: DraftLine }) =>
      dispatch({
        type: "patchReview",
        patch: { lines: lines.map((other) => (other.key === line.key ? line : other)) },
      }),
    [dispatch, lines],
  );
  const asked = lines.filter((line) => review?.choiceKeys.includes(line.key));
  return (
    <div className="grid gap-4">
      <p className="text-sm text-muted-foreground">{t("choices.description")}</p>
      {asked.map((line) => (
        <ChoiceLineCard
          key={line.key}
          line={line}
          catalog={data.catalog}
          quantity={line.quantity ?? when?.guests ?? null}
          onChange={onChange}
        />
      ))}
    </div>
  );
}

/**
 * The step before review when the lines have a required choice (ADR 0089): those lines' required
 * groups and needs, before review. Next is always enabled; what is left open is asked in review.
 */
export function ChoicesSection({ data, state, dispatch }: ChoicesProps) {
  const t = useTranslations("ticketIntake");
  const { review } = state;
  if (!review || !hasChoices({ state })) return null;
  const asked = review.lines.filter((line) => review.choiceKeys.includes(line.key));
  const open = openChoiceCount({ lines: asked, items: data.catalog.items });
  const view = state.open === "choices" ? "open" : state.open === "review" ? "done" : "locked";
  return (
    <StepSection
      number={isCustom({ state }) ? 5 : 4}
      title={t("choices.title")}
      summary={t("choices.summary", { lines: asked.length, open })}
      state={view}
      changeLabel={t("change")}
      onChangeStep={() => dispatch({ type: "change", step: "choices" })}
      footerStart={<StepBack step="choices" state={state} dispatch={dispatch} />}
      footerEnd={
        <Button type="button" onClick={() => dispatch({ type: "change", step: "review" })}>
          {t("next")}
        </Button>
      }
    >
      <ChoiceCards data={data} state={state} dispatch={dispatch} />
    </StepSection>
  );
}
