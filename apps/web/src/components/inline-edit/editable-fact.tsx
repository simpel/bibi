"use client";

import { Button, cn, Popover, PopoverAnchor, PopoverContent } from "@bibi/ui";
import { PencilIcon } from "lucide-react";
import { type ReactNode, useState } from "react";
import { InlineEditContext } from "./inline-edit";

export type EditableFactProps = {
  /** What the page shows: the value as rendered on the server. */
  children: ReactNode;
  /** The pencil's accessible name and tooltip, e.g. "Edit desired dates". */
  editLabel: string;
  /** Without write access the value is plain. */
  canEdit: boolean;
  /** The form in the popover; it closes itself with `useInlineEdit`. */
  editor: ReactNode;
  /** A longer text (a description): wraps and keeps its line breaks instead of truncating. */
  multiline?: boolean;
};

/**
 * A fact edited where it is shown: a pencil on hover (always for the keyboard) opens a popover
 * with the fact's own small form under the value.
 */
export function EditableFact({
  children,
  editLabel,
  canEdit,
  editor,
  multiline = false,
}: EditableFactProps) {
  const [open, setOpen] = useState(false);
  if (!canEdit) return <>{children}</>;
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverAnchor asChild>
        <span
          className={cn(
            "group/fact inline-flex max-w-full gap-1",
            multiline ? "items-start" : "items-center",
          )}
        >
          <span className={cn("min-w-0", multiline ? "whitespace-pre-line" : "truncate")}>
            {children}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={editLabel}
            onClick={() => setOpen(true)}
            className="size-7 shrink-0 font-sans text-muted-foreground opacity-10 transition-opacity focus-visible:opacity-100 group-hover/fact:opacity-100 data-[state=open]:opacity-100"
          >
            <PencilIcon className="size-3.5" />
          </Button>
        </span>
      </PopoverAnchor>
      <PopoverContent align="start" className="w-80 font-sans">
        <InlineEditContext.Provider value={{ close: () => setOpen(false) }}>
          {open ? editor : null}
        </InlineEditContext.Provider>
      </PopoverContent>
    </Popover>
  );
}
