import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { HeroNumber } from "../components/hero-number/hero-number";

type TypeSpecimen = {
  role: string;
  tokenClass: string;
  font: string;
  size: string;
  sample: string;
  meta: string;
};

const SPECIMENS: TypeSpecimen[] = [
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

const SCHEDULE_ITEMS = [
  {
    time: "08:00 – 08:30",
    title: "Rigging & AV-teknikcheck",
    location: "Carl Larsson-salen",
    note: "Ljudtekniker på plats",
  },
  {
    time: "08:30 – 09:15",
    title: "Registrering & Välkomstfika",
    location: "Foajén & Terrassen",
    note: "Kaffe, te & surdegsfralla",
  },
  {
    time: "09:15 – 10:30",
    title: "Öppningsanförande: Cirkulär Mobilitet",
    location: "Carl Larsson-salen",
    note: "Keynote + Q&A",
  },
  {
    time: "10:30 – 11:00",
    title: "Förmiddagsfika & Mingel",
    location: "Vinterträdgården",
    note: "Hembakta kanelbullar & frukt",
  },
  {
    time: "11:00 – 12:30",
    title: "Parallella Workshop-sessioner",
    location: "Salong 1, 2 & Terrassen",
    note: "3 spår samtidigt",
  },
  {
    time: "12:30 – 14:00",
    title: "Sittande 2-rätters Affärslunch",
    location: "Restaurangen",
    note: "Specialkost föranmäld",
  },
  {
    time: "14:00 – 16:30",
    title: "Paneldebatt & Framtidsspaning",
    location: "Carl Larsson-salen",
    note: "Scenpanel m. 5 talare",
  },
  {
    time: "16:30 – 17:30",
    title: "Avslutande Mingel & Förfriskningar",
    location: "Terrassen",
    note: "Lokalproducerad äppelmust",
  },
];

function TypographyPage() {
  return (
    <div className="flex w-[64rem] max-w-full flex-col gap-10 p-6 font-sans">
      <header className="flex flex-col gap-2 border-b pb-6">
        <h1 className="font-serif text-3xl font-light tracking-tight text-black dark:text-white">
          Editorial & Functional Hierarchy
        </h1>
        <p className="max-w-2xl text-sm text-muted-foreground leading-relaxed">
          Crafted for hospitality management: Fraunces brings stately editorial prestige to headings
          and grand financial totals, while Inter delivers crisp legibility for complex operational
          forms and runsheets with OpenType tabular figures. Zero developer monospace.
        </p>
      </header>

      <section className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="flex flex-col gap-2 rounded-lg border bg-card p-5 shadow-xs">
          <span className="font-sans text-xs text-muted-foreground">Headings & Grand Totals</span>
          <p className="font-serif text-2xl font-light text-black dark:text-white">Fraunces 300</p>
          <p className="text-xs text-muted-foreground">
            Optical sizes, generous letterforms, literary elegance. Headings, app title, and
            editorial quotation grand totals.
          </p>
          <code className="mt-2 text-[11px] text-primary">
            var(--font-heading) / var(--font-price-hero)
          </code>
        </div>
        <div className="flex flex-col gap-2 rounded-lg border bg-card p-5 shadow-xs">
          <span className="font-sans text-xs text-muted-foreground">Interface & Body</span>
          <p className="font-sans text-2xl font-semibold text-foreground">Inter</p>
          <p className="text-xs text-muted-foreground">
            Contemporary grotesque with clean vertical metrics. Buttons, inputs, data grid, and body
            copy.
          </p>
          <code className="mt-2 text-[11px] text-primary">var(--font-body)</code>
        </div>
        <div className="flex flex-col gap-2 rounded-lg border bg-card p-5 shadow-xs">
          <span className="font-sans text-xs text-muted-foreground">Runsheets & Line Numbers</span>
          <p className="font-sans text-2xl font-semibold tabular-nums text-foreground">
            Inter tabular-nums
          </p>
          <p className="text-xs text-muted-foreground">
            Lining tabular numerals with identical horizontal advance widths. Agendas, line items,
            and ticket IDs.
          </p>
          <code className="mt-2 text-[11px] text-primary">tabular-nums (OpenType)</code>
        </div>
      </section>

      <section className="flex flex-col gap-6">
        <div>
          <h2 className="font-serif text-xl font-normal tracking-tight text-black dark:text-white">
            Type Scale & Purpose Map
          </h2>
          <p className="text-xs text-muted-foreground">
            Purpose-driven typography scale from display heroes down to tabular runsheet times.
          </p>
        </div>
        <div className="flex flex-col divide-y rounded-lg border bg-card shadow-xs">
          {SPECIMENS.map((spec) => (
            <div
              key={spec.role}
              className="flex flex-col gap-3 p-5 sm:flex-row sm:items-baseline sm:justify-between"
            >
              <div className="flex w-64 shrink-0 flex-col gap-1">
                <span className="font-sans text-xs font-semibold text-foreground">{spec.role}</span>
                <span className="font-sans text-[11px] tabular-nums text-muted-foreground">
                  {spec.font} • {spec.size}
                </span>
                <span className="text-[11px] text-muted-foreground">{spec.meta}</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className={spec.tokenClass}>{spec.sample}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

const meta = {
  title: "Foundations/Typography",
  component: TypographyPage,
  parameters: { layout: "padded" },
} satisfies Meta<typeof TypographyPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Hierarchy: Story = {};

function InteractiveHeroNumberDemo() {
  const [total, setTotal] = useState(184500);

  return (
    <div className="flex w-[48rem] max-w-full flex-col gap-6 p-6 font-sans">
      <div className="flex flex-col gap-1">
        <h2 className="font-serif text-2xl font-light tracking-tight text-black dark:text-white">
          Hero Numbers with Number Flow
        </h2>
        <p className="max-w-2xl text-sm text-muted-foreground leading-relaxed">
          Hero numbers in Okazi represent the financial climax of an offer. Powered by{" "}
          <code className="text-primary font-medium">@number-flow/react</code>, numbers transition
          with smooth rolling digit animations while staying in Fraunces Light numerals in pitch
          black.
        </p>
      </div>

      <div className="flex flex-col gap-6 rounded-xl border bg-card p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-4">
          <HeroNumber
            value={total}
            label="Totalbelopp offert (exkl. moms)"
            suffix=" SEK"
            statusBadge="✓ Offert bekräftad"
            size="xl"
          />
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setTotal((v) => v + 15000)}
              className="rounded-md border bg-muted/30 px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
            >
              +15 000 SEK
            </button>
            <button
              type="button"
              onClick={() => setTotal((v) => Math.max(0, v - 20000))}
              className="rounded-md border bg-muted/30 px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
            >
              -20 000 SEK
            </button>
            <button
              type="button"
              onClick={() => setTotal(184500)}
              className="rounded-md border bg-muted/30 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              Återställ
            </button>
          </div>
        </div>

        <div className="border-t pt-4">
          <span className="text-xs text-muted-foreground">
            Kopplade rader i Inter tabular-nums:
          </span>
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="flex flex-col rounded-md bg-muted/30 p-3">
              <span className="text-xs text-muted-foreground">Lokalhyra</span>
              <span className="font-sans text-sm font-semibold tabular-nums text-foreground">
                45 000 SEK
              </span>
            </div>
            <div className="flex flex-col rounded-md bg-muted/30 p-3">
              <span className="text-xs text-muted-foreground">Måltider (240 kuvert)</span>
              <span className="font-sans text-sm font-semibold tabular-nums text-foreground">
                96 000 SEK
              </span>
            </div>
            <div className="flex flex-col rounded-md bg-muted/30 p-3">
              <span className="text-xs text-muted-foreground">Teknik & Värdskap</span>
              <span className="font-sans text-sm font-semibold tabular-nums text-foreground">
                43 500 SEK
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export const HeroNumbersWithNumberFlow: Story = {
  name: "Hero Numbers & Number Flow (barvian.me)",
  render: () => <InteractiveHeroNumberDemo />,
};

export const RunsheetSchedule: Story = {
  name: "Runsheet Timetable (Inter Tabular)",
  render: () => (
    <div className="flex w-[56rem] max-w-full flex-col gap-6 p-6 font-sans">
      <div className="flex flex-col gap-1">
        <h2 className="font-serif text-2xl font-light tracking-tight text-black dark:text-white">
          Dagens Körschema
        </h2>
        <p className="text-sm text-muted-foreground">
          Tidpunkter staplas med OpenType tabular-nums för perfekt arkitektonisk vertikal linjering.
        </p>
      </div>

      <div className="flex flex-col divide-y rounded-xl border bg-card shadow-xs">
        {SCHEDULE_ITEMS.map((item) => (
          <div
            key={item.time}
            className="flex items-center justify-between p-4 transition-colors hover:bg-muted/30"
          >
            <div className="flex items-center gap-6">
              <span className="w-28 font-sans text-xs font-semibold tabular-nums text-foreground">
                {item.time}
              </span>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-foreground">{item.title}</span>
                <span className="text-xs text-muted-foreground">{item.location}</span>
              </div>
            </div>
            <span className="text-xs text-muted-foreground">{item.note}</span>
          </div>
        ))}
      </div>
    </div>
  ),
};
