import type { DemoItem } from "../../config-types";

type DrinkInput = Pick<DemoItem, "name" | "priceUnit" | "icon"> & {
  kr: number;
  alcoholic: boolean;
  allergens?: readonly string[];
};

const drink = ({ name, kr, priceUnit, alcoholic, allergens, icon }: DrinkInput): DemoItem => ({
  type: "Drink",
  name,
  ...(icon ? { icon } : {}),
  fields: { Alcoholic: alcoholic, ...(allergens ? { Allergens: allergens } : {}) },
  ...{ priceKr: kr, priceUnit },
});

const sulphites = ["Sulphur dioxide/sulphites"];

/** Lindholmen's 6 drinks (`docs/demo-seed.md`, Drinks). Price excl. VAT per person or each. */
export const lindholmenDrinks: readonly DemoItem[] = [
  drink({
    ...{ name: "Coffee and tea", kr: 35, priceUnit: "PER_PERSON", alcoholic: false },
    icon: "coffee",
  }),
  drink({
    ...{ name: "Mineral water", kr: 25, priceUnit: "PER_UNIT", alcoholic: false },
    icon: "glass-water",
  }),
  drink({
    ...{ name: "Sparkling welcome drink", kr: 95, priceUnit: "PER_PERSON" },
    ...{ alcoholic: true, allergens: sulphites },
  }),
  drink({ name: "Alcohol-free bubbly", kr: 65, priceUnit: "PER_PERSON", alcoholic: false }),
  drink({
    ...{ name: "Lager from Göteborg", kr: 85, priceUnit: "PER_UNIT" },
    ...{ alcoholic: true, allergens: ["Gluten"], icon: "beer" },
  }),
  drink({
    ...{ name: "Wine package (2 glasses)", kr: 225, priceUnit: "PER_PERSON" },
    ...{ alcoholic: true, allergens: sulphites },
  }),
];
