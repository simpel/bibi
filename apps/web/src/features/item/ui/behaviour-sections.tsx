import type { EntityTypeDto } from "@okazi/core";
import type { UseFormReturn } from "react-hook-form";
import { BookableSection } from "./bookable-section";
import { ChoiceGroupsSection } from "./choice-groups-section";
import { ComponentsSection } from "./components-section";
import { hasBehaviour } from "./has-behaviour";
import type { ItemFormData } from "./item-form-data";
import type { ItemFormOutput } from "./item-form-schema";
import type { ItemFormValues } from "./item-form-values";
import { PriceSection } from "./price-section";
import { SetupsSection } from "./setups-section";

export type BehaviourSectionsProps = {
  form: UseFormReturn<ItemFormValues, unknown, ItemFormOutput>;
  type: EntityTypeDto;
  data: ItemFormData;
  /** The item being edited, left out of the parts it can contain. */
  itemId?: string | undefined;
};

/** One form section per behaviour the item's type has. */
export function BehaviourSections({ form, type, data, itemId }: BehaviourSectionsProps) {
  const parts = data.parts.filter(({ id }) => id !== itemId);
  return (
    <>
      {hasBehaviour({ type, behaviour: "PRICED" }) ? <PriceSection form={form} /> : null}
      {hasBehaviour({ type, behaviour: "BOOKABLE" }) ? <BookableSection form={form} /> : null}
      {hasBehaviour({ type, behaviour: "SETUPS" }) ? (
        <SetupsSection form={form} setups={data.setups} />
      ) : null}
      {hasBehaviour({ type, behaviour: "COMPOSABLE" }) ? (
        <ComponentsSection form={form} parts={parts} />
      ) : null}
      {hasBehaviour({ type, behaviour: "CHOICES" }) ? (
        <ChoiceGroupsSection form={form} parts={parts} />
      ) : null}
    </>
  );
}
