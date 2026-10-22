import type { Meta, StoryObj } from "@storybook/react-vite";
import { PageHeader } from "./foundations/page-header";
import { RadiusSection, ShadowSection, SpacingScaleSection } from "./foundations/spacing-sections";

function SpacingPage() {
  return (
    <div className="flex w-[64rem] max-w-full flex-col gap-10 p-6 font-sans">
      <PageHeader
        title="Rhythm, Radii & Depth"
        description="The geometric skeleton of Bibi: a strict 4px baseline grid, tailored architectural corner radii, and warm-tinted depth shadows designed to give tactile elegance to operational surfaces."
      />
      <SpacingScaleSection />
      <RadiusSection />
      <ShadowSection />
    </div>
  );
}

const meta = {
  title: "Foundations/Spacing & Elevation",
  component: SpacingPage,
  parameters: { layout: "padded" },
} satisfies Meta<typeof SpacingPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Scale: Story = {};
