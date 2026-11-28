"use client";

import {
  Button,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@bibi/ui";
import { PlusIcon, XIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import type { NeedOption } from "../lib/create-form";

export type NeedValue = { vocabularyValueId: string; quantity: string };

export type NeedsEditorProps = {
  options: readonly NeedOption[];
  value: readonly NeedValue[];
  onChange: (value: NeedValue[]) => void;
};

/** Counts against the organization's lists ("Gluten 2"): how many of the party, never who. */
export function NeedsEditor({ options, value, onChange }: NeedsEditorProps) {
  const t = useTranslations("reservation.needs");
  if (options.length === 0) return null;
  const set = ({ index, patch }: { index: number; patch: Partial<NeedValue> }) =>
    onChange(value.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  return (
    <fieldset className="grid gap-2">
      <legend className="mb-1 text-base font-medium">{t("title")}</legend>
      {value.map((row, index) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: rows have no id until saved
        <div key={index} className="flex items-center gap-2">
          <Select
            value={row.vocabularyValueId}
            onValueChange={(next) => set({ index, patch: { vocabularyValueId: next } })}
          >
            <SelectTrigger aria-label={t("value")} className="h-12 min-w-0 flex-1 text-base">
              <SelectValue placeholder={t("value")} />
            </SelectTrigger>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option.id} value={option.id}>
                  {option.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            value={row.quantity}
            inputMode="numeric"
            aria-label={t("quantity")}
            className="h-12 w-20 text-base"
            onChange={(event) => set({ index, patch: { quantity: event.target.value } })}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-12"
            aria-label={t("remove")}
            onClick={() => onChange(value.filter((_, i) => i !== index))}
          >
            <XIcon />
          </Button>
        </div>
      ))}
      <div>
        <Button
          type="button"
          variant="outline"
          className="h-12 text-base"
          onClick={() => onChange([...value, { vocabularyValueId: "", quantity: "1" }])}
        >
          <PlusIcon />
          {t("add")}
        </Button>
      </div>
    </fieldset>
  );
}
