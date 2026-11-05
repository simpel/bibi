import type { EntityTypeDto, OrderCreateInput, VocabularyDto } from "@bibi/core";
import { buildFieldsSchema, OrderCreateInputSchema } from "@bibi/core/schemas";
import { specsOf } from "@/components/typed-fields/field-specs";
import { formSchema } from "@/lib/form-schema";
import { toCreateInput } from "./create-input";
import type { ReviewFormValues } from "./review-form-values";
import { reviewPatchOf } from "./review-form-values";
import type { ReviewModel } from "./use-review-model";

export type ReviewSchemaInput = {
  type: EntityTypeDto | undefined;
  vocabularies: VocabularyDto[];
  /** The latest model: the lines and steps 1–3 come from the review, not the form. */
  model: () => ReviewModel | null;
};

/** The whole `order.create` input: the review's lines and steps with this form's values. */
function createInputOf({
  values,
  type,
  vocabularies,
  model,
}: ReviewSchemaInput & { values: ReviewFormValues }) {
  const current = model();
  if (!current?.period) return {};
  const specs = specsOf({ type, vocabularies });
  const patch = reviewPatchOf({ values, specs, timeZone: current.timeZone });
  return toCreateInput({
    ...current,
    period: current.period,
    review: { ...current.review, ...patch },
    orderTypeId: values.entityTypeId,
    intakeKey: current.state.intakeKey,
    inboundMessageId: current.state.inboundMessageId,
    draftedFromMessage: Boolean(current.state.draft),
    userId: current.data.catalog.userId,
  });
}

/**
 * Core's `order.create` schema over step 4 (ADR 0081), with the order type's own fields
 * checked against the type; the server checks everything again.
 */
export function reviewFormSchema({ ...input }: ReviewSchemaInput) {
  const specs = specsOf({ type: input.type, vocabularies: input.vocabularies });
  return formSchema({
    schema: OrderCreateInputSchema.extend({ fields: buildFieldsSchema({ specs }) }),
    toInput: ({ values }: { values: ReviewFormValues }): Partial<OrderCreateInput> =>
      createInputOf({ ...input, values }),
  });
}
