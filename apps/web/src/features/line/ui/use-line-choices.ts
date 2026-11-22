import type { LineChooseOptionsInput } from "@bibi/core/schemas";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { useZodMessages } from "@/lib/use-zod-messages";
import {
  type ChooseOptionsFormValues,
  type ChosenOption,
  chooseOptionsDefaults,
  chooseOptionsSchema,
} from "./choose-options-schema";
import type { CustomisableItem } from "./program-form-data";
import { usePickRuleText } from "./use-pick-rule-text";

/** The edited line's choices: its item's customisation groups and what is chosen now. */
export type LineChoices = {
  item: CustomisableItem;
  chosen: readonly ChosenOption[];
  /** The line's effective quantity, which a split group's quantities should add up to. */
  quantity: number | null;
};

export type UseLineChoicesInput = { lineId: string; choices: LineChoices | undefined };

const NO_ITEM: CustomisableItem = { itemId: "", groups: [] };

/** The same choices in any order: a save that changes none sends no `line.chooseOptions`. */
const keyOf = ({ options }: { options: readonly { itemId: string; quantity?: number | null }[] }) =>
  options
    .map(({ itemId, quantity }) => `${itemId}:${quantity ?? ""}`)
    .toSorted()
    .join("|");

/**
 * The choices part of the line's edit form (ADR 0059, 0082): its own form state, validated with
 * the line on Save, and the `line.chooseOptions` input when the choices changed (else null).
 */
export function useLineChoices({ lineId, choices }: UseLineChoicesInput) {
  const item = choices?.item ?? NO_ITEM;
  const ruleText = usePickRuleText();
  const schema = useMemo(
    () => chooseOptionsSchema({ lineId, item, ruleText }),
    [lineId, item, ruleText],
  );
  const form = useForm<ChooseOptionsFormValues, unknown, LineChooseOptionsInput>({
    resolver: zodResolver(schema, useZodMessages()),
    defaultValues: chooseOptionsDefaults({ item, chosen: choices?.chosen ?? [] }),
  });
  const initial = keyOf({ options: choices?.chosen ?? [] });
  /** Validates the choices: `ok` false keeps the dialog open with the group's message. */
  const resolve = async (): Promise<{ ok: boolean; input: LineChooseOptionsInput | null }> => {
    if (!choices) return { ok: true, input: null };
    let input: LineChooseOptionsInput | null = null;
    await form.handleSubmit((values) => {
      input = values;
    })();
    if (input === null) return { ok: false, input: null };
    const changed = keyOf({ options: (input as LineChooseOptionsInput).options }) !== initial;
    return { ok: true, input: changed ? input : null };
  };
  return { form, item, resolve };
}
