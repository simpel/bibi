import { Button } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { useDateTimeFormat } from "@/lib/time/use-date-time-format";
import type { ReviewModel } from "./use-review-model";

const clashes = ({ model }: { model: ReviewModel }) =>
  (model.planned ?? []).filter((line) => line.issues.some(({ kind }) => kind === "HARD_CLASH"));

/** "Since you started, #41 booked Vinga 09:00–11:00" from the new preview, when it names one. */
function useConflictText({ model }: { model: ReviewModel }) {
  const t = useTranslations("ticketIntake.create");
  const dates = useDateTimeFormat();
  for (const line of model.planned ?? []) {
    const issue = line.issues.find(
      ({ kind, refusesCreate }) => kind === "HARD_CLASH" && refusesCreate,
    );
    if (!issue?.ticketReference || !issue.startsAt || !issue.endsAt) continue;
    const resource =
      model.data.catalog.items.find(({ id }) => id === line.itemId)?.name ?? line.name;
    const period = dates.timeRange({ start: issue.startsAt, end: issue.endsAt });
    return t("conflictNamed", { reference: issue.ticketReference, resource, period });
  }
  return t("conflict");
}

function ConflictNotice({ model }: { model: ReviewModel }) {
  const t = useTranslations("ticketIntake.create");
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
  /** Open questions left; Create waits for them. */
  questions: number;
  pending: boolean;
  /** Create was refused for a new clash. */
  conflict: boolean;
};

/**
 * The blocked-lines summary and Create: "Create ticket", "Create and prebook" when lines clash,
 * "Answer <n> questions first" while questions are open, "Creating…" while it runs.
 */
export function CreateBar({ model, questions, pending, conflict }: CreateBarProps) {
  const t = useTranslations("ticketIntake.create");
  const blocked = clashes({ model }).length;
  const label = (() => {
    if (pending) return t("creating");
    if (questions > 0) return t("answerFirst", { count: questions });
    return blocked > 0 ? t("createAndPrebook") : t("create");
  })();
  return (
    <div className="grid gap-3">
      {conflict ? <ConflictNotice model={model} /> : null}
      {blocked > 0 ? (
        <p className="text-sm text-destructive">{t("blocked", { count: blocked })}</p>
      ) : null}
      <Button type="submit" className="justify-self-start" disabled={pending || questions > 0}>
        {label}
      </Button>
    </div>
  );
}
