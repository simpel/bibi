export type TypeSpecimen = {
  role: string;
  tokenClass: string;
  font: string;
  size: string;
  sample: string;
  meta: string;
};

export const SPECIMENS: TypeSpecimen[] = [
  {
    role: "Brand Wordmark",
    tokenClass: "font-wordmark text-2xl text-foreground",
    font: "Cherry Bomb One",
    size: "24px / 1.5rem",
    sample: "Okazi",
    meta: "App wordmark, brand logos, top navigation identity",
  },
  {
    role: "Display / Hero",
    tokenClass: "font-serif text-4xl font-light tracking-tight text-black dark:text-white",
    font: "Fraunces (Weight 300)",
    size: "36px / 2.25rem",
    sample: "World of Volvo Kongress",
    meta: "Major feature intros, hero titles, grand announcements",
  },
  {
    role: "Heading 1",
    tokenClass: "font-serif text-3xl font-light tracking-tight text-black dark:text-white",
    font: "Fraunces (Weight 300)",
    size: "30px / 1.875rem",
    sample: "Höstkonferens & Festmiddag",
    meta: "Primary page headers (venues, tickets, runsheets)",
  },
  {
    role: "Heading 2",
    tokenClass: "font-serif text-2xl font-light tracking-tight text-black dark:text-white",
    font: "Fraunces (Weight 300)",
    size: "24px / 1.5rem",
    sample: "Spegelsalen & Terrassen",
    meta: "Section headers, pipeline stages, modal dialog titles",
  },
  {
    role: "Heading 3",
    tokenClass: "font-serif text-xl font-normal tracking-tight text-black dark:text-white",
    font: "Fraunces (Weight 400)",
    size: "20px / 1.25rem",
    sample: "Menyförslag & Köksorder",
    meta: "Card groupings, sheet subsections, drawer titles",
  },
  {
    role: "Hero Financial Total",
    tokenClass: "font-serif text-2xl font-light text-black dark:text-white",
    font: "Fraunces (Weight 300)",
    size: "24px / 1.5rem",
    sample: "184 500 SEK",
    meta: "Grand quotation totals, hero invoice sums, master pricing",
  },
  {
    role: "Subtitle / Lead",
    tokenClass: "font-sans text-lg text-muted-foreground leading-relaxed",
    font: "Inter Regular",
    size: "18px / 1.125rem",
    sample: "Planerad konferens med 240 deltagare, förmiddagsfika och trerätters middag.",
    meta: "Explanatory intro text under page headers",
  },
  {
    role: "Body Regular",
    tokenClass: "font-sans text-base leading-relaxed text-foreground",
    font: "Inter Regular",
    size: "16px / 1rem",
    sample:
      "Lokalen iordningställs i biosittning med dubbla projektorer och trådlösa headset kl. 07:30. Kaffe och hembakta kanelbullar serveras i foajén.",
    meta: "Standard body copy, ticket descriptions, correspondence",
  },
  {
    role: "Body Medium / UI",
    tokenClass: "font-sans text-sm font-medium text-foreground",
    font: "Inter Medium",
    size: "14px / 0.875rem",
    sample: "Skicka offert till kund för signering",
    meta: "Primary buttons, form labels, data table cells, tab controls",
  },
  {
    role: "Caption / Meta",
    tokenClass: "font-sans text-xs text-muted-foreground",
    font: "Inter Regular",
    size: "12px / 0.75rem",
    sample: "Senast ändrad igår kl. 17:42 av Lovisa Ekström • Faktureringsadress verifierad",
    meta: "Field hints, breadcrumbs, timestamps, status badges",
  },
  {
    role: "Runsheet Timetable",
    tokenClass: "font-sans text-sm font-medium tabular-nums text-foreground",
    font: "Inter (tabular-nums)",
    size: "14px / 0.875rem",
    sample: "08:30 – 09:15 • Välkomstfika & registrering",
    meta: "Runsheet time slots, daily agendas, calendar schedule rows",
  },
  {
    role: "Line Item Price",
    tokenClass: "font-sans text-sm font-semibold tabular-nums text-foreground",
    font: "Inter (tabular-nums)",
    size: "14px / 0.875rem",
    sample: "1 850 SEK / kuvert • 240 gäster",
    meta: "Itemized proposal rows, breakdown tables, price calculations",
  },
  {
    role: "Reference Identifier",
    tokenClass: "font-sans text-xs tracking-wider uppercase font-medium text-muted-foreground",
    font: "Inter (tracked caps)",
    size: "12px / 0.75rem",
    sample: "TKT-2026-4401  •  ORG_VOLVO_GBG",
    meta: "Technical identifiers, booking reference codes, webhook logs",
  },
];
