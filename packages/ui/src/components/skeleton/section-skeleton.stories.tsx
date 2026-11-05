import type { Meta, StoryObj } from "@storybook/react-vite";
import { SectionSkeleton } from "./section-skeleton";

const meta = {
  title: "Components/SectionSkeleton",
  component: SectionSkeleton,
  args: { label: "Loading…", rows: 3, className: "w-[640px]" },
} satisfies Meta<typeof SectionSkeleton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
