import type { EntityTypeDto, ItemDto } from "@bibi/core";
import { getTranslations } from "next-intl/server";
import { EditableSection } from "@/components/inline-edit/editable-section";
import { type Fact, FactList } from "@/components/typed-fields/fact-list";
import { getNumberFormat } from "@/server/number-format";
import { customisationGroupLines } from "./customisation-group-lines";
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

/** The item's buffers: its own minutes, else its type's, said as such. */
function timingFacts({ item, type, t, page }: TimingInput): Fact[] {
  const minutes = ({ own, effective }: { own: number | null; effective: number }) =>
    own === null ? page("fromType", { minutes: effective }) : page("minutes", { minutes: own });
  return [
    ...(hasCapability({ type, capability: "BOOKABLE" })
      ? [
          {
            label: t("fields.defaultDurationMinutes"),
            value:
              item.defaultDurationMinutes === null
                ? "–"
                : page("minutes", { minutes: item.defaultDurationMinutes }),
          },
        ]
      : []),
    {
      label: page("setup"),
      value: minutes({ own: item.setupMinutes, effective: item.effectiveSetupMinutes }),
    },
    {
      label: page("teardown"),
      value: minutes({ own: item.teardownMinutes, effective: item.effectiveTeardownMinutes }),
    },
  ];
}

type Translator = Awaited<ReturnType<typeof getTranslations<"item">>>;
type PageTranslator = Awaited<ReturnType<typeof getTranslations<"item.page">>>;
type TimingInput = {
  item: ItemDto;
  type: EntityTypeDto | undefined;
  t: Translator;
  page: PageTranslator;
};

/**
 * The item's capability values and buffers as sections edited in place, each from the pencil
 * beside its title and sending only its own fields (like the order page).
 */
export async function ItemSections({ item, type, data, canEdit }: ItemSectionsProps) {
  const [t, page, buffers, { money }] = await Promise.all([
    getTranslations("item"),
    getTranslations("item.page"),
    getTranslations("buffers"),
    getNumberFormat(),
  ]);
  const price =
    item.priceMinor === null || item.priceUnit === null
      ? page("noPrice")
      : t("priceValue", {
          amount: money({ minor: item.priceMinor }),
          unit: t(`priceUnits.${item.priceUnit}`),
        });
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
    ...(hasCapability({ type, capability: "PRICED" })
      ? [
          {
            group: "price" as const,
            title: t("sections.price"),
            editLabel: page("editPrice"),
            body: <p className="text-sm">{price}</p>,
          },
        ]
      : []),
    {
      group: "timing",
      title: hasCapability({ type, capability: "BOOKABLE" }) ? page("timing") : buffers("legend"),
      editLabel: page("editTiming"),
      body: <FactList facts={timingFacts({ item, type, t, page })} />,
    },
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
