import type { DemoItem } from "../../config-types";

type DrinkInput = Pick<DemoItem, "name" | "priceUnit"> & {
  kr: number;
  alcoholic: boolean;
  allergens?: readonly string[];
};

const drink = ({ name, kr, priceUnit, alcoholic, allergens }: DrinkInput): DemoItem => ({
  type: "Drink",
  name,
  fields: { Alcoholic: alcoholic, ...(allergens ? { Allergens: allergens } : {}) },
  ...{ priceKr: kr, priceUnit },
});

const sulphites = ["Sulphur dioxide/sulphites"];

/** Lindholmen's 6 drinks (`docs/demo-seed.md`, Drinks). Price excl. VAT per person or each. */
export const lindholmenDrinks: readonly DemoItem[] = [
  drink({ name: "Coffee and tea", kr: 35, priceUnit: "PER_PERSON", alcoholic: false }),
  drink({ name: "Mineral water", kr: 25, priceUnit: "PER_UNIT", alcoholic: false }),
  drink({
    ...{ name: "Sparkling welcome drink", kr: 95, priceUnit: "PER_PERSON" },
    ...{ alcoholic: true, allergens: sulphites },
  }),
  drink({ name: "Alcohol-free bubbly", kr: 65, priceUnit: "PER_PERSON", alcoholic: false }),
  drink({
    ...{ name: "Lager from Göteborg", kr: 85, priceUnit: "PER_UNIT" },
    ...{ alcoholic: true, allergens: ["Gluten"] },
  }),
  drink({
    ...{ name: "Wine package (2 glasses)", kr: 225, priceUnit: "PER_PERSON" },
    ...{ alcoholic: true, allergens: sulphites },
  }),
];
