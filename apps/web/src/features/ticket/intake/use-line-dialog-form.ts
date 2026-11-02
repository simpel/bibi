import type { CreateDraftLine } from "@bibi/core";
import { type UseFormReturn, useForm } from "react-hook-form";
import { useTypedResolver } from "@/components/typed-fields/use-typed-resolver";
import { toLocalInputValue } from "../../occupancy/ui/local-date-time";
import type { CatalogItem } from "./catalog";
import type { DraftLine } from "./draft-line";
import { upsertLine } from "./draft-lines";
import { lineFormSchema, toDraftLine } from "./line-form-schema";
import { type LineFormValues, lineFormDefaults } from "./line-form-values";
import { useDraftPreview } from "./use-draft-preview";
import type { ReviewModel } from "./use-review-model";

export type LineDialogFormApi = UseFormReturn<LineFormValues, unknown, CreateDraftLine>;

export type UseLineDialogFormInput = {
  model: ReviewModel;
  item: CatalogItem | null;
  /** The line being edited; null adds one. */
  line: DraftLine | null;
  lineKey: string;
  onSave: (input: { line: DraftLine }) => void;
};

/** The line's day: its own start's in its zone, else the ticket's (shown read-only). */
const dayOf = ({
  line,
  timeZone,
  fallback,
}: {
  line: DraftLine | null;
  timeZone: string;
  fallback: string;
}) =>
  line?.startsAt
    ? (toLocalInputValue({ date: new Date(line.startsAt), timeZone }).split("T")[0] ?? fallback)
    : fallback;

type LivePreviewInput = { model: ReviewModel; candidate: DraftLine | null; lineKey: string };

/** The draft with this dialog's line in it, previewed live: the availability box reads it. */
function useLivePreview({ model, candidate, lineKey }: LivePreviewInput) {
  const lines = candidate ? upsertLine({ lines: model.review.lines, line: candidate }) : [];
  const preview = useDraftPreview({
    ...{ customerId: model.who.customerId, period: model.period, headcount: model.when.guests },
    ...{ lines, nonce: 0 },
  });
  const index = lines.findIndex(({ key }) => key === lineKey);
  if (preview.status !== "ready" || preview.entry.lines.length !== lines.length) return null;
  return preview.entry.lines[index] ?? null;
}

/** The line dialog's form: core's draft line schema over its values, plus a live preview. */
export function useLineDialogForm({ model, item, line, lineKey, onSave }: UseLineDialogFormInput) {
  const { catalog } = model.data;
  const timeZone = item?.timeZone ?? model.timeZone;
  const date = dayOf({ line, timeZone, fallback: model.when.date });
  const schemaFor = ({ type }: { type: Parameters<typeof lineFormSchema>[0]["type"] }) =>
    lineFormSchema({
      type,
      vocabularies: catalog.vocabularies,
      item,
      date,
      timeZone,
      needTypeId: catalog.needTypeId,
    });
  const resolver = useTypedResolver<LineFormValues, CreateDraftLine>({
    types: catalog.lineTypes,
    schemaFor,
  });
  const type = catalog.lineTypes.find(
    ({ id }) => id === (line?.entityTypeId ?? catalog.lineTypes[0]?.id),
  );
  const form = useForm<LineFormValues, unknown, CreateDraftLine>({
    resolver,
    defaultValues: lineFormDefaults({ line, item, type, timeZone, period: model.period }),
  });
  const values = form.watch();
  const current = catalog.lineTypes.find(({ id }) => id === values.entityTypeId);
  const parsed = schemaFor({ type: current }).safeParse(values);
  const candidate = parsed.success ? toDraftLine({ line: parsed.data, key: lineKey }) : null;
  const planned = useLivePreview({ model, candidate, lineKey });
  const submit = form.handleSubmit((out) =>
    onSave({ line: toDraftLine({ line: out, key: lineKey }) }),
  );
  return { form, submit, planned, date, timeZone };
}
