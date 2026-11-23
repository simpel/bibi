import type { ItemDto } from "@bibi/core";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { useInlineEdit } from "@/components/inline-edit/inline-edit";
import { useTypedResolver } from "@/components/typed-fields/use-typed-resolver";
import { useRouter } from "@/lib/navigation";
import { useFormAction } from "@/lib/use-form-action";
import { updateItemAction } from "../actions";
import type { ItemFormData } from "./item-form-data";
import { type ItemFormOutput, itemFormSchema } from "./item-form-schema";
import { type ItemFormValues, itemFormDefaults } from "./item-form-values";
import { type ItemEditGroup, toUpdateInput } from "./item-update-input";

export type UseItemEditInput = {
  item: ItemDto;
  data: ItemFormData;
  groups: readonly ItemEditGroup[];
  /** The own field a `field` editor changes. */
  fieldKey?: string | undefined;
};

/**
 * One in-place editor of an item (the picture's popover, a section's form): the whole item's
 * form state and checks, but only `groups` are sent. Saving closes the editor and refreshes.
 */
export function useItemEdit({ item, data, groups, fieldKey }: UseItemEditInput) {
  const t = useTranslations("item");
  const router = useRouter();
  const { close } = useInlineEdit();
  const type = data.types.find(({ id }) => id === item.entityTypeId);
  const resolver = useTypedResolver<ItemFormValues, ItemFormOutput>({
    types: data.types,
    schemaFor: ({ type: current }) =>
      itemFormSchema({ type: current, vocabularies: data.vocabularies }),
  });
  const form = useForm<ItemFormValues, unknown, ItemFormOutput>({
    resolver,
    defaultValues: itemFormDefaults({ type, item }),
  });
  const { submit, pending } = useFormAction({
    form,
    action: ({ values }) =>
      updateItemAction({ input: toUpdateInput({ item, values, type, groups, fieldKey }) }),
    messages: { pending: t("saving"), success: t("updated") },
    onSuccess: () => {
      close();
      router.refresh();
    },
  });
  return { form, submit, pending, type, close };
}
