import type { EntityTypeDto, ItemDto } from "@bibi/core";
import { getTranslations } from "next-intl/server";
import { EditableSection } from "@/components/inline-edit/editable-section";
import { FactList } from "@/components/typed-fields/fact-list";
import { customisationGroupLines } from "./customisation-group-lines";
import { editableItemFact } from "./editable-item-fact";
import { hasCapability } from "./has-capability";
import type { ItemFormData } from "./item-form-data";
import { ItemInlineEditor } from "./item-inline-editor";
import type { ItemEditGroup } from "./item-update-input";

export type ItemSectionsProps = {
  item: ItemDto;
  type: EntityTypeDto | undefined;
  data: ItemFormData;
  canEdit: boolean;
};

type Section = { group: ItemEditGroup; title: string; editLabel: string; body: React.ReactNode };

/** A list of lines, or what it says when there are none. */
function Lines({ lines, empty }: { lines: string[]; empty: string }) {
  if (lines.length === 0) return <p className="text-sm text-muted-foreground">{empty}</p>;
  return (
    <ul className="grid gap-1 text-sm">
      {lines.map((line) => (
        <li key={line}>{line}</li>
      ))}
    </ul>
  );
}

/**
 * The item's setup and teardown (a pencil per setting), then its parts and customisation groups
 * as sections edited from the pencil beside their title. Price, capacity and default length are
 * the stat cards at the top (`ItemStatCards`).
 */
export async function ItemSections({ item, type, data, canEdit }: ItemSectionsProps) {
  const [t, page, buffers] = await Promise.all([
    getTranslations("item"),
    getTranslations("item.page"),
    getTranslations("buffers"),
  ]);
  const minutes = ({ own, effective }: { own: number | null; effective: number }) =>
    own === null ? page("fromType", { minutes: effective }) : page("minutes", { minutes: own });
  const setup = {
    label: page("setup"),
    value: minutes({ own: item.setupMinutes, effective: item.effectiveSetupMinutes }),
  };
  const teardown = {
    label: page("teardown"),
    value: minutes({ own: item.teardownMinutes, effective: item.effectiveTeardownMinutes }),
  };
  const fact = { item, data, canEdit };
  const bufferFacts = [
    editableItemFact({
      ...fact,
      fact: setup,
      editLabel: page("editFact", { label: setup.label }),
      group: "setup",
    }),
    editableItemFact({
      ...fact,
      fact: teardown,
      editLabel: page("editFact", { label: teardown.label }),
      group: "teardown",
    }),
  ];
  const parts = item.parts.map(({ itemId, quantity, offsetMinutes, required }) =>
    t("partValue", {
      quantity,
      name: data.parts.find(({ id }) => id === itemId)?.name ?? "–",
      offset: offsetMinutes,
      required: String(required),
    }),
  );
  const groups = customisationGroupLines({
    groups: item.customisationGroups,
    format: (values) => t("customisationGroupValue", values),
  });
  const sections: Section[] = [
    ...(hasCapability({ type, capability: "BUNDLE" })
      ? [
          {
            group: "parts" as const,
            title: t("sections.parts"),
            editLabel: page("editParts"),
            body: <Lines lines={parts} empty={page("noParts")} />,
          },
        ]
      : []),
    ...(hasCapability({ type, capability: "CUSTOMISATIONS" })
      ? [
          {
            group: "customisations" as const,
            title: t("sections.customisations"),
            editLabel: page("editCustomisations"),
            body: <Lines lines={groups} empty={page("noCustomisations")} />,
          },
        ]
      : []),
  ];
  return (
    <>
      <section className="grid grid-cols-1 gap-4">
        <h2 className="text-xl">{buffers("legend")}</h2>
        <FactList facts={bufferFacts} />
      </section>
      {sections.map(({ group, title, editLabel, body }) => (
        <EditableSection
          key={group}
          {...{ title, editLabel, canEdit }}
          editor={<ItemInlineEditor item={item} data={data} group={group} />}
        >
          {body}
        </EditableSection>
      ))}
    </>
  );
}
