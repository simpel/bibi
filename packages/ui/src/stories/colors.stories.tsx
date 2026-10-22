import type { Meta, StoryObj } from "@storybook/react-vite";
import { ColorCard } from "./foundations/color-card";
import { CORE_COLOR_GROUPS } from "./foundations/color-groups-core";
import { UI_COLOR_GROUPS } from "./foundations/color-groups-ui";
import { PageHeader } from "./foundations/page-header";
import { SectionHeading } from "./foundations/section-heading";

const COLOR_GROUPS = [...CORE_COLOR_GROUPS, ...UI_COLOR_GROUPS];

function ColorsPage() {
  return (
    <div className="flex w-[64rem] max-w-full flex-col gap-10 p-6 font-sans">
      <PageHeader
        title="Nordic Manor & Heritage Palette"
        description="Rooted in Scandinavian estate architecture: luminous alabaster light surfaces, deep Nordic Spruce primary accents, aged brass warmth, and rich espresso typography. Every token is calibrated in OKLCH for uniform perceptual contrast."
      />

      {COLOR_GROUPS.map((group) => (
        <section key={group.title} className="flex flex-col gap-4">
          <SectionHeading title={group.title} description={group.description} />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {group.tokens.map((token) => (
              <ColorCard key={token.variable} token={token} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

const meta = {
  title: "Foundations/Colors",
  component: ColorsPage,
  parameters: { layout: "padded" },
} satisfies Meta<typeof ColorsPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AllColors: Story = {};
