import type { ClientContact } from "./calendar-types";

const contact = ({ name, phone }: { name: string; phone: string }): ClientContact => ({
  name,
  phone,
  email: `${name.toLowerCase().replace(/\s+/g, ".")}@example.com`,
});

/** Each customer's contact person, by customer name. Fictional. */
export const CLIENT_CONTACTS: Record<string, ClientContact> = {
  "Volvo Cars": contact({ name: "Anna Karlsson", phone: "+46 31 555 02 10" }),
  "Västra Götalandsregionen": contact({ name: "Per Holm", phone: "+46 31 555 02 21" }),
  "Hisingen Energi AB": contact({ name: "Maria Ek", phone: "+46 31 555 02 32" }),
  Chalmers: contact({ name: "Karin Lund", phone: "+46 31 555 02 43" }),
  "Chalmers tekniska högskola": contact({ name: "Karin Lund", phone: "+46 31 555 02 43" }),
  "Göteborgs Stad": contact({ name: "Ahmed Ali", phone: "+46 31 555 02 54" }),
  "Svenska Mässan Gothenburg Convention Centre": contact({
    name: "Sofia Berg",
    phone: "+46 31 555 02 65",
  }),
  Ericsson: contact({ name: "Lars Nyström", phone: "+46 31 555 02 76" }),
  "SCA Hygiene Products": contact({ name: "Eva Sandberg", phone: "+46 31 555 02 87" }),
};
