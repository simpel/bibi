import type { AppErrorIssue, TicketCreateInput } from "@bibi/core";
import { useTranslations } from "next-intl";
import { useEffect, useRef } from "react";
import { type UseFormReturn, useForm } from "react-hook-form";
import { specsOf } from "@/components/typed-fields/field-specs";
import { useTypedResolver } from "@/components/typed-fields/use-typed-resolver";
import { useFormAction } from "@/lib/use-form-action";
import { createTicketAction } from "../actions";
import { reviewFormSchema } from "./review-form-schema";
import { type ReviewFormValues, reviewFormDefaults, reviewPatchOf } from "./review-form-values";
import { useFinishCreate } from "./use-finish-create";
import type { ReviewModel } from "./use-review-model";

export type ReviewForm = UseFormReturn<ReviewFormValues, unknown, TicketCreateInput>;

type SyncInput = { form: ReviewForm; model: ReviewModel };

/** Every change of the form goes into the review: the draft and the open questions follow it. */
function useReviewSync({ form, model }: SyncInput) {
  const { dispatch, timeZone, data } = model;
  useEffect(() => {
    const sync = () => {
      const values = form.getValues();
      const type = data.catalog.ticketTypes.find(({ id }) => id === values.entityTypeId);
      const specs = specsOf({ type, vocabularies: data.catalog.vocabularies });
      dispatch({ type: "patchReview", patch: reviewPatchOf({ values, specs, timeZone }) });
    };
    // Once at the start too: a package's default field values count as given.
    sync();
    const subscription = form.watch(sync);
    return () => subscription.unsubscribe();
  }, [form, dispatch, timeZone, data]);
}

export type UseReviewFormInput = {
  model: ReviewModel;
  /** Create was refused for a new clash: preview again and say so. */
  onConflict: () => void;
  /** Create's issues that name no field of the form (a line's, say). */
  onUnmappedIssues: (input: { issues: AppErrorIssue[] }) => void;
};

/** Step 4's form; its submit is Create (`ticket.create` with every line, ADR 0081). */
export function useReviewForm({ model, onConflict, onUnmappedIssues }: UseReviewFormInput) {
  const t = useTranslations("ticketIntake.create");
  const latest = useRef(model);
  latest.current = model;
  const { catalog } = model.data;
  const resolver = useTypedResolver<ReviewFormValues, TicketCreateInput>({
    types: catalog.ticketTypes,
    schemaFor: ({ type }) =>
      reviewFormSchema({ type, vocabularies: catalog.vocabularies, model: () => latest.current }),
  });
  const form = useForm<ReviewFormValues, unknown, TicketCreateInput>({
    resolver,
    mode: "onChange",
    defaultValues: reviewFormDefaults({
      ...{ review: model.review, type: model.ticketType, timeZone: model.timeZone },
      packageFields: model.pkg?.fields ?? {},
    }),
  });
  useReviewSync({ form, model });
  const finish = useFinishCreate({ model: () => latest.current });
  const { submit, pending } = useFormAction({
    form,
    action: ({ values }) => createTicketAction({ input: values }),
    messages: { pending: t("creating"), success: t("created"), unmapped: t("failed") },
    onSuccess: ({ value }) => finish({ ticket: value, values: form.getValues() }),
    onUnmappedIssues,
    onError: ({ error }) => {
      if (error.code === "CONFLICT") onConflict();
    },
  });
  return { form, submit, pending };
}
