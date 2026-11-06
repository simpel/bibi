import type { ExampleLine, PipelineCreateExamplesInput } from "@bibi/core/schemas";
import { categoryOf, type SetupDraft } from "./setup-draft";

/** The texts of `welcome.examples`, already translated. */
export type ExampleTexts = {
  typeNames: PipelineCreateExamplesInput["typeNames"];
  customerName: string;
  contactName: string;
  meeting: string;
  conference: string;
  dinner: string;
};

const CONTACT_EMAIL = "anna@example.com";

/** A line on an item named like its type, e.g. "Bankettsal" in Bankettsal. */
const lineOf = ({
  type,
  priceMinor,
  quantity,
}: {
  type: string;
  priceMinor: number;
  quantity?: number;
}): ExampleLine => ({
  name: type,
  itemType: type,
  itemName: type,
  unitPriceMinor: priceMinor,
  ...(quantity === undefined ? {} : { quantity }),
});

/** The ticked type names of one category, as activation creates them. */
const namesOf = ({ draft, category }: { draft: SetupDraft; category: string }) =>
  draft.types
    .filter((type) => type.checked && categoryOf({ type }) === category)
    .map((type) => type.name.trim())
    .filter((name) => name.length > 0);

/**
 * The three example orders of a fresh board (docs/specs/welcome.md "Example orders"): a small
 * meeting, a full-day conference and a dinner moved past the entry status, on the chosen spaces
 * and food types. Without types ("Start empty") the orders have no lines. Prices in öre.
 */
export function exampleOrdersInput({
  draft,
  texts,
}: {
  draft: SetupDraft;
  texts: ExampleTexts;
}): PipelineCreateExamplesInput {
  const spaces = namesOf({ draft, category: "spaces" });
  const food = namesOf({ draft, category: "food" });
  const room = ({ type, priceMinor }: { type: string | undefined; priceMinor: number }) =>
    type ? [lineOf({ type, priceMinor, quantity: 1 })] : [];
  const meals = ({ types, priceMinor }: { types: (string | undefined)[]; priceMinor: number }) =>
    types.flatMap((type) => (type ? [lineOf({ type, priceMinor })] : []));
  const conferenceFood = food.length > 1 ? food.slice(1, 3) : food.slice(0, 1);
  return {
    typeNames: texts.typeNames,
    customer: {
      name: texts.customerName,
      contactName: texts.contactName,
      contactEmail: CONTACT_EMAIL,
    },
    orders: [
      {
        ...{ title: texts.meeting, startsInDays: 3, startTime: "09:00", endTime: "12:00" },
        ...{ headcount: 12, advance: false },
        lines: [
          ...room({ type: spaces[0], priceMinor: 250_000 }),
          ...meals({ types: [food[0]], priceMinor: 6_500 }),
        ],
      },
      {
        ...{ title: texts.conference, startsInDays: 10, startTime: "08:30", endTime: "17:00" },
        ...{ headcount: 40, advance: false },
        lines: [
          ...room({ type: spaces[1] ?? spaces[0], priceMinor: 900_000 }),
          ...meals({ types: conferenceFood, priceMinor: 19_500 }),
        ],
      },
      {
        ...{ title: texts.dinner, startsInDays: 24, startTime: "18:00", endTime: "23:00" },
        ...{ headcount: 24, advance: true },
        lines: [
          ...room({ type: spaces[0], priceMinor: 600_000 }),
          ...meals({ types: [food[2] ?? food.at(-1)], priceMinor: 59_500 }),
        ],
      },
    ],
  };
}
