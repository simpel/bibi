import { zodResolver } from "@hookform/resolvers/zod";
import type { ItemDto } from "@okazi/core";
import { useRouter } from "@okazi/i18n/navigation";
import { useTranslations } from "next-intl";
import { type Resolver, useForm } from "react-hook-form";
import { useFormAction } from "@/lib/use-form-action";
import { useZodMessages } from "@/lib/use-zod-messages";
import { createItemAction, saveItemAsPackageAction, updateItemAction } from "../actions";
import type { ItemFormData } from "./item-form-data";
import { type ItemFormOutput, itemFormSchema } from "./item-form-schema";
import { type ItemFormValues, itemFormDefaults } from "./item-form-values";
import { toUpdateInput } from "./item-update-input";

type FindTypeInput = { types: ItemFormData["types"]; id: string };

const findType = ({ types, id }: FindTypeInput) => types.find((type) => type.id === id);

export type UseItemFormInput = {
  data: ItemFormData;
  /** Present = edit mode, absent = create mode. */
  item?: ItemDto | undefined;
  /** Create mode: the type to start with, e.g. the one chosen in the list filter. */
  typeId?: string | undefined;
  /** Create mode: save the item as this customer's package ("Save as package", ADR 0021). */
  customerId?: string | undefined;
  onDone: () => void;
};

type SuccessKeyInput = { item: ItemDto | undefined; customerId: string | undefined };

const successKey = ({ item, customerId }: SuccessKeyInput) =>
  item ? "updated" : customerId ? "packageSaved" : "created";

type CreateActionInput = { values: ItemFormOutput; customerId: string | undefined };

/** A catalog item, or a customer's package when a customer is given. */
const createAction = ({ values, customerId }: CreateActionInput) =>
  customerId
    ? saveItemAsPackageAction({
        input: { ...values, customerId, components: values.components ?? [] },
      })
    : createItemAction({ input: values });

/**
 * Item form state. The resolver is built per selected type, so the type's own fields are
 * validated with `buildFieldsSchema`; server field issues (`fields.<key>`) land on the controls.
 */
export function useItemForm({ data, item, typeId, customerId, onDone }: UseItemFormInput) {
  const t = useTranslations("item");
  const router = useRouter();
  const messages = useZodMessages();
  const typeOf = ({ id }: { id: string }) => findType({ types: data.types, id });
  const initial = typeOf({ id: item?.entityTypeId ?? typeId ?? "" });
  const form = useForm<ItemFormValues, unknown, ItemFormOutput>({
    resolver: (values, context, options) => {
      const type = typeOf({ id: values.entityTypeId });
      const schema = itemFormSchema({ type, vocabularies: data.vocabularies });
      return zodResolver(schema, messages)(values, context, options) as ReturnType<
        Resolver<ItemFormValues, unknown, ItemFormOutput>
      >;
    },
    defaultValues: itemFormDefaults({ type: initial, item }),
  });
  const { submit, pending } = useFormAction({
    form,
    action: ({ values }) =>
      item
        ? updateItemAction({
            input: toUpdateInput({ item, values, type: typeOf({ id: item.entityTypeId }) }),
          })
        : createAction({ values, customerId }),
    messages: { pending: t("saving"), success: t(successKey({ item, customerId })) },
    onSuccess: () => {
      router.refresh();
      onDone();
    },
  });
  return { form, submit, pending, typeOf };
}
