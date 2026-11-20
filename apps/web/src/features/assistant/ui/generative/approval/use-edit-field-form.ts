"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useZodMessages } from "@/lib/use-zod-messages";
import type { EditKind, EditValue } from "../../../lib/approval-edits";

export type EditFieldValues = { text: string; checked: boolean };

const number = z.string().trim().min(1).pipe(z.coerce.number());

/**
 * One value as its kind: the field's own rules run in core when the user confirms (MCP validates
 * the edited proposal with the operation), so this only turns the input into the right type.
 */
function schemaFor({ kind }: { kind: EditKind }): z.ZodType<EditValue, EditFieldValues> {
  const values = z.object({ text: z.string(), checked: z.boolean() });
  if (kind === "boolean") return values.transform(({ checked }) => checked);
  if (kind === "text") return values.transform(({ text }) => text.trim());
  const amount = z.object({ text: number, checked: z.boolean() });
  if (kind === "number") return amount.transform(({ text }) => text);
  return amount.transform(({ text }) => Math.round(text * 100));
}

function defaultsOf({ kind, value }: { kind: EditKind; value: unknown }): EditFieldValues {
  if (kind === "boolean") return { text: "", checked: value === true };
  if (typeof value === "number")
    return { text: String(kind === "money" ? value / 100 : value), checked: false };
  return { text: typeof value === "string" ? value : "", checked: false };
}

export type UseEditFieldFormInput = { kind: EditKind; value: unknown };

/** react-hook-form for one approval-card value, with localized messages. */
export function useEditFieldForm({ kind, value }: UseEditFieldFormInput) {
  const messages = useZodMessages();
  const schema = useMemo(() => schemaFor({ kind }), [kind]);
  return useForm<EditFieldValues, unknown, EditValue>({
    resolver: zodResolver(schema, messages),
    defaultValues: defaultsOf({ kind, value }),
  });
}
