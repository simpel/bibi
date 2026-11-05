import { Button, StepSectionFooter } from "@bibi/ui";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { useDateTimeFormat } from "@/lib/time/use-date-time-format";
import type { CreateBlock } from "./use-create-readiness";
import type { ReviewModel } from "./use-review-model";

const clashes = ({ model }: { model: ReviewModel }) =>
  (model.planned ?? []).filter((line) => line.issues.some(({ kind }) => kind === "HARD_CLASH"));

/** "Since you started, Saab kickoff (or #41) booked Vinga 09:00–11:00", when the preview names one. */
function useConflictText({ model }: { model: ReviewModel }) {
  const t = useTranslations("orderIntake.create");
  const dates = useDateTimeFormat();
  for (const line of model.planned ?? []) {
    const issue = line.issues.find(
      ({ kind, refusesCreate }) => kind === "HARD_CLASH" && refusesCreate,
    );
    if (!issue?.orderReference || !issue.startsAt || !issue.endsAt) continue;
    const resource =
      model.data.catalog.items.find(({ id }) => id === line.itemId)?.name ?? line.name;
    const period = dates.timeRange({ start: issue.startsAt, end: issue.endsAt });
    const order = issue.orderTitle ?? `#${issue.orderReference}`;
    return t("conflictNamed", { order, resource, period });
  }
  return t("conflict");
}

function ConflictNotice({ model }: { model: ReviewModel }) {
  const t = useTranslations("orderIntake.create");
  const named = useConflictText({ model });
  return (
    <p
      role="alert"
      className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm"
    >
      {named} {t("conflictHint")}
    </p>
  );
}

export type CreateBarProps = {
  model: ReviewModel;
  /** Why Create waits (`useCreateReadiness`); null when it can run. */
  block: CreateBlock | null;
  pending: boolean;
  /** Create was refused for a new clash. */
  conflict: boolean;
  /** Back to step 3, bottom left; Create is bottom right. */
  back: ReactNode;
};

/**
 * The blocked-lines summary and Create: "Create order", "Create and prebook" when lines clash,
 * "Creating…" while it runs, and while it waits why: "Answer <n> questions first", "Checking
 * availability…", "Fix what is listed above first" or "Fix the highlighted fields first".
 */
export function CreateBar({ model, block, pending, conflict, back }: CreateBarProps) {
  const t = useTranslations("orderIntake.create");
  const blocked = clashes({ model }).length;
  const label = (() => {
    if (pending) return t("creating");
    if (block?.kind === "QUESTIONS") return t("answerFirst", { count: block.count });
    if (block?.kind === "CHECKING") return t("checking");
    if (block?.kind === "ISSUES") return t("fixIssues");
    if (block?.kind === "FIELDS") return t("fixFields");
    return blocked > 0 ? t("createAndPrebook") : t("create");
  })();
  return (
    <div className="grid gap-3">
      {conflict ? <ConflictNotice model={model} /> : null}
      {blocked > 0 ? (
        <p className="text-sm text-destructive">{t("blocked", { count: blocked })}</p>
      ) : null}
      <StepSectionFooter
        start={back}
        end={
          <Button type="submit" disabled={pending || block !== null}>
            {label}
          </Button>
        }
      />
    </div>
  );
}
