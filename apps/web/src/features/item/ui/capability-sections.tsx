import type { EntityTypeDto } from "@okazi/core";
import type { UseFormReturn } from "react-hook-form";
import { BufferFields } from "@/components/form/buffer-fields";
import { BookableSection } from "./bookable-section";
import { CustomisationGroupsSection } from "./customisation-groups-section";
import { hasCapability } from "./has-capability";
import type { ItemFormData } from "./item-form-data";
import type { ItemFormOutput } from "./item-form-schema";
import type { ItemFormValues } from "./item-form-values";
import { PartsSection } from "./parts-section";
import { PriceSection } from "./price-section";
import { SetupsSection } from "./setups-section";

export type CapabilitySectionsProps = {
  form: UseFormReturn<ItemFormValues, unknown, ItemFormOutput>;
  type: EntityTypeDto;
  data: ItemFormData;
  /** The item being edited, left out of the parts and options it can contain. */
  itemId?: string | undefined;
};

/** One form section per capability the item's type has, and the buffers every item has. */
export function CapabilitySections({ form, type, data, itemId }: CapabilitySectionsProps) {
  const parts = data.parts.filter(({ id }) => id !== itemId);
  return (
    <>
      {hasCapability({ type, capability: "PRICED" }) ? <PriceSection form={form} /> : null}
      {hasCapability({ type, capability: "BOOKABLE" }) ? <BookableSection form={form} /> : null}
      {hasCapability({ type, capability: "SETUPS" }) ? (
        <SetupsSection form={form} setups={data.setups} />
      ) : null}
      {hasCapability({ type, capability: "BUNDLE" }) ? (
        <PartsSection form={form} parts={parts} />
      ) : null}
      {hasCapability({ type, capability: "CUSTOMISATIONS" }) ? (
        <CustomisationGroupsSection form={form} items={parts} />
      ) : null}
      <BufferFields form={form} inherits="type" />
    </>
  );
}
