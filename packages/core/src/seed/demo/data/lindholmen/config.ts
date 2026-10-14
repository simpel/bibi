import type { DemoConfig } from "../../config-types";

/** Lindholmen's lists and setups (`docs/demo-seed.md`, Konfiguration). */
export const lindholmenLists: Pick<DemoConfig, "listTemplates" | "lists" | "setups"> = {
  listTemplates: ["eu-14-allergens"],
  lists: [
    { name: "Kost", values: ["Vegetarisk", "Vegansk", "Halal", "Fläskfri"] },
    { name: "Allvarlighetsgrad", values: ["Intolerans", "Allergi", "Anafylaxi"] },
    { name: "Tillgänglighet", values: ["Rullstol", "Hörselslinga", "Ledarhund"] },
    { name: "Utsikt", values: ["Älven", "Innergården", "Ingen"] },
    { name: "Dresscode", values: ["Vardag", "Kavaj", "Mörk kostym"] },
  ],
  setups: [
    { name: "Bio", changeoverMinutes: 15 },
    { name: "Klassrum", changeoverMinutes: 30 },
    { name: "U-bord", changeoverMinutes: 30 },
    { name: "Styrelse", changeoverMinutes: 20 },
    { name: "Ö-sittning", changeoverMinutes: 40 },
    { name: "Bankett", changeoverMinutes: 60 },
    { name: "Mingel", changeoverMinutes: 15 },
  ],
};
