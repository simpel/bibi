import type { EntityTypeDto, ItemDto } from "@bibi/core";
import { KeyFacts } from "@bibi/ui";
import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import { EditableFact } from "@/components/inline-edit/editable-fact";
import { getNumberFormat } from "@/server/number-format";
import { hasCapability } from "./has-capability";
import type { ItemFormData } from "./item-form-data";
import { ItemInlineEditor } from "./item-inline-editor";
import type { ItemEditGroup } from "./item-update-input";

export type ItemKeyFactsProps = {
  item: ItemDto;
  type: EntityTypeDto | undefined;
  data: ItemFormData;
  canEdit: boolean;
};

type Card = {
  group: ItemEditGroup;
  label: string;
  value: string;
  editLabel: string;
};

/**
 * The item's key facts under its title, like an order's: price (PRICED), capacity (SETUPS) and
 * default length (BOOKABLE), each with its own pencil and editing only itself.
 */
export async function ItemKeyFacts({ item, type, data, canEdit }: ItemKeyFactsProps) {
  const [t, page, { money }] = await Promise.all([
    getTranslations("item"),
    getTranslations("item.page"),
    getNumberFormat(),
  ]);
  const cards: Card[] = [
    ...(hasCapability({ type, capability: "PRICED" })
      ? [
          {
            group: "price" as const,
            label: page("priceLabel", { unit: item.priceUnit ?? "none" }),
            value: item.priceMinor === null ? "–" : money({ minor: item.priceMinor }),
            editLabel: page("editPrice"),
          },
        ]
      : []),
    ...(hasCapability({ type, capability: "SETUPS" })
      ? [
          {
            group: "layouts" as const,
            label: page("capacity"),
            value:
              item.maxPeople === null
                ? page("noCapacity")
                : page("capacityValue", { count: item.maxPeople }),
            editLabel: page("editCapacity"),
          },
        ]
      : []),
    ...(hasCapability({ type, capability: "BOOKABLE" })
      ? [
          {
            group: "duration" as const,
            label: page("defaultLength"),
            value:
              item.defaultDurationMinutes === null
                ? "–"
                : page("minutes", { minutes: item.defaultDurationMinutes }),
            editLabel: page("editDefaultLength"),
          },
        ]
      : []),
  ];
  if (cards.length === 0) return null;
  const editableValue = ({ card }: { card: Card }): ReactNode => (
    <EditableFact
      canEdit={canEdit}
      editLabel={card.editLabel}
      editor={<ItemInlineEditor item={item} data={data} group={card.group} />}
    >
      {card.value}
    </EditableFact>
  );
  return (
    <KeyFacts
      facts={cards.map((card) => ({
        label: card.label,
        value: editableValue({ card }),
      }))}
    />
  );
}
