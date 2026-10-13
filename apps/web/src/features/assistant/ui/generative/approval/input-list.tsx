"use client";

import { useTranslations } from "next-intl";
import { fieldKey } from "../../../lib/approval-labels";
import { describeInput } from "../../../lib/describe-input";

export type InputListProps = { input: unknown };

/** The proposed input as a readable list; known field names are localized. */
export function InputList({ input }: InputListProps) {
  const t = useTranslations("assistant.approval");
  const entries = describeInput({ input });
  if (entries.length === 0) return null;
  return (
    <dl className="grid gap-1.5 rounded-md bg-muted/50 p-3 text-sm" data-slot="approval-input">
      {entries.map(({ key, value }) => {
        const label = fieldKey({ key });
        return (
          <div key={key} className="grid grid-cols-[minmax(0,8rem)_1fr] gap-2">
            <dt className="truncate text-muted-foreground">{label ? t(`fields.${label}`) : key}</dt>
            <dd className="min-w-0 whitespace-pre-wrap break-words font-medium">{value}</dd>
          </div>
        );
      })}
    </dl>
  );
}
