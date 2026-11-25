"use client";

import { Button } from "@bibi/ui";
import { PencilIcon } from "lucide-react";
import { type ReactNode, useState } from "react";
import { InlineEditContext } from "./inline-edit";

export type EditableSectionProps = {
  title: string;
  /** Keep the title for screen readers only; the pencil sits beside the content instead. */
  titleHidden?: boolean;
  /** The pencil's accessible name and tooltip, e.g. "Edit details". */
  editLabel: string;
  canEdit: boolean;
  /** What the section shows: rendered on the server. */
  children: ReactNode;
  /** The section's fields as a form, in place of the view; it closes itself with `useInlineEdit`. */
  editor: ReactNode;
};

/** A page section edited in place: a pencil beside its title turns the view into its form. */
export function EditableSection({
  title,
  titleHidden = false,
  editLabel,
  canEdit,
  children,
  editor,
}: EditableSectionProps) {
  const [editing, setEditing] = useState(false);
  const pencil =
    canEdit && !editing ? (
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label={editLabel}
        onClick={() => setEditing(true)}
        className="text-muted-foreground"
      >
        <PencilIcon />
      </Button>
    ) : null;
  const body = editing ? (
    <InlineEditContext.Provider value={{ close: () => setEditing(false) }}>
      {editor}
    </InlineEditContext.Provider>
  ) : (
    children
  );
  if (titleHidden) {
    return (
      <section className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2">
        <h2 className="sr-only">{title}</h2>
        <div className="min-w-0">{body}</div>
        {pencil}
      </section>
    );
  }
  return (
    <section className="grid grid-cols-1 gap-4">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-xl">{title}</h2>
        {pencil}
      </div>
      {body}
    </section>
  );
}
