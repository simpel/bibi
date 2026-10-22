import type { Meta, StoryObj } from "@storybook/react-vite";
import { InteractiveHeroNumberDemo } from "./foundations/hero-number-demo";
import { PageHeader } from "./foundations/page-header";
import { RunsheetScheduleView } from "./foundations/runsheet-schedule";
import { TypefaceCards, TypeScaleSection } from "./foundations/typography-sections";

function TypographyPage() {
  return (
    <div className="flex w-[64rem] max-w-full flex-col gap-10 p-6 font-sans">
      <PageHeader
        title="Editorial & Functional Hierarchy"
        description="Crafted for hospitality management: Fraunces brings stately editorial prestige to headings and grand financial totals, while Inter delivers crisp legibility for complex operational forms and runsheets with OpenType tabular figures. Zero developer monospace."
      />
      <TypefaceCards />
      <TypeScaleSection />
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

export const HeroNumbersWithNumberFlow: Story = {
  name: "Hero Numbers & Number Flow (barvian.me)",
  render: () => <InteractiveHeroNumberDemo />,
};

export const RunsheetSchedule: Story = {
  name: "Runsheet Timetable (Inter Tabular)",
  render: () => <RunsheetScheduleView />,
};
