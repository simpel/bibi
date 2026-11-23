"use client";

import type { ItemDto } from "@bibi/core";
import { Button, Form } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { BufferFields } from "@/components/form/buffer-fields";
import { TextField } from "@/components/form/text-field";
import { TypeFields } from "@/components/typed-fields/type-fields";
import { BookableSection } from "./bookable-section";
import { CustomisationGroupsSection } from "./customisation-groups-section";
import { hasCapability } from "./has-capability";
import { ItemVenueField } from "./item-core-fields";
import type { ItemFormData } from "./item-form-data";
import { ItemPictureField } from "./item-picture-field";
import type { ItemEditGroup } from "./item-update-input";
import { MaxPeopleSection } from "./max-people-section";
import { PartsSection } from "./parts-section";
import { PriceSection } from "./price-section";
import { useItemEdit } from "./use-item-edit";

export type ItemInlineEditorProps = {
  item: ItemDto;
  data: ItemFormData;
  /** The one part of the item this editor changes. */
  group: ItemEditGroup;
};

type GroupProps = ItemInlineEditorProps & { form: ReturnType<typeof useItemEdit>["form"] };

/** The fields of one group; the section around it already says what they are. */
function GroupFields({ item, data, group, form }: GroupProps) {
  const t = useTranslations("item.fields");
  const type = data.types.find(({ id }) => id === item.entityTypeId);
  const others = data.parts.filter(({ id }) => id !== item.id);
  if (group === "picture") return <ItemPictureField form={form} />;
  if (group === "price") return <PriceSection form={form} />;
  if (group === "layouts") return <MaxPeopleSection form={form} />;
  if (group === "parts") return <PartsSection form={form} parts={others} />;
  if (group === "customisations") return <CustomisationGroupsSection form={form} items={others} />;
  if (group === "timing") {
    return (
      <>
        {hasCapability({ type, capability: "BOOKABLE" }) ? <BookableSection form={form} /> : null}
        <BufferFields form={form} />
      </>
    );
  }
  return (
    <>
      <TextField form={form} name="description" label={t("description")} multiline />
      <ItemVenueField form={form} venues={data.venues} venuesHidden={data.venuesHidden} />
      {type ? <TypeFields control={form.control} type={type} data={data} /> : null}
    </>
  );
}

/** Edits one part of an item in place (the picture's popover, a section), sending only that part. */
export function ItemInlineEditor(props: ItemInlineEditorProps) {
  const common = useTranslations("common");
  const { form, submit, pending, close } = useItemEdit({ ...props, groups: [props.group] });
  return (
    <Form {...form}>
      <form onSubmit={submit} noValidate className="grid gap-4 [&_legend]:sr-only">
        <GroupFields {...props} form={form} />
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={close} disabled={pending}>
            {common("cancel")}
          </Button>
          <Button type="submit" disabled={pending}>
            {common("save")}
          </Button>
        </div>
      </form>
    </Form>
  );
}
