import type { EntityTypeDto, ItemDto } from "@bibi/core";
import { StatCard, StatCards } from "@bibi/ui";
import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import { EditableFact } from "@/components/inline-edit/editable-fact";
import { getNumberFormat } from "@/server/number-format";
import { hasCapability } from "./has-capability";
import type { ItemFormData } from "./item-form-data";
import { ItemInlineEditor } from "./item-inline-editor";
import type { ItemEditGroup } from "./item-update-input";

export type ItemStatCardsProps = {
  item: ItemDto;
  type: EntityTypeDto | undefined;
  data: ItemFormData;
  canEdit: boolean;
};

type Card = {
  group: ItemEditGroup;
  label: string;
  value: string;
  hint?: string;
  editLabel: string;
};

/**
 * The item's headline figures from its capabilities: price (PRICED), capacity (SETUPS) and
 * default length (BOOKABLE). Hovering a card shows its pencil; each edits only itself.
 */
export async function ItemStatCards({ item, type, data, canEdit }: ItemStatCardsProps) {
  const [t, page, { money }] = await Promise.all([
    getTranslations("item"),
    getTranslations("item.page"),
    getNumberFormat(),
  ]);
  const vat =
    item.vatRatePercent === null
      ? page("vatDefault")
      : page("vat", { percent: item.vatRatePercent });
  const cards: Card[] = [
    ...(hasCapability({ type, capability: "PRICED" })
      ? [
          {
            group: "price" as const,
            label: t("sections.price"),
            value: item.priceMinor === null ? "–" : money({ minor: item.priceMinor }),
            hint: item.priceUnit ? `${t(`priceUnits.${item.priceUnit}`)} · ${vat}` : vat,
            editLabel: page("editPrice"),
          },
        ]
      : []),
    ...(hasCapability({ type, capability: "SETUPS" })
      ? [
          {
            group: "layouts" as const,
            label: page("capacity"),
            value: item.maxPeople === null ? "–" : String(item.maxPeople),
            hint: item.maxPeople === null ? page("noCapacity") : page("people"),
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
    <StatCards>
      {cards.map((card) => (
        <StatCard
          key={card.group}
          label={card.label}
          value={editableValue({ card })}
          hint={card.hint}
          className="group/fact"
        />
      ))}
    </StatCards>
  );
}
