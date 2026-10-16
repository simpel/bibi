import type { DemoItem } from "../../config-types";

const guide = ({ name, languages }: { name: string; languages: readonly string[] }): DemoItem => ({
  type: "Guide",
  name,
  fields: { Language: languages },
});

type EquipmentInput = { name: string; kr: number; inventory: string };

const equipment = ({ name, kr, inventory }: EquipmentInput): DemoItem => ({
  type: "Equipment",
  name,
  fields: { "Inventory number": inventory },
  ...{ priceKr: kr, priceUnit: "FLAT" },
});

const guides = ["Emma Lind", "Oskar Ahl", "Nora Falk"].map((name) => ({ name }));

/**
 * Lindholmen's guides, tours and equipment (`docs/demo-seed.md`, Guides and tours, Equipment).
 * A tour picks one bookable guide; the Design workshop contains the room Knippla.
 */
export const lindholmenActivities: readonly DemoItem[] = [
  guide({ name: "Emma Lind", languages: ["Swedish", "English"] }),
  guide({ name: "Oskar Ahl", languages: ["Swedish", "German"] }),
  guide({ name: "Nora Falk", languages: ["Swedish", "English"] }),
  {
    type: "Tour",
    name: "Exhibition tour",
    fields: { Language: ["Swedish", "English", "German"] },
    ...{ priceKr: 1450, priceUnit: "FLAT", durationMinutes: 60 },
    choices: [{ name: "Guide", options: guides }],
  },
  {
    type: "Tour",
    name: "Evening tour",
    fields: { Language: ["Swedish", "English", "German"] },
    ...{ priceKr: 2200, priceUnit: "FLAT", durationMinutes: 90 },
    choices: [{ name: "Guide", options: guides }],
  },
  {
    type: "Tour",
    name: "Design workshop",
    ...{ priceKr: 395, priceUnit: "PER_PERSON", durationMinutes: 120 },
    parts: [{ name: "Knippla (workshop)", durationMinutes: 120 }],
  },
  equipment({ name: "Projector", kr: 450, inventory: "LEC-AV-001" }),
  equipment({ name: "Mobile sound system", kr: 900, inventory: "LEC-AV-002" }),
  equipment({ name: "Extra whiteboard", kr: 150, inventory: "LEC-FU-001" }),
  equipment({ name: "Hearing loop", kr: 0, inventory: "LEC-AV-003" }),
];
