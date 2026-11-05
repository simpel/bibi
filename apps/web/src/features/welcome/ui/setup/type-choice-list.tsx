"use client";

import { Button } from "@bibi/ui";
import { Trash2Icon } from "lucide-react";
import { useTranslations } from "next-intl";
import type { TypeChoice } from "../../lib/setup-draft";
import { AddTypeInput } from "./add-type-input";

export type TypeChoiceListProps = {
  rows: [TypeChoice, number][];
  onRemove: ({ index }: { index: number }) => void;
  onAdd: ({ name }: { name: string }) => void;
  addPlaceholder?: string;
};

/** The types as list items with trashcans, with an inline add field as the last item. */
export function TypeChoiceList({ rows, onRemove, onAdd, addPlaceholder }: TypeChoiceListProps) {
  const t = useTranslations("welcome.setup");

  return (
    <ul className="grid gap-2">
      {rows.map(([type, index]) => (
        <li
          key={`${type.name}-${index}`}
          className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card p-3.5 transition-colors"
        >
          <span className="text-sm font-medium text-foreground truncate">{type.name}</span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-7 text-muted-foreground hover:text-destructive shrink-0"
            onClick={() => onRemove({ index })}
            aria-label={t("remove")}
          >
            <Trash2Icon className="size-4" />
          </Button>
        </li>
      ))}
      <li>
        <AddTypeInput onAdd={onAdd} placeholder={addPlaceholder} />
      </li>
    </ul>
  );
}
