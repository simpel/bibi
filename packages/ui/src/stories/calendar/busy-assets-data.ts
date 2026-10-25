import type { CalendarAsset, CalendarPerson } from "./calendar-types";
import { PEOPLE } from "./people-data";

const SPACES: readonly [string, string, string][] = [
  ["aspero", "Asperö", "12 seats"],
  ["branno", "Brännö", "20 seats"],
  ["donso", "Donsö", "8 seats"],
  ["hono", "Hönö", "16 seats"],
  ["kopstadso", "Köpstadsö", "10 seats"],
  ["styrso", "Styrsö", "24 seats"],
  ["vinga", "Vinga", "Auditorium, 120"],
  ["vrango", "Vrångö", "30 seats"],
  ["ockero", "Öckerö", "40 seats"],
  ["restaurant", "Restaurant", "80 covers"],
  ["terrace", "Terrace", "60 standing"],
  ["hall", "Exhibition hall", "300 standing"],
];

const EXTRA_STAFF: readonly CalendarPerson[] = [
  { id: "nora", name: "Nora Lind", role: "Host" },
  { id: "omar", name: "Omar Haddad", role: "AV technician" },
  { id: "elin", name: "Elin Ström", role: "Guide" },
  { id: "jonas", name: "Jonas Berg", role: "Bartender" },
];

const EQUIPMENT: readonly [string, string, string][] = [
  ["projector-1", "Projector 1", "Laser, 4K"],
  ["projector-2", "Projector 2", "Portable"],
  ["pa", "Mobile PA", "2 mics"],
  ["hybrid", "Hybrid kit", "Camera and speakerphone"],
  ["riser", "Stage riser", "4 × 2 m"],
  ["coffee-cart", "Coffee cart", "Self-serve"],
];

const staff = [PEOPLE.sara, PEOPLE.mona, PEOPLE.leo, PEOPLE.ali, ...EXTRA_STAFF];

/** A busy Thursday at a large venue: every group full, so the view is designed for the worst case. */
export const BUSY_ASSETS: readonly CalendarAsset[] = [
  ...SPACES.map(([id, name, detail]) => ({ id, name, detail, group: "Spaces" })),
  ...staff.map((person) => ({
    id: person.id,
    name: person.name,
    detail: person.role,
    group: "Staff",
    person,
  })),
  ...EQUIPMENT.map(([id, name, detail]) => ({ id, name, detail, group: "Equipment" })),
];
