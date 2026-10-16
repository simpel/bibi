import type { DemoItem } from "../../config-types";

type DishInput = { name: string; allergens?: readonly string[]; diet?: readonly string[] };

const dish = ({ name, allergens = [], diet = [] }: DishInput): DemoItem => ({
  type: "Dish",
  name,
  fields: {
    ...(allergens.length ? { Allergens: allergens } : {}),
    ...(diet.length ? { Diet: diet } : {}),
  },
});

const veg = ["Vegetarian"];
const vegan = ["Vegan"];
const porkFree = ["Pork-free"];
const sulphites = "Sulphur dioxide/sulphites";

/** Lindholmen's 24 dishes (`docs/demo-seed.md`, Dishes). Dishes have no price of their own. */
export const lindholmenDishes: readonly DemoItem[] = [
  dish({ name: "Sourdough bread with butter", allergens: ["Gluten", "Milk"], diet: veg }),
  dish({ name: "Yoghurt with granola", allergens: ["Milk", "Gluten", "Tree nuts"], diet: veg }),
  dish({ name: "Scrambled eggs", allergens: ["Eggs", "Milk"], diet: veg }),
  dish({ name: "Fresh fruit", diet: vegan }),
  dish({ name: "Cinnamon bun", allergens: ["Gluten", "Milk", "Eggs"], diet: veg }),
  dish({ name: "Carrot cake", allergens: ["Gluten", "Eggs", "Milk", "Tree nuts"], diet: veg }),
  dish({ name: "Oat ball", allergens: ["Gluten"], diet: vegan }),
  dish({
    name: "Oven-baked cod loin, browned butter",
    allergens: ["Fish", "Milk"],
    diet: porkFree,
  }),
  dish({
    name: "Veal roast with red wine sauce",
    ...{ allergens: ["Milk", "Celery", sulphites], diet: porkFree },
  }),
  dish({ name: "Mushroom risotto", allergens: ["Milk"], diet: veg }),
  dish({ name: "Lentil stew with coconut rice", allergens: ["Celery"], diet: vegan }),
  dish({ name: "Green salad and bread", allergens: ["Gluten"], diet: vegan }),
  dish({
    name: "Skagen shrimp salad on rye bread",
    allergens: ["Crustaceans", "Eggs", "Gluten", "Mustard"],
  }),
  dish({ name: "Beetroot carpaccio with chèvre", allergens: ["Milk", "Tree nuts"], diet: veg }),
  dish({
    name: "Venison fillet, celeriac purée",
    ...{ allergens: ["Milk", "Celery", sulphites], diet: porkFree },
  }),
  dish({
    name: "Pan-fried pike-perch, mussel sauce",
    ...{ allergens: ["Fish", "Molluscs", "Milk", sulphites], diet: porkFree },
  }),
  dish({
    name: "Celeriac steak, mustard vinaigrette",
    allergens: ["Celery", "Mustard"],
    diet: vegan,
  }),
  dish({
    name: "Chocolate fondant with hazelnut",
    ...{ allergens: ["Tree nuts", "Eggs", "Milk", "Gluten"], diet: veg },
  }),
  dish({ name: "Cloudberry parfait", allergens: ["Eggs", "Milk"], diet: veg }),
  dish({ name: "Lemon sorbet", diet: vegan }),
  dish({ name: "Toast Skagen", allergens: ["Crustaceans", "Gluten", "Eggs"] }),
  dish({ name: "Charcuterie and cheese", allergens: ["Milk", "Mustard", sulphites] }),
  dish({ name: "Hummus with vegetable sticks", allergens: ["Sesame"], diet: vegan }),
  dish({ name: "Spiced nuts", allergens: ["Tree nuts", "Peanuts"], diet: vegan }),
];
