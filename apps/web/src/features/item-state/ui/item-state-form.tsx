"use client";

import type { ItemStateCreateInput, ItemStateDto } from "@bibi/core/schemas";
import { Button, DialogFooter, Form } from "@bibi/ui";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { TextField } from "@/components/form/text-field";
import { useRouter } from "@/lib/navigation";
import { ROUTES } from "@/lib/routes";
import { useFormAction } from "@/lib/use-form-action";
import { useZodMessages } from "@/lib/use-zod-messages";
import { createItemStateAction, updateItemStateAction } from "../actions";
import { ItemStateFlagFields } from "./item-state-flag-fields";
import {
  type ItemStateFormValues,
  itemStateFormDefaults,
  itemStateFormSchema,
} from "./item-state-form-schema";

export type ItemStateFormProps = {
  /** The item type the state belongs to. */
  type: { id: string; bookable: boolean };
  /** Present = edit mode, absent = create mode. */
  state?: ItemStateDto | undefined;
};

type SaveInput = { state: ItemStateDto | undefined; values: ItemStateCreateInput };

const save = ({ state, values }: SaveInput) => {
  if (!state) return createItemStateAction({ input: values });
  const { entityTypeId: _type, ...rest } = values;
  return updateItemStateAction({ input: { id: state.id, ...rest } });
};

/** Create or edit form: name, color and the state flags; saving returns to the list. */
export function ItemStateForm({ type, state }: ItemStateFormProps) {
  const t = useTranslations("itemState");
  const common = useTranslations("common");
  const router = useRouter();
  const back = () => router.push(ROUTES.settingsItemStates);
  const form = useForm<ItemStateFormValues, unknown, ItemStateCreateInput>({
    resolver: zodResolver(itemStateFormSchema({ entityTypeId: type.id }), useZodMessages()),
    defaultValues: itemStateFormDefaults({ state }),
  });
  const { submit, pending } = useFormAction({
    form,
    action: ({ values }) => save({ state, values }),
    messages: { pending: t("saving"), success: t(state ? "updated" : "created") },
    onSuccess: back,
  });
  return (
    <Form {...form}>
      <form onSubmit={submit} noValidate className="grid max-w-2xl gap-4">
        <TextField form={form} name="name" label={t("fields.name")} required />
        <TextField form={form} name="color" label={t("fields.color")} type="color" />
        <ItemStateFlagFields form={form} bookable={type.bookable} />
        <DialogFooter>
          <Button type="button" variant="outline" onClick={back}>
            {common("cancel")}
          </Button>
          <Button type="submit" disabled={pending}>
            {common("save")}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}
