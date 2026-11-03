import type { AppErrorIssue } from "@bibi/core";
import { useEffect } from "react";
import type { FieldPath } from "react-hook-form";
import { isFormPath } from "@/lib/issue-form-path";
import { useZodMessages } from "@/lib/use-zod-messages";
import { reviewFormSchema } from "./review-form-schema";
import type { ReviewFormValues } from "./review-form-values";
import type { ReviewForm } from "./use-review-form";
import type { ReviewModel } from "./use-review-model";

/** Why Create waits; null when the ticket can be created. */
export type CreateBlock =
  | { kind: "QUESTIONS"; count: number }
  | { kind: "CHECKING" }
  | { kind: "ISSUES" }
  | { kind: "FIELDS" };

export type CreateReadinessInput = {
  form: ReviewForm;
  model: ReviewModel;
  questions: number;
  /** Create's server issues that name no field (`useServerIssues`). */
  serverIssues: AppErrorIssue[];
};

/** The form checked as Create would send it, its issues split into fields and the rest. */
function useCreateCheck({ form, model }: Pick<CreateReadinessInput, "form" | "model">) {
  const messages = useZodMessages();
  const values = form.watch();
  const { catalog } = model.data;
  const type = catalog.ticketTypes.find(({ id }) => id === values.entityTypeId);
  const schema = reviewFormSchema({ type, vocabularies: catalog.vocabularies, model: () => model });
  const parsed = schema.safeParse(values, messages);
  const issues = (parsed.success ? [] : parsed.error.issues).map(({ path, message }) => ({
    path: path.join("."),
    message,
  }));
  const onField = ({ path }: AppErrorIssue) => isFormPath({ path, values });
  return { fields: issues.filter(onField), rest: issues.filter((issue) => !onField(issue)) };
}

const blockOf = ({ ...input }: CreateReadinessInput & { rest: number; fields: number }) => {
  if (input.questions > 0) return { kind: "QUESTIONS", count: input.questions } as const;
  if (input.model.preview.status === "loading") return { kind: "CHECKING" } as const;
  if (input.serverIssues.length > 0 || input.rest > 0) return { kind: "ISSUES" } as const;
  return input.fields > 0 ? ({ kind: "FIELDS" } as const) : null;
};

/**
 * Whether Create can run (spec "Create"): open questions answered, the preview not loading, no
 * issue left that names no field, and the form valid. Invalid fields are marked once they are the
 * only thing left, so "Fix the highlighted fields" points at something.
 */
export function useCreateReadiness({ ...input }: CreateReadinessInput) {
  const { fields, rest } = useCreateCheck(input);
  const block: CreateBlock | null = blockOf({ ...input, rest: rest.length, fields: fields.length });
  const marked = block?.kind === "FIELDS" ? fields.map(({ path }) => path).join(",") : "";
  const { form } = input;
  // react-hook-form store: fields marked by the server are validated to show their errors.
  useEffect(() => {
    if (marked) void form.trigger(marked.split(",") as FieldPath<ReviewFormValues>[]);
  }, [form, marked]);
  return { block, issues: [...input.serverIssues, ...rest] };
}
