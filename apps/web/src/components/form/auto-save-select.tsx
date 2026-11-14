"use client";

import { Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { useId, useState } from "react";
import type { ActionResult } from "@/lib/action-result";
import { useRouter } from "@/lib/navigation";
import { useToastAction } from "@/lib/use-toast-action";

/** `disabled`: shown (it may be the saved value) but not pickable. */
export type AutoSaveOption<V extends string> = { value: V; label: string; disabled?: boolean };

export type AutoSaveSelectProps<V extends string, R> = {
  label: string;
  value: V;
  options: readonly AutoSaveOption<V>[];
  canEdit: boolean;
  /** The server action that stores the choice. */
  save: (input: { value: V }) => Promise<ActionResult<R>>;
  /** A line under the field. */
  hint?: string | undefined;
  /** The success toast. */
  saved: string;
  /** After a save; without it the page refreshes. The assistant's card keeps the new value. */
  onSaved?: ((input: { value: R }) => void) | undefined;
};

/**
 * A setting that saves as soon as it changes (CLAUDE.md "Forms"): the choice shows at once, one
 * toast per save, and an error puts the previous choice back.
 */
export function AutoSaveSelect<V extends string, R>({
  label,
  value,
  options,
  canEdit,
  hint,
  save,
  saved,
  onSaved,
}: AutoSaveSelectProps<V, R>) {
  const common = useTranslations("common");
  const router = useRouter();
  const id = useId();
  const { run, pending } = useToastAction();
  const [current, setCurrent] = useState(value);
  const choose = ({ next }: { next: string }) => {
    const choice = options.find((option) => option.value === next)?.value;
    if (!choice || choice === current) return;
    const previous = current;
    setCurrent(choice);
    run({
      action: () => save({ value: choice }),
      messages: { pending: common("saving"), success: saved },
      onSuccess: ({ value: result }) => (onSaved ? onSaved({ value: result }) : router.refresh()),
      onError: () => setCurrent(previous),
    });
  };
  return (
    <div className="grid max-w-sm gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Select
        value={current}
        onValueChange={(next) => choose({ next })}
        disabled={!canEdit || pending}
      >
        <SelectTrigger id={id}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value} disabled={option.disabled ?? false}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {hint ? <p className="text-sm text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
