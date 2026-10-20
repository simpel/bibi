import type { ItemDto } from "@okazi/core";
import { Button, DialogFooter, Form } from "@okazi/ui";
import { useTranslations } from "next-intl";
import { rawFields } from "@/components/typed-fields/raw-fields";
import { TypeFields } from "@/components/typed-fields/type-fields";
import { TypeSelectField } from "@/components/typed-fields/type-select-field";
import { CapabilitySections } from "./capability-sections";
import { ItemCoreFields } from "./item-core-fields";
import type { ItemFormData } from "./item-form-data";
import { useItemForm } from "./use-item-form";

export type ItemFormProps = {
  data: ItemFormData;
  item?: ItemDto | undefined;
  typeId?: string | undefined;
  /** Create mode: save as this customer's bundle. */
  customerId?: string | undefined;
  onDone: () => void;
};

/** Create (type picker first) or edit an item: core fields, the type's own fields, capabilities. */
export function ItemForm(props: ItemFormProps) {
  const { data, item, onDone } = props;
  const common = useTranslations("common");
  const t = useTranslations("item.fields");
  const { form, submit, pending, typeOf } = useItemForm(props);
  const type = typeOf({ id: form.watch("entityTypeId") });
  return (
    <Form {...form}>
      <form onSubmit={submit} noValidate className="grid gap-4">
        {item ? null : (
          <TypeSelectField
            control={form.control}
            types={data.types}
            label={t("type")}
            onTypeChange={(id) =>
              form.setValue("fields", rawFields({ type: typeOf({ id }), stored: {} }))
            }
          />
        )}
        {type ? (
          <>
            <ItemCoreFields form={form} venues={data.venues} venuesHidden={data.venuesHidden} />
            <TypeFields control={form.control} type={type} data={data} />
            <CapabilitySections form={form} type={type} data={data} itemId={item?.id} />
          </>
        ) : null}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onDone}>
            {common("cancel")}
          </Button>
          <Button type="submit" disabled={pending || !type}>
            {common("save")}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}
