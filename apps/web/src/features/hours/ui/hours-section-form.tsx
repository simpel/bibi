"use client";

import type { HoursDay, HoursException } from "@bibi/core/schemas";
import { Form } from "@bibi/ui";
import type { ActionResult } from "@/lib/action-result";
import { HoursExceptionsSummary } from "./hours-exceptions-summary";
import { HoursSectionButtons } from "./hours-section-buttons";
import { HoursSummary } from "./hours-summary";
import { HoursWeekEditor } from "./hours-week-editor";
import { useHoursSectionForm } from "./use-hours-section-form";

export type HoursPattern = { days: HoursDay[]; exceptions: HoursException[] };

export type HoursSectionFormProps = {
  initial: HoursPattern;
  canEdit: boolean;
  /** Shown instead of the summary while no hours are set. */
  emptyText: string;
  /** Shown under the summary or editor, e.g. how to follow the venue again. */
  hint?: string;
  save: (input: HoursPattern) => Promise<ActionResult<unknown>>;
};

/** Weekly hours and dated exceptions as a summary with Change; Save replaces them. */
export function HoursSectionForm({
  initial,
  canEdit,
  emptyText,
  hint,
  save,
}: HoursSectionFormProps) {
  const { form, submit, pending, editing, setEditing, empty } = useHoursSectionForm({
    initial,
    save,
  });
  const [rows, exceptions] = form.watch(["rows", "exceptions"]);
  return (
    <Form {...form}>
      <form onSubmit={submit} noValidate className="grid gap-3">
        {editing ? <HoursWeekEditor form={form} withExceptions /> : null}
        {!editing && !empty ? (
          <div className="grid gap-3">
            <HoursSummary rows={rows} />
            <HoursExceptionsSummary rows={exceptions} />
          </div>
        ) : null}
        {!editing && empty ? <p className="text-sm text-muted-foreground">{emptyText}</p> : null}
        {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
        {canEdit ? (
          <HoursSectionButtons
            editing={editing}
            pending={pending}
            onEdit={() => setEditing(true)}
            onCancel={() => {
              form.reset();
              setEditing(false);
            }}
          />
        ) : null}
      </form>
    </Form>
  );
}
