import type { DemoItem } from "../../config-types";

type MealInput = Pick<DemoItem, "name" | "parts" | "customisations"> & {
  kr: number;
  style: string;
};

const meal = ({ name, kr, style, parts, customisations }: MealInput): DemoItem => ({
  type: "Meal",
  name,
  fields: { "Service style": style },
  ...{ priceKr: kr, priceUnit: "PER_PERSON" },
  ...(parts ? { parts } : {}),
  ...(customisations ? { customisations } : {}),
});

const named = ({ names }: { names: readonly string[] }) => names.map((name) => ({ name }));

/** Lindholmen's 6 meals (`docs/demo-seed.md`, Meals). Parts outside a customisation group are mandatory. */
export const lindholmenMeals: readonly DemoItem[] = [
  meal({
    ...{ name: "Conference breakfast", kr: 125, style: "Buffet" },
    parts: named({
      names: [
        "Sourdough bread with butter",
        "Yoghurt with granola",
        "Scrambled eggs",
        "Fresh fruit",
        "Coffee and tea",
      ],
    }),
  }),
  meal({
    ...{ name: "Morning break", kr: 65, style: "Buffet" },
    parts: named({ names: ["Coffee and tea"] }),
    customisations: [
      { name: "Snack", options: named({ names: ["Cinnamon bun", "Oat ball", "Fresh fruit"] }) },
    ],
  }),
  meal({
    ...{ name: "Afternoon break", kr: 65, style: "Buffet" },
    parts: named({ names: ["Coffee and tea"] }),
    customisations: [
      { name: "Snack", options: named({ names: ["Carrot cake", "Oat ball", "Fresh fruit"] }) },
    ],
  }),
  meal({
    ...{ name: "Conference lunch", kr: 245, style: "Buffet" },
    parts: named({ names: ["Green salad and bread", "Mineral water"] }),
    customisations: [
      {
        name: "Main course",
        options: named({
          names: [
            "Oven-baked cod loin, browned butter",
            "Veal roast with red wine sauce",
            "Mushroom risotto",
            "Lentil stew with coconut rice",
          ],
        }),
      },
    ],
  }),
  meal({
    ...{ name: "Three-course dinner", kr: 595, style: "Plated" },
    customisations: [
      {
        name: "Starter",
        options: named({
          names: ["Skagen shrimp salad on rye bread", "Beetroot carpaccio with chèvre"],
        }),
      },
      {
        name: "Main course",
        options: named({
          names: [
            "Venison fillet, celeriac purée",
            "Pan-fried pike-perch, mussel sauce",
            "Celeriac steak, mustard vinaigrette",
          ],
        }),
      },
      {
        name: "Dessert",
        options: named({
          names: ["Chocolate fondant with hazelnut", "Cloudberry parfait", "Lemon sorbet"],
        }),
      },
    ],
  }),
  meal({
    ...{ name: "Reception buffet", kr: 245, style: "Finger food" },
    parts: named({
      names: [
        "Toast Skagen",
        "Charcuterie and cheese",
        "Hummus with vegetable sticks",
        "Spiced nuts",
      ],
    }),
  }),
];
