import type { DemoContact, DemoCustomer } from "../../customer-types";
import { nordkustBundle } from "./bundles";

type PersonInput = { name: string; role: string; email?: string };

const person = ({ name, role, email }: PersonInput): DemoContact => ({
  name,
  type: "Contact person",
  fields: { Role: role },
  ...(email ? { email } : {}),
});

/** Lindholmen's customers and contact persons (`docs/demo-seed.md`, Customers). */
export const lindholmenCustomers: readonly DemoCustomer[] = [
  {
    name: "Nordkust Logistik AB",
    type: "Company",
    organizationNumber: "556712-3401",
    fields: { "Framework agreement": true },
    ...{ invoiceCity: "Göteborg", paymentTermsDays: 30 },
    priceList: { name: "Nordkust framework agreement", discountPercent: 15 },
    bundles: [nordkustBundle],
    contacts: [
      person({ name: "Karin Wallin", role: "Orderer", email: "karin.wallin@nordkust.test" }),
      person({
        name: "Fakturor Nordkust",
        role: "Invoice recipient",
        email: "faktura@nordkust.test",
      }),
    ],
  },
  {
    name: "Hisingen Energi AB",
    type: "Company",
    organizationNumber: "556834-2210",
    contacts: [person({ name: "Mats Olsson", role: "Orderer" })],
  },
  {
    name: "Västra Sjukvårdsregionen",
    type: "Public sector",
    organizationNumber: "232100-0131",
    requiresBuyerReference: true,
    fields: { "Peppol-ID": "0007:2321000131" },
    ...{ invoiceCity: "Vänersborg", paymentTermsDays: 30 },
    contacts: [
      { ...person({ name: "Eva Sund", role: "Organizer" }), buyerReference: "VSR-2026-0412" },
      person({ name: "Ekonomienheten", role: "Invoice recipient" }),
    ],
  },
  {
    name: "Kvarnby Design AB",
    type: "Company",
    organizationNumber: "559012-7788",
    contacts: [
      person({ name: "Linnea Kvist", role: "Orderer", email: "linnea.kvist@kvarnby.test" }),
    ],
  },
  {
    name: "Göta Advokatbyrå KB",
    type: "Company",
    organizationNumber: "969745-1120",
    contacts: [person({ name: "Henrik Strand", role: "Orderer" })],
  },
  {
    name: "Älvstrand Tech AB",
    type: "Company",
    organizationNumber: "559301-4455",
    contacts: [person({ name: "Amir Haddad", role: "Orderer" })],
  },
  {
    name: "Göteborgs Seglarsällskap",
    type: "Association",
    organizationNumber: "857209-6612",
    contacts: [person({ name: "Ulla Berg", role: "Organizer" })],
  },
  // A near-duplicate of Nordkust Logistik AB, registered separately by mistake: what
  // `customer.findSimilar` suggests before another one is created (ADR 0081).
  {
    name: "Nordkust Logistik i Göteborg",
    type: "Company",
    contacts: [person({ name: "Per Lind", role: "Orderer", email: "per.lind@nordkust.test" })],
  },
];
