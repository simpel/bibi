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
    fields: { "Org no.": "556712-3401", "Framework agreement": true },
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
    fields: { "Org no.": "556834-2210" },
    contacts: [person({ name: "Mats Olsson", role: "Orderer" })],
  },
  {
    name: "Västra Sjukvårdsregionen",
    type: "Public sector",
    fields: {
      "Org no.": "232100-0131",
      "Peppol-ID": "0007:2321000131",
      "Requires case number": true,
    },
    ...{ invoiceCity: "Vänersborg", paymentTermsDays: 30 },
    contacts: [
      person({ name: "Eva Sund", role: "Organizer" }),
      person({ name: "Ekonomienheten", role: "Invoice recipient" }),
    ],
  },
  {
    name: "Kvarnby Design AB",
    type: "Company",
    fields: { "Org no.": "559012-7788" },
    contacts: [person({ name: "Linnea Kvist", role: "Orderer" })],
  },
  {
    name: "Göta Advokatbyrå KB",
    type: "Company",
    fields: { "Org no.": "969745-1120" },
    contacts: [person({ name: "Henrik Strand", role: "Orderer" })],
  },
  {
    name: "Älvstrand Tech AB",
    type: "Company",
    fields: { "Org no.": "559301-4455" },
    contacts: [person({ name: "Amir Haddad", role: "Orderer" })],
  },
  {
    name: "Göteborgs Seglarsällskap",
    type: "Association",
    fields: { "Org no.": "857209-6612" },
    contacts: [person({ name: "Ulla Berg", role: "Organizer" })],
  },
];
