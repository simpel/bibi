import type { EntityTypeDto } from "@bibi/core";
import type { FieldSpec } from "@bibi/core/schemas";
import { NONE } from "@/components/form/option-select-field";
import { fieldsToInput, rawFields, type WithRawFields } from "@/components/typed-fields/raw-fields";
import { fromLocalInputValue, toLocalInputValue } from "../../occupancy/ui/local-date-time";
import type { ReviewPatch } from "./intake-state";
import type { IntakeReview } from "./review-state";

/** Raw values of step 4's own inputs: the lines live in the review, not in the form. */
export type ReviewFormValues = WithRawFields & {
  entityTypeId: string;
  title: string;
  note: string;
  /** A member's user id, or `NONE` for the creating member. */
  assigneeId: string;
  /** `YYYY-MM-DDTHH:mm` in the organization's zone, or empty. */
  holdsUntil: string;
  saveAsPackage: boolean;
  packageName: string;
};

export type ReviewDefaultsInput = {
  review: IntakeReview;
  type: EntityTypeDto | undefined;
  /** The package's default own field values; a custom booking has none. */
  packageFields: Record<string, unknown>;
  timeZone: string;
};

/** The form as the review left it (a restored draft included). */
export function reviewFormDefaults({
  review,
  type,
  packageFields,
  timeZone,
}: ReviewDefaultsInput): ReviewFormValues {
  const { more } = review;
  const holdsUntil = more.holdsUntil ? new Date(more.holdsUntil) : null;
  return {
    entityTypeId: type?.id ?? "",
    title: review.title,
    note: review.note,
    assigneeId: more.assigneeId ?? NONE,
    holdsUntil: holdsUntil ? toLocalInputValue({ date: holdsUntil, timeZone }) : "",
    saveAsPackage: review.saveAsPackage,
    packageName: review.packageName,
    fields: rawFields({ type, stored: { ...packageFields, ...review.orderFields } }),
  };
}

export type ReviewPatchOfInput = {
  values: ReviewFormValues;
  specs: readonly FieldSpec[];
  timeZone: string;
};

/** The review as the form now says, for the draft and the open questions. */
export function reviewPatchOf({ values, specs, timeZone }: ReviewPatchOfInput): ReviewPatch {
  const holdsUntil = fromLocalInputValue({ value: values.holdsUntil, timeZone });
  return {
    title: values.title,
    note: values.note,
    orderTypeId: values.entityTypeId || null,
    orderFields: fieldsToInput({ values, specs }),
    saveAsPackage: values.saveAsPackage,
    packageName: values.packageName,
    more: {
      assigneeId: values.assigneeId === NONE ? null : values.assigneeId,
      holdsUntil: holdsUntil?.toISOString() ?? null,
    },
  };
}
