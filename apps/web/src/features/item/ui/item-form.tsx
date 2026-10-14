import type { ItemDto } from "@okazi/core";
import { Button, DialogFooter, Form } from "@okazi/ui";
import { useTranslations } from "next-intl";
import { BookingSection } from "./booking-section";
import { hasBehaviour } from "./has-behaviour";
import { ItemCoreFields } from "./item-core-fields";
import type { ItemFormData } from "./item-form-data";
import { rawFields } from "./item-form-values";
import { ItemTypeField } from "./item-type-field";
import { ItemTypeFields } from "./item-type-fields";
import { PriceSection } from "./price-section";
import { SetupsSection } from "./setups-section";
import { useItemForm } from "./use-item-form";

export type ItemFormProps = {
  data: ItemFormData;
  item?: ItemDto | undefined;
  typeId?: string | undefined;
  onDone: () => void;
};

/** Create (type picker first) or edit an item: core fields, the type's own fields, behaviours. */
export function ItemForm({ data, item, typeId, onDone }: ItemFormProps) {
  const common = useTranslations("common");
  const { form, submit, pending, typeOf } = useItemForm({ data, item, typeId, onDone });
  const type = typeOf({ id: form.watch("entityTypeId") });
  return (
    <Form {...form}>
      <form onSubmit={submit} noValidate className="grid gap-4">
        {item ? null : (
          <ItemTypeField
            control={form.control}
            types={data.types}
            onTypeChange={(id) =>
              form.setValue("fields", rawFields({ type: typeOf({ id }), stored: {} }))
            }
          />
        )}
        {type ? (
          <>
            <ItemCoreFields form={form} venues={data.venues} />
            <ItemTypeFields control={form.control} type={type} vocabularies={data.vocabularies} />
            {hasBehaviour({ type, behaviour: "PRICED" }) ? <PriceSection form={form} /> : null}
            {hasBehaviour({ type, behaviour: "BOOKABLE" }) ? <BookingSection form={form} /> : null}
            {hasBehaviour({ type, behaviour: "SETUPS" }) ? (
              <SetupsSection form={form} setups={data.setups} />
            ) : null}
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
