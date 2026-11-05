import type { EntityTypeDto, PreviewLine } from "@bibi/core";
import type { Dispatch } from "react";
import type { IntakeData } from "../load-intake-data";
import { type IntakePeriod, periodOf } from "./intake-period";
import type { IntakeAction, IntakePick, IntakeState, IntakeWhen, IntakeWho } from "./intake-state";
import type { PackageOption } from "./package-groups";
import type { IntakeReview } from "./review-state";
import { type DraftPreview, useDraftPreview } from "./use-draft-preview";

/** Everything step 4's parts read, once steps 1–3 have their answers. */
export type ReviewModel = {
  data: IntakeData;
  dispatch: Dispatch<IntakeAction>;
  state: IntakeState;
  who: IntakeWho;
  when: IntakeWhen;
  pick: IntakePick;
  review: IntakeReview;
  period: IntakePeriod | null;
  timeZone: string;
  /** The picked package; null for a custom booking. */
  pkg: PackageOption | null;
  /** The order type the order gets: the package's, else the custom booking's choice. */
  orderType: EntityTypeDto | undefined;
  preview: DraftPreview;
  /** The draft's preview lines in the lines' order, when the preview matches them. */
  planned: readonly PreviewLine[] | null;
};

export type UseReviewModelInput = {
  data: IntakeData;
  state: IntakeState;
  dispatch: Dispatch<IntakeAction>;
  timeZone: string;
  nonce: number;
};

type Ready = { who: IntakeWho; when: IntakeWhen; pick: IntakePick; review: IntakeReview };

const ready = ({ state }: { state: IntakeState }): Ready | null => {
  const { who, when, pick, review } = state;
  return who && when && pick && review ? { who, when, pick, review } : null;
};

function typeOf({
  data,
  pkg,
  review,
}: {
  data: IntakeData;
  pkg: PackageOption | null;
  review: IntakeReview;
}) {
  const { orderTypes } = data.catalog;
  const id = pkg?.entityTypeId ?? review.orderTypeId;
  return orderTypes.find((type) => type.id === id) ?? (pkg ? undefined : orderTypes[0]);
}

/** The review's model; null until steps 1–3 are answered and step 3 was completed. */
export function useReviewModel({
  data,
  state,
  dispatch,
  timeZone,
  nonce,
}: UseReviewModelInput): ReviewModel | null {
  const answers = ready({ state });
  const period = state.when ? periodOf({ when: state.when, timeZone }) : null;
  const preview = useDraftPreview({
    customerId: state.who?.customerId ?? "",
    period: answers ? period : null,
    headcount: state.when?.guests ?? 0,
    lines: state.review?.lines ?? [],
    nonce,
  });
  if (!answers) return null;
  const { pick, review } = answers;
  const pkg =
    pick.kind === "PACKAGE"
      ? (data.packages.find(({ id }) => id === pick.templateId) ?? null)
      : null;
  const lines = preview.status === "ready" ? preview.entry.lines : null;
  const planned = lines && lines.length === review.lines.length ? lines : null;
  const orderType = typeOf({ data, pkg, review });
  return { ...answers, data, dispatch, state, period, timeZone, pkg, orderType, preview, planned };
}
