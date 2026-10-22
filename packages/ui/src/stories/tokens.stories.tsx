import type { Meta, StoryObj } from "@storybook/react-vite";
import { Wordmark } from "../components/wordmark/wordmark";
import { PageHeader } from "./foundations/page-header";
import { SectionHeading } from "./foundations/section-heading";
import { BookingCompositionCard } from "./foundations/tokens-booking-card";
import {
  CorePaletteSection,
  GeometrySection,
  TypographyPurposeSection,
} from "./foundations/tokens-sections";

function OverviewTitle() {
  return (
    <div className="flex items-center gap-3">
      <Wordmark size="lg" name="Bibi" />
      <span className="font-serif text-3xl font-light tracking-tight text-black dark:text-white">
        Design System
      </span>
    </div>
  );
}

function OverviewPage() {
  return (
    <div className="flex w-[64rem] max-w-full flex-col gap-10 p-6 font-sans">
      <PageHeader
        title={<OverviewTitle />}
        description="The Nordic Manor & Heritage visual foundation. Built on luminous alabaster surfaces, deep Nordic Spruce brand accents, Fraunces serif headings and grand totals, and Inter interface copy with OpenType tabular figures."
      />

      <section className="flex flex-col gap-4">
        <SectionHeading
          title="Harmonized Composition (Editorial Estate)"
          description="A realistic conference booking card showing typography, color, spacing, and elevation working in unison without decorative clutter."
        />
        <BookingCompositionCard />
      </section>

      <CorePaletteSection />
      <TypographyPurposeSection />
      <GeometrySection />
    </div>
  );
}

const meta = {
  title: "Foundations/Overview",
  component: OverviewPage,
  parameters: { layout: "padded" },
} satisfies Meta<typeof OverviewPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Overview: Story = {};
