"use client";

import { Button } from "@bibi/ui";
import { PencilIcon } from "lucide-react";
import { type ReactNode, useState } from "react";
import { InlineEditContext } from "./inline-edit";

export type EditableSectionProps = {
  title: string;
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
  editLabel,
  canEdit,
  children,
  editor,
}: EditableSectionProps) {
  const [editing, setEditing] = useState(false);
  return (
    <section className="grid grid-cols-1 gap-4">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-xl">{title}</h2>
        {canEdit && !editing ? (
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
        ) : null}
      </div>
      {editing ? (
        <InlineEditContext.Provider value={{ close: () => setEditing(false) }}>
          {editor}
        </InlineEditContext.Provider>
      ) : (
        children
      )}
    </section>
  );
}
