import type { EntityTypeDto, ItemDto } from "@bibi/core";
import { getTranslations } from "next-intl/server";
import { FactList } from "@/components/typed-fields/fact-list";
import { editableItemFact } from "./editable-item-fact";
import { itemFacts } from "./item-facts-list";
import type { ItemFormData } from "./item-form-data";

export type ItemDetailsSectionProps = {
  item: ItemDto;
  type: EntityTypeDto | undefined;
  data: ItemFormData;
  canEdit: boolean;
};

/**
 * Description, type, venue and the type's own fields. Each fact but the type (fixed at create)
 * has its own pencil and saves only itself.
 */
export async function ItemDetailsSection(props: ItemDetailsSectionProps) {
  const { item, type, data } = props;
  const [t, page, common] = await Promise.all([
    getTranslations("item"),
    getTranslations("item.page"),
    getTranslations("common"),
  ]);
  const yesNo = { yes: common("yes"), no: common("no") };
  const [typeFact, venueFact, ...own] = itemFacts({
    ...{ item, type, data, t, yesNo },
    hidden: common("hidden"),
  });
  const description = { label: t("fields.description"), value: item.description ?? "–" };
  const facts = [
    editableItemFact({
      ...props,
      fact: description,
      editLabel: page("editFact", { label: description.label }),
      group: "description",
    }),
    ...(typeFact ? [typeFact] : []),
    ...(venueFact
      ? [
          editableItemFact({
            ...props,
            fact: venueFact,
            editLabel: page("editFact", { label: venueFact.label }),
            group: "venue",
          }),
        ]
      : []),
    ...own.map((fact, index) =>
      editableItemFact({
        ...props,
        fact,
        editLabel: page("editFact", { label: fact.label }),
        group: "field",
        fieldKey: type?.fields[index]?.key,
      }),
    ),
  ];
  return (
    <section className="grid grid-cols-1 gap-4">
      <h2 className="text-xl">{page("details")}</h2>
      <FactList facts={facts} />
    </section>
  );
}
