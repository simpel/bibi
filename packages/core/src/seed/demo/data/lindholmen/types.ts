import type { DemoType } from "../../config-types";

const languages = ["Svenska", "Engelska", "Tyska"];
const orgnr = { name: "Orgnr", kind: "TEXT" } as const;

/** Lindholmen's own types (`docs/demo-seed.md`: Artikeltyper and Övriga typer). */
export const lindholmenTypes: readonly DemoType[] = [
  {
    base: "ITEM",
    name: "Konferensrum",
    behaviours: ["BOOKABLE", "SETUPS", "PRICED"],
    fields: [
      { name: "Våning", kind: "NUMBER" },
      { name: "Yta m²", kind: "NUMBER" },
      { name: "Takhöjd m", kind: "NUMBER" },
      { name: "Dagsljus", kind: "BOOLEAN" },
      { name: "Utsikt", kind: "CHOICE", list: "Utsikt" },
    ],
  },
  {
    base: "ITEM",
    name: "Rätt",
    fields: [
      { name: "Allergener", kind: "MULTI_CHOICE", list: "Allergener" },
      { name: "Kost", kind: "MULTI_CHOICE", list: "Kost" },
    ],
  },
  {
    base: "ITEM",
    name: "Dryck",
    behaviours: ["PRICED"],
    fields: [
      { name: "Allergener", kind: "MULTI_CHOICE", list: "Allergener" },
      { name: "Alkoholhaltig", kind: "BOOLEAN" },
    ],
  },
  {
    base: "ITEM",
    name: "Måltid",
    behaviours: ["PRICED", "COMPOSABLE", "CHOICES"],
    fields: [
      { name: "Serveringsform", kind: "CHOICE", options: ["Buffé", "Serverad", "Plockmat"] },
    ],
  },
  {
    base: "ITEM",
    name: "Visning",
    behaviours: ["PRICED", "COMPOSABLE", "CHOICES", "BOOKABLE"],
    fields: [{ name: "Språk", kind: "MULTI_CHOICE", options: languages }],
  },
  {
    base: "ITEM",
    name: "Guide",
    behaviours: ["BOOKABLE"],
    fields: [{ name: "Språk", kind: "MULTI_CHOICE", options: languages }],
  },
  {
    base: "ITEM",
    name: "Utrustning",
    behaviours: ["BOOKABLE", "PRICED"],
    fields: [{ name: "Inventarienummer", kind: "TEXT" }],
  },
  {
    base: "ITEM",
    name: "Paket",
    behaviours: ["PRICED", "COMPOSABLE", "CHOICES"],
    fields: [{ name: "Minsta antal", kind: "NUMBER" }],
  },
  { base: "CUSTOMER", name: "Företag", fields: [orgnr, { name: "Ramavtal", kind: "BOOLEAN" }] },
  {
    base: "CUSTOMER",
    name: "Offentlig",
    fields: [
      orgnr,
      { name: "Peppol-ID", kind: "TEXT" },
      { name: "Kräver diarienummer", kind: "BOOLEAN" },
    ],
  },
  { base: "CUSTOMER", name: "Förening", fields: [orgnr] },
  { base: "BOOKING", name: "Konferens", fields: [{ name: "Syfte", kind: "TEXT" }] },
  {
    base: "BOOKING",
    name: "Event",
    fields: [
      { name: "Dresscode", kind: "CHOICE", list: "Dresscode" },
      { name: "Talare/underhållning", kind: "TEXT" },
    ],
  },
  { base: "BOOKING", name: "Visning", fields: [{ name: "Skolklass", kind: "BOOLEAN" }] },
];
