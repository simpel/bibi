"use client";

import type { HoursDay, HoursException } from "@bibi/core/schemas";
import { Button, Form } from "@bibi/ui";
import { PencilIcon } from "lucide-react";
import type { ActionResult } from "@/lib/action-result";
import { HoursExceptionsSummary } from "./hours-exceptions-summary";
import { HoursSectionButtons } from "./hours-section-buttons";
import { HoursSummary } from "./hours-summary";
import { HoursWeekEditor } from "./hours-week-editor";
import { useHoursSectionForm } from "./use-hours-section-form";

export type HoursPattern = { days: HoursDay[]; exceptions: HoursException[] };

/** A page section's title row: the pencil beside the title edits in place (no Change button). */
export type HoursHeading = { title: string; description?: string; editLabel: string };

export type HoursSectionFormProps = {
  initial: HoursPattern;
  canEdit: boolean;
  /** Shown instead of the summary while no hours are set. */
  emptyText: string;
  /** Shown under the summary or editor, e.g. how to follow the venue again. */
  hint?: string;
  /** Dated exceptions are edited and shown too (default); a member's working hours have none. */
  withExceptions?: boolean;
  /** On a record page: the section's title with a pencil, like the order page's sections. */
  heading?: HoursHeading;
  save: (input: HoursPattern) => Promise<ActionResult<unknown>>;
};

type HeadingProps = { heading: HoursHeading; showPencil: boolean; onEdit: () => void };

function HoursHeadingRow({ heading, showPencil, onEdit }: HeadingProps) {
  return (
    <div className="grid gap-1">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-xl">{heading.title}</h2>
        {showPencil ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={heading.editLabel}
            onClick={onEdit}
            className="text-muted-foreground"
          >
            <PencilIcon />
          </Button>
        ) : null}
      </div>
      {heading.description ? (
        <p className="text-sm text-muted-foreground">{heading.description}</p>
      ) : null}
    </div>
  );
}

/**
 * Weekly hours and dated exceptions as a summary with Change, or with a pencil beside `heading`;
 * Save replaces them.
 */
export function HoursSectionForm({
  initial,
  canEdit,
  emptyText,
  hint,
  withExceptions = true,
  heading,
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
        {heading ? (
          <HoursHeadingRow
            heading={heading}
            showPencil={canEdit && !editing}
            onEdit={() => setEditing(true)}
          />
        ) : null}
        {editing ? <HoursWeekEditor form={form} withExceptions={withExceptions} /> : null}
        {!editing && !empty ? (
          <div className="grid gap-3">
            <HoursSummary rows={rows} />
            {withExceptions ? <HoursExceptionsSummary rows={exceptions} /> : null}
          </div>
        ) : null}
        {!editing && empty ? <p className="text-sm text-muted-foreground">{emptyText}</p> : null}
        {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
        {canEdit && (editing || !heading) ? (
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
